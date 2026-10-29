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
const prices = museums.map((m) => ({
  ...m,
  adultPrice: m.id === 31 ? 60000 : 40000,
  concessionPrice: 20000,
  childPrice: 0,
  terms: "Điều kiện vé fixture",
  isEnabled: true,
  closedWeekdays: "",
  updatedAt: "2026-10-30T00:00:00Z",
}));
const qrArtwork = {
  id: 17,
  title: "Artwork QR fixture",
  artist: "Artist fixture",
  material: "Oil",
  creationPeriod: "1943",
  description: "Full QR artwork description",
  history: "QR artwork history",
  contentLanguage: "vi",
  currentExhibition: null,
};
const codes = [
  {
    id: 17,
    title: qrArtwork.title,
    label: "Gallery QR",
    enabled: true,
    available: true,
    scans: 2,
    lastScannedAt: "2026-10-30T00:00:00Z",
  },
  {
    id: 18,
    title: "Paused artwork",
    enabled: false,
    available: true,
    scans: 0,
  },
  { id: 19, title: "Draft artwork", enabled: true, available: false, scans: 0 },
];
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
  requests.push({
    path,
    method: p.request.method,
    kind:
      path === "/api/activity" && p.request.postData
        ? JSON.parse(p.request.postData).kind
        : null,
  });
  let data = {},
    code = 200;
  if (path === "/api/tickets/prices") {
    data = { items: prices };
    if (fail) code = 503;
  }
  if (path === "/api/museums") data = museums;
  if (path === "/api/catalog/artworks")
    data = {
      items:
        new URL(p.request.url).searchParams.get("qr") === "1" &&
        codes[0].enabled
          ? [qrArtwork]
          : [],
      total:
        new URL(p.request.url).searchParams.get("qr") === "1" &&
        codes[0].enabled
          ? 1
          : 0,
      pageSize: 12,
    };
  if (path === "/api/catalog/filters")
    data = { artists: [], materials: [], museums: [] };
  if (path === "/api/artworks/17") data = qrArtwork;
  if (path === "/api/artworks") data = [qrArtwork];
  if (path === "/api/admin/qr/artworks") data = { items: codes };
  if (
    path.startsWith("/api/admin/qr/artworks/") &&
    p.request.method === "PUT"
  ) {
    const id = Number(path.split("/").pop());
    Object.assign(
      codes.find((r) => r.id === id),
      JSON.parse(p.request.postData),
    );
    data = { ok: true };
  }
  if (path.startsWith("/api/qr/artworks/")) {
    const row = codes.find((r) => r.id === Number(path.split("/").pop()));
    code = !row || !row.available ? 404 : !row.enabled ? 410 : 200;
    data =
      code === 200
        ? { id: row.id, label: row.label, active: true }
        : { message: "QR unavailable" };
  }

  if (path === "/api/auth/me")
    data = { user: loggedIn ? { id: 1, name: "Admin", role: "Admin" } : null };
  if (path === "/api/auth/login") {
    loggedIn = true;
    data = { user: { id: 1, name: "Admin", role: "Admin" } };
  }
  if (path === "/api/admin/analytics")
    data = {
      summary: {
        activeVisitors: 7,
        activeLoggedIn: 3,
        loggedInUsers: 10,
        logins: 20,
        visitors: 50,
        sessions: 60,
        qrScans: 5,
        audioPlays: 4,
      },
      hours: [],
      peakHours: [],
      points: [],
      recent: [
        {
          id: "session-a001",
          name: "Bình",
          startedAt: "2026-10-30T00:00:00Z",
          lastSeenAt: "2026-10-30T00:10:00Z",
          active: 1,
        },
        {
          id: "session-b002",
          name: "An",
          startedAt: "2026-10-30T00:00:00Z",
          lastSeenAt: "2026-10-30T00:02:00Z",
          active: 0,
        },
        {
          id: "session-c003",
          name: null,
          startedAt: "2026-10-30T00:00:00Z",
          lastSeenAt: "2026-10-30T00:01:00Z",
          active: 0,
        },
      ],
      daily: [],
      trackingSince: "2026-10-30T00:00:00Z",
      updatedAt: "2026-10-30T00:00:00Z",
    };
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
  await wait("document.querySelector('.pg-stat strong')?.textContent === '7'");
  assert.equal(await ev("document.querySelectorAll('.pg-stat').length"), 5);
  const labels = await ev(
    "[...document.querySelectorAll('.pg-stat small')].map(e=>e.textContent)",
  );
  assert.ok(labels.includes("Khách đang hoạt động"));
  for (const removed of [
    "Tài khoản đang hoạt động",
    "Tài khoản đã đăng nhập",
    "Tổng lượt đăng nhập",
  ])
    assert.equal(labels.includes(removed), false);
  assert.equal(
    await ev(
      "[...document.querySelectorAll('.sidebar .nav-item')].some(e=>/Giá vé|Tickets/.test(e.textContent))",
    ),
    false,
  );
  assert.equal(
    await ev(
      "document.querySelector('.sidebar [aria-current=page]')?.textContent",
    ),
    "Overview",
  );
  assert.equal(
    await ev(
      "[...document.querySelectorAll('.sidebar .nav-item')].some(e=>e.textContent==='Visitors')",
    ),
    false,
  );
  await wait(
    "document.querySelectorAll('.analytics-visitor-list tbody tr').length===3",
  );
  assert.equal(
    await ev("document.querySelectorAll('.analytics-hours').length"),
    1,
  );
  await input(".topbar input", "Binh");
  await wait(
    "document.querySelectorAll('.analytics-visitor-list tbody tr').length===1 && document.querySelector('.analytics-visitor-list tbody').textContent.includes('Bình')",
  );
  await ev(
    "(()=>{const s=document.querySelector('.analytics-visitor-tools select');s.value='inactive';s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await wait(
    "document.querySelector('.analytics-visitor-list tbody').textContent.includes('Chưa có phiên phù hợp')",
  );
  await input(".topbar input", "");
  await wait(
    "document.querySelectorAll('.analytics-visitor-list tbody tr').length===2",
  );
  await ev(
    "const original=URL.createObjectURL;URL.createObjectURL=(blob)=>{window.exportedCsv=blob;return original(blob)};document.querySelector('.analytics-visitor-list .pg-panel-head button').click();",
  );
  const csv = await ev("window.exportedCsv.text()");
  assert.ok(csv.includes("session-b002"));
  assert.equal(csv.includes("session-a001"), false);
  assert.equal(csv.includes("Khung giờ"), false);
  await ev("location.hash='Visitors'");
  await wait(
    "document.querySelector('.sidebar [aria-current=page]')?.textContent==='Overview'",
  );
  await viewport(1440);
  writeFileSync(
    "/tmp/muses-overview-merged.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await viewport(375);
  await ev("location.hash='QR Check-in'");
  await wait(
    "document.querySelector('.qr-management tbody tr')?.textContent.includes('Artwork QR fixture')",
  );
  assert.equal(
    await ev(
      "document.querySelector('.sidebar [aria-current=page]').textContent",
    ),
    "Quản lý QR",
  );
  assert.equal(await ev("document.querySelectorAll('.pg-stat').length"), 0);
  await ev("document.querySelector('.qr-row-actions button').click()");
  await wait(
    "document.querySelector('[role=dialog] img')?.src.startsWith('data:image/png')",
  );
  await input("[role=dialog] input[type=url]", origin);
  await ev(
    "(()=>{const s=document.querySelector('[role=dialog] select');s.value='ko';s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await wait(
    "document.querySelector('.qr-preview-url').textContent.includes('lang=ko')",
  );
  await ev("document.querySelector('[aria-label=\"Close dialog\"]').click()");
  await ev("document.querySelectorAll('.qr-row-actions button')[1].click()");
  await wait("document.querySelector('form .qr-enabled input')");
  await input("[role=dialog] input:not([type=checkbox])", "Renamed QR");
  await ev(
    "document.querySelector('.qr-enabled input').click();document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await wait(
    "!document.querySelector('[role=dialog]') && document.querySelector('.qr-management tbody').textContent.includes('Không có mã QR phù hợp')",
  );
  await call("Page.navigate", { url: origin + "/scan?lang=vi" });
  await wait(
    "document.querySelector('.aw-request')?.textContent.includes('Không tìm thấy')",
  );
  const scansBefore = requests.filter((r) => r.kind === "qr_scan").length;
  await call("Page.navigate", {
    url: origin + "/explore/artworks/17?lang=vi&source=qr",
  });
  await wait(
    "document.querySelector('.scan-page h1')?.textContent.includes('không hoạt động')",
  );
  assert.equal(await ev("document.querySelector('.detail-content')"), null);
  assert.equal(
    requests.filter((r) => r.kind === "qr_scan").length,
    scansBefore,
  );
  await call("Page.navigate", { url: origin + "/explore/artworks/17?lang=vi" });
  await wait(
    "document.querySelector('.detail-summary h1')?.textContent==='Artwork QR fixture'",
  );
  await call("Page.navigate", { url: admin + "/#QR%20Codes" });
  await wait(
    "document.querySelector('.qr-management .analytics-visitor-tools select')",
  );
  await ev(
    "(()=>{const s=document.querySelector('.qr-management select');s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await wait("document.querySelectorAll('.qr-management tbody tr').length===3");
  assert.ok(
    (
      await ev("document.querySelector('.qr-management tbody').textContent")
    ).includes("Renamed QR"),
  );
  await ev("document.querySelectorAll('.qr-row-actions button')[1].click()");
  await wait("document.querySelector('.qr-enabled input')");
  await ev(
    "document.querySelector('.qr-enabled input').click();document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await wait(
    "!document.querySelector('[role=dialog]') && document.querySelector('.qr-row-actions button') && !document.querySelector('.qr-row-actions button').disabled",
  );
  await viewport(1440);
  writeFileSync(
    "/tmp/muses-admin-qr-management.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await viewport(375);
  await call("Page.navigate", {
    url: origin + "/explore/artworks/17?lang=vi&source=qr",
  });
  await wait(
    "document.querySelector('.detail-summary h1')?.textContent==='Artwork QR fixture'",
  );
  for (
    let i = 0;
    i < 30 &&
    requests.filter((r) => r.kind === "qr_scan").length === scansBefore;
    i++
  )
    await new Promise((r) => setTimeout(r, 100));
  assert.equal(
    requests.filter((r) => r.kind === "qr_scan").length,
    scansBefore + 1,
  );
  codes[0].enabled = false;
  await ev(
    "(()=>{const s=document.querySelector('.detail-language-bar select');s.value='en';s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await wait(
    "document.querySelector('.scan-page h1')?.textContent.includes('no longer active')",
  );
  assert.equal(await ev("document.querySelector('.detail-content')"), null);
  assert.equal(
    requests.filter((r) => r.kind === "qr_scan").length,
    scansBefore + 1,
  );
  codes[0].enabled = true;

  await call("Page.navigate", { url: origin + "/tickets?museum=31&lang=vi" });
  await wait(
    "document.querySelector('.price-feature strong')?.textContent.includes('60.000')",
  );
  assert.equal(
    requests.some((r) => r.path === "/api/tickets/checkout"),
    false,
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: read-only price lookup, unknown vs free, search/group/sort, venue routing, five languages, 375/768/1440, API retry, removed Admin ticket page/account cards, retained active visitor count, merged Overview visitor list and filtered CSV, real QR management/preview/rename/disable/re-enable/public gate; no checkout requests. Controlled API fixtures.",
  );
} finally {
  ws.close();
}
