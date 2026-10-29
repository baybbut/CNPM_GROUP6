import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { catalog, directionsUrl } from "../../api/catalog.mjs";
import { ArtworkImage } from "../explore/Artworks";
import PlacesMap from "./PlacesMap";
import {
  hasCoordinates,
  searchPlaces,
  connectCatalogue,
} from "./placeModel.mjs";
import "./museums.css";

export function MuseumMap({ museum }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const place = useMemo(
    () => ({
      ...museum,
      id: `museum-${museum.museumId || museum.id}`,
      kind: "museum",
    }),
    [museum],
  );
  const places = useMemo(() => [place], [place]);
  if (!hasCoordinates(place))
    return <p>{t("The museum location has not been confirmed yet.")}</p>;
  const lat = Number(place.latitude),
    lng = Number(place.longitude);
  return (
    <section className="museum-map" aria-label={t("Museum map")}>
      <PlacesMap places={places} title={`${t("Museum map")}: ${place.name}`} />
      <div className="museum-map-links">
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Open map")}
        </a>
        <a
          href={directionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Directions")}
        </a>
      </div>
    </section>
  );
}
export function CurrentExhibition({ artwork }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key),
    e = artwork.currentExhibition;
  return (
    <section className="current-exhibition">
      <h2>{t("Where to see this artwork")}</h2>
      {e ? (
        <>
          <h3>
            <Link to={`/museums/${e.museumId}`}>{e.name}</Link>
          </h3>
          <p>{e.address}</p>
          <p>
            {t("From")}: {e.startDate}
            {e.endDate && ` · ${t("Until (exclusive)")}: ${e.endDate}`}
          </p>
          {(e.source || e.verifiedOn) && (
            <p>
              {e.source && `${t("Source")}: ${e.source}`}
              {e.verifiedOn && ` · ${t("Verified on")}: ${e.verifiedOn}`}
            </p>
          )}
          {e.isDemo && (
            <p className="catalog-demo">
              {t("Demonstration data — not a real exhibition.")}
            </p>
          )}
          <MuseumMap museum={e} />
        </>
      ) : (
        <p>{t("No confirmed current exhibition.")}</p>
      )}
    </section>
  );
}
function DiscoverMuseums() {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [q, setQ] = useState(""),
    [kind, setKind] = useState("all"),
    [data, setData] = useState(null),
    [museums, setMuseums] = useState([]),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0),
    [position, setPosition] = useState(null),
    [gpsError, setGpsError] = useState(null),
    [gpsBusy, setGpsBusy] = useState(false),
    [selectedId, setSelectedId] = useState(null);
  const gpsRun = useRef(0);
  useEffect(
    () => () => {
      gpsRun.current++;
    },
    [],
  );
  useEffect(() => {
    const c = new AbortController();
    setError(false);
    catalog("/api/places/hcm", c.signal, 30000)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    catalog("/api/museums", c.signal)
      .then(setMuseums)
      .catch(() => {});
    return () => c.abort();
  }, [attempt]);
  function locate() {
    const run = ++gpsRun.current;
    setGpsError(null);
    if (!window.isSecureContext || !navigator.geolocation) {
      setGpsError(
        !window.isSecureContext
          ? "Location needs a secure connection. You can still explore the map."
          : "Location unavailable. You can still search by name.",
      );
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (run !== gpsRun.current) return;
        const next = {
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        };
        if (hasCoordinates(next)) setPosition(next);
        else setGpsError("Location unavailable. You can still search by name.");
        setGpsBusy(false);
      },
      () => {
        if (run !== gpsRun.current) return;
        setGpsBusy(false);
        setGpsError("Location unavailable. You can still search by name.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  const allPlaces = useMemo(
    () => connectCatalogue(data?.items || [], museums),
    [data, museums],
  );
  const places = useMemo(
    () => searchPlaces(allPlaces, { q, kind, position, lang }),
    [allPlaces, q, kind, position, lang],
  );
  const selected = places.find((p) => p.id === selectedId);
  const selectPlace = (id) => {
    setSelectedId(id);
  };
  useEffect(() => {
    if (selectedId && !places.some((p) => p.id === selectedId))
      setSelectedId(null);
  }, [places, selectedId]);
  return (
    <div className="museum-page discovery-page">
      <p className="aw-eyebrow">MUSES · {t("Ho Chi Minh City")}</p>
      <h1>{t("Museums & exhibition spaces")}</h1>
      <p className="discovery-intro">
        {t("Explore museums, galleries and art spaces in Ho Chi Minh City.")}
      </p>
      <div className="museum-search">
        <label>
          {t("Search places")}
          <input
            type="search"
            value={q}
            placeholder={t("Name or address")}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          {t("Place type")}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">{t("All")}</option>
            <option value="museum">{t("Museums")}</option>
            <option value="gallery">{t("Galleries & art spaces")}</option>
          </select>
        </label>
        <button disabled={gpsBusy} onClick={locate}>
          {gpsBusy ? t("Locating…") : t("Use my location")}
        </button>
        {position && (
          <button
            onClick={() => {
              gpsRun.current++;
              setPosition(null);
              setGpsBusy(false);
              setGpsError(null);
            }}
          >
            {t("Reset to Ho Chi Minh City")}
          </button>
        )}
        {gpsError && <p role="status">{t(gpsError)}</p>}
      </div>
      <div className="discovery-summary" aria-live="polite">
        <span>
          {places.length} {t("places")}
          {position && ` · ${t("Nearest first")}`}
        </span>
        {!data && !error && <span>{t("Loading…")}</span>}
        {data?.stale && (
          <span>{t("Showing the last available map data.")}</span>
        )}
      </div>
      {error && (
        <p className="places-load-error" role="alert">
          {t("Places could not be loaded. Please try again.")}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>
            {t("Try again")}
          </button>{" "}
          <a
            href="https://www.google.com/maps/search/museums+art+galleries+Ho+Chi+Minh+City"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Search on Google Maps")}
          </a>
        </p>
      )}
      <div className="discovery-layout">
        <div className="discovery-results" aria-label={t("Search results")}>
          {places.map((place) => (
            <article
              className={`museum-card ${selectedId === place.id ? "is-selected" : ""}`}
              key={place.id}
            >
              <span className="place-kind">
                {t(
                  place.kind === "museum"
                    ? "Museums"
                    : "Galleries & art spaces",
                )}
              </span>
              <h2>
                <button
                  onClick={() => selectPlace(place.id)}
                  aria-pressed={selectedId === place.id}
                >
                  {place.name}
                </button>
              </h2>
              <p>{place.address}</p>
              {place.distance != null && (
                <p className="place-distance">
                  {place.distance.toFixed(1)} km · {t("Straight-line distance")}
                </p>
              )}
              <div className="place-actions">
                <button onClick={() => selectPlace(place.id)}>
                  {t("Show on map")}
                </button>
                <a
                  href={directionsUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Directions")}
                </a>
                {place.museumId && (
                  <Link to={`/museums/${place.museumId}`}>
                    {t("Currently on display")}
                  </Link>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Website")}
                  </a>
                )}
                <a
                  href={place.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Place information")}
                </a>
              </div>
            </article>
          ))}
          {data && !places.length && <p>{t("No results found.")}</p>}
        </div>
        <div className="discovery-map">
          <PlacesMap
            places={places}
            position={position}
            selectedId={selectedId}
            onSelect={selectPlace}
          />
          {selected && (
            <div className="selected-place" aria-live="polite">
              <strong>{selected.name}</strong>
              <p>{selected.address}</p>
              <a
                href={directionsUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("Directions")}
              </a>
            </div>
          )}
        </div>
      </div>
      <p className="places-note">
        {t(
          "Art spaces are venues; check their website for current exhibitions and opening hours.",
        )}
      </p>
      {data?.fetchedAt && (
        <p className="places-source">
          © OpenStreetMap contributors · {t("Updated")}:{" "}
          {new Date(data.fetchedAt).toLocaleDateString(lang)} ·{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Source")}
          </a>
        </p>
      )}
    </div>
  );
}
function MuseumDetail({ id }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [data, setData] = useState(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError(false);
    catalog(`/api/museums/${id}?lang=${lang}`, c.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => c.abort();
  }, [id, lang, attempt]);
  return (
    <div className="museum-page">
      <p className="aw-eyebrow">
        <Link to="/museums">MUSES · {t("Museums")}</Link>
      </p>
      {error ? (
        <p role="alert">
          {t("Unable to load data. Please try again.")}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>
            {t("Try again")}
          </button>
        </p>
      ) : !data ? (
        <p role="status">{t("Loading…")}</p>
      ) : (
        <>
          <h1>{data.name}</h1>
          {data.isDemo && (
            <p className="catalog-demo">
              {t("Demonstration data — not a real exhibition.")}
            </p>
          )}
          <p>{data.description}</p>
          <p>
            <strong>{t("Address")}: </strong>
            {data.address}
          </p>
          {data.contact && (
            <p>
              <strong>{t("Contact")}: </strong>
              {data.contact}
            </p>
          )}
          {data.source && (
            <p>
              <strong>{t("Source")}: </strong>
              {data.source}
            </p>
          )}
          <MuseumMap museum={data} />
          <h2>{t("Currently on display")}</h2>
          {data.artworks.length ? (
            <>
              <h3>{t("Suggested visit order")}</h3>
              <ol className="museum-itinerary">
                {data.artworks.map((a) => (
                  <li key={a.id}>
                    <Link to={`/explore/artworks/${a.id}?lang=${lang}`}>
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="aw-grid">
                {data.artworks.map((a) => (
                  <Link
                    key={a.id}
                    className="aw-card"
                    to={`/explore/artworks/${a.id}?lang=${lang}`}
                  >
                    <div className="aw-image">
                      <ArtworkImage artwork={a} />
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.artist}</p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p>{t("No results found.")}</p>
          )}
        </>
      )}
    </div>
  );
}
export default function Museums() {
  const { id } = useParams();
  return id ? <MuseumDetail id={id} /> : <DiscoverMuseums />;
}
