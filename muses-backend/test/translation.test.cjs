const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createTranslator } = require("../translation.cjs");
const item = {
  id: 1,
  description: "Xin chào",
  shortDescription: "Xin chào",
  descriptionLanguage: "vi",
};
test("saved translation bypasses service; automatic translation deduplicates and caches", async () => {
  let calls = 0;
  const service = createTranslator({
    enabled: true,
    fetcher: async (url, options) => {
      calls++;
      const body = JSON.parse(options.body);
      assert.equal(body.source, "vi");
      assert.equal(body.target, "fr");
      return { ok: true, json: async () => ({ translatedText: "Bonjour" }) };
    },
  });
  assert.equal(
    (await service.artwork(item, "vi")).translationSource,
    "database",
  );
  assert.equal(calls, 0);
  const translated = await service.artwork(item, "fr");
  assert.equal(translated.description, "Bonjour");
  assert.equal(translated.shortDescription, "Bonjour");
  assert.equal(translated.descriptionLanguage, "fr");
  assert.equal(translated.translationSource, "automatic");
  assert.equal(calls, 1);
  await service.artwork(item, "fr");
  assert.equal(calls, 1);
});
test("provider failure retains original language and text", async () => {
  const service = createTranslator({
    enabled: true,
    fetcher: async () => {
      throw Error("offline");
    },
  });
  const result = await service.artwork(item, "ja");
  assert.equal(result.description, "Xin chào");
  assert.equal(result.descriptionLanguage, "vi");
  assert.equal(result.translationStatus, "unavailable");
});
test("readiness requires all five languages", async () => {
  const service = createTranslator({
    enabled: true,
    fetcher: async () => ({ ok: true, json: async () => [{ code: "en" }] }),
  });
  assert.equal((await service.health()).ready, false);
});
