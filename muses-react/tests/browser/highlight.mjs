// Controlled published-artwork fixtures; this test does not publish catalogue data.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const files = [
  "tranhsonmai/GIAOMUA.jpg",
  "EMTHUY.jpeg",
  "THIEUNUBENHOAHUE.jpg",
  "THIEUNUBENHOASEN.jpg",
  "tranhsonmai/XUANHOGUOM.jpeg",
];
const works = [
  "Giao Mùa",
  "Em Thúy",
  "Thiếu nữ bên hoa huệ",
  "Thiếu nữ bên hoa sen",
  "Xuân Hồ Gươm",
].map((title, i) => ({
  id: i + 1,
  title,
  artist: [
    "Bùi Trọng Dư",
    "Trần Văn Cẩn",
    "Tô Ngọc Vân",
    "Tô Ngọc Vân",
    "Nguyễn Tư Nghiêm",
  ][i],
  category: "Hội họa",
  imageUrl: "/images/fixture-" + i + ".jpg",
  description:
    "Khám phá câu chuyện, chất liệu và vẻ đẹp của tác phẩm trong bộ sưu tập Muses.",
  contentLanguage: "vi",
  descriptionLanguage: "vi",
  currentExhibition: null,
}));
let mode = "normal";
const target = await (
  await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map(),
  exceptions = [];
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
async function intercept(p) {
  const path = new URL(p.request.url).pathname;
  if (path.startsWith("/images/fixture-")) {
    const index = Number(path.match(/fixture-(\d)/)[1]);
    return call("Fetch.fulfillRequest", {
      requestId: p.requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "image/jpeg" }],
      body: readFileSync(
        new URL("../../tranh/" + files[index], import.meta.url),
      ).toString("base64"),
    });
  }
  if (!path.startsWith("/api/"))
    return call("Fetch.continueRequest", { requestId: p.requestId });
  let data = {},
    code = 200;
  const items =
    mode === "single" ? works.slice(0, 1) : mode === "empty" ? [] : works;
  if (path === "/api/artworks") {
    data = items;
    if (mode === "error") code = 503;
  } else if (path.startsWith("/api/artworks/"))
    data = works.find((w) => w.id === Number(path.split("/").pop()));
  else if (path === "/api/catalog/artworks")
    data = { items, total: items.length, page: 1, pageSize: 12 };
  else if (path === "/api/catalog/filters")
    data = { artists: [], materials: [], museums: [] };
  else if (path === "/api/site-images")
    data = works.map((w, i) => ({
      slot: "home.highlight.h" + (i + 1),
      artworkId: 5 - i,
      imageUrl: works[4 - i].imageUrl,
    }));
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
    await ev(
      "document.documentElement.scrollWidth<=document.documentElement.clientWidth",
    ),
    true,
    "overflow " + width,
  );
  if (width === 375)
    assert.ok(
      await ev("Math.abs(innerWidth-document.documentElement.clientWidth)<2"),
      "mobile viewport scale " + width,
    );
}
async function load() {
  await call("Page.navigate", { url: origin + "/?lang=vi" });
  await wait("document.querySelector('.highlight')");
}
try {
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Fetch.enable", {
    patterns: [{ urlPattern: "*/api/*" }, { urlPattern: "*/images/fixture-*" }],
  });
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await viewport(1440);
  await load();
  await wait("document.querySelectorAll('.hl-card').length===5");
  await wait(
    "document.querySelector('.hl-card .hl-details a').href.includes('/5?')",
  );
  await ev(
    "document.querySelector('.highlight').scrollIntoView({block:'start',behavior:'instant'})",
  );
  assert.equal(
    await ev(
      "getComputedStyle(document.querySelector('.highlight')).backgroundColor",
    ),
    "rgb(11, 11, 9)",
  );
  assert.equal(
    await ev(
      "[...document.querySelectorAll('.hl-picture>img')].every(e=>getComputedStyle(e).objectFit==='cover')",
    ),
    true,
  );
  await ev("document.querySelectorAll('.hl-select')[0].click()");
  await wait(
    "document.querySelectorAll('.hl-card')[0].classList.contains('is-active')",
  );
  assert.ok(
    await ev(
      "document.querySelectorAll('.hl-card')[0].offsetWidth > document.querySelectorAll('.hl-card')[1].offsetWidth*2.5",
    ),
  );
  await ev(
    "document.querySelectorAll('.hl-select')[0].focus({preventScroll:true})",
  );
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "End",
    code: "End",
  });
  await wait(
    "document.querySelectorAll('.hl-card')[4].classList.contains('is-active')",
  );
  await ev("document.querySelector('.hl-controls button:last-child').click()");
  await wait(
    "document.querySelectorAll('.hl-card')[0].classList.contains('is-active')",
  );
  await ev("document.querySelector('.hl-controls button:first-child').click()");
  await wait(
    "document.querySelectorAll('.hl-card')[4].classList.contains('is-active')",
  );
  await viewport(375);
  await ev(
    "document.querySelector('.hl-track').scrollTo({left:0,behavior:'instant'})",
  );
  await wait(
    "document.querySelectorAll('.hl-card')[0].classList.contains('is-active')",
  );
  assert.equal(
    await ev("document.querySelectorAll('.hl-details:not([hidden])').length"),
    1,
  );
  await viewport(768);
  await viewport(1440);
  const rect = await ev(
    "(()=>{const r=document.querySelectorAll('.hl-card')[2].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+40}})()",
  );
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", ...rect });
  await wait(
    "document.querySelectorAll('.hl-card')[2].classList.contains('is-active')",
  );
  writeFileSync(
    "/tmp/muses-highlight-desktop.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await viewport(375);
  writeFileSync(
    "/tmp/muses-highlight-mobile.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await ev(
    "document.querySelector('.hl-card.is-active .hl-details a').click()",
  );
  await wait(
    "location.pathname.startsWith('/explore/artworks/') && document.querySelector('.artwork-detail-page')",
  );
  mode = "single";
  await load();
  await wait("document.querySelectorAll('.hl-card').length===1");
  assert.equal(
    await ev("document.querySelector('.hl-controls button').disabled"),
    true,
  );
  mode = "empty";
  await load();
  await wait("document.querySelector('.hl-empty')");
  assert.equal(await ev("document.querySelectorAll('.hl-card').length"), 0);
  mode = "error";
  await load();
  await wait("document.querySelector('.highlight [role=alert]')");
  assert.equal(await ev("document.querySelectorAll('.hl-card').length"), 0);
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: Highlight published slot mapping, expanded desktop cards, hover/keyboard, wrap both ways, mobile swipe, detail link and single/empty/error states. Controlled API fixtures.",
  );
} finally {
  ws.close();
}
