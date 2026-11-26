import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { directionsUrl } from "../../api/catalog.mjs";
import { hasCoordinates } from "./placeModel.mjs";
import { routeUrl, readRoute, routeSummary } from "./routeModel.mjs";

export function useDirections(position) {
  const [request, setRequest] = useState(null);
  const [result, setResult] = useState(null);
  const latestPosition = useRef(position);
  latestPosition.current = position;
  const located = hasCoordinates(position);

  useEffect(() => {
    if (!request || !located) {
      setResult(null);
      return;
    }
    const origin = latestPosition.current;
    const { place } = request;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let active = true;
    async function load() {
      try {
        const response = await fetch(routeUrl(origin, place), { signal: controller.signal });
        if (!response.ok) throw Error("ROUTE");
        const route = readRoute(await response.json());
        route.bounds = [[origin.latitude, origin.longitude], ...route.points, [place.latitude, place.longitude]];
        if (active) setResult({ request, place, route });
      } catch {
        if (active) setResult({ request, place, error: true });
      } finally {
        clearTimeout(timer);
      }
    }
    load();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, located]);

  const state = request && located
    ? (result?.request === request ? result : { place: request.place, loading: true })
    : null;
  return {
    state,
    start: (place) => setRequest({ place }),
    clear: () => setRequest(null),
  };
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
          {t("Directions")} · {state.place.names?.[lang] || state.place.name}
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
            {t("Driving route")} · {routeSummary(state.route, lang)}
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
