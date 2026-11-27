import { distanceKm } from "../../api/catalog.mjs";
export const MUSEUM_RADIUS_KM = 2;
export const EXTENDED_MUSEUM_RADIUS_KM = 10;
// Announce the approach up to 200 m before crossing the museum radius.
export const APPROACH_MARGIN_KM = 0.2;

export function countPlacesInRadius(places, position, radiusKm) {
  if (!hasCoordinates(position) || !(radiusKm > 0)) return null;
  return places.filter(place =>
    hasCoordinates(place) && distanceKm(position, place) <= radiusKm
  ).length;
}

export function closestMuseumInRange(places, position, radiusKm) {
  if (!hasCoordinates(position) || radiusKm <= 0) return null;
  let nearest = null;
  for (const place of places) {
    if (place.kind !== "museum" || !hasCoordinates(place)) continue;
    const distance = distanceKm(position, place);
    if (distance > EXTENDED_MUSEUM_RADIUS_KM) continue;
    if (!nearest || distance < nearest.distance ||
        (distance === nearest.distance && String(place.id) < String(nearest.place.id))) {
      let zone = "extended";
      if (distance <= radiusKm) zone = "nearby";
      else if (distance <= radiusKm + APPROACH_MARGIN_KM) zone = "approaching";
      nearest = { place, distance, zone };
    }
  }
  return nearest;
}

export const HCM_CENTER = [10.7769, 106.7009];
export function hasCoordinates(place) {
  return (
    place?.latitude != null &&
    place?.longitude != null &&
    place.latitude !== "" &&
    place.longitude !== "" &&
    Number.isFinite(Number(place.latitude)) &&
    Number.isFinite(Number(place.longitude)) &&
    Math.abs(Number(place.latitude)) <= 90 &&
    Math.abs(Number(place.longitude)) <= 180
  );
}
export function searchPlaces(
  items,
  { q = "", kind = "all", position = null, lang = "vi" } = {},
) {
  const fold = (text) =>
    String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  const term = fold(q.trim());
  return items
    .filter(hasCoordinates)
    .map((p) => ({
      ...p,
      name: p.names?.[lang] || p.name,
      distance: position ? distanceKm(position, p) : null,
    }))
    .filter(
      (p) =>
        (kind === "all" || p.kind === kind) &&
        fold(
          `${p.name} ${Object.values(p.names || {}).join(" ")} ${p.address}`,
        ).includes(term),
    )
    .sort((a, b) =>
      position
        ? a.distance - b.distance || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
}
// Only a close name AND pin match may link an OSM venue to the curated catalogue.
export function matchesMuseum(place, museum) {
  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  return hasCoordinates(museum) && distanceKm(museum, place) < 0.25 &&
    Object.values(place.names || { name: place.name }).some(name => norm(name) === norm(museum.name));
}
export function connectCatalogue(items, museums) {
  return items.map((place) => {
    const museum = museums.find(m => !m.isDemo && matchesMuseum(place, m));
    return museum ? { ...place, museumId: museum.id } : place;
  });
}
