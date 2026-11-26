import { hasCoordinates } from "./placeModel.mjs";

export function routeUrl(origin, destination) {
  return roadRouteUrl([origin, destination], false);
}

export function roadRouteUrl(waypoints, steps = true) {
  if (waypoints.length < 2 || !waypoints.every(hasCoordinates))
    throw Error("INVALID_COORDINATES");
  const pair = (p) => `${Number(p.longitude)},${Number(p.latitude)}`;
  return `https://router.project-osrm.org/route/v1/driving/${waypoints.map(pair).join(";")}?overview=full&geometries=geojson&steps=${steps}`;
}

export function readRoute(data) {
  const route = data?.routes?.[0];
  if (data?.code !== "Ok") throw Error("NO_ROUTE");
  return roadGeometry(route, route?.geometry?.coordinates);
}

function roadGeometry(route, coordinates) {
  if (
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

export async function fetchRoadRoute(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw Error("ROUTE");
  return response.json();
}

export function readItineraryRoute(data, waypointCount) {
  const route = readRoute(data);
  const legs = data.routes[0].legs;
  if (!Array.isArray(legs) || legs.length !== waypointCount - 1) throw Error("NO_ROUTE");
  const segments = legs.map(({ distance, duration, steps }) => {
    const coordinates = steps.flatMap(step => step.geometry.coordinates);
    return roadGeometry({ distance, duration }, coordinates);
  });
  return { ...route, legs: segments, bounds: route.points };
}

export function routeSummary({ distance, duration }, lang) {
  const format = (value, unit, digits = 0) =>
    new Intl.NumberFormat(lang, { style: "unit", unit, maximumFractionDigits: digits }).format(value);
  const length = distance < 1000 ? format(distance, "meter") : format(distance / 1000, "kilometer", 1);
  return `${format(Math.max(1, Math.round(duration / 60)), "minute")} · ${length}`;
}
