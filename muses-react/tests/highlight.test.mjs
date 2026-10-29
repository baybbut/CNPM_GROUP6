import { test } from "node:test";
import assert from "node:assert/strict";
import {
  highlightArtworks,
  nextHighlight,
} from "../src/components/Highlight/highlightModel.mjs";
test("highlights use only published API items, honour configured slots and avoid duplicate artworks or invented event dates", () => {
  const works = [
    { id: 1, title: "Work A" },
    { id: 2, title: "Work B" },
    { id: 3, title: "Work C" },
  ];
  const items = highlightArtworks(works, [
    { artworkId: 2, title: "Wrong old event", date: "Fake date" },
    { artworkId: 2 },
    { artworkId: 999 },
  ]);
  assert.deepEqual(
    items.map((i) => i.id),
    [2, 3, 1],
  );
  assert.equal(items[0].title, "Work B");
  assert.equal(items[0].date, undefined);
  assert.deepEqual(highlightArtworks([], [{ artworkId: 999 }]), []);
  assert.equal(highlightArtworks(works, [], 2).length, 2);
});
test("highlight selection wraps both ways, including one-card and empty states", () => {
  assert.equal(nextHighlight(4, 1, 5), 0);
  assert.equal(nextHighlight(0, -1, 5), 4);
  assert.equal(nextHighlight(0, 1, 1), 0);
  assert.equal(nextHighlight(0, -1, 0), 0);
});

test("an explicitly configured image is used only for its matching published artwork", () => {
  const works = [
    { id: 1, title: "A", imageUrl: "primary-a.jpg" },
    { id: 2, title: "B", imageUrl: "primary-b.jpg" },
  ];
  assert.equal(
    highlightArtworks(works, [
      { artworkId: 2, configuredImg: "configured-b.jpg" },
    ])[0].imageUrl,
    "configured-b.jpg",
  );
  assert.equal(
    highlightArtworks(works, [
      { artworkId: 999, configuredImg: "hidden-image.jpg" },
    ])[0].imageUrl,
    "primary-a.jpg",
  );
});
