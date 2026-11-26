import { hasCoordinates } from "./placeModel.mjs";

export function routeUrl(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination))
    throw Error("INVALID_COORDINATES");
  const pair = (p) => `${Number(p.longitude)},${Number(p.latitude)}`;
  return `https://router.project-osrm.org/route/v1/driving/${pair(origin)};${pair(destination)}?overview=full&geometries=geojson&steps=false`;
}

export function readRoute(data) {
  const route = data?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (
    data?.code !== "Ok" ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(route.distance) ||
    route.distance < 0 ||
    !Number.isFinite(route.duration) ||
    route.duration < 0 ||
    coordinates.some(
      (p) =>
        !Array.isArray(p) ||
        !hasCoordinates({ longitude: p[0], latitude: p[1] }),
    )
  ) {
    throw Error("NO_ROUTE");
  }
  return {
    points: coordinates.map(([lng, lat]) => [Number(lat), Number(lng)]),
    distance: route.distance,
    duration: route.duration,
  };
}

export function routeSummary({ distance, duration }, lang) {
  const format = (value, unit, digits = 0) =>
    new Intl.NumberFormat(lang, { style: "unit", unit, maximumFractionDigits: digits }).format(value);
  const length = distance < 1000 ? format(distance, "meter") : format(distance / 1000, "kilometer", 1);
  return `${format(Math.max(1, Math.round(duration / 60)), "minute")} · ${length}`;
}
