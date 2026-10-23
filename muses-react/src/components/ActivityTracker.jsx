import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackActivity } from "../api/activity.mjs";
export default function ActivityTracker() {
  const { pathname, search } = useLocation(),
    last = useRef(""),
    lastQR = useRef("");
  useEffect(() => {
    const key = pathname + search;
    if (last.current === key) return;
    last.current = key;
    const query = new URLSearchParams(search),
      match = /^\/explore\/artworks\/([1-9]\d*)\/?$/.exec(pathname),
      point = query.get("point");
    const details = {
      ...(match ? { artworkId: Number(match[1]) } : {}),
      ...(match && point && /^[\w:-]{1,80}$/.test(point) ? { point } : {}),
      language: (
        query.get("lang") ||
        document.documentElement.lang ||
        "vi"
      ).split("-")[0],
    };
    trackActivity("page_view", details);
    const qrKey = `${pathname}:${point || ""}`;
    if (!match || query.get("source") !== "qr") lastQR.current = "";
    if (match && query.get("source") === "qr" && lastQR.current !== qrKey) {
      lastQR.current = qrKey;
      // Reloading a QR landing page immediately must not inflate scan counts.
      let recent = false;
      try {
        const previous = JSON.parse(
          sessionStorage.getItem("muses-last-qr") || "null",
        );
        recent = previous?.key === qrKey && Date.now() - previous.time < 10000;
        sessionStorage.setItem(
          "muses-last-qr",
          JSON.stringify({ key: qrKey, time: Date.now() }),
        );
      } catch {}
      if (!recent) trackActivity("qr_scan", details);
    }
  }, [pathname, search]);
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") trackActivity("heartbeat");
    };
    const timer = setInterval(beat, 60000);
    window.addEventListener("muses-auth-change", beat);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      window.removeEventListener("muses-auth-change", beat);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);
  return null;
}
