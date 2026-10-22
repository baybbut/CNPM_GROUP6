import { test } from "node:test";
import assert from "node:assert/strict";
import {
  speechLocale,
  matchingVoices,
  chooseVoice,
} from "../src/components/Narration/speechLanguage.mjs";
const voices = [
  { lang: "en-US", voiceURI: "en", default: true },
  { lang: "vi-VN", voiceURI: "vi" },
  { lang: "fr-FR", voiceURI: "fr" },
  { lang: "ja-JP", voiceURI: "ja" },
  { lang: "zh-TW", voiceURI: "tw", default: true },
  { lang: "zh_CN", voiceURI: "cn" },
];
test("select matching speech language for all five content languages", () => {
  for (const [code, locale, id] of [
    ["vi", "vi-VN", "vi"],
    ["en", "en-US", "en"],
    ["fr", "fr-FR", "fr"],
    ["ja", "ja-JP", "ja"],
    ["zh", "zh-CN", "cn"],
  ]) {
    assert.equal(speechLocale(code), locale);
    assert.equal(chooseVoice(voices, code).voiceURI, id);
  }
});
test("never fall back to an unrelated voice or stale selection", () => {
  assert.equal(chooseVoice(voices, "fr", "en").voiceURI, "fr");
  assert.equal(
    chooseVoice([{ lang: "en-US", voiceURI: "en", default: true }], "ja"),
    undefined,
  );
  assert.equal(matchingVoices(voices, "de").length, 0);
});
