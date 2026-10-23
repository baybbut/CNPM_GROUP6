export function matchesEventDate(item, date) {
  if (!date) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const value = new Date(`${date}T12:00:00Z`);
  if (
    !Number.isFinite(value.getTime()) ||
    value.toISOString().slice(0, 10) !== date
  )
    return false;
  if (item.startDate && date < item.startDate) return false;
  if (item.endDate && date > item.endDate) return false;
  return !item.weekdays || item.weekdays.includes(value.getUTCDay());
}
