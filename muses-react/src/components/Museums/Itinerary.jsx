import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import {
  LocationControls,
  useMuseumLocation,
} from "../../context/MuseumLocation";
import { label } from "../../i18n/catalog.mjs";
import { catalog } from "../../api/catalog.mjs";
import references from "../../data/hcmPlaces.json";
import { connectCatalogue, hasCoordinates, matchesMuseum, MUSEUM_RADIUS_KM } from "./placeModel.mjs";
import {
  museumGuides,
  moveStop,
  nearestOrder,
  visitTimeline,
  clockLabel,
} from "./itineraryModel.mjs";
import { fetchRoadRoute, readItineraryRoute, roadRouteUrl, routeSummary } from "./routeModel.mjs";
import MuseumFloorPlans from "./MuseumFloorPlans";
import PlacesMap from "./PlacesMap";
import Directions from "./Directions";
import "./museums.css";
import "./itinerary.css";

function useItineraryRoute(stops, position) {
  // Ignore small GPS fluctuations when calculating the driving route.
  const waypoints = position ? [{
    latitude: Number(position.latitude.toFixed(4)),
    longitude: Number(position.longitude.toFixed(4)),
  }, ...stops] : stops;
  const count = waypoints.length;
  const url = count >= 2 ? roadRouteUrl(waypoints) : null;
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let active = true;
    let timeout;
    const timer = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const data = await fetchRoadRoute(url, controller.signal);
        const route = readItineraryRoute(data, count);
        if (active) setResult({ url, attempt, route });
      } catch {
        if (active) setResult({ url, attempt, error: true });
      } finally {
        clearTimeout(timeout);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [url, count, attempt]);
  const state = result?.url === url && result.attempt === attempt ? result : null;
  return { route: state?.route, loading: Boolean(url && !state), error: state?.error,
    retry: () => setAttempt(n => n + 1) };
}

export default function Itinerary() {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [params] = useSearchParams();
  const requestedId = params.get("fromMuseum");
  const [museums, setMuseums] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setFailed(false);
    catalog("/api/museums", c.signal)
      .then(rows => { if (!c.signal.aborted) setMuseums(rows); })
      .catch(() => { if (!c.signal.aborted) setFailed(true); });
    return () => c.abort();
  }, [attempt]);
  const origin = requestedId ? museums?.find(m => String(m.id) === requestedId) : null;
  const places = useMemo(() => {
    const list = connectCatalogue(references, museums || []);
    if (hasCoordinates(origin)) {
      const index = list.findIndex(p => p.museumId === origin.id || matchesMuseum(p, origin));
      const startPlace = { ...origin, id: `museum-${origin.id}`, museumId: origin.id, kind: "museum" };
      if (index < 0) list.unshift(startPlace);
      else list[index] = { ...list[index], museumId: origin.id, latitude: origin.latitude, longitude: origin.longitude };
    }
    return list.map(p => ({ ...p, name: p.names?.[lang] || p.name }));
  }, [museums, lang, origin]);
  if (requestedId && !hasCoordinates(origin)) {
    return <section className="museum-page">
      <h1>{t("Build a museum itinerary")}</h1>
      <p role="status">{t(failed ? "Unable to load data. Please try again." :
        museums ? "Starting museum unavailable." : "Loading…")}</p>
      {failed && <button onClick={() => setAttempt(n => n + 1)}>{t("Try again")}</button>}
      <Link className="v-link" to="/museums/itinerary">{t("Build a museum itinerary")}</Link>
    </section>;
  }
  const firstStop = origin && places.find(p => p.museumId === origin.id);
  return <ItineraryEditor key={requestedId} places={places} firstStop={firstStop} />;
}

