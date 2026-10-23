const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough, Writable } = require("node:stream");
const { setupActivity } = require("../scripts/activity-setup.cjs");
const { terminalPrompt } = require("../scripts/terminal-prompt.cjs");
const config = {
  server: "local-test",
  database: "MuseumTest",
  user: "museum_reader",
  password: "runtime-test-only",
  options: { encrypt: true },
};
function fixture({ ready = 1, failMigration = false } = {}) {
  const calls = [],
    pools = [];
  return {
    calls,
    pools,
    createPool(value) {
      const pool = {
        config: value,
        closed: false,
        async connect() {
          return this;
        },
        async close() {
          this.closed = true;
        },
        request() {
          const values = {};
          return {
            input(name, type, value) {
              values[name] = value;
              return this;
            },
            async query(query) {
              calls.push({ query, values, config: value });
              if (query.includes("CREATE TABLE") && failMigration)
                throw Error("Migration denied");
              return {
                recordset: query.includes("HAS_PERMS_BY_NAME")
                  ? [{ ready }]
                  : [{ runtimeUser: "MappedMuseumUser" }],
              };
            },
          };
        },
      };
      pools.push(pool);
      return pool;
    },
  };
}
test("privileged setup creates schema then grants to mapped app user and verifies app access", async () => {
  const stub = fixture(),
    original = JSON.stringify(config);
  const result = await setupActivity(
    config,
    { user: "sql_admin", password: "admin-test-only" },
    stub.createPool,
  );
  assert.equal(result, "MappedMuseumUser");
  assert.equal(stub.pools.length, 2);
  assert.equal(stub.pools[0].config.user, "sql_admin");
  assert.equal(stub.pools[1].config.user, "museum_reader");
  assert.equal(stub.calls[1].values.runtimeLogin, "museum_reader");
  assert.match(stub.calls[1].query, /QUOTENAME\(@principal\)/);
  assert.doesNotMatch(
    stub.calls[1].query,
    /ALTER ROLE|ADD MEMBER|GRANT CREATE TABLE/i,
  );
  assert.equal(
    stub.calls.some((x) => x.query.includes("admin-test-only")),
    false,
  );
  assert.equal(
    stub.pools.every((p) => p.closed),
    true,
  );
  assert.equal(JSON.stringify(config), original);
});
test("effective permission denial is reported without claiming successful setup", async () => {
  const stub = fixture({ ready: 0 });
  await assert.rejects(
    () =>
      setupActivity(
        config,
        { user: "sql_admin", password: "test" },
        stub.createPool,
      ),
    /bị chặn/,
  );
  assert.equal(
    stub.pools.every((p) => p.closed),
    true,
  );
});
test("failed schema migration closes connection and does not apply grants", async () => {
  const stub = fixture({ failMigration: true });
  await assert.rejects(
    () =>
      setupActivity(
        config,
        { user: "sql_admin", password: "test" },
        stub.createPool,
      ),
    /Migration denied/,
  );
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.pools[0].closed, true);
});
test("setup validates missing configuration before connecting", async () => {
  const stub = fixture();
  await assert.rejects(
    () =>
      setupActivity(
        { ...config, user: "" },
        { user: "sa", password: "test" },
        stub.createPool,
      ),
    /DB_USER/,
  );
  assert.equal(stub.pools.length, 0);
});
test("SQL administrator password is hidden from terminal output", async () => {
  const input = new PassThrough();
  input.isTTY = true;
  let captured = "";
  const output = new Writable({
    write(chunk, encoding, done) {
      captured += chunk.toString();
      done();
    },
  });
  const prompt = terminalPrompt(input, output);
  const pending = prompt.ask("Password: ", true);
  input.write("hidden-test-value\n");
  assert.equal(await pending, "hidden-test-value");
  prompt.close();
  assert.equal(captured.includes("hidden-test-value"), false);
  assert.equal(captured.includes("Password:"), true);
});
