// Browser/QR verification with API fixtures, not a live SQL or phone test.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const { BinaryBitmap, HybridBinarizer, QRCodeReader, RGBLuminanceSource } =
  require("@zxing/library");
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const expectedUrl = "http://192.168.31.88:5173/";
const output = "/tmp/muses-website-qr-check";
mkdirSync(output, { recursive: true });
rmSync(output + "/muses-website-qr.png", { force: true });
const target = await (
  await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
let sequence = 0;
let backendDown = false;
const pending = new Map();
const exceptions = [];
const requests = [];
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    pending.set(++sequence, { resolve, reject });
    ws.send(JSON.stringify({ id: sequence, method, params }));
  });
}
async function fixture(event) {
  const path = new URL(event.request.url).pathname;
  if (!path.startsWith("/api/")) {
    return call("Fetch.continueRequest", { requestId: event.requestId });
  }
  requests.push(path);
  let body = {};
  let status = 200;
  if (path === "/api/catalog/artworks") {
    status = backendDown ? 503 : 200;
    body = {
      items: [{ id: 17, title: "Tác phẩm thử QR", artist: "Tác giả", material: "Sơn dầu" }],
      total: 1,
      pageSize: 12,
    };
  } else if (path === "/api/catalog/filters") {
    body = { artists: [], materials: [], museums: [] };
  } else if (path === "/api/qr/artworks/17") {
    body = { id: 17, active: true };
  } else if (path === "/api/auth/me") {
    body = { user: null };
  }
  await call("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(body)).toString("base64"),
  });
}
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const entry = pending.get(message.id);
    pending.delete(message.id);
    message.error ? entry.reject(Error(message.error.message)) : entry.resolve(message.result);
  } else if (message.method === "Fetch.requestPaused") {
    fixture(message.params).catch((error) => exceptions.push(error.message));
  } else if (message.method === "Runtime.exceptionThrown") {
    exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
});
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function wait(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error("Timeout: " + expression);
}
function decode(pngBytes) {
  const png = PNG.sync.read(pngBytes);
  const pixels = new Uint8ClampedArray(png.width * png.height);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = (png.data[i * 4] + 2 * png.data[i * 4 + 1] + png.data[i * 4 + 2]) >> 2;
  }
  return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, png.width, png.height)))).getText();
}

try {
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: output });
  await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await call("Page.navigate", { url: origin + "/scan?lang=vi" });
  await wait("document.querySelector('.website-qr-image')?.complete && document.querySelector('.aw-card')");
  assert.equal(await evaluate("document.querySelector('#website-qr-title').textContent"), "QR truy cập website");
  assert.equal(await evaluate("document.querySelector('.website-qr-address a').href"), expectedUrl);
  const src = await evaluate("document.querySelector('.website-qr-image').src");
  assert.equal(decode(Buffer.from(src.split(",")[1], "base64")), expectedUrl);
  assert.equal(requests.filter((path) => path.startsWith("/api/qr/")).length, 0,
    "Homepage QR must not call artwork QR APIs or count an artwork opening");
  await evaluate("document.querySelector('.website-qr-actions [download]').click()");
  let downloaded = false;
  for (let i = 0; i < 30; i++) {
    try {
      assert.equal(decode(readFileSync(output + "/muses-website-qr.png")), expectedUrl);
      downloaded = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.ok(downloaded, "Downloaded QR PNG decodes to the homepage");
  for (const width of [1440, 768, 375]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 1100, deviceScaleFactor: 1, mobile: width === 375 });
    await evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `Page fits ${width}px`);
    assert.equal(await evaluate("(()=>{const r=document.querySelector('.website-qr-card').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()"), true);
    if (width !== 768) {
      writeFileSync(`${output}/scan-${width}.png`, Buffer.from((await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).data, "base64"));
    }
  }
  for (const lang of ["en", "zh", "ja", "ko", "vi"]) {
    await evaluate(`(()=>{const s=document.querySelector('.scan-catalogue-tools select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(lang)});s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await wait(`document.documentElement.lang === ${JSON.stringify(lang)}`);
    const heading = await evaluate("document.querySelector('#website-qr-title').textContent");
    assert.ok(heading.length > 0);
    if (lang !== "en") assert.notEqual(heading, "Website access QR");
    assert.equal(await evaluate("document.querySelector('.website-qr-image').src"), src);
  }
  await wait("document.querySelector('.aw-card')");
  await evaluate("document.querySelector('.aw-card').click()");
  await wait("document.querySelector('[role=dialog] > img')?.complete");
  assert.match(await evaluate("document.querySelector('.qr-url').textContent"), /\/explore\/artworks\/17\?lang=vi&source=qr/);
  await evaluate("document.querySelector('[role=dialog] button').click()");
  backendDown = true;
  await call("Page.reload");
  await wait("document.querySelector('.website-qr-image')?.complete && document.querySelector('.aw-request[role=alert]')");
  assert.equal(decode(Buffer.from((await evaluate("document.querySelector('.website-qr-image').src")).split(",")[1], "base64")), expectedUrl);
  assert.deepEqual(exceptions, []);
  console.log("PASS: homepage QR decoded/downloaded; responsive 375/768/1440; five languages; artwork QR retained; homepage QR available without backend");
  console.log("Screenshots: " + output);
} catch (error) {
  console.error(JSON.stringify({
    page: await evaluate("({url:location.href,title:document.title,text:document.body.innerText.slice(0,1500)})"),
    exceptions,
    requests,
  }));
  throw error;
} finally {
  await call("Browser.setDownloadBehavior", { behavior: "default" }).catch(() => {});
  await call("Page.close").catch(() => {});
  ws.close();
}
