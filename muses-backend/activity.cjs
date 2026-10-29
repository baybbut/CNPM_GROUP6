const crypto = require("node:crypto");
const { promisify } = require("node:util");
const scrypt = promisify(crypto.scrypt);
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS = ["page_view", "qr_scan", "audio_play", "heartbeat"];
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}
async function verifyPassword(password, hash) {
  const [kind, salt, value] = String(hash).split(":");
  if (kind !== "scrypt" || !salt || !/^[a-f0-9]{128}$/.test(value || ""))
    return false;
  const key = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(key, Buffer.from(value, "hex"));
}
function validDate(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value || "") ||
    String(value).startsWith("0000")
  )
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}
function reportRange(query) {
  const today = new Date(Date.now() + 420 * 60000).toISOString().slice(0, 10);
  const from = query.from || today,
    to = query.to || today;
  if (
    !validDate(from) ||
    !validDate(to) ||
    from > to ||
    new Date(to) - new Date(from) > 365 * 86400000
  )
    throw Error("INVALID_RANGE");
  return {
    from,
    to,
    start: new Date(new Date(`${from}T00:00:00Z`) - 420 * 60000),
    end: new Date(+new Date(`${to}T00:00:00Z`) + 86400000 - 420 * 60000),
  };
}
function reportHours(query) {
  const from = query.fromHour === undefined ? "0" : query.fromHour;
  const to = query.toHour === undefined ? "24" : query.toHour;
  if (!/^\d{1,2}$/.test(String(from)) || !/^\d{1,2}$/.test(String(to)))
    throw Error("INVALID_HOURS");
  const fromHour = Number(from),
    toHour = Number(to);
  if (
    fromHour < 0 ||
    fromHour > 23 ||
    toHour < 1 ||
    toHour > 24 ||
    fromHour >= toHour
  )
    throw Error("INVALID_HOURS");
  return { fromHour, toHour };
}
function validateActivity(body) {
  if (
    !body ||
    !UUID.test(body.sessionId) ||
    !UUID.test(body.visitorId) ||
    !UUID.test(body.eventId) ||
    !KINDS.includes(body.kind)
  )
    throw Error("INVALID_ACTIVITY");
  if (
    (["qr_scan", "audio_play"].includes(body.kind) || body.point != null) &&
    body.artworkId == null
  )
    throw Error("INVALID_ARTWORK");
  if (
    body.artworkId != null &&
    (!Number.isInteger(body.artworkId) ||
      body.artworkId < 1 ||
      body.artworkId > 2147483647)
  )
    throw Error("INVALID_ARTWORK");
  if (body.point != null && !/^[a-zA-Z0-9:_-]{1,80}$/.test(body.point))
    throw Error("INVALID_POINT");
  if (body.language != null && !/^[a-z]{2}(-[A-Za-z]{2})?$/.test(body.language))
    throw Error("INVALID_LANGUAGE");
  return body;
}
function attachActivityRoutes(app, sql) {
  const limits = new Map();
  const limit = (req, key, max) => {
    const now = Date.now(),
      id = `${key}:${req.ip}`;
    let item = limits.get(id);
    if (!item || item.until < now) {
      if (limits.size > 10000) limits.clear();
      item = { count: 0, until: now + 60000 };
      limits.set(id, item);
    }
    return ++item.count <= max;
  };
  const request = () => app.locals.pool.request();
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      console.error("Activity API:", e.code || e.message);
      res.status(503).json({
        code: "ACTIVITY_UNAVAILABLE",
        message:
          "Chưa tải được dữ liệu. Kiểm tra kết nối và cập nhật database.",
      });
    }
  };
  const cookieName = "muses_session";
  const cookie = (res, value, clear = false) =>
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 43200}${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`,
    );
  const digest = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");
  async function identity(req) {
    const token = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const result = await request()
      .input("token", sql.VarChar(64), digest(token))
      .query(
        `SELECT u.UserID AS id,u.FullName AS name,u.Role AS role FROM dbo.AuthSessions s JOIN dbo.Users u ON u.UserID=s.UserID WHERE s.TokenHash=@token AND s.ExpiresAt>SYSUTCDATETIME() AND u.IsActive=1;`,
      );
    return result.recordset[0] || null;
  }
  app.locals.identity = identity;
  app.post(
    "/api/auth/register",
    wrap(async (req, res) => {
      if (!limit(req, "register", 5))
        return res.status(429).json({ message: "Thử lại sau một phút." });
      const { name, email, password } = req.body || {};
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 150 ||
        typeof email !== "string" ||
        email.length > 255 ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      )
        return res.status(400).json({
          message: "Nhập tên, email hợp lệ và mật khẩu từ 8 đến 128 ký tự.",
        });
      const hash = await hashPassword(password);
      try {
        await request()
          .input("name", sql.NVarChar(150), name.trim())
          .input("email", sql.VarChar(255), email.trim().toLowerCase())
          .input("hash", sql.NVarChar(500), hash)
          .query(
            "INSERT INTO dbo.Users(FullName,Email,PasswordHash,Role) VALUES(@name,@email,@hash,'Visitor');",
          );
      } catch (e) {
        if ([2601, 2627].includes(e.number))
          return res.status(409).json({
            message:
              "Không thể đăng ký email này. Vui lòng đăng nhập hoặc dùng email khác.",
          });
        throw e;
      }
      res
        .status(201)
        .json({ message: "Tạo tài khoản thành công. Bạn có thể đăng nhập." });
    }),
  );
  app.post(
    "/api/auth/login",
    wrap(async (req, res) => {
      if (!limit(req, "login", 10))
        return res.status(429).json({ message: "Thử lại sau một phút." });
      const { email, password } = req.body || {};
      if (
        typeof email !== "string" ||
        email.length > 255 ||
        typeof password !== "string" ||
        password.length > 128
      )
        return res
          .status(400)
          .json({ message: "Thông tin đăng nhập không hợp lệ." });
      const rows = await request()
        .input("email", sql.VarChar(255), email.trim().toLowerCase())
        .query(
          "SELECT UserID AS id,FullName AS name,Role AS role,PasswordHash AS hash FROM dbo.Users WHERE Email=@email AND IsActive=1;",
        );
      const user = rows.recordset[0];
      // Perform the same password derivation when no account matches.
      const fallback =
        "scrypt:00000000000000000000000000000000:" + "0".repeat(128);
      const matches = await verifyPassword(password, user?.hash || fallback);
      if (!user || !matches)
        return res
          .status(401)
          .json({ message: "Email hoặc mật khẩu không đúng." });
      const token = crypto.randomBytes(32).toString("hex");
      await request()
        .input("token", sql.VarChar(64), digest(token))
        .input("user", sql.Int, user.id)
        .query(
          "SET XACT_ABORT ON; BEGIN TRANSACTION; INSERT INTO dbo.AuthSessions(TokenHash,UserID,ExpiresAt) VALUES(@token,@user,DATEADD(hour,12,SYSUTCDATETIME())); INSERT INTO dbo.AuthLoginEvents(UserID) VALUES(@user); COMMIT;",
        );
      cookie(res, token);
      res.json({ user: { id: user.id, name: user.name, role: user.role } });
    }),
  );
  app.get(
    "/api/auth/me",
    wrap(async (req, res) => res.json({ user: await identity(req) })),
  );
  app.post(
    "/api/auth/logout",
    wrap(async (req, res) => {
      const token = (req.headers.cookie || "")
        .split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1);
      if (token)
        await request()
          .input("token", sql.VarChar(64), digest(token))
          .query("DELETE FROM dbo.AuthSessions WHERE TokenHash=@token;");
      cookie(res, "", true);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/activity",
    wrap(async (req, res) => {
      if (!limit(req, "activity", 240))
        return res.status(429).json({ message: "Too many requests" });
      let body;
      try {
        body = validateActivity(req.body);
      } catch {
        return res.status(400).json({ message: "Hoạt động không hợp lệ." });
      }
      const user = await identity(req);
      const result = await request()
        .input("session", sql.VarChar(36), body.sessionId)
        .input("visitor", sql.VarChar(36), body.visitorId)
        .input("user", sql.Int, user?.id || null)
        .input("event", sql.VarChar(36), body.eventId)
        .input("kind", sql.VarChar(20), body.kind)
        .input("artwork", sql.Int, body.artworkId || null)
        .input(
          "point",
          sql.VarChar(80),
          body.point || (body.artworkId ? `artwork:${body.artworkId}` : null),
        )
        .input("language", sql.VarChar(10), body.language || null).query(`
   SET XACT_ABORT ON;
   BEGIN TRANSACTION;
   IF @artwork IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.Artworks WHERE ArtworkID=@artwork)
   BEGIN ROLLBACK; SELECT 'INVALID_ARTWORK' AS error; RETURN; END;
   IF EXISTS(SELECT 1 FROM dbo.AnalyticsSessions WITH(UPDLOCK,HOLDLOCK) WHERE SessionID=@session AND VisitorID<>@visitor)
   BEGIN ROLLBACK; SELECT 'INVALID_SESSION' AS error; RETURN; END;
   IF NOT EXISTS(SELECT 1 FROM dbo.AnalyticsSessions WITH(UPDLOCK,HOLDLOCK) WHERE SessionID=@session)
    INSERT INTO dbo.AnalyticsSessions(SessionID,VisitorID,UserID) VALUES(@session,@visitor,@user);
   ELSE UPDATE dbo.AnalyticsSessions SET LastSeenAt=SYSUTCDATETIME(),UserID=@user WHERE SessionID=@session;
   IF @kind<>'heartbeat' AND NOT EXISTS(SELECT 1 FROM dbo.AnalyticsEvents WITH(UPDLOCK,HOLDLOCK) WHERE EventID=@event)
    INSERT INTO dbo.AnalyticsEvents(EventID,SessionID,UserID,Kind,ArtworkID,PointKey,LanguageCode) VALUES(@event,@session,@user,@kind,@artwork,@point,@language);
   COMMIT;
   SELECT 'OK' AS result;
  `);
      if (result.recordset?.[0]?.error)
        return res
          .status(400)
          .json({ message: "Tác phẩm hoặc phiên truy cập không hợp lệ." });
      res.status(202).json({ ok: true });
    }),
  );
  app.get(
    "/api/admin/analytics",
    wrap(async (req, res) => {
      const user = await identity(req);
      if (!user)
        return res
          .status(401)
          .json({ message: "Vui lòng đăng nhập tài khoản quản trị." });
      if (!["Admin", "Administrator"].includes(user.role))
        return res
          .status(403)
          .json({ message: "Tài khoản không có quyền xem thống kê." });
      let range, hourRange;
      try {
        range = reportRange(req.query);
        hourRange = reportHours(req.query);
      } catch {
        return res
          .status(400)
          .json({
            message:
              "Chọn khoảng ngày hợp lệ (tối đa 366 ngày) và khung giờ từ 00:00 đến 24:00, giờ kết thúc lớn hơn giờ bắt đầu.",
          });
      }
      const hourWindow = (alias) =>
        `DATEPART(hour,DATEADD(minute,420,${alias}.OccurredAt))>=@fromHour AND DATEPART(hour,DATEADD(minute,420,${alias}.OccurredAt))<@toHour`;
      const sessionHours = `@allHours=1 OR EXISTS(SELECT 1 FROM dbo.AnalyticsEvents sx WHERE sx.SessionID=s.SessionID AND sx.OccurredAt>=@start AND sx.OccurredAt<@end AND ${hourWindow("sx")})`;
      const result = await request()
        .input("fromHour", sql.Int, hourRange.fromHour)
        .input("toHour", sql.Int, hourRange.toHour)
        .input(
          "allHours",
          sql.Bit,
          hourRange.fromHour === 0 && hourRange.toHour === 24,
        )
        .input("start", sql.DateTime2, range.start)
        .input("end", sql.DateTime2, range.end).query(`
    SELECT COUNT(*) AS sessions,COUNT(DISTINCT VisitorID) AS visitors,(SELECT COUNT(DISTINCT VisitorID) FROM dbo.AnalyticsSessions WHERE LastSeenAt>=DATEADD(minute,-5,SYSUTCDATETIME())) AS activeVisitors,
      (SELECT COUNT(DISTINCT s.UserID) FROM dbo.AnalyticsSessions s JOIN dbo.Users u ON u.UserID=s.UserID WHERE s.LastSeenAt>=DATEADD(minute,-5,SYSUTCDATETIME()) AND u.Role='Visitor') AS activeLoggedIn
    FROM dbo.AnalyticsSessions s WHERE s.LastSeenAt>=@start AND s.StartedAt<@end AND (${sessionHours});
    SELECT COUNT(*) AS logins,COUNT(DISTINCT s.UserID) AS loggedInUsers FROM dbo.AuthLoginEvents s JOIN dbo.Users u ON u.UserID=s.UserID WHERE s.LoggedAt>=@start AND s.LoggedAt<@end AND DATEPART(hour,DATEADD(minute,420,s.LoggedAt))>=@fromHour AND DATEPART(hour,DATEADD(minute,420,s.LoggedAt))<@toHour AND u.Role='Visitor';
    SELECT COUNT(CASE WHEN Kind='qr_scan' THEN 1 END) AS qrScans,COUNT(CASE WHEN Kind='audio_play' THEN 1 END) AS audioPlays FROM dbo.AnalyticsEvents e WHERE e.OccurredAt>=@start AND e.OccurredAt<@end AND ${hourWindow("e")};
    SELECT CONVERT(VARCHAR(10),DATEADD(minute,420,e.OccurredAt),23) AS day,COUNT(DISTINCT s.VisitorID) AS visitors,COUNT(DISTINCT e.SessionID) AS sessions,
      COUNT(CASE WHEN e.Kind='qr_scan' THEN 1 END) AS qrScans,COUNT(CASE WHEN e.Kind='audio_play' THEN 1 END) AS audioPlays
    FROM dbo.AnalyticsEvents e JOIN dbo.AnalyticsSessions s ON s.SessionID=e.SessionID WHERE e.OccurredAt>=@start AND e.OccurredAt<@end AND ${hourWindow("e")} GROUP BY CONVERT(VARCHAR(10),DATEADD(minute,420,e.OccurredAt),23) ORDER BY day;
    SELECT DATEPART(hour,DATEADD(minute,420,e.OccurredAt)) AS hour,COUNT(DISTINCT s.VisitorID) AS visitors,COUNT(*) AS interactions
    FROM dbo.AnalyticsEvents e JOIN dbo.AnalyticsSessions s ON s.SessionID=e.SessionID WHERE e.OccurredAt>=@start AND e.OccurredAt<@end AND ${hourWindow("e")} GROUP BY DATEPART(hour,DATEADD(minute,420,e.OccurredAt)) ORDER BY hour;
    SELECT e.PointKey AS point,CASE WHEN COUNT(DISTINCT e.ArtworkID)=1 THEN MIN(e.ArtworkID) END AS artworkId,CASE WHEN COUNT(DISTINCT e.ArtworkID)>1 THEN CONCAT(COUNT(DISTINCT e.ArtworkID),N' tác phẩm') ELSE MAX(a.ArtworkName) END AS title,COUNT(DISTINCT CASE WHEN e.Kind IN('qr_scan','audio_play') THEN s.VisitorID END) AS participants,COUNT(DISTINCT CASE WHEN e.Kind IN('qr_scan','audio_play') THEN e.UserID END) AS signedInParticipants,
      COUNT(DISTINCT s.VisitorID) AS viewers,COUNT(CASE WHEN e.Kind='qr_scan' THEN 1 END) AS qrScans,COUNT(CASE WHEN e.Kind='audio_play' THEN 1 END) AS audioPlays
    FROM dbo.AnalyticsEvents e JOIN dbo.AnalyticsSessions s ON s.SessionID=e.SessionID LEFT JOIN dbo.Artworks a ON a.ArtworkID=e.ArtworkID
    WHERE e.OccurredAt>=@start AND e.OccurredAt<@end AND ${hourWindow("e")} AND e.PointKey IS NOT NULL GROUP BY e.PointKey ORDER BY participants DESC,viewers DESC;
    SELECT TOP(100) s.SessionID AS id,CASE WHEN u.Role='Visitor' THEN u.FullName END AS name,s.StartedAt AS startedAt,s.LastSeenAt AS lastSeenAt,CASE WHEN s.LastSeenAt>=DATEADD(minute,-5,SYSUTCDATETIME()) THEN 1 ELSE 0 END AS active
    FROM dbo.AnalyticsSessions s LEFT JOIN dbo.Users u ON u.UserID=s.UserID WHERE s.LastSeenAt>=@start AND s.StartedAt<@end AND (${sessionHours}) ORDER BY s.LastSeenAt DESC;
    SELECT MIN(OccurredAt) AS trackingSince FROM dbo.AnalyticsEvents;
  `);
      const [summary, logins, plays, daily, hours, points, recent, since] =
        result.recordsets;
      const peak = Math.max(0, ...hours.map((x) => x.visitors));
      res.json({
        from: range.from,
        to: range.to,
        timeZone: "Asia/Ho_Chi_Minh",
        fromHour: hourRange.fromHour,
        toHour: hourRange.toHour,
        updatedAt: new Date().toISOString(),
        summary: { ...summary[0], ...logins[0], ...plays[0] },
        daily,
        hours,
        points,
        recent,
        peakHours: peak
          ? hours.filter((x) => x.visitors === peak).map((x) => x.hour)
          : [],
        trackingSince: since[0]?.trackingSince || null,
      });
    }),
  );
}
module.exports = {
  attachActivityRoutes,
  hashPassword,
  verifyPassword,
  validateActivity,
  reportRange,
  reportHours,
};
