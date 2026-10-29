import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { directionsUrl } from "../../api/catalog.mjs";
import { routeUrl, readRoute } from "./routeModel.mjs";

export function useDirections(position) {
  const [state, setState] = useState(null);
  const current = useRef(null);
  useEffect(() => () => current.current?.abort(), []);
  function clear() {
    current.current?.abort();
    setState(null);
  }
  async function start(place) {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setState({ place, loading: true });
    try {
      let origin = position;
      if (!origin) {
        if (!window.isSecureContext || !navigator.geolocation)
          throw Error("LOCATION");
        origin = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            (p) =>
              resolve({
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
              }),
            reject,
            { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
          ),
        );
      }
      if (controller.signal.aborted) return;
      const response = await fetch(routeUrl(origin, place), {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(15000),
        ]),
      });
      if (!response.ok) throw Error("ROUTE");
      const route = readRoute(await response.json());
      if (!controller.signal.aborted)
        setState({ place, origin, route, loading: false });
    } catch {
      if (!controller.signal.aborted)
        setState({ place, loading: false, error: true });
    }
  }
  return { state, start, clear };
}

export default function Directions({ state, onClose, onRetry }) {
  const { lang } = useLang();
  const t = (key) => label(lang, key);
  const panel = useRef(null);
  useEffect(() => {
    if (!state?.place) return;
    panel.current?.focus({ preventScroll: true });
    panel.current
      ?.closest(".discovery-map, .museum-map")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state?.place]);
  if (!state) return null;
  return (
    <section
      className="map-directions"
      ref={panel}
      tabIndex={-1}
      aria-label={t("Directions")}
    >
      <div className="map-directions-heading">
        <h3>
          {t("Directions")} · {state.place.name}
        </h3>
        <button onClick={onClose} aria-label={t("Close directions")}>
          ×
        </button>
      </div>
      <div role="status">
        {state.loading && (
          <p>{t("Finding a driving route from your location…")}</p>
        )}
        {state.error && (
          <p>
            {t(
              "Unable to find a route. Allow location access or choose your starting point in Google Maps.",
            )}
          </p>
        )}
        {state.route && (
          <p>
            {t("Driving route")} · {(state.route.distance / 1000).toFixed(1)} km
            · {Math.max(1, Math.round(state.route.duration / 60))} {t("min")}
          </p>
        )}
      </div>
      <p>{state.place.address}</p>
      {state.place.pinAccuracy === "approximate" && (
        <p>{t("Approximate pin — use directions for the entrance.")}</p>
      )}
      <div className="place-actions">
        {state.error && <button onClick={onRetry}>{t("Try again")}</button>}
        <a
          href={directionsUrl(state.place)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Navigate in Google Maps")}
        </a>
      </div>
      {state.route && <small>© OpenStreetMap contributors · OSRM</small>}
    </section>
  );
}
