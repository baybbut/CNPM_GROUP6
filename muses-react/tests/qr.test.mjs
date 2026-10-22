import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArtworkQR } from "../src/components/Scanner/parseArtworkQR.mjs";
import { CONTENT_LANGUAGES } from "../src/api/contentLanguages.mjs";
test("artwork QR IDs and five content languages", () => {
  assert.equal(CONTENT_LANGUAGES.length, 5);
  for (const { code } of CONTENT_LANGUAGES)
    assert.deepEqual(
      parseArtworkQR(`https://example.org/explore/artworks/12?lang=${code}`),
      { id: 12, lang: code, path: `/explore/artworks/12?lang=${code}` },
    );
  assert.equal(parseArtworkQR("muses:artwork:1").id, 1);
});
test("reject invalid QR and never follow external hosts", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://evil.example",
    "/explore/artworks/0",
    "muses:artwork:2147483648",
    "https://user:pass@example.org/explore/artworks/1",
    "x".repeat(4097),
  ])
    assert.throws(() => parseArtworkQR(value));
  assert.equal(
    parseArtworkQR("https://other.example/explore/artworks/1").path,
    "/explore/artworks/1",
  );
});
