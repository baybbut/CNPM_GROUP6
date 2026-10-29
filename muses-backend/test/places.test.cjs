const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizePlaces, createPlaceService } = require("../places.cjs");
const venue = (id, tags = {}, point = { lat: 10.77, lon: 106.69 }) => ({
  type: "node",
  id,
  ...point,
  tags: { tourism: "museum", name: "Bảo tàng thử nghiệm", ...tags },
});
const data = { elements: [venue(1)] };
test("OSM venues keep real geometry, distinguish galleries and reject private, invalid, unnamed and unsafe URLs", () => {
  const items = normalizePlaces({
    elements: [
      venue(1, { website: "javascript:alert(1)" }),
      venue(2),
      venue(3, { name: "Phòng tranh", tourism: "gallery" }),
      venue(4, { name: "Private", access: "private" }),
      venue(5, { name: "" }),
      venue(6, { name: "Invalid" }, { lat: NaN, lon: 106 }),
      venue(7, { name: "Closed", disused: "yes" }),
      {
        type: "way",
        id: 8,
        center: { lat: 10.78, lon: 106.7 },
        tags: {
          name: "Art centre",
          amenity: "arts_centre",
          website: "https://example.org",
        },
      },
    ],
  });
  assert.equal(items.length, 3);
  assert.equal(items.find((p) => p.id === "osm-node-1").website, null);
  assert.equal(items.find((p) => p.id === "osm-node-3").kind, "gallery");
  assert.equal(items.find((p) => p.id === "osm-way-8").latitude, 10.78);
  assert.throws(() => normalizePlaces({ elements: [], remark: "timeout" }));
});
test("discovery caches and coalesces callers; fixed HCM query never includes visitor location", async () => {
  let calls = 0,
    release;
  const wait = new Promise((r) => (release = r));
  const get = createPlaceService({
    fetchImpl: async (url, options) => {
      calls++;
      await wait;
      assert.match(options.body.get("data"), /VN-SG/);
      assert.equal(options.body.has("latitude"), false);
      return { ok: true, json: async () => data };
    },
  });
  const a = get(),
    b = get();
  release();
  assert.deepEqual(await a, await b);
  assert.equal(calls, 1);
  await get();
  assert.equal(calls, 1);
});
test("provider failure tries backup, serves stale known data and backs off; partial responses never replace cache", async () => {
  let time = Date.parse("2026-10-29T00:00:00Z"),
    calls = 0,
    fail = false;
  const get = createPlaceService({
    now: () => time,
    fetchImpl: async () => {
      calls++;
      return { ok: !fail, json: async () => data };
    },
  });
  const good = await get();
  assert.equal(good.stale, false);
  time += 7 * 3600000;
  fail = true;
  const stale = await get();
  assert.equal(stale.stale, true);
  assert.deepEqual(stale.items, good.items);
  assert.equal(calls, 3);
  await get();
  assert.equal(calls, 3);
});
test("first-load outage supplies labelled real-world reference museums and backs off", async () => {
  let calls = 0;
  const get = createPlaceService({
    fetchImpl: async () => {
      calls++;
      throw Error("network");
    },
  });
  const fallback = await get();
  assert.equal(fallback.sourceType, "reference");
  assert.equal(fallback.fetchedAt, null);
  assert.equal(fallback.items.length, 4);
  assert.ok(fallback.items.some((p) => p.name.includes("Mỹ thuật")));
  assert.ok(
    fallback.items.every(
      (p) =>
        p.pinAccuracy === "approximate" && p.sourceUrl.startsWith("https://"),
    ),
  );
  assert.deepEqual(await get(), fallback);
  assert.equal(calls, 2);
});
