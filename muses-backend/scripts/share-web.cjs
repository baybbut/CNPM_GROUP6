// Share the locally running SQL-backed visitor website through a temporary
// HTTPS Cloudflare tunnel. No database, credentials or .env files are uploaded.
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

function publicBuildEnv(env = process.env) {
  return { ...env, VITE_API_BASE_URL: "", VITE_VISITOR_BASE_URL: "" };
}
function tunnelUrl(line) {
  return line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/i)?.[0] || null;
}
async function main() {
  const check = spawnSync("cloudflared", ["--version"], { encoding: "utf8" });
  if (check.error || check.status !== 0) {
    throw Error("Chưa có cloudflared. Trên Mac chạy: brew install cloudflared, rồi chạy lại lệnh share.");
  }
  const web = path.resolve(__dirname, "../../muses-react");
  console.log("Đang build website với API và QR dùng chung địa chỉ HTTPS…");
  await new Promise((resolve, reject) => {
    const build = spawn(process.platform === "win32" ? "npm.cmd" : "npm",
      ["--prefix", web, "run", "build"], { stdio: "inherit", env: publicBuildEnv() });
    build.once("error", reject);
    build.once("exit", (code) => code === 0 ? resolve() : reject(Error("Build website thất bại; chưa mở link công khai.")));
  });
  const { app, startServer } = require("../server.cjs");
  const server = await startServer();
  if (!server) throw Error("Backend chưa kết nối được SQL Server. Giữ Docker/DB hoạt động rồi thử lại.");
  try {
    if (!server.listening) await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
  } catch (error) {
    await app.locals.pool?.close();
    throw error;
  }
  let tunnel;
  let stopping = false;
  const stop = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    tunnel?.kill("SIGTERM");
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    await app.locals.pool?.close();
    process.exitCode = code;
  };
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
  // startServer uses the configured backend port, not Vite. This serves the
  // built website, /api and images under one public origin.
  const port = server.address().port;
  tunnel = spawn("cloudflared", ["tunnel", "--url", `http://127.0.0.1:${port}`, "--no-autoupdate"],
    { stdio: ["ignore", "pipe", "pipe"] });
  let announced = false;
  let recentOutput = "";
  const print = (chunk) => {
    const line = chunk.toString();
    process.stdout.write(line);
    recentOutput = (recentOutput + line).slice(-4000);
    const url = tunnelUrl(recentOutput);
    if (url && !announced) {
      announced = true;
      console.log(`\nWEBSITE CÔNG KHAI: ${url}\nLẤY QR WEBSITE: ${url}/scan\n` +
        "Chờ tunnel kết nối, mở link /scan trên máy tính rồi dùng camera điện thoại quét QR trong trang.\n" +
        "Điện thoại dùng Wi-Fi hoặc 4G/5G đều được khi có Internet.\n" +
        "Giữ máy tính, Docker và terminal này chạy. Ctrl+C đóng link; lần chạy sau cần lấy QR mới.\n");
    }
  };
  tunnel.stdout.on("data", print);
  tunnel.stderr.on("data", print);
  tunnel.once("error", (error) => {
    console.error("Không mở được tunnel:", error.message);
    void stop(1);
  });
  tunnel.once("exit", (code) => void stop(stopping ? 0 : code || 1));
}

if (require.main === module) {
  main().catch((error) => {
    if (error.code === "EADDRINUSE")
      console.error("Cổng backend đang bận. Dừng terminal backend cũ bằng Ctrl+C trước khi chạy share.");
    else console.error(error.message);
    process.exitCode = 1;
  });
}
module.exports = { publicBuildEnv, tunnelUrl };
