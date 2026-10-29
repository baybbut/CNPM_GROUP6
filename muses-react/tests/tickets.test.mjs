import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bookingTotal,
  guestCount,
  ticketToday,
  ticketLastDay,
  validVisitDate,
  demoQr,
} from "../src/components/Tickets/ticketModel.mjs";
import {
  ticketMessages,
  ticketText,
} from "../src/components/Tickets/ticketText.mjs";
const offer = {
  adultPrice: 40000,
  concessionPrice: 20000,
  childPrice: 0,
  closedWeekdays: "3",
};
test("ticket totals use integer prices and include free admission", () => {
  const counts = { adults: 2, concessions: 1, children: 3 };
  assert.equal(bookingTotal(offer, counts), 100000);
  assert.equal(guestCount(counts), 6);
  assert.equal(
    bookingTotal(offer, { adults: 0, concessions: 0, children: 1 }),
    0,
  );
});
test("visit day uses Vietnam date and 90-day range; rejects closures and invalid dates", () => {
  const now = new Date("2026-10-28T17:00:00Z");
  assert.equal(ticketToday(now), "2026-10-29");
  assert.equal(ticketLastDay(now), "2027-01-27");
  assert.equal(validVisitDate(offer, "2026-10-29", now), true);
  assert.equal(validVisitDate(offer, "2026-10-28", now), false);
  assert.equal(validVisitDate(offer, "2026-11-04", now), false);
  assert.equal(validVisitDate(offer, "2026-02-30", now), false);
});
test("all five languages have ticket messages; sample QR is not a bank transfer", () => {
  for (const lang of ["vi", "en", "zh", "ja", "ko"])
    for (const key of Object.keys(ticketMessages))
      assert.notEqual(ticketText(lang, key), key);
  assert.match(demoQr({ code: "DEMO", total: 40000 }), /NOT A PAYMENT/);
  assert.ok(!demoQr({ code: "DEMO", total: 40000 }).includes("000201"));
});
