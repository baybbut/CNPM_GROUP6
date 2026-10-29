// Controlled API fixtures; real museum availability and payment are not inferred by this test.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { ticketToday } from "../../src/components/Tickets/ticketModel.mjs";
import { visitText } from "../../src/components/visit/visitText.mjs";
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const ref = JSON.parse(
  readFileSync(new URL("../../src/data/hcmPlaces.json", import.meta.url)),
);
const museums = [
  { ...ref[0], id: 31, isDemo: false, isPublic: true },
  { ...ref[2], id: 32, isDemo: false, isPublic: true },
];
const offers = museums.map((m) => ({
  ...m,
  adultPrice: m.id === 31 ? 40000 : 55000,
  concessionPrice: 20000,
  childPrice: 0,
  closedWeekdays: "",
  terms: "Ticket terms fixture",
}));
let fail = false;
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
  const url = new URL(p.request.url);
  if (!url.pathname.startsWith("/api/"))
    return call("Fetch.continueRequest", { requestId: p.requestId });
  let data = {},
    status = 200;
  if (url.pathname === "/api/museums")
    data = [
      ...museums,
      {
        id: 99,
        name: "DEMO SHOULD NOT APPEAR",
        latitude: 10.77,
        longitude: 106.7,
        isDemo: true,
        isPublic: true,
      },
    ];
  if (url.pathname === "/api/tickets/prices") {
    status = fail ? 503 : 200;
    data = { paymentReady: false, mode: "Demo", items: offers };
  }
  if (url.pathname === "/api/catalog/artworks")
    data = {
      items: [
        {
          id: 1,
          title: "Published fixture artwork",
          artist: "Fixture artist",
          imageUrl: "/images/background/catalog-demo/01.svg",
        },
      ],
      total: 1,
    };
  return call("Fetch.fulfillRequest", {
    requestId: p.requestId,
    responseCode: status,
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
  for (let i = 0; i < 100; i++) {
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
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await call("Page.navigate", { url: origin + "/visit?lang=vi" });
  await wait("document.querySelector('.v-price-row')");
  assert.equal(
    await ev("document.querySelectorAll('.v-tabs-list a').length"),
    9,
  );
  assert.equal(
    await ev("document.querySelectorAll('#visit-museum option').length"),
    4,
  );
  assert.equal(
    await ev(
      'Boolean(document.querySelector(\'.v-link[href="#"], .v-actions a[href="#"]\'))',
    ),
    false,
  );
  assert.equal(
    await ev(
      "document.querySelector('.v-destination-card').textContent.includes('Mỹ thuật')",
    ),
    true,
  );
  assert.equal(
    await ev(
      "document.querySelector('.v-admission-card').textContent.includes('40.000')",
    ),
    true,
  );
  await ev(
    `document.querySelector('#visit-museum').value='hcm-reference-history';document.querySelector('#visit-museum').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await wait(
    "document.querySelector('.v-admission-card').textContent.includes('55.000')",
  );
  assert.ok(
    (
      await ev("document.querySelector('.v-destination-card').textContent")
    ).includes("Nguyễn Bỉnh Khiêm"),
  );
  assert.ok(
    (await ev("document.querySelector('.v-venue-name').textContent")).includes(
      "Nguyễn Bỉnh Khiêm",
    ),
  );
  const date = ticketToday();
  await input("#visit-date", date);
  await wait(
    `document.querySelector('.v-admission-row a[href^="/tickets"]').href.includes('museum=32')`,
  );
  const link = await ev(
    "document.querySelector('.v-admission-row a[href^=\"/tickets\"]').href",
  );
  assert.equal(new URL(link).searchParams.get("date"), date);
  await ev(
    "document.querySelector('.v-admission-row a[href^=\"/tickets\"]').click()",
  );
  await wait("document.querySelector('.price-page')");
  await wait(
    "document.querySelectorAll('.price-card').length===1 && document.querySelector('.price-card h2').textContent.includes('Lịch sử')",
  );
  assert.equal(
    await ev("new URL(location.href).searchParams.get('date')"),
    date,
  );
  assert.equal(
    await ev("new URL(location.href).searchParams.get('museum')"),
    "32",
  );
  await call("Page.navigate", { url: origin + "/visit?lang=vi" });
  await wait("document.querySelector('.v-faq')");
  await ev("document.querySelector('.v-tabs-list a[href=\"#faq\"]').click()");
  await wait(
    "document.querySelector('.v-tabs-list a[href=\"#faq\"]').getAttribute('aria-current')==='location'",
  );
  assert.ok(
    await ev("document.querySelector('#faq').getBoundingClientRect().top>=65"),
  );
  await ev(
    "document.querySelectorAll('.v-faq')[1].querySelector('summary').click()",
  );
  assert.equal(await ev("document.querySelectorAll('.v-faq')[1].open"), true);
  await ev(
    "document.querySelector('#directions').scrollIntoView({behavior:'instant',block:'start'})",
  );
  await wait(
    "document.querySelector('.v-tabs-list a[href=\"#directions\"]').getAttribute('aria-current')==='location'",
  );
  for (const width of [375, 768, 1440]) await viewport(width);
  for (const lang of ["vi", "en", "zh", "ja", "ko"]) {
    await call("Page.navigate", { url: origin + "/visit?lang=" + lang });
    await wait(
      `document.documentElement.lang==='${lang}' && document.querySelector('.v-hero h1')?.textContent===${JSON.stringify(visitText(lang, "heroTitle"))}`,
    );
    assert.equal(
      await ev("document.querySelector('.v-hero h1').textContent"),
      visitText(lang, "heroTitle"),
    );
  }
  fail = true;
  await call("Page.navigate", { url: origin + "/visit?lang=vi" });
  await wait("document.querySelector('.v-admission-card button')");
  assert.equal(
    await ev("document.querySelectorAll('#visit-museum option').length"),
    4,
  );
  assert.equal(
    await ev("document.querySelectorAll('.venue-marker').length"),
    1,
  );
  assert.ok(
    (
      await ev("document.querySelector('.v-admission-card').textContent")
    ).includes("Chưa tải"),
  );
  fail = false;
  await ev("document.querySelector('.v-admission-card button').click()");
  await wait("document.querySelector('.v-price-row')");
  await viewport(1440);
  await ev('window.scrollTo({top:0,behavior:"instant"})');
  writeFileSync(
    "/tmp/muses-visit-desktop.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await viewport(375);
  writeFileSync(
    "/tmp/muses-visit-mobile.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: Visit nine sections, real destination/price/map changes, museum+date transfer to price lookup, sticky navigation/FAQ, five languages, API failure/retry and 375/768/1440 widths. Controlled API fixtures.",
  );
} finally {
  ws.close();
}
