const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const { attachActivityRoutes } = require("./activity.cjs");
const sql = require("mssql");

const { attachPlaceRoutes } = require("./places.cjs");
const { attachTicketRoutes } = require("./tickets.cjs");
const { attachArtworkQRRoutes } = require("./artwork-qr.cjs");
const { attachCatalogRoutes } = require("./catalog.cjs");
const app = express();
app.get("/api/translation/health", (_req, res) =>
  res.json({ mode: "manual", languages: ["vi", "en", "zh", "ja", "ko"] }),
);
const PORT = Number(process.env.PORT || 3001);
app.use("/api", (_req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) =>
    json(
      res.statusCode >= 400 && body?.message && !body.code
        ? {
            ...body,
            code:
              {
                400: "BAD_REQUEST",
                401: "UNAUTHENTICATED",
                403: "FORBIDDEN",
                404: "NOT_FOUND",
                409: "CONFLICT",
                429: "TOO_MANY_REQUESTS",
                503: "UNAVAILABLE",
              }[res.statusCode] || "INTERNAL_ERROR",
          }
        : body,
    );
  next();
});

// Cho trình duyệt lấy ảnh trong muses-react/tranh.
const tranhDirectory = path.join(__dirname, "..", "muses-react", "tranh");

app.use("/images/tranh", express.static(tranhDirectory));
app.use(
  "/images/background",
  express.static(path.join(__dirname, "..", "muses-react", "background")),
);
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use("/api", express.json({ limit: "64kb" }));
attachActivityRoutes(app, sql);
app.use("/api", (err, _req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ message: "Nội dung gửi lên không hợp lệ." });
  if (err.status === 413)
    return res.status(413).json({ message: "Nội dung gửi lên quá lớn." });
  next(err);
});

const dbConfig = {
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

// Kiểm tra backend đang kết nối DB nào.
app.get("/api/health", async (req, res) => {
  try {
    const result = await app.locals.pool
      .request()
      .query("SELECT DB_NAME() AS databaseName");

    res.json({
      message: "Backend Muses đã kết nối SQL Server!",
      database: result.recordset[0].databaseName,
    });
  } catch (err) {
    console.error("Lỗi database:", err.message);

    res.status(503).json({
      message: "Không kết nối được database.",
    });
  }
});

attachArtworkQRRoutes(app, sql);
attachCatalogRoutes(app, sql);
attachTicketRoutes(app, sql);
attachPlaceRoutes(app);

// Stable homepage placement keys, independent of artwork ordering and language.
app.get("/api/site-images", async (_req, res) => {
  try {
    const result = await app.locals.pool.request().query(`
      SELECT s.SlotKey AS slot, s.ImageURL AS imageUrl, s.ArtworkID AS artworkId
      FROM dbo.SiteImages AS s
      WHERE s.SlotKey LIKE 'home.%' OR s.SlotKey LIKE 'exhibition.%'
      ORDER BY s.SlotKey;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi cấu hình ảnh trang chủ:", err.message);
    res.status(503).json({ message: "Chưa tải được cấu hình ảnh trang chủ." });
  }
});

// Production: serve the built visitor website and API on the same origin.
app.use("/api", (_req, res) =>
  res.status(404).json({ message: "API not found." }),
);
app.use("/images", (_req, res) => res.sendStatus(404));
const websiteDirectory = path.join(__dirname, "..", "muses-react", "dist");
app.use(express.static(websiteDirectory));
app.use((req, res, next) => {
  if (req.method !== "GET" || !req.accepts("html") || path.extname(req.path))
    return next();
  res.sendFile(path.join(websiteDirectory, "index.html"), (err) => {
    if (err) next(err);
  });
});

async function startServer() {
  try {
    for (const name of ["DB_NAME", "DB_USER", "DB_PASSWORD"]) {
      if (!process.env[name])
        throw new Error(`Thiếu cấu hình ${name} trong môi trường hoặc .env`);
    }
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    app.locals.pool = pool;

    pool.on("error", (err) => {
      console.error("Lỗi SQL Server:", err.message);
    });

    console.log(`Đã kết nối database: ${dbConfig.database}`);

    return app.listen(PORT, () => {
      console.log(`Backend chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Không khởi động được backend:", err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) startServer();
module.exports = { app, startServer, dbConfig };
