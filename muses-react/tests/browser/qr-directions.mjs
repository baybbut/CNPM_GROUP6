// Controlled API / routing fixtures; no live SQL or routing service required.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const places = JSON.parse(
  readFileSync(new URL("../../src/data/hcmPlaces.json", import.meta.url)),
);
const artwork = {
  id: 17,
  title: "Thiếu nữ bên hoa huệ",
  artist: "Tô Ngọc Vân",
  material: "Sơn dầu",
  creationPeriod: "1943",
  dimensions: "60 × 45 cm",
  description: "Mô tả đầy đủ của tác phẩm hoa huệ.",
  shortDescription: "Giới thiệu hoa huệ.",
  history: "Lịch sử đầy đủ của tác phẩm.",
  contentLanguage: "vi",
  currentExhibition: null,
};
const requests = [],
  exceptions = [];
let routeFail = false,
  catalogueFail = false;
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
  const u = new URL(p.request.url),
    path = u.pathname;
  if (!path.startsWith("/api/") && u.hostname !== "router.project-osrm.org")
    return call("Fetch.continueRequest", { requestId: p.requestId });
  requests.push(path);
  let data = {},
    code = 200;
  if (u.hostname === "router.project-osrm.org") {
    code = routeFail ? 503 : 200;
    data = {
      code: "Ok",
      routes: [
        {
          distance: 2100,
          duration: 420,
          geometry: {
            coordinates: [
              [106.69, 10.77],
              [106.695, 10.775],
              [106.699, 10.769],
            ],
          },
        },
      ],
    };
  } else if (path === "/api/qr/artworks/17")
    data = { id: 17, active: true, label: artwork.title };
  else if (path === "/api/catalog/artworks") {
    code = catalogueFail ? 503 : 200;
    const match =
      !u.searchParams.get("q") ||
      "thiếu nữ bên hoa huệ".includes(u.searchParams.get("q").toLowerCase());
    data = {
      items: match ? [artwork] : [],
      total: match ? 1 : 0,
      pageSize: 12,
    };
  } else if (path === "/api/catalog/filters")
    data = { artists: [], materials: [], museums: [] };
  else if (path === "/api/artworks/17") data = artwork;
  else if (path === "/api/artworks") data = [artwork];
  else if (path === "/api/places/hcm")
    data = { items: places, sourceType: "reference" };
  else if (path === "/api/museums")
    data = [{ ...places[0], id: 31, isPublic: true, isDemo: false }];
  else if (path === "/api/museums/31")
    data = { ...places[0], id: 31, artworks: [artwork] };
  else if (path === "/api/auth/me") data = { user: null };
  return call("Fetch.fulfillRequest", {
    requestId: p.requestId,
    responseCode: code,
    responseHeaders: [
      { name: "Content-Type", value: "application/json" },
      { name: "Access-Control-Allow-Origin", value: "*" },
    ],
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
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(navigator, 'geolocation', {value: {getCurrentPosition(ok, fail) { (window.gpsRequests=(window.gpsRequests||0)+1, window.denyGPS) ? fail({code:1}) : ok({coords:{latitude:10.77,longitude:106.69}}); }}});`,
  });
  await call("Fetch.enable", {
    patterns: [
      { urlPattern: "*/api/*" },
      { urlPattern: "https://router.project-osrm.org/*" },
    ],
  });
  await call("Page.navigate", { url: origin + "/scan?lang=vi" });
  await wait("document.querySelector('.scan-catalogue .aw-card')");
  assert.equal(await ev("document.querySelector('.scan-camera')"), null);
  await ev("document.querySelector('.aw-card').click()");
  await wait(
    "document.querySelector('[role=dialog] > img')?.src.startsWith('data:image/png')",
  );
  await viewport(375);
  assert.equal(
    await ev(
      "(()=>{const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()",
    ),
    true,
    "QR dialog fits mobile viewport",
  );
  const qr = await ev("document.querySelector('[role=dialog] > img').src");
  assert.match(
    await ev("document.querySelector('.qr-url').textContent"),
    /\/explore\/artworks\/17\?lang=vi&source=qr/,
  );
  assert.match(
    await ev("document.querySelector('[role=dialog] h2').textContent"),
    /hoa huệ/,
  );
  await viewport(375);
  await ev(
    "document.querySelector('[role=dialog] button').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))",
  );
  await wait("!document.querySelector('[role=dialog]')");
  assert.equal(
    await ev("document.activeElement.classList.contains('aw-card')"),
    true,
  );
  await input(".aw-filters input", "Không có tác phẩm");
  await wait(
    "!document.querySelector('.aw-card') && document.querySelector('.aw-section').textContent.includes('Không tìm thấy')",
  );
  await call("Page.navigate", { url: origin + "/scan/camera?lang=vi" });
  await wait("document.querySelector('.scan-upload input')");
  await ev(
    `(async()=>{ const blob=await (await fetch(${JSON.stringify(qr)})).blob(); const file=new File([blob],'artwork.png',{type:'image/png'}); const dt=new DataTransfer();dt.items.add(file);const input=document.querySelector('.scan-upload input');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await wait(
    "location.pathname==='/explore/artworks/17' && document.querySelector('.detail-summary h1')",
  );
  assert.equal(
    await ev("new URLSearchParams(location.search).get('source')"),
    "qr",
  );
  for (const value of [
    artwork.title,
    artwork.artist,
    artwork.material,
    artwork.dimensions,
    artwork.description,
    artwork.history,
  ])
    assert.ok(
      (
        await ev("document.querySelector('.detail-content').textContent")
      ).includes(value),
      value,
    );
  await call("Page.navigate", { url: origin + "/museums?lang=vi" });
  await wait("document.querySelector('.venue-marker')");
  await viewport(1440);
  await ev("document.querySelector('.venue-marker').click()");
  await wait("document.querySelector('.selected-place button')");
  assert.equal(
    await ev("document.querySelector('.selected-place button').disabled"),
    true,
  );
  await ev("document.querySelector('.selected-place button').click()");
  assert.equal(await ev("window.gpsRequests || 0"), 0);
  assert.equal(
    await ev("Boolean(document.querySelector('.map-directions'))"),
    false,
  );
  await ev("document.querySelector('.use-my-location').click()");
  await wait("!document.querySelector('.selected-place button').disabled");
  await ev("document.querySelector('.selected-place button').click()");
  await wait(
    "document.querySelector('.map-directions')?.textContent.includes('2.1 km')",
  );
  assert.ok(
    await ev(
      "Boolean(document.querySelector('.leaflet-overlay-pane path[stroke=\"#2563eb\"]'))",
    ),
  );
  assert.ok(
    (
      await ev("document.querySelector('.map-directions').textContent")
    ).includes("7 phút"),
  );
  await viewport(375);
  writeFileSync(
    "/tmp/muses-inline-directions.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  await ev("document.querySelector('.map-directions-heading button').click()");
  await wait("!document.querySelector('.map-directions')");
  routeFail = true;
  await ev("document.querySelector('.selected-place button').click()");
  await wait(
    "document.querySelector('.map-directions')?.textContent.includes('Chưa tìm được')",
  );
  assert.match(
    await ev("document.querySelector('.map-directions a').href"),
    /google.com\/maps\/dir/,
  );
  routeFail = false;
  await ev(
    "document.querySelector('.map-directions .place-actions button').click()",
  );
  await wait(
    "document.querySelector('.map-directions')?.textContent.includes('2.1 km')",
  );
  await ev(
    "document.querySelector('.reset-my-location').click(); window.denyGPS=true;",
  );
  await wait(
    "!document.querySelector('.map-directions') && document.querySelector('.selected-place button').disabled",
  );
  assert.equal(
    await ev(
      "Boolean(document.querySelector('.leaflet-overlay-pane path[stroke=\"#2563eb\"]'))",
    ),
    false,
  );
  await ev("document.querySelector('.use-my-location').click()");
  await wait(
    "document.querySelector('.museum-location-controls [role=status]')",
  );
  assert.equal(
    await ev("document.querySelector('.selected-place button').disabled"),
    true,
  );
  assert.equal(
    await ev("Boolean(document.querySelector('.map-directions'))"),
    false,
  );
  await call("Page.navigate", { url: origin + "/museums/itinerary?lang=vi" });
  await wait("document.querySelectorAll('.itinerary-stops > li').length===4");
  assert.equal(
    await ev("document.querySelectorAll('.guide-diagram button').length"),
    3,
  );
  await wait("document.querySelector('.guide-artworks a')");
  assert.match(
    await ev("document.querySelector('.guide-artworks a').href"),
    /artworks\/17/,
  );
  assert.equal(
    await ev("document.querySelector('.itinerary-tools button').disabled"),
    true,
  );
  assert.equal(
    await ev("document.querySelector('.guide-floorplan img')"),
    null,
  );
  assert.ok(
    (
      await ev("document.querySelector('.guide-floorplan').textContent")
    ).includes("Chưa có sơ đồ"),
  );
  await ev(
    "document.querySelector('.itinerary-stops li .place-actions button:nth-child(2)').click()",
  );
  assert.ok(
    (
      await ev("document.querySelectorAll('.itinerary-name')[1].textContent")
    ).includes("Mỹ thuật"),
  );
  await ev(
    "const select=document.querySelector('.itinerary-stops select');select.value='90';select.dispatchEvent(new Event('change',{bubbles:true}));",
  );
  await wait(
    "document.querySelector('.itinerary-total').textContent.includes('270')",
  );
  await ev("document.querySelector('.itinerary-pick input').click()");
  await wait("document.querySelectorAll('.itinerary-stops > li').length===3");
  await ev("document.querySelector('.use-my-location').click()");
  await wait("!document.querySelector('.itinerary-tools button').disabled");
  await ev("document.querySelector('.itinerary-tools button').click()");
  await viewport(375);
  for (const id of places.map((p) => p.id)) {
    await ev(
      `(()=>{const s=document.querySelector('.guide-select select');s.value=${JSON.stringify(id)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await wait(
      `document.querySelector('.guide-select select').value===${JSON.stringify(id)}`,
    );
    assert.equal(
      await ev("document.querySelectorAll('.guide-diagram button').length"),
      3,
    );
  }
  writeFileSync(
    "/tmp/muses-itinerary.png",
    Buffer.from(
      (
        await call("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
        })
      ).data,
      "base64",
    ),
  );
  catalogueFail = true;
  await call("Page.navigate", { url: origin + "/scan?lang=vi" });
  await wait("document.querySelector('.aw-section [role=alert] button')");
  catalogueFail = false;
  await ev("document.querySelector('.aw-section [role=alert] button').click()");
  await wait("document.querySelector('.aw-card')");
  await ev("document.querySelector('.aw-card').click()");
  await wait("document.querySelector('[role=dialog] img')");
  await viewport(375);
  writeFileSync(
    "/tmp/muses-qr-popup.png",
    Buffer.from(
      (await call("Page.captureScreenshot", { format: "png" })).data,
      "base64",
    ),
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: QR decoding into full detail, GPS enabled only via Use my location, gated directions/reset/denial, inline route/retry, four-museum planner/reordering/duration/themes and mobile layout. Controlled fixtures.",
  );
} catch (error) {
  console.error({
    requests,
    exceptions,
    body: await ev("document.body.innerText"),
    url: await ev("location.href"),
  });
  throw error;
} finally {
  ws.close();
}
