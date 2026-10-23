const readline = require("node:readline");
const { Writable } = require("node:stream");
const sql = require("mssql");
const { dbConfig } = require("../server.cjs");
const { hashPassword } = require("../activity.cjs");
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output,
  terminal: process.stdin.isTTY,
});
const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));
(async () => {
  let pool;
  try {
    const name = (await ask("Tên quản trị viên: ")).trim();
    const email = (await ask("Email: ")).trim().toLowerCase();
    process.stdout.write("Mật khẩu (ít nhất 8 ký tự, không hiển thị): ");
    muted = true;
    const password = await ask("");
    muted = false;
    process.stdout.write("\n");
    if (
      !name ||
      name.length > 150 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      email.length > 255 ||
      password.length < 8 ||
      password.length > 128
    )
      throw Error("Tên, email hoặc mật khẩu không hợp lệ.");
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const existing = await pool
      .request()
      .input("email", sql.VarChar(255), email)
      .query("SELECT UserID FROM dbo.Users WHERE Email=@email;");
    if (existing.recordset.length)
      throw Error(
        "Email đã tồn tại; dùng email mới. Script không ghi đè tài khoản hiện có.",
      );
    const hash = await hashPassword(password);
    await pool
      .request()
      .input("name", sql.NVarChar(150), name)
      .input("email", sql.VarChar(255), email)
      .input("hash", sql.NVarChar(500), hash)
      .query(
        "INSERT INTO dbo.Users(FullName,Email,PasswordHash,Role) VALUES(@name,@email,@hash,'Admin');",
      );
    console.log(
      "Đã tạo tài khoản Admin. Bạn có thể đăng nhập trên trang thống kê.",
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    muted = false;
    rl.close();
    await pool?.close();
  }
})();
