const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Cho trình duyệt lấy ảnh trong muses-react/tranh.
const tranhDirectory = path.join(__dirname, "..", "muses-react", "tranh");

app.use("/images/tranh", express.static(tranhDirectory));
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

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

// Truy vấn đúng cấu trúc MusesMuseumDB.
async function getArtworks(lang, id = null) {
  const result = await app.locals.pool
    .request()
    .input("lang", sql.VarChar(10), lang)
    .input("id", sql.Int, id).query(`
      SELECT
        a.ArtworkID AS id,
        a.ArtworkName AS title,
        ar.ArtistName AS artist,
        c.CategoryID AS categoryId,
        c.CategoryName AS category,
        a.Material AS material,
        a.CreationPeriod AS creationPeriod,
        a.Dimensions AS dimensions,
        a.IsNationalTreasure AS isNationalTreasure,
        a.TreasureYear AS treasureYear,

        COALESCE(
          d.FullDescription,
          d.ShortDescription,
          vi.FullDescription,
          vi.ShortDescription
        ) AS description,

        COALESCE(
          d.ShortDescription,
          vi.ShortDescription
        ) AS shortDescription,

        CASE
          WHEN d.FullDescription IS NOT NULL
            OR d.ShortDescription IS NOT NULL
            THEN @lang
          WHEN vi.FullDescription IS NOT NULL
            OR vi.ShortDescription IS NOT NULL
            THEN 'vi'
          ELSE NULL
        END AS descriptionLanguage,

        d.AudioURL AS audioUrl,
        img.ImageURL AS imageUrl

      FROM dbo.Artworks AS a

      JOIN dbo.Artists AS ar
        ON a.ArtistID = ar.ArtistID

      JOIN dbo.Categories AS c
        ON a.CategoryID = c.CategoryID

      LEFT JOIN dbo.Languages AS langRequested
        ON langRequested.LanguageCode = @lang

      LEFT JOIN dbo.ArtworkDescriptions AS d
        ON d.ArtworkID = a.ArtworkID
        AND d.LanguageID = langRequested.LanguageID

      LEFT JOIN dbo.Languages AS langVi
        ON langVi.LanguageCode = 'vi'

      LEFT JOIN dbo.ArtworkDescriptions AS vi
        ON vi.ArtworkID = a.ArtworkID
        AND vi.LanguageID = langVi.LanguageID

      OUTER APPLY (
        SELECT TOP (1)
          i.ImageURL
        FROM dbo.ArtworkImages AS i
        WHERE i.ArtworkID = a.ArtworkID
        ORDER BY
          i.IsPrimary DESC,
          i.DisplayOrder ASC,
          i.ImageID ASC
      ) AS img

      WHERE (@id IS NULL OR a.ArtworkID = @id)

      ORDER BY a.ArtworkID;
    `);

  return result.recordset;
}

// Kiểm tra ngôn ngữ gửi đến API.
function validateLanguage(req, res, next) {
  const lang = req.query.lang || "vi";

  if (!["vi", "en"].includes(lang)) {
    return res.status(400).json({
      message: "Hiện hỗ trợ vi và en.",
    });
  }

  req.artworkLanguage = lang;
  next();
}

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

// Danh sách tác phẩm.
app.get("/api/artworks", validateLanguage, async (req, res) => {
  try {
    const artworks = await getArtworks(req.artworkLanguage);
    res.json(artworks);
  } catch (err) {
    console.error("Lỗi lấy danh sách tác phẩm:", err.message);

    res.status(500).json({
      message: "Không lấy được danh sách tác phẩm.",
    });
  }
});

// Chi tiết một tác phẩm.
app.get("/api/artworks/:id", validateLanguage, async (req, res) => {
  const rawId = req.params.id;
  const id = Number(rawId);

  if (
    !/^[1-9][0-9]*$/.test(rawId) ||
    !Number.isInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({
      message: "Mã tác phẩm không hợp lệ.",
    });
  }

  try {
    const artworks = await getArtworks(req.artworkLanguage, id);

    if (artworks.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tác phẩm.",
      });
    }

    res.json(artworks[0]);
  } catch (err) {
    console.error("Lỗi lấy chi tiết tác phẩm:", err.message);

    res.status(500).json({
      message: "Không lấy được chi tiết tác phẩm.",
    });
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
module.exports = { app, startServer };
