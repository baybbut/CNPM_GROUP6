const { setupActivity } = require("./activity-setup.cjs");
const { terminalPrompt } = require("./terminal-prompt.cjs");
if (process.argv.includes("--help")) {
  console.log(
    "npm run db:setup\nDùng tài khoản SQL quản trị (thường là sa) để tạo bảng và cấp quyền ứng dụng.\nKhông đổi .env, không lưu mật khẩu quản trị, không xóa dữ liệu.",
  );
} else {
  const { dbConfig } = require("../server.cjs");
  const prompt = terminalPrompt();
  (async () => {
    try {
      console.log(
        `Database: ${dbConfig.database || "(chưa cấu hình)"}. Tài khoản ứng dụng: ${dbConfig.user || "(chưa cấu hình)"}.`,
      );
      const user =
        (await prompt.ask("Tài khoản SQL quản trị [sa]: ")).trim() || "sa";
      const password = await prompt.ask(
        "Mật khẩu SQL quản trị (không hiển thị): ",
        true,
      );
      const principal = await setupActivity(dbConfig, { user, password });
      console.log(
        `Đã tạo/cập nhật bảng và cấp quyền đọc/ghi thống kê cho ${principal}. .env được giữ nguyên.`,
      );
      console.log("Tiếp theo chạy: npm run admin:create rồi npm start.");
    } catch (e) {
      console.error("Chưa setup được database:", e.message);
      if ([229, 262, 2760].includes(e.number))
        console.error(
          "Tài khoản vừa nhập chưa đủ quyền. Dùng tài khoản SQL quản trị database (thường là sa).",
        );
      process.exitCode = 1;
    } finally {
      prompt.close();
    }
  })();
}
