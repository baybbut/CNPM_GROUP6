const base = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
export async function catalog(path, signal, timeoutMs = 15000) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetch(base + path, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) {
    const error = Error("API_ERROR");
    error.status = response.status;
    throw error;
  }
  return response.json();
}
export function distanceKm(a, b) {
  const r = (v) => (v * Math.PI) / 180,
    dlat = r(b.latitude - a.latitude),
    dlng = r(b.longitude - a.longitude);
  const x =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function directionsUrl(museum) {
  const q = new URLSearchParams({
    api: "1",
    destination: `${Number(museum.latitude)},${Number(museum.longitude)}`,
  });
  return `https://www.google.com/maps/dir/?${q}`;
}
