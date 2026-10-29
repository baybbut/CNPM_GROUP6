import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { HCM_CENTER, hasCoordinates } from "./placeModel.mjs";

export default function PlacesMap({
  places,
  position = null,
  selectedId = null,
  onSelect,
  title,
  focus = "results",
}) {
  const { lang } = useLang();
  const host = useRef(null),
    mapRef = useRef(null),
    markers = useRef(new Map()),
    onSelectRef = useRef(onSelect);
  const [tileError, setTileError] = useState(false),
    [retry, setRetry] = useState(0);
  onSelectRef.current = onSelect;
  useEffect(() => {
    const map = L.map(host.current, { scrollWheelZoom: false }).setView(
      HCM_CENTER,
      12,
    );
    mapRef.current = map;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    ).addTo(map);
    const loadTimeout = setTimeout(() => setTileError(true), 15000);
    tiles.on("load", () => clearTimeout(loadTimeout));
    tiles.on("tileerror", () => setTileError(true));
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(host.current);
    return () => {
      clearTimeout(loadTimeout);
      resize.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    markers.current.clear();
    for (const place of places.filter(hasCoordinates)) {
      const marker = L.marker(
        [Number(place.latitude), Number(place.longitude)],
        {
          title: place.name,
          icon: L.divIcon({
            className: "venue-marker",
            html: `<span class="venue-pin ${place.kind === "gallery" ? "gallery-pin" : ""}"></span>`,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
          }),
        },
      );
      const name = document.createElement("span");
      name.textContent = place.name;
      marker
        .bindTooltip(name, { direction: "top" })
        .on("click", () => onSelectRef.current?.(place.id))
        .addTo(layer);
      markers.current.set(place.id, marker);
    }
    if (hasCoordinates(position)) {
      L.circleMarker([position.latitude, position.longitude], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#286cda",
        fillOpacity: 1,
      })
        .bindTooltip(label(lang, "Your location"))
        .addTo(layer);
    }
    return () => map.removeLayer(layer);
  }, [places, position, lang, retry]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (hasCoordinates(position))
      map.setView([position.latitude, position.longitude], 13, {
        animate: false,
      });
    else {
      const pins = places
        .filter(hasCoordinates)
        .map((p) => [Number(p.latitude), Number(p.longitude)]);
      if (pins.length)
        map.fitBounds(L.latLngBounds(pins), {
          padding: [36, 36],
          maxZoom: 15,
          animate: false,
        });
      else map.setView(HCM_CENTER, 12, { animate: false });
    }
  }, [places, position, retry, focus]);
  useEffect(() => {
    const marker = markers.current.get(selectedId);
    if (marker) {
      mapRef.current?.panTo(marker.getLatLng(), { animate: false });
      marker.openTooltip();
    }
  }, [selectedId, places, retry]);
  return (
    <section
      className="places-map-panel"
      aria-label={title || label(lang, "Museum map")}
    >
      <div className="places-map-canvas" ref={host} />
      {tileError && (
        <div className="map-tile-error" role="status">
          <span>
            {label(
              lang,
              "Map unavailable. You can still use the address or directions.",
            )}
          </span>
          <button
            onClick={() => {
              setTileError(false);
              setRetry((n) => n + 1);
            }}
          >
            {label(lang, "Try again")}
          </button>
        </div>
      )}
    </section>
  );
}
