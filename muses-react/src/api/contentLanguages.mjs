export const CONTENT_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];
export function contentLanguage(code) {
  return CONTENT_LANGUAGES.some((l) => l.code === code) ? code : "en";
}
