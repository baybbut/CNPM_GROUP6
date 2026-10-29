const crypto = require("node:crypto");
const R = require("./catalog-rules.cjs");
const VNPAY = require("./vnpay.cjs");
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const amount = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > 10000000)
    R.fail("Giá vé phải là số nguyên từ 0 đến 10.000.000 VND.");
  return value;
};
function validateBooking(body) {
  if (!UUID.test(body?.requestId)) R.fail("Mã yêu cầu không hợp lệ.");
  const visitDate = R.date(body.visitDate),
    today = R.todayVN();
  if (
    visitDate < today ||
    visitDate >
      new Date(new Date(today + "T00:00:00Z").getTime() + 90 * 86400000)
        .toISOString()
        .slice(0, 10)
  )
    R.fail("Chọn ngày tham quan từ hôm nay đến 90 ngày tới.");
  const counts = ["adults", "concessions", "children"].map((k) => body[k]);
  if (
    counts.some((n) => !Number.isInteger(n) || n < 0) ||
    counts.reduce((a, b) => a + b, 0) < 1 ||
    counts.reduce((a, b) => a + b, 0) > 20
  )
    R.fail("Mỗi lần đặt từ 1 đến 20 khách.");
  const email = R.text(body.email, "Email", 255, true).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) R.fail("Email không hợp lệ.");
  if (body.acceptTerms !== true)
    R.fail("Vui lòng đồng ý điều kiện vé trước khi đặt.");
  return {
    requestId: body.requestId,
    museumId: R.id(body.museumId),
    visitDate,
    name: R.text(body.name, "Tên khách", 150, true),
    email,
    adults: counts[0],
    concessions: counts[1],
    children: counts[2],
    expectedTotal:
      Number.isInteger(body.expectedTotal) &&
      body.expectedTotal >= 0 &&
      body.expectedTotal <= 200000000
        ? body.expectedTotal
        : R.fail("Tổng tiền không hợp lệ."),
  };
}
function ticketTotal(offer, b) {
  return (
    offer.adultPrice * b.adults +
    offer.concessionPrice * b.concessions +
    offer.childPrice * b.children
  );
}
function attachTicketRoutes(app, sql) {
  const limits = new Map();
  const run = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof R.CatalogError)
        return res.status(e.status).json({ code: e.code, message: e.message });
      console.error("Ticket API:", e.code || e.message);
      res.status(503).json({
        code: "TICKETS_UNAVAILABLE",
        message: "Chưa xử lý được đặt vé. Vui lòng thử lại.",
      });
    }
  };
  function query(connection, text, values = {}) {
    const request = connection.request();
    for (const [k, v] of Object.entries(values))
      request.input(
        k,
        v instanceof Date
          ? sql.DateTime2
          : typeof v === "number"
            ? sql.Int
            : typeof v === "boolean"
              ? sql.Bit
              : sql.NVarChar(sql.MAX),
        v ?? null,
      );
    return request.query(text);
  }
  const offers = `SELECT m.MuseumID AS id,m.Name AS name,m.Address AS address,m.IsDemo AS isDemo,t.AdultPrice AS adultPrice,t.ConcessionPrice AS concessionPrice,t.ChildPrice AS childPrice,t.ClosedWeekdays AS closedWeekdays,t.Terms AS terms,t.IsEnabled AS isEnabled FROM dbo.TicketOffers t JOIN dbo.Museums m ON m.MuseumID=t.MuseumID`;
  const gate = run(async (req, res) => {
    const user = await app.locals.identity(req);
    if (!user) R.fail("Vui lòng đăng nhập quản trị.", 401, "UNAUTHENTICATED");
    if (!["Admin", "Administrator"].includes(user.role))
      R.fail("Không có quyền quản trị.", 403, "FORBIDDEN");
    req.admin = user;
    res.locals.ticketAdmin = true;
  });
  const admin = (req, res, next) =>
    gate(req, res).then(() => {
      if (res.locals.ticketAdmin && !res.headersSent) next();
    });
  app.get(
    "/api/tickets/offers",
    run(async (_req, res) =>
      res.json({
        paymentReady: VNPAY.configured(),
        mode: VNPAY.configured() ? "Online" : "Demo",
        items: (
          await query(
            app.locals.pool,
            `${offers} WHERE t.IsEnabled=1 AND m.IsPublic=1 ORDER BY m.Name`,
          )
        ).recordset,
      }),
    ),
  );
  app.post(
    "/api/tickets/checkout",
    run(async (req, res) => {
      const now = Date.now(),
        key = req.ip;
      let limit = limits.get(key);
      if (!limit || limit.until < now) {
        if (limits.size > 10000) limits.clear();
        limit = { until: now + 60000, count: 0 };
        limits.set(key, limit);
      }
      if (++limit.count > 10)
        R.fail("Vui lòng thử lại sau một phút.", 429, "TOO_MANY_REQUESTS");
      const b = validateBooking(req.body),
        hash = crypto
          .createHash("sha256")
          .update(JSON.stringify(b))
          .digest("hex");
      const tx = app.locals.pool.transaction();
      await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        const old = (
          await query(
            tx,
            "SELECT BookingCode AS code,RequestHash AS requestHash,TotalAmount AS total,CreatedAt AS createdAt,ExpiresAt AS expiresAt,PaymentState AS paymentState,IsDemoPayment AS isDemoPayment FROM dbo.TicketReservations WITH(UPDLOCK,HOLDLOCK) WHERE ReservationID=@requestId",
            b,
          )
        ).recordset[0];
        if (old) {
          if (old.requestHash !== hash)
            R.fail(
              "Yêu cầu đã được sử dụng. Tạo lượt đặt mới.",
              409,
              "REQUEST_CONFLICT",
            );
          if (old.isDemoPayment) {
            await tx.commit();
            return res.json({
              reservationId: b.requestId,
              mode: "Demo",
              code: old.code,
              total: old.total,
            });
          }
          if (
            old.paymentState === "Paid" ||
            old.paymentState === "NotRequired"
          ) {
            await tx.commit();
            return res.json({
              reservationId: b.requestId,
              paymentState: old.paymentState,
            });
          }
          if (new Date(old.expiresAt) < new Date())
            R.fail(
              "Lượt thanh toán đã hết hạn. Vui lòng tạo lượt đặt mới.",
              409,
              "PAYMENT_EXPIRED",
            );
          await tx.commit();
          return res.json({
            reservationId: b.requestId,
            redirectUrl: VNPAY.checkoutUrl(old, {
              ip: req.ip,
              language: req.body.language,
            }),
          });
        }
        const offer = (
          await query(
            tx,
            `${offers} WHERE t.MuseumID=@museumId AND t.IsEnabled=1 AND m.IsPublic=1`,
            { museumId: b.museumId },
          )
        ).recordset[0];
        if (!offer)
          R.fail("Bảo tàng hiện chưa mở đặt vé.", 409, "OFFER_UNAVAILABLE");
        const weekday = new Date(b.visitDate + "T00:00:00Z").getUTCDay();
        if (
          String(offer.closedWeekdays || "")
            .split(",")
            .filter(Boolean)
            .map(Number)
            .includes(weekday)
        )
          R.fail(
            "Bảo tàng không nhận đặt vé vào ngày đã chọn. Chọn ngày khác.",
            409,
            "CLOSED_DATE",
          );
        const total = ticketTotal(offer, b);
        if (total !== b.expectedTotal)
          R.fail(
            "Giá vé vừa thay đổi. Vui lòng tải lại bảng giá và xem lại tổng tiền.",
            409,
            "PRICE_CHANGED",
          );
        const code =
          "MUS-" + crypto.randomBytes(8).toString("hex").toUpperCase();
        const createdAt = new Date(),
          expiresAt = new Date(+createdAt + 15 * 60000),
          isDemoPayment = !VNPAY.configured() || Boolean(offer.isDemo);
        await query(
          tx,
          `INSERT INTO dbo.TicketReservations(ReservationID,BookingCode,RequestHash,MuseumID,VisitDate,FullName,Email,Adults,Concessions,Children,AdultPrice,ConcessionPrice,ChildPrice,TotalAmount,CreatedAt,ExpiresAt,PaymentState,IsDemoPayment) VALUES(@requestId,@code,@hash,@museumId,@visitDate,@name,@email,@adults,@concessions,@children,@adultPrice,@concessionPrice,@childPrice,@total,@created,@expires,@paymentState,@isDemoPayment)`,
          {
            ...b,
            code,
            hash,
            adultPrice: offer.adultPrice,
            concessionPrice: offer.concessionPrice,
            childPrice: offer.childPrice,
            total,
            created: createdAt,
            expires: expiresAt,
            paymentState:
              !isDemoPayment && total === 0 ? "NotRequired" : "Pending",
            isDemoPayment,
          },
        );
        await tx.commit();
        res.status(201).json({
          reservationId: b.requestId,
          code,
          total,
          mode: isDemoPayment ? "Demo" : "Online",
          paymentState:
            !isDemoPayment && total === 0 ? "NotRequired" : "Pending",
          redirectUrl:
            isDemoPayment || total === 0
              ? undefined
              : VNPAY.checkoutUrl(
                  { code, total, createdAt, expiresAt },
                  { ip: req.ip, language: req.body.language },
                ),
          isDemo: Boolean(offer.isDemo),
        });
      } catch (e) {
        try {
          await tx.rollback();
        } catch {}
        throw e;
      }
    }),
  );

  app.get(
    "/api/tickets/vnpay/ipn",
    run(async (req, res) => {
      const p = req.query;
      if (!VNPAY.verify(p))
        return res.json({ RspCode: "97", Message: "Invalid signature" });
      if (
        !/^MUS-[A-F0-9]{16}$/.test(p.vnp_TxnRef || "") ||
        !/^\d+$/.test(p.vnp_Amount || "")
      )
        return res.json({ RspCode: "01", Message: "Order not found" });
      const tx = app.locals.pool.transaction();
      await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        const order = (
          await query(
            tx,
            "SELECT TotalAmount AS total,PaymentState AS state,IsDemoPayment AS isDemoPayment FROM dbo.TicketReservations WITH(UPDLOCK,HOLDLOCK) WHERE BookingCode=@code",
            { code: p.vnp_TxnRef },
          )
        ).recordset[0];
        if (!order || order.isDemoPayment) {
          await tx.rollback();
          return res.json({ RspCode: "01", Message: "Order not found" });
        }
        if (BigInt(p.vnp_Amount) !== BigInt(order.total) * 100n) {
          await tx.rollback();
          return res.json({ RspCode: "04", Message: "Invalid amount" });
        }
        if (order.state === "Paid" || order.state === "NotRequired") {
          await tx.commit();
          return res.json({
            RspCode: "02",
            Message: "Order already confirmed",
          });
        }
        const paid =
          p.vnp_ResponseCode === "00" && p.vnp_TransactionStatus === "00";
        if (paid && !/^\d{1,64}$/.test(p.vnp_TransactionNo || "")) {
          await tx.rollback();
          return res.json({ RspCode: "99", Message: "Invalid transaction" });
        }
        await query(
          tx,
          "UPDATE dbo.TicketReservations SET PaymentState=@state,PaymentTransaction=@transaction,PaidAt=CASE WHEN @state='Paid' THEN SYSUTCDATETIME() ELSE NULL END WHERE BookingCode=@code",
          {
            code: p.vnp_TxnRef,
            state: paid ? "Paid" : "Failed",
            transaction: R.text(p.vnp_TransactionNo, "Transaction", 64),
          },
        );
        await tx.commit();
        res.json({ RspCode: "00", Message: "Confirm Success" });
      } catch (e) {
        try {
          await tx.rollback();
        } catch {}
        console.error("VNPAY IPN:", e.code || e.message);
        res.json({ RspCode: "99", Message: "Please retry" });
      }
    }),
  );
  app.get(
    "/api/tickets/reservations/:id",
    run(async (req, res) => {
      if (!UUID.test(req.params.id))
        R.fail("Không tìm thấy đặt vé.", 404, "NOT_FOUND");
      const result = await query(
        app.locals.pool,
        `SELECT r.BookingCode AS code,r.TotalAmount AS total,r.PaymentState AS paymentState,r.Status AS status,CONVERT(varchar(10),r.VisitDate,23) AS visitDate,r.Adults AS adults,r.Concessions AS concessions,r.Children AS children,r.ExpiresAt AS expiresAt,r.IsDemoPayment AS isDemoPayment,m.Name AS museum,m.Address AS address,m.IsDemo AS isDemo FROM dbo.TicketReservations r JOIN dbo.Museums m ON m.MuseumID=r.MuseumID WHERE r.ReservationID=@id`,
        { id: req.params.id },
      );
      if (!result.recordset.length)
        R.fail("Không tìm thấy đặt vé.", 404, "NOT_FOUND");
      const row = result.recordset[0];
      if (
        !row.isDemoPayment &&
        row.paymentState === "Pending" &&
        new Date(row.expiresAt) < new Date()
      )
        row.paymentState = "Expired";
      res.set("Cache-Control", "no-store").json(row);
    }),
  );
  app.get(
    "/api/admin/tickets/offers",
    admin,
    run(async (_req, res) =>
      res.json(
        (await query(app.locals.pool, offers + " ORDER BY m.Name")).recordset,
      ),
    ),
  );
  app.put(
    "/api/admin/tickets/offers/:id",
    admin,
    run(async (req, res) => {
      const museumId = R.id(req.params.id),
        b = req.body || {},
        adultPrice = amount(b.adultPrice),
        concessionPrice = amount(b.concessionPrice),
        childPrice = amount(b.childPrice);
      const terms = R.text(b.terms, "Điều kiện vé", 1500, true);
      if (
        typeof b.isEnabled !== "boolean" ||
        !Array.isArray(b.closedWeekdays) ||
        b.closedWeekdays.some((n) => !Number.isInteger(n) || n < 0 || n > 6)
      )
        R.fail("Cấu hình ngày hoặc trạng thái không hợp lệ.");
      await query(
        app.locals.pool,
        `SET XACT_ABORT ON; BEGIN TRANSACTION; IF NOT EXISTS(SELECT 1 FROM dbo.Museums WITH(UPDLOCK,HOLDLOCK) WHERE MuseumID=@museumId) BEGIN ROLLBACK; THROW 51000,N'Museum not found',1; END; IF EXISTS(SELECT 1 FROM dbo.TicketOffers WITH(UPDLOCK,HOLDLOCK) WHERE MuseumID=@museumId) UPDATE dbo.TicketOffers SET AdultPrice=@adultPrice,ConcessionPrice=@concessionPrice,ChildPrice=@childPrice,IsEnabled=@enabled,ClosedWeekdays=@closed,Terms=@terms,UpdatedBy=@user,UpdatedAt=SYSUTCDATETIME() WHERE MuseumID=@museumId; ELSE INSERT INTO dbo.TicketOffers(MuseumID,AdultPrice,ConcessionPrice,ChildPrice,IsEnabled,ClosedWeekdays,Terms,UpdatedBy) VALUES(@museumId,@adultPrice,@concessionPrice,@childPrice,@enabled,@closed,@terms,@user); COMMIT;`,
        {
          museumId,
          adultPrice,
          concessionPrice,
          childPrice,
          enabled: b.isEnabled,
          closed: [...new Set(b.closedWeekdays)].join(","),
          terms,
          user: req.admin.id,
        },
      );
      res.json({ message: "Đã lưu bảng giá vé." });
    }),
  );
  app.get(
    "/api/admin/tickets/reservations",
    admin,
    run(async (_req, res) =>
      res.json(
        (
          await query(
            app.locals.pool,
            `SELECT TOP(200) r.ReservationID AS id,r.BookingCode AS code,m.Name AS museum,CONVERT(varchar(10),r.VisitDate,23) AS visitDate,r.FullName AS name,r.Email AS email,r.Adults+r.Concessions+r.Children AS guests,r.TotalAmount AS total,r.Status AS status,r.PaymentState AS paymentState,r.IsDemoPayment AS isDemoPayment FROM dbo.TicketReservations r JOIN dbo.Museums m ON m.MuseumID=r.MuseumID ORDER BY r.CreatedAt DESC`,
          )
        ).recordset,
      ),
    ),
  );
  app.put(
    "/api/admin/tickets/reservations/:id",
    admin,
    run(async (req, res) => {
      if (
        !UUID.test(req.params.id) ||
        !["Cancelled", "CheckedIn"].includes(req.body?.status)
      )
        R.fail("Trạng thái đặt vé không hợp lệ.");
      const result = await query(
        app.locals.pool,
        `UPDATE dbo.TicketReservations SET Status=@status OUTPUT INSERTED.ReservationID AS id WHERE ReservationID=@id AND IsDemoPayment=0 AND Status='Reserved' AND ((@status='CheckedIn' AND PaymentState IN ('Paid','NotRequired') AND VisitDate=CONVERT(date,DATEADD(minute,420,SYSUTCDATETIME()))) OR (@status='Cancelled' AND PaymentState='Failed'))`,
        { id: req.params.id, status: req.body.status },
      );
      if (!result.recordset.length)
        R.fail(
          "Đơn đã được xử lý hoặc không tồn tại.",
          409,
          "ALREADY_PROCESSED",
        );
      res.json({ message: "Đã cập nhật đặt vé." });
    }),
  );
}
module.exports = { attachTicketRoutes, validateBooking, ticketTotal };
