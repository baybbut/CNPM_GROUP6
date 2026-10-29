export const ticketToday = (now = new Date()) =>
  new Date(+now + 420 * 60000).toISOString().slice(0, 10);
export const ticketLastDay = (now = new Date()) =>
  new Date(new Date(ticketToday(now) + "T00:00:00Z").getTime() + 90 * 86400000)
    .toISOString()
    .slice(0, 10);
export function bookingTotal(offer, counts) {
  return (
    offer.adultPrice * counts.adults +
    offer.concessionPrice * counts.concessions +
    offer.childPrice * counts.children
  );
}
export const guestCount = (counts) =>
  counts.adults + counts.concessions + counts.children;
export function isClosed(offer, date) {
  if (!date) return false;
  return String(offer.closedWeekdays || "")
    .split(",")
    .filter(Boolean)
    .map(Number)
    .includes(new Date(date + "T00:00:00Z").getUTCDay());
}
export function validVisitDate(offer, date, now = new Date()) {
  const parsed = new Date(date + "T00:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(+parsed) &&
    parsed.toISOString().slice(0, 10) === date &&
    date >= ticketToday(now) &&
    date <= ticketLastDay(now) &&
    !isClosed(offer, date)
  );
}
export function requestId() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const hex = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export const demoQr = (order) =>
  `MUSES DEMO — NOT A PAYMENT\nBooking: ${order.code}\nAmount: ${order.total} VND`;
