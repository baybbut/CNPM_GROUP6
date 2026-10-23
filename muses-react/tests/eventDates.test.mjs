import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesEventDate } from "../src/components/exhibition/eventDates.mjs";
test("event date ranges include endpoints and cross month/year boundaries", () => {
  const event = { startDate: "2026-12-20", endDate: "2027-01-05" };
  for (const day of ["2026-12-20", "2026-12-31", "2027-01-01", "2027-01-05"])
    assert.equal(matchesEventDate(event, day), true);
  for (const day of ["2026-12-19", "2027-01-06", "2025-12-25"])
    assert.equal(matchesEventDate(event, day), false);
  assert.equal(matchesEventDate(event, ""), true);
});
test("weekly tours respect weekdays and published date range", () => {
  const tour = {
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    weekdays: [1, 2, 4],
  };
  assert.equal(matchesEventDate(tour, "2026-10-22"), true);
  assert.equal(matchesEventDate(tour, "2026-10-23"), false);
  assert.equal(matchesEventDate(tour, "2026-11-02"), false);
  assert.equal(matchesEventDate(tour, "2026-10-26"), true);
});
test("invalid calendar dates are rejected; leap days are valid", () => {
  for (const day of ["2026-02-29", "2026-13-01", "not-a-date"])
    assert.equal(matchesEventDate({}, day), false);
  assert.equal(matchesEventDate({}, "2028-02-29"), true);
});
