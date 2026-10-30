import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { activityApiBase, createActivityDelivery } from "../src/api/activityDelivery.mjs";

const require = createRequire(import.meta.url);
const { validateActivity } = require("../../muses-backend/activity.cjs");
const accepted = () => ({ ok: true, status: 202 });
function timerFixture() {
  let next = 0;
  const timers = new Map();
  return {
    timers,
    schedule(fn, delay) {
      timers.set(++next, { fn, delay });
      return next;
    },
    cancel(id) { timers.delete(id); },
    async run(delay) {
      const item = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(item, `Expected a ${delay}ms timer`);
      timers.delete(item[0]);
      item[1].fn();
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}
const event = () => ({
  visitorId: randomUUID(), sessionId: randomUUID(), eventId: randomUUID(), kind: "page_view",
});

test("LAN phones use the local API proxy when env points at the phone's localhost", () => {
  for (const configured of ["http://localhost:3001", "http://127.0.0.1:3001/", "http://[::1]:3001"]) {
    assert.equal(activityApiBase(configured, "http://172.20.10.2:5173"), "");
  }
  assert.equal(activityApiBase("", "http://172.20.10.2:5173"), "");
  assert.equal(activityApiBase("https://api.muses.example/", "https://muses.example"), "https://api.muses.example");
  assert.equal(activityApiBase("http://localhost:3001", "http://localhost:5173"), "http://localhost:3001");
});

test("a lost acknowledgement is retried automatically with the same event ID", async () => {
  const clock = timerFixture();
  const recorded = new Set();
  const bodies = [];
  const warnings = [];
  const sender = createActivityDelivery({
    endpoint: "/api/activity", ...clock, warn: (message) => warnings.push(message),
    fetchRequest: async (_, options) => {
      const body = JSON.parse(options.body);
      bodies.push(body);
      recorded.add(body.eventId);
      if (bodies.length === 1) throw new TypeError("Connection interrupted after write");
      return accepted();
    },
  });
  const visit = event();
  await sender.enqueue(visit);
  await clock.run(1000);
  assert.equal(bodies.length, 2);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.equal(recorded.size, 1);
  assert.equal(clock.timers.size, 0);
  assert.equal(warnings.length, 1);
});

test("503 and 429 retain the visit until the API recovers; invalid events do not block the queue", async () => {
  const clock = timerFixture();
  const statuses = [503, 429, 202, 400, 202];
  const bodies = [];
  const sender = createActivityDelivery({
    endpoint: "/api/activity", ...clock, warn() {},
    fetchRequest: async (_, options) => {
      bodies.push(JSON.parse(options.body));
      const status = statuses.shift();
      return { status, ok: status < 400 };
    },
  });
  await sender.enqueue(event());
  await clock.run(1000);
  await clock.run(2000);
  assert.equal(new Set(bodies.map((body) => body.eventId)).size, 1);
  await sender.enqueue(event());
  await sender.enqueue(event());
  assert.equal(bodies.length, 5);
  assert.equal(clock.timers.size, 0);
});

test("a hung network request times out and retries", async () => {
  const clock = timerFixture();
  let requests = 0;
  const sender = createActivityDelivery({
    endpoint: "/api/activity", ...clock, warn() {},
    fetchRequest: async (_, { signal }) => {
      if (++requests > 1) return accepted();
      return new Promise((_, reject) => signal.addEventListener("abort", () => reject(Error("Aborted"))));
    },
  });
  const first = sender.enqueue(event());
  await clock.run(10000);
  await first;
  await clock.run(1000);
  assert.equal(requests, 2);
  assert.equal(clock.timers.size, 0);
});

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}
let moduleId = 0;
async function clientFixture(t, local = new Storage(), session = new Storage()) {
  const bodies = [];
  for (const [key, value] of Object.entries({ localStorage: local, sessionStorage: session,
    fetch: async (_, options) => { bodies.push(JSON.parse(options.body)); return accepted(); },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  const client = await import(`../src/api/activity.mjs?test=${++moduleId}`);
  return { client, bodies, local, session };
}

test("repair legacy stored IDs and keep a valid visitor/session for repeated visits", async (t) => {
  const local = new Storage(), session = new Storage();
  local.setItem("muses-visitor-id", "old-visitor");
  session.setItem("muses-activity-session", JSON.stringify({ id: "old-session", last: Date.now() }));
  const { client, bodies } = await clientFixture(t, local, session);
  await client.trackActivity("page_view");
  await client.trackActivity("heartbeat");
  for (const body of bodies) assert.doesNotThrow(() => validateActivity(body));
  assert.equal(bodies[0].visitorId, bodies[1].visitorId);
  assert.equal(bodies[0].sessionId, bodies[1].sessionId);
  assert.notEqual(bodies[0].eventId, bodies[1].eventId);
});

test("changing visitor identity starts a new session rather than reusing another visitor's session", async (t) => {
  const { client, bodies, local } = await clientFixture(t);
  await client.trackActivity("page_view");
  local.setItem("muses-visitor-id", randomUUID());
  await client.trackActivity("page_view");
  assert.notEqual(bodies[0].visitorId, bodies[1].visitorId);
  assert.notEqual(bodies[0].sessionId, bodies[1].sessionId);
});

test("blocked storage still records a stable visitor and session", async (t) => {
  const blocked = { getItem() { throw Error("Blocked"); }, setItem() { throw Error("Blocked"); } };
  const { client, bodies } = await clientFixture(t, blocked, blocked);
  await client.trackActivity("page_view");
  await client.trackActivity("heartbeat");
  assert.doesNotThrow(() => validateActivity(bodies[0]));
  assert.equal(bodies[0].sessionId, bodies[1].sessionId);
  assert.equal(bodies[0].visitorId, bodies[1].visitorId);
});
