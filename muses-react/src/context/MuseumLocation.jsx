import { createContext, useContext, useEffect, useRef, useState } from "react";
import { hasCoordinates } from "../components/Museums/placeModel.mjs";
import { useLang } from "./LangContext";
import { label } from "../i18n/catalog.mjs";
const LocationContext = createContext(null);
export function MuseumLocationProvider({ children }) {
  const [position, setPosition] = useState(null),
    [gpsBusy, setBusy] = useState(false),
    [gpsError, setError] = useState(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  function reset() {
    generation.current++;
    setPosition(null);
    setBusy(false);
    setError(null);
  }
  function locate() {
    const run = ++generation.current;
    setPosition(null);
    setError(null);
    if (!window.isSecureContext || !navigator.geolocation) {
      setBusy(false);
      setError(
        !window.isSecureContext
          ? "Location needs a secure connection. You can still explore the map."
          : "Location unavailable. You can still search by name.",
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (run !== generation.current) return;
        const next = {
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        };
        if (hasCoordinates(next)) setPosition(next);
        else setError("Location unavailable. You can still search by name.");
        setBusy(false);
      },
      () => {
        if (run !== generation.current) return;
        setBusy(false);
        setError("Location unavailable. You can still search by name.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
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
export function LocationControls() {
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
        <p>{t("Use my location to enable directions on the map.")}</p>
      )}
      {gpsError && <p role="status">{t(gpsError)}</p>}
    </div>
  );
}
