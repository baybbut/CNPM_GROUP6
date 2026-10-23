const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export function activityId() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
let fallbackVisitor = activityId(),
  fallbackSession = activityId(),
  queue = [],
  flushing = false;
function identity() {
  let visitorId = fallbackVisitor,
    sessionId = fallbackSession;
  try {
    visitorId = localStorage.getItem("muses-visitor-id") || visitorId;
    localStorage.setItem("muses-visitor-id", visitorId);
  } catch {}
  try {
    const saved = JSON.parse(
      sessionStorage.getItem("muses-activity-session") || "null",
    );
    sessionId =
      saved && Date.now() - saved.last < 1800000 ? saved.id : activityId();
    sessionStorage.setItem(
      "muses-activity-session",
      JSON.stringify({ id: sessionId, last: Date.now() }),
    );
    fallbackSession = sessionId;
  } catch {}
  return { visitorId, sessionId };
}
export async function authRequest(path, body) {
  const response = await fetch(`${base}/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.message || "Chưa kết nối được máy chủ.");
  return data;
}
async function flush() {
  if (flushing || !queue.length) return;
  flushing = true;
  try {
    while (queue.length) {
      const item = queue[0];
      const response = await fetch(`${base}/api/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
        keepalive: true,
      });
      if (response.status >= 500 || response.status === 429) break;
      queue.shift();
    }
  } catch {
  } finally {
    flushing = false;
  }
}
export function trackActivity(kind, details = {}) {
  const item = { ...identity(), eventId: activityId(), kind, ...details };
  queue.push(item);
  if (queue.length > 100) queue.shift();
  void flush();
}
export function trackAudio(language) {
  const match = /^\/explore\/artworks\/([1-9]\d*)\/?$/.exec(location.pathname);
  if (!match) return;
  const query = new URLSearchParams(location.search),
    point = query.get("point");
  trackActivity("audio_play", {
    artworkId: Number(match[1]),
    language: (language || document.documentElement.lang).split("-")[0],
    ...(point && /^[\w:-]{1,80}$/.test(point) ? { point } : {}),
  });
}
