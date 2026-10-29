import { distanceKm } from "../../api/catalog.mjs";
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
export function connectCatalogue(items, museums) {
  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  return items.map((place) => {
    const museum = museums.find(
      (m) =>
        !m.isDemo &&
        hasCoordinates(m) &&
        distanceKm(m, place) < 0.25 &&
        Object.values(place.names || { name: place.name }).some(
          (name) => norm(name) === norm(m.name),
        ),
    );
    return museum ? { ...place, museumId: museum.id } : place;
  });
}
