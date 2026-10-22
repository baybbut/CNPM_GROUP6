import { CONTENT_LANGUAGES } from "../../api/contentLanguages.mjs";
export function parseArtworkQR(value, origin = "http://localhost") {
  const text = String(value || "").trim();
  if (!text || text.length > 4096) throw new Error("INVALID_QR");
  let id, lang;
  const compact = /^muses:artwork:([1-9]\d*)$/i.exec(text);
  if (compact) id = compact[1];
  else {
    let url;
    try {
      url = new URL(text, origin);
    } catch {
      throw new Error("INVALID_QR");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("INVALID_QR");
    const path = /^\/explore\/artworks\/([1-9]\d*)\/?$/.exec(url.pathname);
    if (!path) throw new Error("INVALID_QR");
    id = path[1];
    lang = url.searchParams.get("lang");
  }
  if (!Number.isSafeInteger(Number(id)) || Number(id) > 2147483647)
    throw new Error("INVALID_QR");
  if (!CONTENT_LANGUAGES.some((l) => l.code === lang)) lang = null;
  // Never follow the scanned host: navigate to the artwork on this website only.
  return {
    id: Number(id),
    lang,
    path: `/explore/artworks/${id}${lang ? `?lang=${lang}` : ""}`,
  };
}
