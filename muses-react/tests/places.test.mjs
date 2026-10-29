import { readFileSync } from "node:fs";
import { directionsUrl } from "../src/api/catalog.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasCoordinates,
  searchPlaces,
  connectCatalogue,
} from "../src/components/Museums/placeModel.mjs";
const items = [
  {
    id: "m",
    name: "Bảo tàng",
    names: { vi: "Bảo tàng", en: "Museum" },
    address: "TP.HCM",
    latitude: 10.77,
    longitude: 106.69,
    kind: "museum",
  },
  {
    id: "g",
    name: "Phòng tranh",
    address: "Quận 1",
    latitude: 10.8,
    longitude: 106.7,
    kind: "gallery",
  },
];
test("search is accent insensitive, multilingual and combines type, address and proximity", () => {
  assert.equal(searchPlaces(items, { q: "bao tang" })[0].id, "m");
  assert.equal(searchPlaces(items, { q: "Museum", lang: "vi" })[0].id, "m");
  assert.equal(searchPlaces(items, { q: "quan 1", kind: "museum" }).length, 0);
  assert.equal(searchPlaces(items, { position: items[1] })[0].id, "g");
  assert.equal(searchPlaces(items, { kind: "gallery" }).length, 1);
  for (const p of [
    { latitude: null, longitude: 106 },
    { latitude: 91, longitude: 106 },
    { latitude: "", longitude: 0 },
  ])
    assert.equal(hasCoordinates(p), false);
});
test("curated artwork links need both matching name and nearby pin; demo or owner guesses cannot attach", () => {
  const museum = {
    id: 1,
    name: "Bảo tàng",
    latitude: 10.77,
    longitude: 106.69,
    isDemo: false,
  };
  assert.equal(connectCatalogue(items, [museum])[0].museumId, 1);
  for (const m of [
    { ...museum, isDemo: true },
    { ...museum, name: "Another museum" },
    { ...museum, latitude: 21 },
  ])
    assert.equal(connectCatalogue(items, [m])[0].museumId, undefined);
});

test("reference museums are immediately usable, multilingual and route by address instead of an approximate pin", () => {
  const reference = JSON.parse(
    readFileSync(new URL("../src/data/hcmPlaces.json", import.meta.url)),
  );
  assert.equal(reference.length, 4);
  for (const lang of ["vi", "en", "zh", "ja", "ko"])
    assert.equal(searchPlaces(reference, { lang }).length, 4);
  const museum = searchPlaces(reference, { q: "my thuat" })[0];
  assert.ok(museum);
  const destination = new URL(directionsUrl(museum)).searchParams.get(
    "destination",
  );
  assert.ok(destination.includes("97A Phó Đức Chính"));
  assert.ok(!destination.includes("10.769"));
});
