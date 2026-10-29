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
