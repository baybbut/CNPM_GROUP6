import { distanceKm } from "../../api/catalog.mjs";
import { hasCoordinates } from "./placeModel.mjs";
export const museumGuides = {
  "hcm-reference-fine-arts": {
    topics: ["Painting", "Sculpture", "Architecture"],
    floorPlans: [],
  },
  "hcm-reference-war-remnants": {
    topics: [
      "Historical context",
      "Photographs and documents",
      "Outdoor exhibits",
    ],
    floorPlans: [],
  },
  "hcm-reference-history": {
    topics: [
      "Early cultures",
      "Vietnam through the dynasties",
      "Regional cultures",
    ],
    floorPlans: [],
  },
  "hcm-reference-city-museum": {
    topics: [
      "The city and its origins",
      "Urban life and culture",
      "Architecture",
    ],
    floorPlans: [],
  },
};
export function moveStop(ids, id, step) {
  const from = ids.indexOf(id),
    to = from + step;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
export function nearestOrder(places, origin) {
  if (!hasCoordinates(origin)) return places.map((p) => p.id);
  const remaining = [...places],
    result = [];
  let previous = origin;
  while (remaining.length) {
    remaining.sort((a, b) => distanceKm(previous, a) - distanceKm(previous, b));
    previous = remaining.shift();
    result.push(previous.id);
  }
  return result;
}
export function visitTimeline(ids, durations, start = "09:00") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) return [];
  let minute = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
  return ids.map((id) => {
    const raw = Number(durations[id]);
    const duration =
      Number.isInteger(raw) && raw >= 15 && raw <= 180 ? raw : 60;
    const item = { id, start: minute, end: minute + duration, duration };
    minute += duration;
    return item;
  });
}
export function clockLabel(minute) {
  const days = Math.floor(minute / 1440),
    inDay = minute % 1440;
  return `${String(Math.floor(inDay / 60)).padStart(2, "0")}:${String(inDay % 60).padStart(2, "0")}${days ? ` (+${days})` : ""}`;
}
