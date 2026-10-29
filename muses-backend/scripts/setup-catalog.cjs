const fs = require("node:fs");
const path = require("node:path");
const sql = require("mssql");
const { terminalPrompt } = require("./terminal-prompt.cjs");
const { setupActivity } = require("./activity-setup.cjs");
async function setupCatalog(
  config,
  administrator,
  {
    backupPath,
    seed = false,
    createPool = (value) => new sql.ConnectionPool(value),
  } = {},
) {
  if (!backupPath || !backupPath.startsWith("/") || backupPath.length > 500)
    throw Error("Cần đường dẫn file backup tuyệt đối trên máy SQL Server.");
  let pool, applicationPool;
  try {
    pool = createPool({ ...config, ...administrator });
    await pool.connect();
    await pool
      .request()
      .input("database", sql.NVarChar(128), config.database)
      .input("backup", sql.NVarChar(500), backupPath)
      .query(
        "BACKUP DATABASE @database TO DISK=@backup WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@backup WITH CHECKSUM;",
      );
    await setupActivity(config, administrator, createPool);
    const file = seed ? "CatalogDemo.sql" : "Catalog.sql";
    if (seed) {
      await pool
        .request()
        .input("user", sql.NVarChar(128), administrator.user)
        .query(
          "IF NOT EXISTS(SELECT 1 FROM dbo.Users WHERE Role IN ('Admin','Administrator') AND IsActive=1) THROW 51000,N'Create a web Admin account before seeding demo data.',1;",
        );
    }
    for (const batch of fs
      .readFileSync(path.join(__dirname, "../MusesDB", file), "utf8")
      .split(/^GO\s*$/im)
      .filter((s) => s.trim()))
      await pool.request().query(batch);
    await pool
      .request()
      .input("runtimeLogin", sql.NVarChar(128), config.user)
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/CatalogPermissions.sql"),
          "utf8",
        ),
      );
    applicationPool = createPool({ ...config });
    await applicationPool.connect();
    const access = await applicationPool
      .request()
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/CatalogAccess.sql"),
          "utf8",
        ),
      );
    if (!access.recordset[0]?.ready)
      throw Error(
        "User ứng dụng còn bị DENY quyền. Kiểm tra role db_denydatawriter / quyền DENY với SQL quản trị; không đổi sang sa để chạy backend.",
      );
  } finally {
    await applicationPool?.close();
    await pool?.close();
  }
}
if (require.main === module) {
  const { dbConfig } = require("../server.cjs");
  const prompt = terminalPrompt();
  (async () => {
    try {
      console.log(
        `Database: ${dbConfig.database}. User ứng dụng: ${dbConfig.user}. Backup được lưu trong máy/container SQL Server.`,
      );
      const user =
        (await prompt.ask("Tài khoản SQL quản trị [sa]: ")).trim() || "sa";
      const password = await prompt.ask(
        "Mật khẩu SQL quản trị (không hiển thị): ",
        true,
      );
      const proposed = `/var/opt/mssql/data/muses-before-prd-${Date.now()}.bak`;
      const backupPath =
        (
          await prompt.ask(`Đường dẫn backup trên SQL Server [${proposed}]: `)
        ).trim() || proposed;
      await setupCatalog(
        dbConfig,
        { user, password },
        { backupPath, seed: process.argv.includes("--demo") },
      );
      console.log(`Đã sao lưu và kiểm tra backup: ${backupPath}`);
      console.log(
        process.argv.includes("--demo")
          ? "Đã thêm bộ dữ liệu MINH HỌA."
          : "Đã cập nhật mô hình PRD. Nội dung cũ giữ ở trạng thái nháp; dùng npm run admin:create để tạo Admin nếu chưa có.",
      );
    } catch (e) {
      console.error("Chưa hoàn tất:", e.message);
      process.exitCode = 1;
    } finally {
      prompt.close();
    }
  })();
}
module.exports = { setupCatalog };
