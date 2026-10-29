import { test } from "node:test";
import assert from "node:assert/strict";
import {
  museumGuides,
  moveStop,
  nearestOrder,
  visitTimeline,
  clockLabel,
} from "../src/components/Museums/itineraryModel.mjs";
import references from "../src/data/hcmPlaces.json" with { type: "json" };
test("four real venue guides do not claim unverified floor plans", () => {
  assert.deepEqual(
    Object.keys(museumGuides),
    references.map((p) => p.id),
  );
  for (const guide of Object.values(museumGuides)) {
    assert.equal(guide.topics.length, 3);
    assert.deepEqual(guide.floorPlans, []);
  }
});
test("changing order preserves selected stops without crossing bounds", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(moveStop(ids, "b", -1), ["b", "a", "c"]);
  assert.deepEqual(moveStop(ids, "b", 1), ["a", "c", "b"]);
  assert.deepEqual(moveStop(ids, "a", -1), ids);
  assert.deepEqual(moveStop(ids, "missing", 1), ids);
  assert.deepEqual(ids, ["a", "b", "c"]);
});
test("visit timeline includes only chosen visit durations, handles midnight and invalid inputs", () => {
  assert.deepEqual(visitTimeline(["a", "c"], { a: 30, c: 90 }, "09:00"), [
    { id: "a", start: 540, end: 570, duration: 30 },
    { id: "c", start: 570, end: 660, duration: 90 },
  ]);
  assert.deepEqual(visitTimeline(["a"], {}, "99:00"), []);
  assert.deepEqual(visitTimeline([], {}, "09:00"), []);
  assert.equal(visitTimeline(["a"], { a: -1 }, "23:30")[0].end, 1470);
  assert.equal(clockLabel(1470), "00:30 (+1)");
});
test("nearest ordering requires an origin and never adds or drops venues", () => {
  const venues = [
    { id: "far", latitude: 10.8, longitude: 106.7 },
    { id: "near", latitude: 10.77, longitude: 106.7 },
  ];
  assert.deepEqual(nearestOrder(venues, null), ["far", "near"]);
  assert.deepEqual(
    nearestOrder(venues, { latitude: 10.77, longitude: 106.7 }),
    ["near", "far"],
  );
  assert.deepEqual(
    venues.map((p) => p.id),
    ["far", "near"],
  );
});
