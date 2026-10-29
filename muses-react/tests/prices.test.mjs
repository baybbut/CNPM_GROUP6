import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lookupDate,
  knownPrice,
  pricePlaces,
  filterPrices,
  priceKeys,
} from "../src/components/Tickets/priceModel.mjs";
import {
  priceMessages,
  priceText,
} from "../src/components/Tickets/priceText.mjs";
test("missing prices stay unknown; only an explicit numeric zero is free", () => {
  for (const missing of [undefined, null, "", false, "0", NaN, -1, Infinity])
    assert.equal(knownPrice(missing), null);
  assert.equal(knownPrice(0), 0);
  assert.equal(knownPrice(50000), 50000);
  const list = pricePlaces();
  assert.equal(list.length, 4);
  assert.ok(list.every((p) => priceKeys.every((k) => p[k] === null)));
});
test("price lookup matches a real museum, omits demo/hidden data, searches accents and sorts unknowns last", () => {
  const rows = [
    {
      id: 31,
      name: "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh",
      latitude: 10.769,
      longitude: 106.699,
      isPublic: true,
      adultPrice: 30000,
      concessionPrice: 15000,
      childPrice: 0,
    },
    {
      id: 32,
      name: "Bảo tàng Đặc biệt",
      isPublic: true,
      adultPrice: 0,
      concessionPrice: 0,
      childPrice: 0,
    },
    { id: 33, name: "DEMO", isDemo: true, adultPrice: 1 },
    { id: 34, name: "Hidden", isPublic: false, adultPrice: 1 },
  ];
  const list = pricePlaces(rows);
  assert.equal(list.length, 5);
  assert.equal(
    list.find((p) => p.id === "hcm-reference-fine-arts").museumId,
    31,
  );
  assert.equal(filterPrices(list, { q: "DAC BIET" })[0].museumId, 32);
  assert.equal(filterPrices(list, { q: "my thuat" })[0].adultPrice, 30000);
  assert.equal(filterPrices(list, { museum: "31" }).length, 1);
  assert.equal(filterPrices(list, { sort: "price" })[0].museumId, 32);
  assert.equal(filterPrices(list, { sort: "price" }).at(-1).adultPrice, null);
});
test("price lookup copy is complete in five languages", () => {
  for (const key of Object.keys(priceMessages))
    for (const lang of ["vi", "en", "zh", "ja", "ko"]) {
      assert.ok(priceText(lang, key));
      assert.notEqual(priceText(lang, key), key);
    }
});

test("lookup date is context only and rejects invalid dates", () => {
  assert.equal(lookupDate("2026-02-30"), "");
  assert.equal(lookupDate("2028-02-29"), "2028-02-29");
});
