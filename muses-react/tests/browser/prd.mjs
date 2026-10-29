// UI integration with controlled API responses. This does NOT replace live SQL acceptance tests.
import assert from "node:assert/strict";
const visitor = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const admin = process.env.ADMIN_ORIGIN || "http://127.0.0.1:5187";
const target = await (
  await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let nextId = 0,
  loggedIn = false,
  failSave = true,
  requests = [],
  exceptions = [];
const pending = new Map();
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const museum = {
  id: 1,
  name: "Museum UI fixture",
  address: "Museum address",
  latitude: 10.8,
  longitude: 106.6,
  description: "Fixture museum",
  isPublic: true,
  pinVerified: true,
  source: "UI fixture only",
  isDemo: true,
};
const work = {
  id: 1,
  title: "Artwork UI fixture",
  artist: "Artist fixture",
  artistId: 1,
  categoryId: 1,
  category: "Painting",
  materialId: 1,
  material: "Oil",
  creationPeriod: "2026",
  description: "A description for narration.",
  contentLanguage: "vi",
  descriptionLanguage: "vi",
  isFallback: true,
  requestedLanguage: "ko",
  imageUrl: "/images/background/catalog-demo/01.svg",
  source: "UI test",
  isDemo: true,
  currentExhibition: {
    ...museum,
    museumId: 1,
    startDate: "2026-10-01",
    endDate: null,
    verifiedOn: "2026-10-01",
  },
};
const store = {
  artworks: [{ ...work, status: "Draft" }],
  artists: [{ id: 1, name: "Artist fixture" }],
  materials: [{ id: 1, name: "Oil" }],
  categories: [{ id: 1, name: "Painting" }],
  museums: [museum],
  translations: [],
  schedules: [],
};
async function intercept(p) {
  const url = new URL(p.request.url);
  if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/images/"))
    return call("Fetch.continueRequest", { requestId: p.requestId });
  requests.push({
    path: url.pathname,
    query: url.search,
    method: p.request.method,
    body: p.request.postData,
  });
  let data = {},
    code = 200;
  if (url.pathname.startsWith("/images/"))
    return call("Fetch.fulfillRequest", {
      requestId: p.requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "image/svg+xml" }],
      body: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760"><rect width="600" height="760" fill="#bda569"/></svg>',
      ).toString("base64"),
    });
  if (url.pathname === "/api/auth/me")
    data = {
      user: loggedIn ? { id: 1, name: "Admin fixture", role: "Admin" } : null,
    };
  else if (url.pathname === "/api/auth/login") {
    loggedIn = true;
    data = { user: { id: 1, name: "Admin fixture", role: "Admin" } };
  } else if (url.pathname === "/api/auth/logout") {
    loggedIn = false;
    data = { ok: true };
  } else if (url.pathname === "/api/catalog/filters")
    data = {
      artists: store.artists,
      materials: store.materials,
      museums: store.museums,
    };
  else if (url.pathname === "/api/catalog/artworks")
    data = {
      items: [work],
      total: 20,
      page: Number(url.searchParams.get("page") || 1),
      pageSize: 12,
    };
  else if (url.pathname === "/api/artworks") data = [work];
  else if (url.pathname.startsWith("/api/artworks/"))
    data = { ...work, requestedLanguage: url.searchParams.get("lang") || "vi" };
  else if (url.pathname === "/api/museums") data = [museum];
  else if (url.pathname.startsWith("/api/museums/"))
    data = { ...museum, artworks: [work] };
  else if (url.pathname.startsWith("/api/admin/catalog/")) {
    const entity = url.pathname.split("/")[4];
    if (p.request.method === "GET") data = store[entity] || [];
    else if (failSave) {
      code = 409;
      data = { message: "Fixture: current schedule prevents hiding museum." };
    } else data = { id: 2, message: "Saved" };
  } else if (url.pathname === "/api/admin/analytics")
    data = {
      summary: {},
      hours: [],
      daily: [],
      recent: [],
      points: [],
      peakHours: [],
    };
  await call("Fetch.fulfillRequest", {
    requestId: p.requestId,
    responseCode: code,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(data)).toString("base64"),
  });
}
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) p.reject(Error(msg.error.message));
    else p.resolve(msg.result);
  } else if (msg.method === "Fetch.requestPaused")
    intercept(msg.params).catch(console.error);
  else if (msg.method === "Runtime.exceptionThrown")
    exceptions.push(
      msg.params.exceptionDetails.text +
        ": " +
        msg.params.exceptionDetails.exception?.description,
    );
});
async function ev(expression) {
  const r = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text,
    );
  return r.result.value;
}
async function until(expression) {
  for (let i = 0; i < 100; i++) {
    if (await ev(`Boolean(${expression})`)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Timed out: " + expression);
}
async function navigate(url) {
  await call("Page.navigate", { url });
}
async function viewport(width) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width === 375,
  });
}
try {
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Fetch.enable", {
    patterns: [{ urlPattern: "*/api/*" }, { urlPattern: "*/images/*" }],
  });
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `localStorage.setItem('muses-lang','ko');window.__spoken=[];window.__cancel=0;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{voiceURI:'vi',name:'Vietnamese',lang:'vi-VN'}],addEventListener(){},removeEventListener(){},cancel(){window.__cancel++},resume(){},pause(){},speak(u){window.__spoken.push({lang:u.lang,text:u.text});u.onstart?.()}}});window.SpeechSynthesisUtterance=function(text){this.text=text};`,
  });
  await navigate(visitor + "/explore/collection");
  await until('document.querySelectorAll(".aw-card").length===1');
  for (const width of [375, 768, 1440]) {
    await viewport(width);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(
      await ev("document.documentElement.scrollWidth<=innerWidth"),
      true,
      "visitor collection overflow " + width,
    );
  }
  await ev(
    `document.querySelector('.aw-filters select').value='1';document.querySelector('.aw-filters select').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await until(`document.querySelectorAll('.aw-card').length===1`);
  await ev(
    `document.querySelector('.catalog-pagination button:last-child').click()`,
  );
  await until(
    `document.querySelector('.catalog-pagination span')?.textContent.includes('2')`,
  );
  assert.ok(
    requests.some(
      (r) =>
        r.path === "/api/catalog/artworks" &&
        r.query.includes("artist=1") &&
        r.query.includes("page=2"),
    ),
  );
  await navigate(visitor + "/explore/artworks/1?lang=ko");
  await until('document.querySelector(".narration-primary")');
  assert.equal(
    await ev(
      `document.querySelector('.detail-translation-status').textContent.includes('베트남어')`,
    ),
    true,
  );
  await ev(`document.querySelector('.narration-primary').click()`);
  assert.equal(await ev("window.__spoken[0].lang"), "vi-VN");
  await ev(
    `document.querySelector('.detail-language-bar select').value='ja';document.querySelector('.detail-language-bar select').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await until("window.__cancel>0");
  for (const width of [375, 768, 1440]) {
    await viewport(width);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(
      await ev("document.documentElement.scrollWidth<=innerWidth"),
      true,
      "detail overflow " + width,
    );
  }
  await navigate(visitor + "/museums");
  await until('document.querySelector(".museum-card")');
  assert.equal(
    await ev(
      `document.querySelector('.museum-card a[href*="google.com/maps/dir"]').href.includes('destination=10.8%2C106.6')`,
    ),
    true,
  );
  await navigate(admin + "/#Artworks");
  await until('document.querySelector(".catalog-auth form")');
  await ev(
    `document.querySelector('[name=email]').value='admin@fixture.invalid';document.querySelector('[name=password]').value='test-password';document.querySelector('.catalog-auth form').requestSubmit()`,
  );
  await until('document.querySelector(".catalog-admin table")');
  for (const width of [375, 768, 1440]) {
    await viewport(width);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(
      await ev("document.documentElement.scrollWidth<=innerWidth"),
      true,
      "admin overflow " + width,
    );
  }
  await ev(
    `document.querySelector('.catalog-admin .pg-heading button').click()`,
  );
  await until('document.querySelector(".catalog-form")');
  // React controlled inputs need the native value setter.
  await ev(
    `(()=>{const input=document.querySelector('.catalog-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Unsaved artwork');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll('.catalog-form select').forEach(s=>{s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));});setTimeout(()=>document.querySelector('.catalog-form').requestSubmit(),50);})()`,
  );
  await until(`document.querySelector('.catalog-form [role=alert]')`);
  assert.equal(
    await ev(`document.querySelector('.catalog-form input').value`),
    "Unsaved artwork",
    "failed save retains form",
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: five-language fallback/TTS, combined filters/page, map destination, protected Admin login, failed-save retention, and widths 375/768/1440 (controlled API fixture).",
  );
} catch (e) {
  console.error(
    "Browser exceptions:",
    exceptions,
    "Recent API:",
    requests.slice(-5),
  );
  throw e;
} finally {
  await call("Page.close").catch(() => {});
  ws.close();
}
