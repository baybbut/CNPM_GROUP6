import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { catalog, directionsUrl } from "../../api/catalog.mjs";
import { SvgIcon } from "../Icons";
import { isClosed } from "./ticketModel.mjs";
import {
  pricePlaces,
  filterPrices,
  priceKeys,
  lookupDate,
} from "./priceModel.mjs";
import { priceText } from "./priceText.mjs";
import { mapSearchUrl } from "../visit/visitModel.mjs";
import museumImage from "../../../background/muses4.jpg";
import "./priceLookup.css";
export default function PriceLookup() {
  const { lang } = useLang(),
    t = (key) => priceText(lang, key),
    [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0),
    [q, setQ] = useState(""),
    [group, setGroup] = useState("adultPrice"),
    [sort, setSort] = useState("name");
  const museum = params.get("museum") || "",
    date = lookupDate(params.get("date"));
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(false);
    catalog("/api/tickets/prices", c.signal)
      .then((data) => {
        if (!Array.isArray(data.items)) throw Error("INVALID_PRICE_LIST");
        setRows(data.items);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [attempt]);
  const all = useMemo(() => pricePlaces(rows), [rows]);
  const items = useMemo(
    () => filterPrices(all, { q, group, sort, lang, museum }),
    [all, q, group, sort, lang, museum],
  );
  const money = (value) =>
    value === 0
      ? t("free")
      : new Intl.NumberFormat(lang, {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(value);
  function selectMuseum(value) {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value) next.set("museum", value);
        else next.delete("museum");
        return next;
      },
      { replace: true },
    );
  }
  function clear() {
    setQ("");
    setGroup("adultPrice");
    setSort("name");
    selectMuseum("");
  }
  return (
    <div className="price-page">
      <section className="price-hero">
        <div>
          <span className="price-eyebrow">MUSES · {t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
          <Link to="/museums" className="price-hero-link">
            {t("info")}
            <SvgIcon kind="arrow" size={20} />
          </Link>
        </div>
        <div className="price-hero-image">
          <img src={museumImage} alt="" />
          <span>{t("heading")}</span>
        </div>
      </section>
      <section className="price-directory" aria-label={t("title")}>
        <div className="price-search">
          <label className="price-search-main">
            {t("search")}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label>
            {t("museum")}
            <select
              value={
                museum
                  ? all.find(
                      (p) =>
                        p.id === museum || String(p.museumId || "") === museum,
                    )?.id || museum
                  : ""
              }
              onChange={(e) => selectMuseum(e.target.value)}
            >
              <option value="">{t("all")}</option>
              {all.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.names?.[lang] || p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("group")}
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {priceKeys.map((key, i) => (
                <option key={key} value={key}>
                  {t(["adult", "concession", "child"][i])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("sort")}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">{t("name")}</option>
              <option value="price">{t("price")}</option>
            </select>
          </label>
        </div>
        {loading && (
          <p className="price-status" role="status">
            {t("loading")}
          </p>
        )}
        {error && (
          <p className="price-status price-error" role="alert">
            {t("error")}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>
              {t("retry")}
            </button>
          </p>
        )}
        <div className="price-results-meta">
          <span aria-live="polite">
            {items.length} {t("results")}
          </span>
          {date && /^\d{4}-\d{2}-\d{2}$/.test(date) && (
            <span>
              {t("selectedDate")}: {date}
            </span>
          )}
          {(q || museum) && <button onClick={clear}>{t("clear")}</button>}
        </div>
        <div className="price-grid">
          {items.map((place) => {
            const known = place[group] !== null;
            return (
              <article className="price-card" key={place.id}>
                <div className="price-card-top">
                  <SvgIcon kind="logo" size={28} />
                  <span>MUSES · {t("museum")}</span>
                </div>
                <h2>{place.name}</h2>
                <p className="price-address">
                  <SvgIcon kind="pin" size={18} />
                  {place.address}
                </p>
                <div className="price-feature">
                  <span>
                    {t(
                      ["adult", "concession", "child"][
                        priceKeys.indexOf(group)
                      ],
                    )}
                  </span>
                  <strong className={known ? "" : "price-unknown"}>
                    {known ? money(place[group]) : t("unknown")}
                  </strong>
                  {known && place[group] > 0 && <small>{t("perPerson")}</small>}
                </div>
                <dl className="price-tiers">
                  {priceKeys.map((key, index) => (
                    <div key={key}>
                      <dt>{t(["adult", "concession", "child"][index])}</dt>
                      <dd>{place[key] === null ? "—" : money(place[key])}</dd>
                    </div>
                  ))}
                </dl>
                {!priceKeys.some((key) => place[key] !== null) && (
                  <p className="price-card-note">{t("noPrice")}</p>
                )}
                <details className="price-conditions">
                  <summary>
                    {t("conditions")}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{place.terms || t("termsTip")}</p>
                  {date && isClosed(place, date) && <p>{t("dayNotice")}</p>}
                  {place.updatedAt &&
                    Number.isFinite(Date.parse(place.updatedAt)) && (
                      <small>
                        {t("updated")}:{" "}
                        {new Date(place.updatedAt).toLocaleDateString(lang)}
                      </small>
                    )}
                </details>
                <div className="price-card-actions">
                  <a
                    href={mapSearchUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("info")}
                    <SvgIcon kind="arrow" size={18} />
                  </a>
                  <a
                    href={directionsUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("directions")}
                  </a>
                  <Link
                    to={`/visit?museum=${encodeURIComponent(place.museumId || place.id)}${date ? "&date=" + encodeURIComponent(date) : ""}`}
                  >
                    {t("plan")}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        {!loading && !items.length && (
          <div className="price-empty">
            <p>{t("empty")}</p>
            <button onClick={clear}>{t("clear")}</button>
          </div>
        )}
        <p className="price-footnote">{t("note")}</p>
      </section>
    </div>
  );
}
