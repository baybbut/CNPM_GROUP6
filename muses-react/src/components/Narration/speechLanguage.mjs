const locales = {
  vi: "vi-VN",
  en: "en-US",
  fr: "fr-FR",
  ko: "ko-KR",
  ja: "ja-JP",
  zh: "zh-CN",
};
// Names exposed by Web Speech differ between Edge, Chrome and Apple devices.
const preferredVoices = {
  vi: { natural: "hoaimy", apple: "linh" },
  en: { natural: "jenny", apple: "samantha" },
  zh: { natural: "xiaoxiao", apple: "tingting" },
  ja: { natural: "nanami", apple: "kyoko" },
  ko: { natural: "sunhi", apple: "yuna" },
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
function qualityRank(voice, profile) {
  const name = `${voice.name || ""} ${voice.voiceURI || ""}`
    .normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const compactName = name.replace(/[^a-z]/g, "");
  const preferred = profile && compactName.includes(profile.natural);
  if (/espeak|eloquence|novelty/.test(name)) return 0;
  if (preferred && /natural|neural/.test(name)) return 8;
  if (/premium|enhanced|natural|neural/.test(name)) {
    return profile && compactName.includes(profile.apple) ? 7 : 6;
  }
  if (preferred) return 5;
  if (/compact/.test(name)) return 1;
  if (/google/.test(name)) return 4;
  if (profile && compactName.includes(profile.apple)) return 3;
  return 2;
}

export function chooseVoice(voices, language, voiceId) {
  const candidates = matchingVoices(voices, language);
  const manual = voiceId && candidates.find((v) => v.voiceURI === voiceId);
  if (manual) return manual;
  const locale = speechLocale(language).toLowerCase();
  const profile = preferredVoices[baseLanguage(language)];
  const rank = (voice) => {
    const tag = voice.lang.toLowerCase().replaceAll("_", "-");
    const exact = tag === locale || tag.replace(/-(hans|hant)(?=-)/, "") === locale;
    return Number(exact) * 100 + qualityRank(voice, profile) * 2 + Number(Boolean(voice.default));
  };
  let best;
  let bestRank = -1;
  for (const voice of candidates) {
    const score = rank(voice);
    if (score > bestRank) {
      best = voice;
      bestRank = score;
    }
  }
  return best;
}
