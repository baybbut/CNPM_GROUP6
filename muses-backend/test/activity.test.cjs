const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const sql = require("mssql");
const {
  attachActivityRoutes,
  hashPassword,
  verifyPassword,
  validateActivity,
  reportRange,
  reportHours,
} = require("../activity.cjs");
let server, origin, adminCookie, visitorCookie;
const users = [],
  sessions = new Map(),
  events = new Map(),
  logins = [];
let lastInputs, lastReportQuery;
before(async () => {
  users.push(
    {
      id: 1,
      name: "Admin test",
      email: "admin@test.invalid",
      hash: await hashPassword("Test-password-123"),
      role: "Admin",
    },
    {
      id: 2,
      name: "Visitor test",
      email: "visitor@test.invalid",
      hash: await hashPassword("Test-password-123"),
      role: "Visitor",
    },
  );
  const app = express();
  app.use(express.json());
  app.locals.pool = {
    request() {
      const inputs = {};
      return {
        input(name, type, value) {
          inputs[name] = value;
          return this;
        },
        async query(query) {
          lastInputs = inputs;
          if (query.includes("PasswordHash AS hash"))
            return { recordset: users.filter((u) => u.email === inputs.email) };
          if (query.includes("SELECT u.UserID AS id")) {
            const user = users.find((u) => u.id === sessions.get(inputs.token));
            return {
              recordset: user
                ? [{ id: user.id, name: user.name, role: user.role }]
                : [],
            };
          }
          if (query.includes("INSERT INTO dbo.AuthSessions")) {
            sessions.set(inputs.token, inputs.user);
            logins.push(inputs.user);
            return { recordset: [] };
          }
          if (query.includes("DELETE FROM dbo.AuthSessions")) {
            sessions.delete(inputs.token);
            return { recordset: [] };
          }
          if (query.includes("INSERT INTO dbo.Users")) {
            assert.equal(query.includes("'Visitor'"), true);
            users.push({
              id: users.length + 1,
              name: inputs.name,
              email: inputs.email,
              hash: inputs.hash,
              role: "Visitor",
            });
            return { recordset: [] };
          }
          if (query.includes("INSERT INTO dbo.AnalyticsEvents")) {
            if (inputs.artwork && inputs.artwork !== 1)
              return { recordset: [{ error: "INVALID_ARTWORK" }] };
            if (inputs.kind !== "heartbeat") events.set(inputs.event, inputs);
            return { recordset: [{ result: "OK" }] };
          }
          if (query.includes("MIN(OccurredAt)")) {
            lastReportQuery = query;
            return {
              recordsets: [
                [
                  {
                    sessions: 0,
                    visitors: 0,
                    activeVisitors: 0,
                    activeLoggedIn: 0,
                  },
                ],
                [
                  {
                    logins: logins.filter((id) => id === 2).length,
                    loggedInUsers: logins.includes(2) ? 1 : 0,
                  },
                ],
                [{ qrScans: events.size, audioPlays: 0 }],
                [],
                [],
                [],
                [],
                [{ trackingSince: null }],
              ],
            };
          }
          throw Error("Unexpected database query");
        },
      };
    },
  };
  attachActivityRoutes(app, sql);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));
