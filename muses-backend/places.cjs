const referencePlaces = require("../muses-react/src/data/hcmPlaces.json");
// Public OSM venue discovery. Visitor coordinates never enter this endpoint.
const QUERY =
  '[out:json][timeout:12];area["ISO3166-2"="VN-SG"]["boundary"="administrative"]->.city;(nwr["tourism"~"^(museum|gallery)$"](area.city);nwr["amenity"="arts_centre"](area.city););out center tags;';
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const TTL = 6 * 60 * 60 * 1000;
function safeWebsite(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function normalizePlaces(data) {
  if (!Array.isArray(data?.elements) || data.remark)
    throw Error("Incomplete map response");
  const places = [];
  for (const item of data.elements) {
    const tags = item.tags || {},
      point = item.center || item;
    const latitude = Number(point.lat),
      longitude = Number(point.lon);
    const name = tags.name || tags["name:vi"] || tags["name:en"];
    if (
      !name ||
      !["node", "way", "relation"].includes(item.type) ||
      !Number.isSafeInteger(item.id) ||
      typeof point.lat !== "number" ||
      typeof point.lon !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180 ||
      ["private", "no"].includes(tags.access) ||
      ["disused", "abandoned", "demolished"].some((k) => tags[k] === "yes")
    )
      continue;
    const kind =
      tags.tourism === "museum"
        ? "museum"
        : tags.tourism === "gallery" || tags.amenity === "arts_centre"
          ? "gallery"
          : null;
    if (!kind) continue;
    const address =
      tags["addr:full"] ||
      [
        [tags["addr:housenumber"], tags["addr:street"]]
          .filter(Boolean)
          .join(" "),
        tags["addr:suburb"],
        tags["addr:district"],
        tags["addr:city"] || "TP. Hồ Chí Minh",
      ]
        .filter(Boolean)
        .join(", ");
    if (
      places.some(
        (p) =>
          p.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi") &&
          Math.abs(p.latitude - latitude) < 0.001 &&
          Math.abs(p.longitude - longitude) < 0.001,
      )
    )
      continue;
    places.push({
      id: `osm-${item.type}-${item.id}`,
      name,
      names: Object.fromEntries(
        ["vi", "en", "zh", "ja", "ko"].map((l) => [
          l,
          tags[`name:${l}`] || name,
        ]),
      ),
      kind,
      latitude,
      longitude,
      address,
      website: safeWebsite(tags.website || tags["contact:website"]),
      openingHours: tags.opening_hours || null,
      sourceUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
    });
  }
  return places.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}
function createPlaceService({ fetchImpl = fetch, now = Date.now } = {}) {
  let cache = null,
    pending = null,
    retryAt = 0;
  async function refresh() {
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
              "Muses-Museum-Project/1.0 (OpenStreetMap venue directory)",
          },
          body: new URLSearchParams({ data: QUERY }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw Error("Map provider unavailable");
        const items = normalizePlaces(await response.json());
        if (!items.length) throw Error("Map provider returned no venues");
        cache = { items, fetchedAt: new Date(now()).toISOString() };
        retryAt = 0;
        return { ...cache, stale: false, sourceType: "osm" };
      } catch {
        /* Try the second public provider; never replace a good cache with a partial response. */
      }
    }
    retryAt = now() + 60000;
    if (cache) return { ...cache, stale: true, sourceType: "osm" };
    return {
      items: referencePlaces,
      fetchedAt: null,
      stale: true,
      sourceType: "reference",
    };
  }
  return async () => {
    if (cache && now() - Date.parse(cache.fetchedAt) < TTL)
      return { ...cache, stale: false, sourceType: "osm" };
    if (now() < retryAt) {
      if (cache) return { ...cache, stale: true, sourceType: "osm" };
      return {
        items: referencePlaces,
        fetchedAt: null,
        stale: true,
        sourceType: "reference",
      };
    }
    if (!pending)
      pending = refresh().finally(() => {
        pending = null;
      });
    return pending;
  };
}
function attachPlaceRoutes(app, options) {
  const getPlaces = createPlaceService(options);
  app.get("/api/places/hcm", async (_req, res) => {
    try {
      const data = await getPlaces();
      res.set("Cache-Control", data.sourceType === "reference" ? "no-store" : "public, max-age=300").json({
        ...data,
        attribution:
          data.sourceType === "reference"
            ? null
            : "© OpenStreetMap contributors",
        source:
          data.sourceType === "reference"
            ? null
            : "https://www.openstreetmap.org/copyright",
      });
    } catch {
      res.status(503).json({
        code: "PLACES_UNAVAILABLE",
        message: "Chưa tải được địa điểm. Vui lòng thử lại sau.",
      });
    }
  });
}
module.exports = { normalizePlaces, createPlaceService, attachPlaceRoutes };