function ItineraryEditor({ places, firstStop }) {
  const { lang } = useLang(), t = key => label(lang, key);
  const { position: userPosition } = useMuseumLocation();
  const position = firstStop ? null : userPosition;
  const [showLegDirections, setShowLegDirections] = useState(false);
  const [ids, setIds] = useState(() => firstStop
    ? [firstStop.id, ...places.filter(p => p.id !== firstStop.id).map(p => p.id)]
    : places.map(p => p.id));
  const [durations, setDurations] = useState({});
  const [start, setStart] = useState("09:00");
  const [selected, setSelected] = useState(ids[0]),
    [topic, setTopic] = useState(0);
  const [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const stops = useMemo(
    () => ids.map((id) => places.find((p) => p.id === id)).filter(Boolean),
    [ids, places],
  );
  const journey = useItineraryRoute(stops, position);
  const selectedIndex = stops.findIndex(p => p.id === selected);
  const legIndex = selectedIndex >= 0 && position ? selectedIndex : selectedIndex - 1;
  const selectedLeg = journey.route?.legs[legIndex];
  const place = places.find((p) => p.id === selected) || places[0];
  const guide = museumGuides[place.id];
  useEffect(() => {
    const c = new AbortController();
    setDetail(null);
    setDetailError(false);
    if (place.museumId)
      catalog(`/api/museums/${place.museumId}?lang=${lang}`, c.signal)
        .then(setDetail)
        .catch((e) => {
          if (!c.signal.aborted) setDetailError(true);
        });
    return () => c.abort();
  }, [place.museumId, lang, attempt]);
  function choose(id, showDirections = false) {
    setSelected(id);
    setTopic(0);
    setShowLegDirections(showDirections);
  }
  function toggle(id) {
    setIds((old) =>
      old.includes(id) ? old.filter((v) => v !== id) : [...old, id],
    );
    setShowLegDirections(false);
  }
  const timeline = visitTimeline(ids, durations, start);
  return (
    <div className="museum-page itinerary-page">
      <Link to="/museums">← {t("Museums")}</Link>
      <p className="aw-eyebrow">MUSES · {t("Ho Chi Minh City")}</p>
      <h1>{t("Build a museum itinerary")}</h1>
      <p>{t("Choose museums, arrange your stops and plan your visit time.")}</p>
      {firstStop ? <p>{t("Starting museum")} · <strong>{firstStop.name}</strong></p>
        : <LocationControls hint="Use your location to start the itinerary from where you are." />}
      <div className="itinerary-layout">
        <section className="itinerary-editor" aria-label={t("Your itinerary")}>
          <h2>{t("Your itinerary")}</h2>
          <div className="itinerary-pick">
            {places.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(p.id)}
                  disabled={p.id === firstStop?.id}
                  onChange={() => toggle(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
          <div className="itinerary-tools">
            <label>
              {t("Start time")}
              <input
                type="time"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <button
              disabled={firstStop ? stops.length < 3 : !position || stops.length < 2}
              onClick={() => {
                setIds(firstStop ? [firstStop.id, ...nearestOrder(stops.slice(1), firstStop)] : nearestOrder(stops, position));
                setShowLegDirections(false);
              }}
            >
              {t("Nearest stop first")}
            </button>
          </div>
          <p className="itinerary-note">
            {t(
              "Planned visit times exclude travel, queues and breaks. Confirm opening hours with each museum.",
            )}
          </p>
          {!ids.length && (
            <p role="status">{t("Select at least one museum.")}</p>
          )}
          {ids.length > 0 && !timeline.length && (
            <p role="alert">{t("Choose a valid start time.")}</p>
          )}
          <ol className="itinerary-stops">
            {stops.map((p, i) => (
              <li key={p.id} className={selected === p.id ? "active" : ""}>
                <span className="itinerary-number">{i + 1}</span>
                <div className="itinerary-stop-content">
                  <button
                    className="itinerary-name"
                    onClick={() => choose(p.id)}
                  >
                    {p.name}
                  </button>
                  <p>{p.address}</p>
                  {timeline[i] && (
                    <p className="itinerary-time">
                      {clockLabel(timeline[i].start)} –{" "}
                      {clockLabel(timeline[i].end)}
                    </p>
                  )}
                  <label>
                    {t("Visit duration")}
                    <select
                      aria-label={`${t("Visit duration")}: ${p.name}`}
                      value={durations[p.id] || 60}
                      onChange={(e) =>
                        setDurations((old) => ({
                          ...old,
                          [p.id]: Number(e.target.value),
                        }))
                      }
                    >
                      {[30, 45, 60, 90, 120, 180].map((n) => (
                        <option key={n} value={n}>
                          {n} {t("min")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="place-actions">
                    <button
                      disabled={i === 0 || (firstStop && i === 1)}
                      aria-label={`${t("Move up")}: ${p.name}`}
                      onClick={() => {
                        setIds(moveStop(ids, p.id, -1));
                        setShowLegDirections(false);
                      }}
                    >
                      ↑
                    </button>
                    <button
                      disabled={i === stops.length - 1 || p.id === firstStop?.id}
                      aria-label={`${t("Move down")}: ${p.name}`}
                      onClick={() => {
                        setIds(moveStop(ids, p.id, 1));
                        setShowLegDirections(false);
                      }}
                    >
                      ↓
                    </button>
                    <button
                      disabled={i === 0 && !position}
                      onClick={() => choose(p.id, true)}
                    >
                      {t("Directions")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {timeline.length > 0 && (
            <p className="itinerary-total" role="status">
              {t("Total visit time")}:{" "}
              {timeline.reduce((sum, p) => sum + p.duration, 0)} {t("min")}
            </p>
          )}
        </section>
        <div className="itinerary-preview">
          <section className="itinerary-overview" aria-label={t("Driving route")}>
            <h2>{t("Driving route")}</h2>
            <div role="status">
              {journey.loading && t("Finding itinerary route…")}
              {journey.error && <>{t("Unable to load the itinerary route.")} <button className="v-link" onClick={journey.retry}>{t("Try again")}</button></>}
              {!stops.length && t("Select at least one museum.")}
              {stops.length === 1 && !position && t(firstStop ? "Add another museum to draw the route." : "Add another museum or use your location to draw a route.")}
              {journey.route && <strong>{routeSummary(journey.route, lang)}</strong>}
              {selectedLeg && <p>
                {stops[selectedIndex - 1]?.name || t("Your location")} → {place.name}
                {" · "}{routeSummary(selectedLeg, lang)}
              </p>}
            </div>
          </section>
          <section className="museum-map">
            <PlacesMap
              places={stops}
              museumRadiusKm={MUSEUM_RADIUS_KM}
              position={position}
              selectedId={selected}
              numberStops
              route={journey.route}
              activeLeg={legIndex}
              onLegSelect={index => choose(stops[index + (position ? 0 : 1)].id)}
              onSelect={choose}
            />
            <Directions
              state={showLegDirections && legIndex >= 0 ? {
                place, origin: stops[selectedIndex - 1] || position,
                loading: journey.loading, error: journey.error, route: selectedLeg,
              } : null}
              onClose={() => setShowLegDirections(false)}
              onRetry={journey.retry}
            />
          </section>
        </div>
      </div>
      <section className="museum-guide" aria-labelledby="museum-guide-title">
        <h2 id="museum-guide-title">{t("Museum visit guide")}</h2>
        <label className="guide-select">
          {t("Museums")}
          <select value={selected} onChange={(e) => choose(e.target.value)}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <h3>{place.name}</h3>
        <p>{place.address}</p>
        {guide && (
          <>
            <h4>{t("Suggested visit diagram")}</h4>
            <p>
              {t(
                "These are suggested viewing themes, not room locations or a floor plan.",
              )}
            </p>
            <div
              className="guide-diagram"
              aria-label={t("Suggested visit diagram")}
            >
              <span className="guide-endpoint">{t("Start")}</span>
              {guide.topics.map((name, i) => (
                <button
                  key={name}
                  aria-pressed={topic === i}
                  onClick={() => setTopic(i)}
                >
                  <span>{i + 1}</span>
                  {t(name)}
                </button>
              ))}
              <span className="guide-endpoint">{t("Finish")}</span>
            </div>
            <p className="guide-topic" role="status">
              {t("Selected theme")}:{" "}
              <strong>{t(guide.topics[topic] || guide.topics[0])}</strong>
            </p>
            <MuseumFloorPlans key={place.id} plans={guide.floorPlans} />
          </>
        )}
        <h4>{t("Currently on display")}</h4>
        {!place.museumId ? (
          <p>{t("No confirmed current exhibition.")}</p>
        ) : detailError ? (
          <p role="alert">
            {t("Unable to load data. Please try again.")}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>
              {t("Try again")}
            </button>
          </p>
        ) : !detail ? (
          <p role="status">{t("Loading…")}</p>
        ) : detail.artworks?.length ? (
          <ul className="guide-artworks">
            {detail.artworks.map((a) => (
              <li key={a.id}>
                <Link to={`/explore/artworks/${a.id}?lang=${lang}`}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("No confirmed current exhibition.")}</p>
        )}
        <a href={place.sourceUrl || `/museums/${place.museumId}`} target="_blank" rel="noopener noreferrer">
          {t("Place information")} ↗
        </a>
      </section>
    </div>
  );
}