const post = (path, body, cookie) =>
  fetch(origin + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const login = async (email) => {
  const response = await post("/api/auth/login", {
    email,
    password: "Test-password-123",
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal("hash" in data.user, false);
  assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  return response.headers.get("set-cookie").split(";")[0];
};
test("passwords are salted and verified without storing plaintext", async () => {
  const hash = await hashPassword("Some-password-123");
  assert.equal(await verifyPassword("Some-password-123", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(
    await verifyPassword("Some-password-123", "old-placeholder-hash"),
    false,
  );
  assert.notEqual(hash, await hashPassword("Some-password-123"));
});
test("reports reject anonymous users and non-admin accounts", async () => {
  assert.equal((await fetch(origin + "/api/admin/analytics")).status, 401);
  visitorCookie = await login("visitor@test.invalid");
  assert.equal(
    (
      await fetch(origin + "/api/admin/analytics", {
        headers: { Cookie: visitorCookie },
      })
    ).status,
    403,
  );
  adminCookie = await login("admin@test.invalid");
});
test("admin receives real zero state, login counts and Vietnamese date bounds", async () => {
  const response = await fetch(
    origin + "/api/admin/analytics?from=2026-10-01&to=2026-10-23",
    { headers: { Cookie: adminCookie } },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.summary.visitors, 0);
  assert.equal(data.summary.loggedInUsers, 1);
  assert.deepEqual(data.peakHours, []);
  assert.equal(lastInputs.start.toISOString(), "2026-09-30T17:00:00.000Z");
  assert.equal(lastInputs.end.toISOString(), "2026-10-23T17:00:00.000Z");
});
test("invalid dates fail before querying report database", async () => {
  assert.equal(
    (
      await fetch(
        origin + "/api/admin/analytics?from=2026-02-30&to=2026-03-01",
        { headers: { Cookie: adminCookie } },
      )
    ).status,
    400,
  );
  assert.throws(() => reportRange({ from: "2026-01-01", to: "2025-01-01" }));
  assert.throws(() => reportRange({ from: "2024-01-01", to: "2026-01-01" }));
});
test("activity binds point and artwork, deduplicates retries and validates artwork", async () => {
  const event = {
    sessionId: crypto.randomUUID(),
    visitorId: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    kind: "qr_scan",
    artworkId: 1,
    point: "garden-01",
    language: "vi",
  };
  assert.equal((await post("/api/activity", event, visitorCookie)).status, 202);
  assert.equal((await post("/api/activity", event, visitorCookie)).status, 202);
  assert.equal(events.size, 1);
  assert.equal(lastInputs.point, "garden-01");
  assert.equal(lastInputs.user, 2);
  assert.equal(
    (await post("/api/activity", { ...event, artworkId: 999 })).status,
    400,
  );
  assert.equal(
    (await post("/api/activity", { ...event, kind: "login" })).status,
    400,
  );
  assert.throws(() => validateActivity({ ...event, point: "bad/point" }));
  assert.throws(() => validateActivity({ ...event, sessionId: "spoof" }));
  assert.throws(() => validateActivity({ ...event, artworkId: null }));
});
test("logout invalidates access and preserves historic login counts", async () => {
  assert.equal((await post("/api/auth/logout", {}, visitorCookie)).status, 200);
  assert.equal(
    (
      await (
        await fetch(origin + "/api/auth/me", {
          headers: { Cookie: visitorCookie },
        })
      ).json()
    ).user,
    null,
  );
  assert.equal(logins.includes(2), true);
  const response = await fetch(origin + "/api/admin/analytics", {
    headers: { Cookie: adminCookie },
  });
  assert.equal((await response.json()).summary.loggedInUsers, 1);
});
test("registration cannot choose its role and wrong password is rejected", async () => {
  assert.equal(
    (
      await post("/api/auth/register", {
        name: "New visitor",
        email: "new@test.invalid",
        password: "Safe-password-123",
        role: "Admin",
      })
    ).status,
    201,
  );
  assert.equal(users.at(-1).role, "Visitor");
  assert.equal(
    (
      await post("/api/auth/login", {
        email: "visitor@test.invalid",
        password: "wrong",
      })
    ).status,
    401,
  );
});

test("hour reports bind Vietnam daily windows and preserve live counters", async () => {
  assert.deepEqual(reportHours({}), { fromHour: 0, toHour: 24 });
  assert.deepEqual(reportHours({ fromHour: "23", toHour: "24" }), {
    fromHour: 23,
    toHour: 24,
  });
  for (const q of [
    { fromHour: "24", toHour: "24" },
    { fromHour: "9", toHour: "9" },
    { fromHour: "18", toHour: "8" },
    { fromHour: "-1" },
    { toHour: "25" },
    { fromHour: "9.5" },
    { fromHour: "0;DROP TABLE x" },
  ])
    assert.throws(() => reportHours(q));
  const response = await fetch(
    origin +
      "/api/admin/analytics?from=2026-10-01&to=2026-10-02&fromHour=9&toHour=17",
    { headers: { Cookie: adminCookie } },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.fromHour, 9);
  assert.equal(data.toHour, 17);
  assert.equal(lastInputs.fromHour, 9);
  assert.equal(lastInputs.toHour, 17);
  assert.equal(lastInputs.allHours, false);
  assert.equal(lastInputs.start.toISOString(), "2026-09-30T17:00:00.000Z");
  assert.match(
    lastReportQuery,
    /DATEPART\(hour,DATEADD\(minute,420,e.OccurredAt\)\)>=@fromHour/,
  );
  assert.match(lastReportQuery, /sx.SessionID=s.SessionID/);
  assert.match(lastReportQuery, /OccurredAt\)\)<@toHour/);
  assert.match(
    lastReportQuery,
    /LastSeenAt>=DATEADD\(minute,-5,SYSUTCDATETIME\(\)\)/,
  );
  const bad = await fetch(
    origin + "/api/admin/analytics?fromHour=22&toHour=3",
    { headers: { Cookie: adminCookie } },
  );
  assert.equal(bad.status, 400);
});
