// Price-only browsing with controlled API data. No orders or payments are created.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { priceText } from "../../src/components/Tickets/priceText.mjs";
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186",
  admin = process.env.ADMIN_ORIGIN || "http://127.0.0.1:5187";
const references = JSON.parse(
  readFileSync(new URL("../../src/data/hcmPlaces.json", import.meta.url)),
);
const museums = [
  { ...references[0], id: 31, isPublic: true, isDemo: false },
  { ...references[2], id: 32, isPublic: true, isDemo: false },
];
let prices = museums.map((m) => ({
  ...m,
  adultPrice: m.id === 31 ? 60000 : 40000,
  concessionPrice: 20000,
  childPrice: 0,
  terms: "Điều kiện vé fixture",
  isEnabled: true,
  closedWeekdays: "",
  updatedAt: "2026-10-30T00:00:00Z",
}));
let fail = false,
  loggedIn = false;
const requests = [],
  exceptions = [];
const target = await (
  await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
async function intercept(p) {
  const path = new URL(p.request.url).pathname;
  if (!path.startsWith("/api/"))
    return call("Fetch.continueRequest", { requestId: p.requestId });
  requests.push({ path, method: p.request.method });
  let data = {},
    code = 200;
  if (path === "/api/tickets/prices") {
    data = { items: prices };
    if (fail) code = 503;
  }
  if (path === "/api/museums") data = museums;
  if (path === "/api/catalog/artworks") data = { items: [], total: 0 };
  if (path === "/api/auth/me")
    data = { user: loggedIn ? { id: 1, name: "Admin", role: "Admin" } : null };
  if (path === "/api/auth/login") {
    loggedIn = true;
    data = { user: { id: 1, name: "Admin", role: "Admin" } };
  }
  if (path === "/api/admin/tickets/offers") data = prices;
  if (path === "/api/admin/catalog/museums") data = museums;
  if (
    path.startsWith("/api/admin/tickets/offers/") &&
    p.request.method === "PUT"
  ) {
    const body = JSON.parse(p.request.postData);
    const key = Number(path.split("/").pop());
    prices = prices.map((m) => (m.id === key ? { ...m, ...body } : m));
    data = { message: "Saved" };
  }
  return call("Fetch.fulfillRequest", {
    requestId: p.requestId,
    responseCode: code,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(data)).toString("base64"),
  });
}
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
  } else if (m.method === "Fetch.requestPaused")
    intercept(m.params).catch((e) => {
      if (!e.message.includes("Invalid InterceptionId")) console.error(e);
    });
  else if (m.method === "Runtime.exceptionThrown")
    exceptions.push(
      m.params.exceptionDetails.exception?.description ||
        m.params.exceptionDetails.text,
    );
});
async function ev(expression) {
  const r = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function wait(expr) {
  for (let i = 0; i < 120; i++) {
    if (await ev(`Boolean(${expr})`)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Timeout " + expr);
}
async function input(selector, value) {
  await ev(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function viewport(width) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width === 375,
  });
  await ev(
    "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))",
  );
  assert.equal(
    await ev("document.documentElement.scrollWidth<=innerWidth"),
    true,
    "overflow " + width,
  );
}
try {
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await call("Page.navigate", { url: origin + "/tickets?lang=vi" });
  await wait(
    "document.querySelector('.price-feature strong')?.textContent.includes('60.000') || [...document.querySelectorAll('.price-feature strong')].some(e=>e.textContent.includes('60.000'))",
  );
  assert.equal(await ev("document.querySelectorAll('.price-card').length"), 4);
  assert.equal(
    await ev(
      "Boolean(document.querySelector('.price-page input[type=email], .ticket-form, .ticket-qr'))",
    ),
    false,
  );
  assert.ok(
    (await ev("document.querySelector('.price-grid').textContent")).includes(
      "Chưa cập nhật",
    ),
  );
  assert.equal(
    await ev("document.querySelector('.price-search select').value"),
    "",
  );
  await input(".price-search input", "my thuat");
  await wait("document.querySelectorAll('.price-card').length===1");
  assert.ok(
    (await ev("document.querySelector('.price-card').textContent")).includes(
      "60.000",
    ),
  );
  await ev(
    "document.querySelectorAll('.price-search select')[1].value='childPrice';document.querySelectorAll('.price-search select')[1].dispatchEvent(new Event('change',{bubbles:true}))",
  );
  await wait(
    "document.querySelector('.price-feature strong').textContent==='Miễn phí'",
  );
  await ev("document.querySelector('.price-conditions summary').click()");
  assert.ok(
    (
      await ev("document.querySelector('.price-conditions').textContent")
    ).includes("Điều kiện vé fixture"),
  );
  await input(".price-search input", "");
  await ev(
    "document.querySelectorAll('.price-search select')[1].value='adultPrice';document.querySelectorAll('.price-search select')[1].dispatchEvent(new Event('change',{bubbles:true}));document.querySelectorAll('.price-search select')[2].value='price';document.querySelectorAll('.price-search select')[2].dispatchEvent(new Event('change',{bubbles:true}))",
  );
  await wait(
    "document.querySelector('.price-feature strong').textContent.includes('40.000')",
  );
  for (const width of [375, 768, 1440]) await viewport(width);
  await call("Page.navigate", { url: origin + "/tickets?museum=32&lang=vi" });
  await wait(
    "document.querySelectorAll('.price-card').length===1 && document.querySelector('.price-feature strong').textContent.includes('40.000')",
  );
  await ev("document.querySelector('.price-card a[href^=\"/visit\"]').click()");
  await wait(
    "document.querySelector('.v-destination-card')?.textContent.includes('Lịch sử')",
  );
  for (const lang of ["vi", "en", "zh", "ja", "ko"]) {
    await call("Page.navigate", { url: origin + "/tickets?lang=" + lang });
    await wait(
      `document.querySelector('.price-hero h1')?.textContent===${JSON.stringify(priceText(lang, "title"))}`,
    );
  }
  fail = true;
  await call("Page.navigate", { url: origin + "/tickets?lang=vi" });
  await wait("document.querySelector('.price-error')");
  assert.equal(await ev("document.querySelectorAll('.price-card').length"), 4);
  assert.equal(
    await ev("document.querySelectorAll('.price-unknown').length"),
    4,
  );
  fail = false;
  await ev("document.querySelector('.price-error button').click()");
  await wait(
    "!document.querySelector('.price-error') && [...document.querySelectorAll('.price-feature strong')].some(e=>e.textContent.includes('60.000'))",
  );
  await viewport(1440);
  writeFileSync(
    "/tmp/muses-prices-desktop.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await viewport(375);
  writeFileSync(
    "/tmp/muses-prices-mobile.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await call("Page.navigate", { url: admin + "/#Tickets" });
  await wait("document.querySelector('.catalog-auth form')");
  await input("[name=email]", "admin@fixture.test");
  await input("[name=password]", "test-password");
  await ev("document.querySelector('.catalog-auth form').requestSubmit()");
  await wait("document.querySelector('.catalog-table-wrap button')");
  assert.ok(
    (await ev("document.querySelector('.pg-workspace').textContent")).includes(
      "Giá vé bảo tàng",
    ),
  );
  assert.equal(
    requests.some((r) => r.path === "/api/admin/tickets/reservations"),
    false,
  );
  await ev("document.querySelector('.catalog-table-wrap button').click()");
  await wait("document.querySelector('.catalog-form input[type=number]')");
  await input(".catalog-form input[type=number]", "70000");
  await ev("document.querySelector('.catalog-form').requestSubmit()");
  await wait("!document.querySelector('.catalog-form')");
  assert.ok(
    requests.some(
      (r) => r.method === "PUT" && r.path === "/api/admin/tickets/offers/31",
    ),
  );
  await call("Page.navigate", { url: origin + "/tickets?museum=31&lang=vi" });
  await wait(
    "document.querySelector('.price-feature strong')?.textContent.includes('70.000')",
  );
  assert.equal(
    requests.some((r) => r.path === "/api/tickets/checkout"),
    false,
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: read-only price lookup, unknown vs free, search/group/sort, venue routing, five languages, 375/768/1440, API retry and Admin price save; no checkout requests. Controlled API fixtures.",
  );
} finally {
  ws.close();
}
