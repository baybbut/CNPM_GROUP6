import { contentLanguage } from "./contentLanguages.mjs";
import { activityApiBase, createActivityDelivery } from "./activityDelivery.mjs";
const base = activityApiBase(
  import.meta.env?.VITE_API_BASE_URL,
  globalThis.location?.origin,
);
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
  lastActivity = Date.now();
const validId = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const delivery = createActivityDelivery({ endpoint: `${base}/api/activity` });
function identity() {
  const now = Date.now();
  let storedVisitor = false;
  let visitorId = fallbackVisitor,
    sessionId = now - lastActivity < 1800000 ? fallbackSession : activityId();
  try {
    const savedVisitor = localStorage.getItem("muses-visitor-id");
    if (validId(savedVisitor)) {
      visitorId = savedVisitor;
      storedVisitor = true;
    }
    fallbackVisitor = visitorId;
    localStorage.setItem("muses-visitor-id", visitorId);
  } catch {}
  try {
    const saved = JSON.parse(
      sessionStorage.getItem("muses-activity-session") || "null",
    );
    if (saved?.visitorId && saved.visitorId !== visitorId) sessionId = activityId();
    if (
      validId(saved?.id) &&
      Number.isFinite(saved.last) &&
      saved.last <= now &&
      now - saved.last < 1800000 &&
      (saved.visitorId ? saved.visitorId === visitorId : storedVisitor)
    ) {
      sessionId = saved.id;
    }
    fallbackSession = sessionId;
    lastActivity = now;
    sessionStorage.setItem(
      "muses-activity-session",
      JSON.stringify({ id: sessionId, visitorId, last: now }),
    );
  } catch {}
  fallbackSession = sessionId;
  lastActivity = now;
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
export function trackActivity(kind, details = {}) {
  const item = { ...identity(), eventId: activityId(), kind, ...details };
  return delivery.enqueue(item);
}
export function retryActivityDelivery() {
  return delivery.retry();
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

export function trackQRLanding(artworkId, point, language) {
  const key = `${artworkId}:${point || ""}`;
  try {
    const previous = JSON.parse(
      sessionStorage.getItem("muses-last-qr") || "null",
    );
    if (previous?.key === key && Date.now() - previous.time < 10000) return;
    sessionStorage.setItem(
      "muses-last-qr",
      JSON.stringify({ key, time: Date.now() }),
    );
  } catch {}
  trackActivity("qr_scan", {
    artworkId,
    language: contentLanguage(language),
    ...(point && /^[\w:-]{1,80}$/.test(point) ? { point } : {}),
  });
}
