const { test } = require("node:test");
const assert = require("node:assert/strict");
const { setupCatalog } = require("../scripts/setup-catalog.cjs");
const config = {
  server: "test",
  database: "MuseumFixture",
  user: "runtime",
  password: "runtime-test-only",
};
function fixture({ backupFailure = false, denied = false } = {}) {
  const calls = [],
    pools = [];
  function createPool(value) {
    const pool = {
      async connect() {
        return this;
      },
      async close() {
        this.closed = true;
      },
      request() {
        const inputs = {};
        return {
          input(name, type, value) {
            inputs[name] = value;
            return this;
          },
          async query(statement) {
            calls.push({ statement, inputs, config: value });
            if (backupFailure && statement.includes("BACKUP DATABASE"))
              throw Error("Backup failed");
            return {
              recordset: statement.includes("permissions(tableName,action)")
                ? [{ ready: denied ? 0 : 1 }]
                : statement.includes("HAS_PERMS_BY_NAME")
                  ? [{ ready: 1 }]
                  : [{ runtimeUser: "runtime" }],
            };
          },
        };
      },
    };
    pools.push(pool);
    return pool;
  }
  return { calls, pools, createPool };
}
test("PRD setup backs up and verifies before any schema mutation, preserves app credentials, and checks effective rights", async () => {
  const f = fixture(),
    before = JSON.stringify(config);
  await setupCatalog(
    config,
    { user: "sa", password: "admin-test-only" },
    { backupPath: "/var/opt/mssql/data/test.bak", createPool: f.createPool },
  );
  assert.match(f.calls[0].statement, /BACKUP DATABASE.*RESTORE VERIFYONLY/);
  assert.equal(f.calls[0].inputs.backup, "/var/opt/mssql/data/test.bak");
  assert.ok(
    f.calls.some((c) =>
      c.statement.includes("CREATE TABLE dbo.DisplaySchedules"),
    ),
  );
  assert.ok(
    f.calls.some(
      (c) =>
        c.config.user === "runtime" &&
        c.statement.includes("permissions(tableName,action)"),
    ),
  );
  assert.equal(JSON.stringify(config), before);
  assert.ok(f.pools.every((p) => p.closed));
  assert.ok(
    !f.calls.some(
      (c) =>
        c.statement.includes("DROP DATABASE") ||
        c.statement.includes("admin-test-only"),
    ),
  );
});
test("failed backup prevents migration and closes SQL connection", async () => {
  const f = fixture({ backupFailure: true });
  await assert.rejects(
    () =>
      setupCatalog(
        config,
        { user: "sa", password: "test" },
        { backupPath: "/backup/a.bak", createPool: f.createPool },
      ),
    /Backup failed/,
  );
  assert.equal(f.calls.length, 1);
  assert.ok(f.pools.every((p) => p.closed));
});
test("application DENY is not reported as successful setup", async () => {
  const f = fixture({ denied: true });
  await assert.rejects(
    () =>
      setupCatalog(
        config,
        { user: "sa", password: "test" },
        { backupPath: "/backup/a.bak", createPool: f.createPool },
      ),
    /DENY/,
  );
  assert.ok(f.pools.every((p) => p.closed));
});
