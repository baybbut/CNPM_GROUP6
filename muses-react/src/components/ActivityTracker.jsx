import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackActivity } from "../api/activity.mjs";
export default function ActivityTracker() {
  const { pathname, search } = useLocation(),
    last = useRef("");
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
