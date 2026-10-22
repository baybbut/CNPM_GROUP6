const locales = {
  vi: "vi-VN",
  en: "en-US",
  fr: "fr-FR",
  ja: "ja-JP",
  zh: "zh-CN",
};
export const baseLanguage = (value) =>
  String(value || "")
    .replaceAll("_", "-")
    .toLowerCase()
    .split("-")[0];
export function speechLocale(language) {
  return locales[language] || String(language).replaceAll("_", "-");
}
export function matchingVoices(voices, language) {
  return voices.filter(
    (voice) => baseLanguage(voice.lang) === baseLanguage(language),
  );
}
export function chooseVoice(voices, language, voiceId) {
  const candidates = matchingVoices(voices, language);
  return (
    candidates.find((v) => v.voiceURI === voiceId) ||
    candidates.find(
      (v) =>
        v.lang.replaceAll("_", "-").toLowerCase() ===
        speechLocale(language).toLowerCase(),
    ) ||
    candidates.find((v) => v.default) ||
    candidates[0]
  );
}
