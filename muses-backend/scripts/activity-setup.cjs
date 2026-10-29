const fs = require("node:fs");
const path = require("node:path");
const sql = require("mssql");
async function setupActivity(
  config,
  administrator,
  createPool = (value) => new sql.ConnectionPool(value),
) {
  if (!config.database || !config.user || config.user.length > 128)
    throw Error("Thiếu DB_NAME hoặc DB_USER hợp lệ trong .env.");
  if (!administrator.user || !administrator.password)
    throw Error("Nhập tài khoản và mật khẩu SQL quản trị.");
  let pool, applicationPool;
  try {
    pool = createPool({
      ...config,
      user: administrator.user,
      password: administrator.password,
    });
    await pool.connect();
    await pool
      .request()
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/ActivityAnalytics.sql"),
          "utf8",
        ),
      );
    const result = await pool
      .request()
      .input("runtimeLogin", sql.NVarChar(128), config.user)
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/ActivityPermissions.sql"),
          "utf8",
        ),
      );
    applicationPool = createPool({ ...config });
    await applicationPool.connect();
    const access = await applicationPool
      .request()
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/ActivityAccess.sql"),
          "utf8",
        ),
      );
    if (!access.recordset[0]?.ready)
      throw Error(
        "Tài khoản ứng dụng vẫn bị chặn quyền đọc/ghi. Kiểm tra quyền DENY hoặc role db_denydatawriter của tài khoản trong SQL Server.",
      );
    return result.recordset[0].runtimeUser;
  } finally {
    await applicationPool?.close();
    await pool?.close();
  }
}
module.exports = { setupActivity };
