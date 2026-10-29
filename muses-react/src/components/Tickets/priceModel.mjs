import references from "../../data/hcmPlaces.json" with { type: "json" };
import { distanceKm } from "../../api/catalog.mjs";
import { hasCoordinates } from "../Museums/placeModel.mjs";
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
const nameKey = (s) =>
  fold(s)
    .replace(
      /thanh pho ho chi minh|tp\.? ho chi minh|tp\.?hcm|ho chi minh city/g,
      "hcm",
    )
    .replace(/[^a-z0-9]/g, "");
export const priceKeys = ["adultPrice", "concessionPrice", "childPrice"];
export function knownPrice(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}
export function pricePlaces(rows = []) {
  const real = rows.filter(
    (p) => p && !p.isDemo && p.isPublic !== false && p.isPublic !== 0 && p.id,
  );
  const used = new Set();
  const result = references.map((ref) => {
    const row = real.find(
      (m) =>
        Object.values(ref.names).some(
          (name) => nameKey(name) === nameKey(m.name),
        ) &&
        (!hasCoordinates(m) || distanceKm(m, ref) < 0.35),
    );
    if (row) used.add(row.id);
    return {
      ...ref,
      ...(row || {}),
      id: ref.id,
      museumId: row?.id,
      names: ref.names,
      ...Object.fromEntries(priceKeys.map((k) => [k, knownPrice(row?.[k])])),
    };
  });
  return [
    ...result,
    ...real
      .filter((m) => !used.has(m.id))
      .map((m) => ({
        ...m,
        id: `catalog-${m.id}`,
        museumId: m.id,
        ...Object.fromEntries(priceKeys.map((k) => [k, knownPrice(m[k])])),
      })),
  ];
}
export function filterPrices(
  items,
  {
    q = "",
    group = "adultPrice",
    sort = "name",
    lang = "vi",
    museum = "",
  } = {},
) {
  const term = fold(q.trim());
  return items
    .map((p) => ({ ...p, name: p.names?.[lang] || p.name }))
    .filter(
      (p) =>
        (!museum || p.id === museum || String(p.museumId || "") === museum) &&
        fold(
          `${p.name} ${Object.values(p.names || {}).join(" ")} ${p.address}`,
        ).includes(term),
    )
    .sort((a, b) =>
      sort === "price"
        ? (a[group] ?? Infinity) - (b[group] ?? Infinity) ||
          a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
}
export function lookupDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value
    ? value
    : "";
}
export function priceLookupLink(place, date) {
  const params = new URLSearchParams();
  if (place?.museumId || place?.id)
    params.set("museum", String(place.museumId || place.id));
  if (lookupDate(date)) params.set("date", date);
  return `/tickets${params.size ? "?" + params : ""}`;
}
