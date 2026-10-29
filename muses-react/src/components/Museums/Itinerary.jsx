import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import {
  LocationControls,
  useMuseumLocation,
} from "../../context/MuseumLocation";
import { label } from "../../i18n/catalog.mjs";
import { catalog } from "../../api/catalog.mjs";
import references from "../../data/hcmPlaces.json";
import { connectCatalogue } from "./placeModel.mjs";
import {
  museumGuides,
  moveStop,
  nearestOrder,
  visitTimeline,
  clockLabel,
} from "./itineraryModel.mjs";
import MuseumFloorPlans from "./MuseumFloorPlans";
import PlacesMap from "./PlacesMap";
import Directions, { useDirections } from "./Directions";
import "./museums.css";
import "./itinerary.css";

export default function Itinerary() {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const { position } = useMuseumLocation();
  const directions = useDirections(position);
  const [ids, setIds] = useState(references.map((p) => p.id));
  const [durations, setDurations] = useState({});
  const [start, setStart] = useState("09:00");
  const [selected, setSelected] = useState(references[0].id),
    [topic, setTopic] = useState(0);
  const [museums, setMuseums] = useState([]),
    [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    catalog("/api/museums", c.signal)
      .then(setMuseums)
      .catch(() => {});
    return () => c.abort();
  }, []);
  const places = useMemo(
    () =>
      connectCatalogue(references, museums).map((p) => ({
        ...p,
        name: p.names[lang] || p.name,
      })),
    [museums, lang],
  );
  const stops = ids
    .map((id) => places.find((p) => p.id === id))
    .filter(Boolean);
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
  function choose(id) {
    setSelected(id);
    setTopic(0);
    directions.clear();
  }
  function toggle(id) {
    setIds((old) =>
      old.includes(id) ? old.filter((v) => v !== id) : [...old, id],
    );
    directions.clear();
  }
  const timeline = visitTimeline(ids, durations, start);
  return (
    <div className="museum-page itinerary-page">
      <Link to="/museums">← {t("Museums")}</Link>
      <p className="aw-eyebrow">MUSES · {t("Ho Chi Minh City")}</p>
      <h1>{t("Build a museum itinerary")}</h1>
      <p>{t("Choose museums, arrange your stops and plan your visit time.")}</p>
      <LocationControls />
      <div className="itinerary-layout">
        <section className="itinerary-editor" aria-label={t("Your itinerary")}>
          <h2>{t("Your itinerary")}</h2>
          <div className="itinerary-pick">
            {places.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(p.id)}
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
              disabled={!position || stops.length < 2}
              onClick={() => {
                setIds(nearestOrder(stops, position));
                directions.clear();
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
                      disabled={i === 0}
                      aria-label={`${t("Move up")}: ${p.name}`}
                      onClick={() => {
                        setIds(moveStop(ids, p.id, -1));
                        directions.clear();
                      }}
                    >
                      ↑
                    </button>
                    <button
                      disabled={i === stops.length - 1}
                      aria-label={`${t("Move down")}: ${p.name}`}
                      onClick={() => {
                        setIds(moveStop(ids, p.id, 1));
                        directions.clear();
                      }}
                    >
                      ↓
                    </button>
                    <button
                      disabled={!position}
                      onClick={() => {
                        setSelected(p.id);
                        setTopic(0);
                        directions.start(p);
                      }}
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
          <section
            className="itinerary-overview"
            aria-label={t("Visit sequence")}
          >
            <h2>{t("Visit sequence")}</h2>
            <div className="itinerary-sequence">
              {stops.map((p, i) => (
                <button
                  key={p.id}
                  aria-pressed={selected === p.id}
                  onClick={() => choose(p.id)}
                >
                  <span>{i + 1}</span>
                  {p.name}
                </button>
              ))}
            </div>
          </section>
          <section className="museum-map">
            <PlacesMap
              places={stops}
              position={position}
              selectedId={selected}
              route={directions.state?.route}
              onSelect={choose}
            />
            <Directions
              state={directions.state}
              onClose={directions.clear}
              onRetry={() => directions.start(directions.state.place)}
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
        <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t("Place information")} ↗
        </a>
      </section>
    </div>
  );
}
