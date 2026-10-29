// Browser UI test with controlled API data; no money is transferred.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const origin = process.env.VISITOR_ORIGIN || "http://127.0.0.1:5186";
const target = await (
  await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0,
  submissions = 0;
const pending = new Map(),
  exceptions = [];
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
const museum = {
  id: 1,
  name: "Bảo tàng minh họa Muses",
  address: "Địa chỉ minh họa",
  isDemo: true,
  adultPrice: 40000,
  concessionPrice: 20000,
  childPrice: 0,
  closedWeekdays: "",
  terms: "Giá minh họa. QR mẫu không có giá trị thanh toán.",
  isEnabled: true,
};
let reservation = null;
async function intercept(p) {
  const url = new URL(p.request.url);
  if (!url.pathname.startsWith("/api/"))
    return call("Fetch.continueRequest", { requestId: p.requestId });
  let data = {};
  if (url.pathname === "/api/tickets/offers")
    data = { mode: "Demo", paymentReady: false, items: [museum] };
  else if (url.pathname === "/api/tickets/checkout") {
    submissions++;
    reservation = JSON.parse(p.request.postData);
    data = {
      mode: "Demo",
      reservationId: reservation.requestId,
      code: "MUS-ABCDEF1234567890",
      total: 60000,
      paymentState: "Pending",
    };
  } else if (url.pathname.startsWith("/api/tickets/reservations/"))
    data = {
      code: "MUS-ABCDEF1234567890",
      total: 60000,
      paymentState: "Pending",
      isDemoPayment: true,
      adults: 1,
      concessions: 1,
      children: 0,
      museum: museum.name,
      address: museum.address,
      visitDate: reservation.visitDate,
    };
  await call("Fetch.fulfillRequest", {
    requestId: p.requestId,
    responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(data)).toString("base64"),
  });
}
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.reject(Error(m.error.message));
    else p.resolve(m.result);
  } else if (m.method === "Fetch.requestPaused")
    intercept(m.params).catch((error) => {
      if (!error.message.includes("Invalid InterceptionId"))
        console.error(error);
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
  if (r.exceptionDetails)
    throw Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text,
    );
  return r.result.value;
}
async function wait(expression) {
  for (let n = 0; n < 100; n++) {
    if (await ev(`Boolean(${expression})`)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Timeout: " + expression);
}
async function screen(width) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width === 375,
  });
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(
    await ev("document.documentElement.scrollWidth<=innerWidth"),
    true,
    "overflow " + width,
  );
}
async function input(selector, value) {
  await ev(
    `(()=>{const node=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,${JSON.stringify(value)});node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
try {
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('muses-lang','vi')",
  });
  await call("Page.navigate", { url: origin + "/tickets" });
  await wait("document.querySelector('.ticket-type')");
  for (const width of [375, 768, 1440]) await screen(width);
  await screen(375);
  assert.equal(
    await ev(
      "getComputedStyle(document.querySelector('.ticket-nav')).display!=='none'",
    ),
    true,
    "mobile Ticket remains reachable",
  );
  const mobile = await call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(
    "/tmp/muses-tickets-mobile.png",
    Buffer.from(mobile.data, "base64"),
  );
  await screen(1440);
  const png = await call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(
    "/tmp/muses-tickets-desktop.png",
    Buffer.from(png.data, "base64"),
  );
  await input(
    ".ticket-form input[type=date]",
    new Date(Date.now() + 420 * 60000).toISOString().slice(0, 10),
  );
  await ev(
    "document.querySelectorAll('.ticket-type')[1].querySelector('.ticket-quantity button:last-child').click()",
  );
  await wait(
    "document.querySelector('.ticket-summary-total').textContent.includes('60.000')",
  );
  await ev("document.querySelector('.ticket-form').requestSubmit()");
  await wait("document.querySelector('.ticket-form input[autocomplete=name]')");
  await input("[autocomplete=name]", "Khách kiểm thử");
  await input("[autocomplete=email]", "visitor@fixture.invalid");
  await ev("document.querySelector('.ticket-form').requestSubmit()");
  await wait("document.querySelector('.ticket-agree')");
  await ev(
    "document.querySelector('.ticket-form-actions .ticket-primary').click()",
  );
  await wait("document.querySelector('.ticket-error')");
  assert.equal(submissions, 0, "consent required before checkout");
  await ev(
    "document.querySelector('.ticket-agree input').click();document.querySelector('.ticket-form-actions .ticket-primary').click()",
  );
  await wait("document.querySelector('.ticket-qr')");
  assert.equal(submissions, 1);
  assert.equal(reservation.expectedTotal, 60000);
  assert.match(
    await ev("document.querySelector('.ticket-demo-note').textContent"),
    /chưa thu tiền/,
  );
  assert.equal(
    await ev(
      "document.querySelector('.ticket-actions a[download]').download.includes('DEMO')",
    ),
    true,
  );
  for (const width of [375, 768, 1440]) await screen(width);
  await ev(
    "document.querySelector('.ticket-actions a[href*=confirmation]').click()",
  );
  await wait("document.querySelector('.ticket-payment-status')");
  assert.match(
    await ev("document.querySelector('.ticket-payment-status').textContent"),
    /Chưa thanh toán/,
  );
  assert.deepEqual(exceptions, []);
  console.log(
    "PASS: Ticket widths 375/768/1440, correct total, date, contact, consent, demo QR/download, stored booking receipt remains unpaid. Controlled API; no live payment.",
  );
} finally {
  await call("Page.close").catch(() => {});
  ws.close();
}
