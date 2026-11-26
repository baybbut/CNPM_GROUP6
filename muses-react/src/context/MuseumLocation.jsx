import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { hasCoordinates } from "../components/Museums/placeModel.mjs";
import { useLang } from "./LangContext";
import { label } from "../i18n/catalog.mjs";
const LocationContext = createContext(null);
function locationError(error) {
  if (error?.code === 1 || error?.name === "SecurityError")
    return "Location access is blocked. Allow location in your browser and device settings, then try again.";
  if (error?.code === 3) return "Location request timed out. Try again.";
  return "Location unavailable.";
}

export function MuseumLocationProvider({ children }) {
  const [position, setPosition] = useState(null),
    [gpsBusy, setBusy] = useState(false),
    [gpsError, setError] = useState(null);
  const generation = useRef(0);
  const [positionRequest, setPositionRequest] = useState(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const { pathname } = useLocation();
  const tracking = Boolean(position) && /^\/museums(?:\/itinerary)?\/?$/.test(pathname);
  useEffect(() => {
    if (!tracking || gpsBusy || !navigator.geolocation?.watchPosition) return;
    const run = generation.current;
    let live = true;
    const watch = navigator.geolocation.watchPosition(({ coords }) => {
      if (!live || run !== generation.current || !hasCoordinates(coords)) return;
      setPosition((previous) => {
        if (previous?.latitude === coords.latitude && previous.longitude === coords.longitude)
          return previous;
        return { latitude: coords.latitude, longitude: coords.longitude };
      });
      setError(null);
    }, (error) => {
      if (!live || run !== generation.current) return;
      if (error.code === 1) setPosition(null);
      setError(locationError(error));
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => {
      live = false;
      navigator.geolocation.clearWatch(watch);
    };
  }, [tracking, gpsBusy, positionRequest]);
  function reset() {
    generation.current++;
    setPosition(null);
    setBusy(false);
    setError(null);
  }
  function locate() {
    const run = ++generation.current;
    setPositionRequest(run);
    setError(null);
    if (!window.isSecureContext || !navigator.geolocation?.getCurrentPosition) {
      setBusy(false);
      setError(
        !window.isSecureContext
          ? "Location needs a secure connection. You can still explore the map."
          : "Location unavailable.",
      );
      return;
    }
    setBusy(true);
    function request(fresh) {
      function failed(error) {
        if (run !== generation.current) return;
        if (!fresh && (error?.code === 2 || error?.code === 3)) {
          request(true);
          return;
        }
        if (error?.code === 1 || error?.name === "SecurityError") setPosition(null);
        setError(locationError(error));
        setBusy(false);
      }
      try {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          if (run !== generation.current) return;
          if (!hasCoordinates(coords)) {
            failed({ code: 2 });
            return;
          }
          setPosition({ latitude: coords.latitude, longitude: coords.longitude });
          setError(null);
          setBusy(false);
        }, failed, {
          enableHighAccuracy: fresh,
          maximumAge: fresh ? 0 : 60000,
          timeout: fresh ? 20000 : 10000,
        });
      } catch (error) {
        failed(error);
      }
    }
    request(false);
  }
  return (
    <LocationContext.Provider
      value={{ position, gpsBusy, gpsError, locate, reset }}
    >
      {children}
    </LocationContext.Provider>
  );
}
export const useMuseumLocation = () => useContext(LocationContext);
export function LocationControls({ hint = "Use my location to enable directions on the map." }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const { position, gpsBusy, gpsError, locate, reset } = useMuseumLocation();
  return (
    <div className="museum-location-controls">
      <button className="use-my-location" disabled={gpsBusy} onClick={locate}>
        {gpsBusy ? t("Locating…") : t("Use my location")}
      </button>
      {position ? (
        <button className="reset-my-location" onClick={reset}>
          {t("Reset to Ho Chi Minh City")}
        </button>
      ) : (
        <p>{t(hint)}</p>
      )}
      {gpsError && <p role="status">{t(gpsError)} {position && t("Showing your last known location.")}</p>}
    </div>
  );
}
