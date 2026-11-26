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

test("prefer the five narration voices even when a basic default is listed first", () => {
  for (const [language, name] of Object.entries({
    vi: "Hoài My", en: "Jenny", zh: "Xiaoxiao", ja: "Nanami", ko: "SunHi",
  })) {
    const lang = speechLocale(language);
    const basic = { lang, name: "System", voiceURI: "basic", default: true };
    const other = { lang, name: "Other (Natural)", voiceURI: "other" };
    const preferred = { lang, name: `Microsoft ${name} Online (Natural)`, voiceURI: "preferred" };
    assert.equal(chooseVoice([basic, other, preferred], lang), preferred);
    assert.equal(chooseVoice([preferred, basic, other], language, "basic"), basic);
  }
});

test("select an enhanced native voice when the preferred neural voice is unavailable", () => {
  const compact = { lang: "vi-VN", name: "Linh", voiceURI: "com.apple.voice.compact.vi-VN.Linh" };
  const enhanced = { ...compact, voiceURI: "com.apple.voice.enhanced.vi-VN.Linh" };
  assert.equal(chooseVoice([compact, enhanced], "vi"), enhanced);
  assert.equal(chooseVoice([compact], "vi"), compact);
  const china = { lang: "zh-Hans-CN", name: "普通话", voiceURI: "mandarin" };
  const taiwan = { lang: "zh-TW", name: "Natural", voiceURI: "tw" };
  assert.equal(chooseVoice([taiwan, china], "zh"), china);
});
