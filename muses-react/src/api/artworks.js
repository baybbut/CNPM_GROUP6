const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function mediaUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, `${base || window.location.origin}/`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export async function fetchArtworks(lang, id, signal) {
  const language = lang === "vi" ? "vi" : "en";
  const response = await fetch(
    `${base}/api/artworks${id ? `/${encodeURIComponent(id)}` : ""}?lang=${language}`,
    { signal },
  );
  if (!response.ok) {
    const error = new Error(
      response.status === 404 ? "NOT_FOUND" : "API_ERROR",
    );
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  if (
    id
      ? !data || typeof data !== "object" || Array.isArray(data) || !data.id
      : !Array.isArray(data)
  )
    throw new Error("INVALID_RESPONSE");
  return data;
}
