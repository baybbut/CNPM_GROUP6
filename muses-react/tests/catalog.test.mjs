import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceKm, directionsUrl } from "../src/api/catalog.mjs";
import { CONTENT_LANGUAGES } from "../src/api/contentLanguages.mjs";
import { label, catalogMessages } from "../src/i18n/catalog.mjs";
import {
  chooseVoice,
  speechLocale,
} from "../src/components/Narration/speechLanguage.mjs";
test("five target languages have complete core UI translations and matching speech locales", () => {
  assert.deepEqual(
    new Set(CONTENT_LANGUAGES.map((l) => l.code)),
    new Set(["vi", "en", "zh", "ja", "ko"]),
  );
  for (const lang of ["vi", "zh", "ja", "ko"])
    for (const key of Object.keys(catalogMessages))
      assert.notEqual(label(lang, key), key, `${lang}: ${key}`);
  assert.equal(speechLocale("ko"), "ko-KR");
  assert.equal(
    chooseVoice([{ lang: "en-US", voiceURI: "en" }], "ko"),
    undefined,
  );
  assert.equal(
    chooseVoice([{ lang: "ko-KR", voiceURI: "ko" }], "ko").voiceURI,
    "ko",
  );
});
test("map destination is saved museum coordinates, proximity remains a local calculation", () => {
  const museum = { latitude: 10.8, longitude: 106.6 };
  assert.equal(distanceKm(museum, museum), 0);
  assert.ok(distanceKm(museum, { latitude: 21, longitude: 105 }) > 1000);
  const u = new URL(directionsUrl(museum));
  assert.equal(u.searchParams.get("destination"), "10.8,106.6");
  assert.equal(u.searchParams.has("origin"), false);
});
