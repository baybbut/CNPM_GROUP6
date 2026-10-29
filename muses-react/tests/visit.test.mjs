import { test } from "node:test";
import assert from "node:assert/strict";
import {
  visitDestinations,
  visitTicketLink,
  mapSearchUrl,
} from "../src/components/visit/visitModel.mjs";
import {
  visitText,
  visitMessages,
} from "../src/components/visit/visitText.mjs";
import { ticketToday } from "../src/components/Tickets/ticketModel.mjs";
test("Visit destinations always work offline, exclude demo/hidden venues and link only matching catalogue museums", () => {
  const real = {
    id: 31,
    name: "Bảo tàng Mỹ thuật TP.HCM",
    latitude: 10.769,
    longitude: 106.699,
    isPublic: true,
    isDemo: false,
  };
  const items = visitDestinations([
    real,
    { ...real, id: 32, isDemo: true },
    { ...real, id: 33, isPublic: false },
    { id: 34, name: "Unknown", latitude: null },
  ]);
  assert.equal(items.length, 4);
  assert.equal(items[0].museumId, 31);
  assert.equal(visitDestinations()[0].museumId, undefined);
});
test("visit booking preserves selected museum and a real future Vietnam date, never a malformed or past date", () => {
  const date = ticketToday();
  assert.equal(
    visitTicketLink({ museumId: 31 }, date),
    `/tickets?museum=31&date=${date}`,
  );
  assert.equal(visitTicketLink({}, date), `/tickets?date=${date}`);
  for (const bad of ["2020-01-01", "2026-02-30", "<script>", ""])
    assert.equal(visitTicketLink({ museumId: 31 }, bad), "/tickets?museum=31");
  assert.equal(
    new URL(
      mapSearchUrl({ name: "Museum A", address: "Address A" }, "cafes near"),
    ).searchParams.get("query"),
    "cafes near Museum A, Address A",
  );
});
test("all Visit content is complete in five languages with no unfinished FAQ answers", () => {
  for (const key of Object.keys(visitMessages))
    for (const lang of ["vi", "en", "zh", "ja", "ko"]) {
      assert.ok(visitText(lang, key).length > 0);
      assert.notEqual(visitText(lang, key), key);
      assert.doesNotMatch(visitText(lang, key), /Content will be updated|TODO/);
    }
});
