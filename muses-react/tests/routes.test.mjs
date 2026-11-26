import { test } from "node:test";
import assert from "node:assert/strict";
import { routeUrl, readRoute, roadRouteUrl, readItineraryRoute } from "../src/components/Museums/routeModel.mjs";

test("driving request uses longitude/latitude and rejects invalid origins", () => {
  const origin = { latitude: 10.77, longitude: 106.69 };
  const destination = { latitude: 10.78, longitude: 106.7 };
  assert.match(routeUrl(origin, destination), /106\.69,10\.77;106\.7,10\.78/);
  for (const invalid of [
    null,
    {},
    { latitude: 91, longitude: 106 },
    { latitude: "", longitude: 106 },
  ])
    assert.throws(() => routeUrl(invalid, destination));
});
test("route geometry converts to Leaflet order and rejects failed or corrupt routes", () => {
  const route = {
    distance: 1500,
    duration: 320,
    geometry: {
      coordinates: [
        [106.69, 10.77],
        [106.7, 10.78],
      ],
    },
  };
  assert.deepEqual(readRoute({ code: "Ok", routes: [route] }), {
    distance: 1500,
    duration: 320,
    points: [
      [10.77, 106.69],
      [10.78, 106.7],
    ],
  });
  for (const bad of [
    { code: "NoRoute" },
    { code: "Ok", routes: [] },
    { code: "Ok", routes: [{ ...route, duration: -1 }] },
    {
      code: "Ok",
      routes: [
        {
          ...route,
          geometry: {
            coordinates: [
              [106, 91],
              [106, 10],
            ],
          },
        },
      ],
    },
  ])
    assert.throws(() => readRoute(bad));
});

test("an itinerary visits waypoints in order and preserves each road leg", () => {
  const coordinates = [[106.70, 10.75], [106.72, 10.76], [106.71, 10.77]];
  const stops = coordinates.map(([longitude, latitude]) => ({ longitude, latitude }));
  const url = new URL(roadRouteUrl(stops));
  assert.ok(url.pathname.endsWith("106.7,10.75;106.72,10.76;106.71,10.77"));
  assert.equal(url.searchParams.get("steps"), "true");
  assert.throws(() => roadRouteUrl(stops.slice(0, 1)));
  const legs = coordinates.slice(1).map((point, i) => ({
    distance: 1200, duration: 180,
    steps: [{ geometry: { coordinates: [coordinates[i], point] } }],
  }));
  const data = { code: "Ok", routes: [{
    distance: 2400, duration: 360, geometry: { coordinates }, legs,
  }] };
  const result = readItineraryRoute(data, 3);
  assert.deepEqual(result.legs[1].points, [[10.76, 106.72], [10.77, 106.71]]);
  assert.equal(result.distance, 2400);
  assert.throws(() => readItineraryRoute(data, 4));
});
