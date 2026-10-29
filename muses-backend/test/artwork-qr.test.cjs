const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express"),
  sql = require("mssql");
const { attachArtworkQRRoutes } = require("../artwork-qr.cjs");
const fs = require("node:fs"),
  path = require("node:path");
let role = "Admin",
  missing = false,
  calls = [],
  server,
  base;
const rows = [
  {
    id: 1,
    title: "Artwork A",
    enabled: true,
    available: true,
    label: null,
    scans: 2,
  },
  { id: 2, title: "Artwork B", enabled: false, available: true, scans: 0 },
  { id: 3, title: "Draft", enabled: true, available: false, scans: 0 },
];
before(async () => {
  const app = express();
  app.use(express.json());
  app.locals.identity = async () => (role ? { id: 7, role } : null);
  app.locals.pool = {
    request() {
      const values = {};
      return {
        input(k, t, v) {
          values[k] = v;
          return this;
        },
        async query(statement) {
          calls.push({ statement, values });
          if (missing)
            throw Object.assign(Error("Invalid column"), { number: 207 });
          const row = rows.find((r) => r.id === values.id);
          let result = [];
          if (statement.startsWith("UPDATE")) {
            if (row && (!values.enabled || row.available)) {
              Object.assign(row, {
                enabled: values.enabled,
                label: values.label,
              });
              result = [{ id: row.id }];
            }
          } else if (values.id) {
            if (
              row &&
              (!statement.includes("COALESCE(NULLIF(a.QRLabel") ||
                row.available)
            )
              result = [{ ...row }];
          } else result = rows.map((r) => ({ ...r }));
          return { recordset: result };
        },
      };
    },
  };
  attachArtworkQRRoutes(app, sql);
  server = await new Promise((r) => {
    const s = app.listen(0, "127.0.0.1", () => r(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
const request = (url, body) =>
  fetch(base + url, {
    method: body ? "PUT" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
test("QR management requires an Admin while public availability remains anonymous", async () => {
  for (const [value, status] of [
    [null, 401],
    ["Visitor", 403],
  ]) {
    role = value;
    assert.equal((await request("/api/admin/qr/artworks")).status, status);
    assert.equal(
      (await request("/api/admin/qr/artworks/1", { enabled: false })).status,
      status,
    );
  }
  role = null;
  const active = await request("/api/qr/artworks/1");
  assert.equal(active.status, 200);
  assert.match(active.headers.get("cache-control"), /no-store/);
  assert.equal((await active.json()).active, true);
  assert.equal((await request("/api/qr/artworks/2")).status, 410);
  assert.equal((await request("/api/qr/artworks/3")).status, 404);
  assert.equal((await request("/api/qr/artworks/999")).status, 404);
});
test("disable/re-enable persists independently of artwork publication; unavailable works cannot be enabled", async () => {
  role = "Admin";
  assert.equal(
    (
      await request("/api/admin/qr/artworks/1", {
        enabled: false,
        label: "Gallery A",
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/qr/artworks/1")).status, 410);
  const list = await (await request("/api/admin/qr/artworks")).json();
  assert.equal(list.items[0].label, "Gallery A");
  assert.equal(list.items[0].enabled, false);
  assert.equal(
    (
      await request("/api/admin/qr/artworks/1", {
        enabled: true,
        label: "Gallery A",
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/qr/artworks/1")).status, 200);
  assert.equal(
    (await request("/api/admin/qr/artworks/3", { enabled: true })).status,
    409,
  );
  const update = calls.find((c) => c.statement.startsWith("UPDATE"));
  assert.equal(update.values.user, 7);
  assert.match(update.statement, /OUTPUT inserted.ArtworkID/);
  assert.match(update.statement, /QRUpdatedAt=SYSUTCDATETIME/);
  assert.doesNotMatch(update.statement, /SET PublicationStatus/);
  const publicQuery = calls.find((c) =>
    c.statement.includes("COALESCE(NULLIF(a.QRLabel"),
  );
  assert.match(publicQuery.statement, /a.PublicationStatus='Published'/);
  assert.match(publicQuery.statement, /l.LanguageCode='vi'/);
  assert.match(publicQuery.statement, /FullDescription/);
});
test("strict status/id/label validation and missing migration never silently activate QR", async () => {
  role = "Admin";
  for (const body of [
    { enabled: "false" },
    { enabled: 1 },
    { enabled: true, label: "x".repeat(151) },
  ])
    assert.equal((await request("/api/admin/qr/artworks/1", body)).status, 400);
  assert.equal(
    (await request("/api/admin/qr/artworks/0", { enabled: false })).status,
    400,
  );
  assert.equal(
    (await request("/api/admin/qr/artworks/999", { enabled: false })).status,
    404,
  );
  missing = true;
  const response = await request("/api/qr/artworks/1");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "QR_SETUP_REQUIRED");
  missing = false;
  const migration = fs.readFileSync(
    path.join(__dirname, "../MusesDB/ArtworkQR.sql"),
    "utf8",
  );
  assert.match(migration, /COL_LENGTH/);
  assert.doesNotMatch(migration, /DROP\s|TRUNCATE\s|DELETE\s/i);
});
