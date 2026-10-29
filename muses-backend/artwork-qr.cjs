const R = require("./catalog-rules.cjs");
const AVAILABLE = `a.PublicationStatus='Published' AND EXISTS(SELECT 1 FROM dbo.ArtworkDescriptions d JOIN dbo.Languages l ON l.LanguageID=d.LanguageID WHERE d.ArtworkID=a.ArtworkID AND l.LanguageCode='vi' AND d.PublicationStatus='Published' AND NULLIF(LTRIM(RTRIM(d.Title)),'') IS NOT NULL AND NULLIF(LTRIM(RTRIM(d.FullDescription)),'') IS NOT NULL)`;
function attachArtworkQRRoutes(app, sql) {
  async function query(text, values = {}) {
    const q = app.locals.pool.request();
    for (const [k, v] of Object.entries(values))
      q.input(
        k,
        typeof v === "boolean"
          ? sql.Bit
          : typeof v === "number"
            ? sql.Int
            : sql.NVarChar(sql.MAX),
        v,
      );
    return q.query(text);
  }
  const wrap = (fn) => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof R.CatalogError)
        return res.status(e.status).json({ code: e.code, message: e.message });
      console.error("Artwork QR API:", e.code || e.message);
      res
        .status(503)
        .json({
          code: [207, 208].includes(e.number)
            ? "QR_SETUP_REQUIRED"
            : "QR_UNAVAILABLE",
          message: [207, 208].includes(e.number)
            ? "Cần cập nhật dữ liệu QR bằng lệnh db:catalog rồi khởi động lại backend."
            : "Chưa tải được mã QR. Vui lòng thử lại.",
        });
    }
  };
  const gate = wrap(async (req, res) => {
    const user = await app.locals.identity(req);
    if (!user) R.fail("Vui lòng đăng nhập quản trị.", 401, "UNAUTHENTICATED");
    if (!["Admin", "Administrator"].includes(user.role))
      R.fail("Tài khoản không có quyền quản trị.", 403, "FORBIDDEN");
    req.admin = user;
  });
  const admin = (req, res, next) =>
    gate(req, res).then(() => {
      if (req.admin && !res.headersSent) next();
    });
  app.get(
    "/api/admin/qr/artworks",
    admin,
    wrap(async (req, res) => {
      const result =
        await query(`SELECT a.ArtworkID AS id,a.ArtworkName AS title,a.QRLabel AS label,a.QRIsEnabled AS enabled,CAST(CASE WHEN ${AVAILABLE} THEN 1 ELSE 0 END AS bit) AS available,a.PublicationStatus AS artworkStatus,CONVERT(varchar(33),a.QRUpdatedAt,126)+'Z' AS updatedAt,
      COALESCE(q.scans,0) AS scans,CONVERT(varchar(33),q.lastScannedAt,126)+'Z' AS lastScannedAt
      FROM dbo.Artworks a OUTER APPLY(SELECT COUNT(*) AS scans,MAX(e.OccurredAt) AS lastScannedAt FROM dbo.AnalyticsEvents e WHERE e.ArtworkID=a.ArtworkID AND e.Kind='qr_scan') q ORDER BY a.ArtworkID;`);
      res.json({ items: result.recordset });
    }),
  );
  app.put(
    "/api/admin/qr/artworks/:id",
    admin,
    wrap(async (req, res) => {
      const id = R.id(req.params.id);
      if (typeof req.body?.enabled !== "boolean")
        R.fail("Trạng thái QR không hợp lệ.");
      const label = R.text(req.body.label, "Tên mã QR", 150) || null;
      const found = await query(
        `SELECT a.ArtworkID AS id,CAST(CASE WHEN ${AVAILABLE} THEN 1 ELSE 0 END AS bit) AS available FROM dbo.Artworks a WHERE a.ArtworkID=@id;`,
        { id },
      );
      if (!found.recordset[0])
        R.fail("Không tìm thấy tác phẩm.", 404, "NOT_FOUND");
      if (req.body.enabled && !found.recordset[0].available)
        R.fail(
          "Công bố tác phẩm và mô tả tiếng Việt trước khi bật QR.",
          409,
          "ARTWORK_UNAVAILABLE",
        );
      const result = await query(
        `UPDATE a SET QRIsEnabled=@enabled,QRLabel=@label,QRUpdatedAt=SYSUTCDATETIME(),QRUpdatedBy=@user OUTPUT inserted.ArtworkID AS id FROM dbo.Artworks a WHERE a.ArtworkID=@id AND (@enabled=0 OR (${AVAILABLE}));`,
        { id, enabled: req.body.enabled, label, user: req.admin.id },
      );
      if (!result.recordset[0])
        R.fail(
          "Trạng thái tác phẩm đã thay đổi. Hãy tải lại.",
          409,
          "ARTWORK_UNAVAILABLE",
        );
      res.json({ ok: true, id });
    }),
  );
  app.get(
    "/api/qr/artworks/:id",
    wrap(async (req, res) => {
      const id = R.id(req.params.id);
      const result = await query(
        `SELECT a.ArtworkID AS id,a.QRIsEnabled AS enabled,COALESCE(NULLIF(a.QRLabel,''),a.ArtworkName) AS label FROM dbo.Artworks a WHERE a.ArtworkID=@id AND ${AVAILABLE};`,
        { id },
      );
      const row = result.recordset[0];
      if (!row)
        R.fail("Không tìm thấy QR tác phẩm đang công bố.", 404, "QR_NOT_FOUND");
      if (!row.enabled)
        R.fail("Mã QR này đã ngừng hoạt động.", 410, "QR_DISABLED");
      res.json({ id: row.id, label: row.label, active: true });
    }),
  );
}
module.exports = { attachArtworkQRRoutes };
