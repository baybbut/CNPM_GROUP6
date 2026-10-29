import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { catalog, distanceKm, directionsUrl } from "../../api/catalog.mjs";
import { ArtworkImage } from "../explore/Artworks";
import "./museums.css";
export function MuseumMap({ museum }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [attempt, setAttempt] = useState(0),
    [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false);
  const timeout = useRef(null);
  const lat = Number(museum.latitude),
    lng = Number(museum.longitude);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    timeout.current = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timeout.current);
  }, [attempt, museum.id, museum.museumId]);
  const params = new URLSearchParams({
    bbox: `${lng - 0.015},${lat - 0.01},${lng + 0.015},${lat + 0.01}`,
    layer: "mapnik",
    marker: `${lat},${lng}`,
  });
  return (
    <section className="museum-map" aria-label={t("Museum map")}>
      {!failed && (
        <iframe
          key={`${lat}-${lng}-${attempt}`}
          src={`https://www.openstreetmap.org/export/embed.html?${params}`}
          title={`${t("Museum map")}: ${museum.name}`}
          loading="lazy"
          onLoad={() => {
            clearTimeout(timeout.current);
            setLoaded(true);
            setFailed(false);
          }}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      )}
      {failed && !loaded && (
        <p role="alert">
          {t("Map unavailable. You can still use the address or directions.")}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>
            {t("Try again")}
          </button>
        </p>
      )}
      <div className="museum-map-links">
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Open map")}
        </a>
        <a
          href={directionsUrl(museum)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Directions")}
        </a>
        <button onClick={() => setAttempt((n) => n + 1)}>
          {t("Try again")}
        </button>
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
      <h2>{t("Current exhibition")}</h2>
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
          <p>
            {t("Source")}: {e.source} · {t("Verified on")}: {e.verifiedOn}
          </p>
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
export default function Museums() {
  const { id } = useParams(),
    { lang } = useLang(),
    t = (key) => label(lang, key);
  const [q, setQ] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0),
    [position, setPosition] = useState(null),
    [gpsError, setGpsError] = useState(false),
    [gpsBusy, setGpsBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError(false);
    const timer = setTimeout(
      () =>
        catalog(
          id
            ? `/api/museums/${id}?lang=${lang}`
            : `/api/museums?q=${encodeURIComponent(q)}`,
          c.signal,
        )
          .then(setData)
          .catch((e) => {
            if (e.name !== "AbortError") setError(true);
          }),
      200,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [id, q, lang, attempt]);
  function locate() {
    setGpsError(false);
    setGpsBusy(true);
    if (!navigator.geolocation) {
      setGpsError(true);
      setGpsBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setGpsBusy(false);
      },
      () => {
        setGpsError(true);
        setGpsBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  const museums =
    !id && data
      ? [...data]
          .map((m) => ({
            ...m,
            distance: position ? distanceKm(position, m) : null,
          }))
          .sort((a, b) => (position ? a.distance - b.distance : 0))
      : [];
  return (
    <main className="museum-page">
      <p className="aw-eyebrow">MUSES · {t("Museums")}</p>
      <h1>{id && data ? data.name : t("Museums")}</h1>
      {!id && (
        <div className="museum-search">
          <label>
            {t("Search museums")}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button disabled={gpsBusy} onClick={locate}>
            {gpsBusy ? t("Loading…") : t("Find nearby museums")}
          </button>
          <p>{t("Your location is used only to sort this list.")}</p>
          {gpsError && (
            <p role="alert">
              {t("Location unavailable. You can still search by name.")}
            </p>
          )}
        </div>
      )}
      {error ? (
        <p role="alert">
          {t("Unable to load data. Please try again.")}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>
            {t("Try again")}
          </button>
        </p>
      ) : !data ? (
        <p role="status">{t("Loading…")}</p>
      ) : id ? (
        <>
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
          <p>
            <strong>{t("Source")}: </strong>
            {data.source}
          </p>
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
      ) : museums.length ? (
        <div className="museum-grid">
          {museums.map((m) => (
            <article className="museum-card" key={m.id}>
              <h2>
                <Link to={`/museums/${m.id}`}>{m.name}</Link>
              </h2>
              {m.isDemo && (
                <p className="catalog-demo">
                  {t("Demonstration data — not a real exhibition.")}
                </p>
              )}
              <p>{m.address}</p>
              <p>{m.description}</p>
              {m.distance != null && <p>{m.distance.toFixed(1)} km</p>}
              <a
                href={directionsUrl(m)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("Directions")}
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p>{t("No results found.")}</p>
      )}
    </main>
  );
}
