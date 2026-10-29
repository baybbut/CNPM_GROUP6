const fs = require("node:fs");
const path = require("node:path");
const sql = require("mssql");
const { dbConfig } = require("../server.cjs");
(async () => {
  let pool;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    await pool
      .request()
      .query(
        fs.readFileSync(
          path.join(__dirname, "../MusesDB/ActivityAnalytics.sql"),
          "utf8",
        ),
      );
    console.log(
      "Đã cập nhật bảng đăng nhập và thống kê. Dữ liệu hiện có được giữ nguyên.",
    );
  } catch (e) {
    console.error("Chưa cập nhật được database:", e.message);
    if ([229, 262, 2760].includes(e.number))
      console.error(
        "Tài khoản hiện tại thiếu quyền tạo bảng. Chạy npm run db:setup để cập nhật bằng tài khoản SQL quản trị và cấp quyền đọc/ghi cho ứng dụng.",
      );
    process.exitCode = 1;
  } finally {
    await pool?.close();
  }
})();
