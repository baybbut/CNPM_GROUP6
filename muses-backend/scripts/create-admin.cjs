const sql = require("mssql");
const { dbConfig } = require("../server.cjs");
const { hashPassword } = require("../activity.cjs");
const { terminalPrompt } = require("./terminal-prompt.cjs");
const prompt = terminalPrompt();
(async () => {
  let pool;
  try {
    const name = (await prompt.ask("Tên quản trị viên: ")).trim();
    const email = (await prompt.ask("Email: ")).trim().toLowerCase();
    const password = await prompt.ask(
      "Mật khẩu web Admin (8–128 ký tự, không hiển thị): ",
      true,
    );
    const confirmation = await prompt.ask(
      "Nhập lại mật khẩu web Admin: ",
      true,
    );
    if (password !== confirmation)
      throw Error("Hai lần nhập mật khẩu không khớp. Chưa tạo tài khoản.");
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
      `Đã tạo tài khoản Admin. Email: ${email}. Database: ${dbConfig.database}. Dùng mật khẩu WEB vừa nhập để đăng nhập.`,
    );
  } catch (e) {
    console.error("Chưa tạo được tài khoản:", e.message);
    if (e.number === 229)
      console.error(
        "User ứng dụng chưa có quyền INSERT Users. Hoàn tất npm run db:catalog bằng SQL quản trị trước.",
      );
    process.exitCode = 1;
  } finally {
    prompt.close();
    await pool?.close();
  }
})();
