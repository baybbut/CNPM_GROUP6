const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ]
}));

const dbConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true // SQL Server local
  }
};

let pool;

// Kiểm tra kết nối database.
app.get("/api/health", async (req, res) => {
  try {
    await pool.request().query("SELECT 1 AS connected");

    res.json({
      message: "Backend Muses đã kết nối SQL Server!"
    });
  } catch (err) {
    console.error("Lỗi database:", err.message);

    res.status(503).json({
      message: "Không kết nối được database."
    });
  }
});

// Lấy tác phẩm từ database.
app.get("/api/artworks", async (req, res) => {
  const lang = req.query.lang || "vi";

  if (!["vi", "en", "ja"].includes(lang)) {
    return res.status(400).json({
      message: "Chỉ hỗ trợ vi, en và ja."
    });
  }

  try {
    const result = await pool
      .request()
      .input("lang", sql.VarChar(10), lang)
      .query(`
        SELECT
          a.ArtworkId AS id,
          ar.FullName AS artist,
          t.Title AS title,
          t.Description AS description
        FROM dbo.Artworks AS a
        JOIN dbo.Artists AS ar
          ON a.ArtistId = ar.ArtistId
        JOIN dbo.ArtworkTranslations AS t
          ON a.ArtworkId = t.ArtworkId
        WHERE t.LanguageCode = @lang
        ORDER BY a.ArtworkId;
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi lấy tác phẩm:", err.message);

    res.status(500).json({
      message: "Không lấy được danh sách tác phẩm."
    });
  }
});

// Kết nối SQL Server trước khi chạy API.
async function startServer() {
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();

    pool.on("error", (err) => {
      console.error("Lỗi kết nối SQL Server:", err.message);
    });

    console.log("Đã kết nối SQL Server.");

    app.listen(PORT, () => {
      console.log(`Backend chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Không khởi động được backend:", err.message);
    process.exitCode = 1;
  }
}

startServer();