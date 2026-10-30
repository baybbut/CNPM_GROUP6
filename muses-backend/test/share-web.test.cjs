const { test } = require("node:test");
const assert = require("node:assert/strict");
const { publicBuildEnv, tunnelUrl } = require("../scripts/share-web.cjs");

test("public demo build clears private API/QR origins without modifying source env", () => {
  const env = { VITE_API_BASE_URL: "http://localhost:3001", VITE_VISITOR_BASE_URL: "http://172.20.10.2:5173/", PORT: "3001" };
  const build = publicBuildEnv(env);
  assert.equal(build.VITE_API_BASE_URL, "");
  assert.equal(build.VITE_VISITOR_BASE_URL, "");
  assert.equal(build.PORT, "3001");
  assert.equal(env.VITE_API_BASE_URL, "http://localhost:3001");
});
test("extract the actual HTTPS tunnel address, never a localhost address or help link", () => {
  assert.equal(tunnelUrl("INF | https://museum-demo.trycloudflare.com |"), "https://museum-demo.trycloudflare.com");
  for (const line of ["http://127.0.0.1:3001", "https://developers.cloudflare.com/cloudflare-one/", "tunnel unavailable"])
    assert.equal(tunnelUrl(line), null);
});
