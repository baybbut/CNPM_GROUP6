// Restores only into a unique disposable database; never replaces the configured database.
const sql = require("mssql");
const { terminalPrompt } = require("./terminal-prompt.cjs");
const { dbConfig } = require("../server.cjs");
const prompt = terminalPrompt();
(async () => {
  let pool;
  const target = `MusesRestoreCheck_${Date.now()}_${process.pid}`;
  try {
    const user =
      (await prompt.ask("Tài khoản SQL quản trị [sa]: ")).trim() || "sa";
    const password = await prompt.ask(
      "Mật khẩu SQL quản trị (không hiển thị): ",
      true,
    );
    const backup = (
      await prompt.ask("Đường dẫn backup trên SQL Server: ")
    ).trim();
    if (!backup.startsWith("/") || backup.length > 500)
      throw Error("Đường dẫn backup không hợp lệ.");
    pool = await new sql.ConnectionPool({
      ...dbConfig,
      database: "master",
      user,
      password,
    }).connect();
    const files = (
      await pool
        .request()
        .input("backup", sql.NVarChar(500), backup)
        .query("RESTORE FILELISTONLY FROM DISK=@backup;")
    ).recordset;
    if (!files.length || files.some((f) => !["D", "L"].includes(f.Type)))
      throw Error(
        "Bản kiểm tra này chỉ hỗ trợ backup có data/log thông thường.",
      );
    const literal = (value) => "N'" + String(value).replaceAll("'", "''") + "'";
    const moves = files.map(
      (f, i) =>
        `MOVE ${literal(f.LogicalName)} TO ${literal(`/var/opt/mssql/data/${target}_${i}.${f.Type === "L" ? "ldf" : "mdf"}`)}`,
    );
    await pool
      .request()
      .input("backup", sql.NVarChar(500), backup)
      .query(
        `RESTORE DATABASE [${target}] FROM DISK=@backup WITH ${moves.join(",")},RECOVERY,CHECKSUM;`,
      );
    const result = await pool
      .request()
      .query(
        `SELECT COUNT(*) AS artworkCount FROM [${target}].dbo.Artworks; DBCC CHECKDB([${target}]) WITH NO_INFOMSGS;`,
      );
    console.log(
      `Khôi phục và CHECKDB thành công trên database kiểm thử ${target}. Số tác phẩm: ${result.recordset[0].artworkCount}. Database gốc không bị thay thế.`,
    );
  } catch (e) {
    console.error("Chưa xác nhận khôi phục:", e.message);
    process.exitCode = 1;
  } finally {
    if (pool) {
      try {
        await pool
          .request()
          .input("target", sql.NVarChar(128), target)
          .query(
            `IF DB_ID(@target) IS NOT NULL BEGIN ALTER DATABASE [${target}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${target}]; END;`,
          );
      } catch (e) {
        console.error(`Chưa dọn được database thử ${target}:`, e.message);
        process.exitCode = 1;
      }
      await pool.close();
    }
    prompt.close();
  }
})();
