import { CONTENT_LANGUAGES } from "../../api/contentLanguages.mjs";
export function artworkQRPath(id, language, { listen = false, point } = {}) {
  const params = new URLSearchParams({ lang: language, source: "qr" });
  if (listen) params.set("mode", "listen");
  if (point) params.set("point", point);
  return `/explore/artworks/${id}?${params}`;
}

export function parseArtworkQR(value, origin = "http://localhost") {
  const text = String(value || "").trim();
  if (!text || text.length > 4096) throw new Error("INVALID_QR");
  let id, lang, point, listen;
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
    listen = url.searchParams.get("mode") === "listen";
    const candidate = url.searchParams.get("point");
    if (candidate && /^[a-zA-Z0-9:_-]{1,80}$/.test(candidate))
      point = candidate;
  }
  if (!Number.isSafeInteger(Number(id)) || Number(id) > 2147483647)
    throw new Error("INVALID_QR");
  if (!CONTENT_LANGUAGES.some((l) => l.code === lang)) lang = null;
  // Never follow the scanned host: navigate to the artwork on this website only.
  return {
    ...(listen ? { listen } : {}),
    ...(point ? { point } : {}),
    id: Number(id),
    lang,
    path: listen ? artworkQRPath(id, lang || "en", { listen, point }) : `/explore/artworks/${id}${lang ? `?lang=${lang}` : ""}`,
  };
}
