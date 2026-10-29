import { test } from "node:test";
import assert from "node:assert/strict";
import { routeUrl, readRoute } from "../src/components/Museums/routeModel.mjs";

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
