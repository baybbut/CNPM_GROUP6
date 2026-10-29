import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { catalog, directionsUrl } from "../../api/catalog.mjs";
import { SvgIcon } from "../Icons";
import { MuseumMap } from "../Museums/Museums";
import { ArtworkImage } from "../explore/Artworks";
import { ticketText } from "../Tickets/ticketText.mjs";
import {
  isClosed,
  ticketToday,
  ticketLastDay,
} from "../Tickets/ticketModel.mjs";
import {
  VISIT_SECTIONS,
  FACILITIES,
  ACCESS,
  VISIT_FAQ,
} from "../../data/visitData";
import { visitText } from "./visitText.mjs";
import {
  visitDestinations,
  visitTicketLink,
  mapSearchUrl,
} from "./visitModel.mjs";
import galleryImage from "../../../background/muses4.jpg";
import coffeeImage from "../../../background/musescoffee.jpg";
import familyImage from "../../../background/muses9.jpg";
import "./visit.css";

function SectionTitle({ id, number, children }) {
  return (
    <h2 className="v-label" id={id}>
      <span className="v-number">{number}</span>
      <span>{children}</span>
      <i aria-hidden="true" />
    </h2>
  );
}
function ExternalLink({ href, children, className = "v-link" }) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <SvgIcon kind="arrow" size={18} />
    </a>
  );
}
export default function Visit() {
  const [params] = useSearchParams();
  const { lang } = useLang(),
    t = (key) => visitText(lang, key);
  const [activeTab, setActiveTab] = useState("hours"),
    [museums, setMuseums] = useState([]),
    [offers, setOffers] = useState([]),
    [ticketLoading, setTicketLoading] = useState(true),
    [ticketError, setTicketError] = useState(false),
    [attempt, setAttempt] = useState(0),
    [selectedId, setSelectedId] = useState(
      params.get("museum") || "hcm-reference-fine-arts",
    ),
    [date, setDate] = useState(() => params.get("date") || ticketToday()),
    [artworks, setArtworks] = useState([]);
  const tabs = useRef(null);
  const destinations = useMemo(() => visitDestinations(museums), [museums]);
  const place = useMemo(() => {
    const item =
      destinations.find(
        (m) => m.id === selectedId || String(m.museumId || "") === selectedId,
      ) || destinations[0];
    return { ...item, name: item.names?.[lang] || item.name };
  }, [destinations, selectedId, lang]);
  const offer = offers.find(
    (o) =>
      Number(o.id) === place.museumId &&
      !o.isDemo &&
      typeof o.adultPrice === "number",
  );
  const priceUrl = visitTicketLink(place, date);
  useEffect(() => {
    const c = new AbortController();
    setTicketError(false);
    setTicketLoading(true);
    catalog("/api/museums", c.signal)
      .then((data) => {
        if (Array.isArray(data)) setMuseums(data);
      })
      .catch(() => {});
    catalog("/api/tickets/prices", c.signal)
      .then((data) => {
        if (!Array.isArray(data.items)) throw Error("INVALID_OFFERS");
        setOffers(data.items);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setTicketError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setTicketLoading(false);
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    const c = new AbortController();
    setArtworks([]);
    catalog(`/api/catalog/artworks?lang=${lang}`, c.signal)
      .then((data) => setArtworks((data.items || []).slice(0, 3)))
      .catch(() => {});
    return () => c.abort();
  }, [lang]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveTab(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -55% 0px", threshold: 0 },
    );
    VISIT_SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const nav = tabs.current,
      link = nav?.querySelector(`[href="#${activeTab}"]`);
    if (nav && link && nav.getBoundingClientRect().top <= 90)
      nav.scrollTo({
        left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2,
        behavior: "auto",
      });
  }, [activeTab]);
  function jump(event, id) {
    const element = document.getElementById(id);
    if (!element) return;
    event.preventDefault();
    setActiveTab(id);
    element.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    window.history.replaceState(window.history.state, "", `#${id}`);
  }
  const money = (value) =>
    new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  return (
    <div className="visit">
      <section
        className="v-hero"
        data-scroll-intro
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(21,18,13,.25),rgba(21,18,13,.78)),url("${galleryImage}")`,
        }}
      >
        <div className="v-hero-text">
          <span className="v-eyebrow">MUSES · {t("visit")}</span>
          <h1>{t("heroTitle")}</h1>
          <p>{t("heroIntro")}</p>
          <div className="v-actions">
            <a
              className="btn btn-brown"
              href="#hours"
              onClick={(e) => jump(e, "hours")}
            >
              {t("plan")}
              <SvgIcon kind="arrow" size={20} />
            </a>
            <Link className="v-hero-link" to="/museums">
              {t("map")}
              <SvgIcon kind="pin" light size={20} />
            </Link>
          </div>
        </div>
      </section>
      <nav className="v-tabs" aria-label={t("plan")}>
        <div className="v-tabs-list" ref={tabs}>
          {VISIT_SECTIONS.map(([id, key]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeTab === id ? "is-active" : ""}
              aria-current={activeTab === id ? "location" : undefined}
              onClick={(e) => jump(e, id)}
            >
              {t(key)}
            </a>
          ))}
        </div>
      </nav>
      <section className="v-sec v-tan">
        <SectionTitle id="hours" number="01">
          {t("hours")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <span className="v-eyebrow">{t("destination")}</span>
            <h3>{t("plan")}</h3>
            <p>{t("hoursTip")}</p>
            <div className="v-planner">
              <label htmlFor="visit-museum">
                {t("choose")}
                <select
                  id="visit-museum"
                  value={place.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {destinations.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.names?.[lang] || m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="visit-date">
                {t("date")}
                <input
                  id="visit-date"
                  type="date"
                  min={ticketToday()}
                  max={ticketLastDay()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="v-card v-destination-card">
            <SvgIcon kind="logo" size={36} />
            <h3>{place.name}</h3>
            <p className="v-address">
              <SvgIcon kind="pin" size={20} />
              {place.address}
            </p>
            <ExternalLink href={mapSearchUrl(place)}>
              {t("checkHours")}
            </ExternalLink>
          </div>
        </div>
        <div className="v-row v-admission-row">
          <div className="v-text">
            <h3>{t("prices")}</h3>
            <p>{t("priceTip")}</p>
            <Link className="btn btn-brown" to={priceUrl}>
              {t("tickets")}
              <SvgIcon kind="ticket" light size={20} />
            </Link>
          </div>
          <div className="v-card v-admission-card">
            {ticketLoading ? (
              <p role="status">{ticketText(lang, "loading")}</p>
            ) : ticketError ? (
              <div role="status">
                <p>{t("unavailable")}</p>
                <button
                  className="v-link"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  {t("retry")}
                  <SvgIcon kind="arrow" size={18} />
                </button>
              </div>
            ) : offer ? (
              <>
                {[
                  ["adult", "adultPrice"],
                  ["concession", "concessionPrice"],
                  ["child", "childPrice"],
                ].map(([key, price]) => (
                  <div className="v-price-row" key={key}>
                    <span>{ticketText(lang, key)}</span>
                    <strong>{money(offer[price])}</strong>
                  </div>
                ))}
                {date && isClosed(offer, date) && (
                  <p role="status" className="v-admission-note">
                    {t("closedDate")}
                  </p>
                )}
                {offer.terms && (
                  <p className="v-admission-note">{offer.terms}</p>
                )}
              </>
            ) : (
              <>
                <h4>{t("choose")}</h4>
                <p>{t("noOffer")}</p>
                <ExternalLink href={mapSearchUrl(place)}>
                  {t("contact")}
                </ExternalLink>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="v-sec">
        <SectionTitle id="directions" number="02">
          {t("directions")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <h3>{t("routeTitle")}</h3>
            <p>{t("routeTip")}</p>
            <p className="v-venue-name">
              {place.name}
              <br />
              {place.address}
            </p>
            <div className="v-actions">
              <ExternalLink
                className="btn btn-brown"
                href={directionsUrl(place)}
              >
                {t("directionsButton")}
              </ExternalLink>
              <Link className="v-link" to="/museums">
                {t("map")}
                <SvgIcon kind="arrow" size={18} />
              </Link>
            </div>
          </div>
          <MuseumMap museum={place} />
        </div>
      </section>
      <section className="v-sec v-tan">
        <SectionTitle id="galleries" number="03">
          {t("galleries")}
        </SectionTitle>
        <div className="v-section-intro">
          <h3>{t("collection")}</h3>
          <p>{t("collectionTip")}</p>
          <Link
            className="v-link"
            to={
              place.museumId
                ? `/museums/${place.museumId}`
                : "/explore/collection"
            }
          >
            {t(place.museumId ? "seeMuseum" : "seeCollection")}
            <SvgIcon kind="arrow" size={18} />
          </Link>
        </div>
        {artworks.length > 0 ? (
          <div className="v-artworks">
            {artworks.map((a) => (
              <Link
                to={`/explore/artworks/${a.id}?lang=${lang}`}
                key={a.id}
                className="v-artwork"
              >
                <div>
                  <ArtworkImage artwork={a} />
                </div>
                <h4>{a.title}</h4>
                <p>{a.artist}</p>
              </Link>
            ))}
          </div>
        ) : (
          <Link className="v-gallery-feature" to="/explore/collection">
            <img src={galleryImage} alt="" loading="lazy" />
            <span>
              {t("seeCollection")}
              <SvgIcon kind="arrow" size={24} />
            </span>
          </Link>
        )}
        <div className="v-audio-feature">
          <div>
            <SvgIcon kind="headphones" size={40} />
            <h3>{t("scanTitle")}</h3>
            <p>{t("scanTip")}</p>
          </div>
          <Link className="btn btn-brown" to="/scan">
            <SvgIcon kind="qr" size={22} />
            {t("scan")}
          </Link>
        </div>
      </section>
      <section className="v-sec v-dark">
        <SectionTitle id="amenities" number="04">
          {t("amenities")}
        </SectionTitle>
        <div className="v-facilities">
          {FACILITIES.map(([icon, title, tip]) => (
            <article className="v-facility" key={title}>
              <SvgIcon kind={icon} size={36} />
              <h3>{t(title)}</h3>
              <p>{t(tip)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v-sec v-cafe">
        <SectionTitle id="restaurants" number="05">
          {t("restaurants")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <h3>{t("cafeTitle")}</h3>
            <p>{t("cafeTip")}</p>
            <ExternalLink
              className="btn btn-brown"
              href={mapSearchUrl(place, "cafes near")}
            >
              {t("cafeButton")}
            </ExternalLink>
          </div>
          <div className="v-editorial-image">
            <img src={coffeeImage} alt="" loading="lazy" />
          </div>
        </div>
      </section>
      <section className="v-sec">
        <SectionTitle id="family" number="06">
          {t("family")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <h3>{t("familyTitle")}</h3>
            <p>{t("familyTip")}</p>
            <Link className="v-link" to={priceUrl}>
              {t("tickets")}
              <SvgIcon kind="arrow" size={18} />
            </Link>
          </div>
          <div className="v-editorial-image v-family-image">
            <img src={familyImage} alt="" loading="lazy" />
          </div>
        </div>
      </section>
      <section className="v-sec v-tan">
        <SectionTitle id="group" number="07">
          {t("group")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <h3>{t("groupTitle")}</h3>
            <p>{t("groupTip")}</p>
            <ExternalLink href={mapSearchUrl(place)}>
              {t("contact")}
            </ExternalLink>
          </div>
          <div className="v-group-card">
            <span>MUSES</span>
            <h3>{place.name}</h3>
            <p>{place.address}</p>
            <Link className="btn btn-brown" to={priceUrl}>
              {t("tickets")}
            </Link>
          </div>
        </div>
      </section>
      <section className="v-sec">
        <SectionTitle id="accessibility" number="08">
          {t("accessibility")}
        </SectionTitle>
        <div className="v-section-intro">
          <h3>{t("pace")}</h3>
          <p>{t("accessTip")}</p>
        </div>
        <div className="v-access-grid">
          {ACCESS.map(([icon, title, tip]) => (
            <article key={title}>
              <SvgIcon kind={icon} size={36} />
              <h3>{t(title)}</h3>
              <p>{t(tip)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v-sec v-dark">
        <SectionTitle id="faq" number="09">
          {t("faq")}
        </SectionTitle>
        <div className="v-row">
          <div className="v-text">
            <h3>{t("faqIntro")}</h3>
            <Link className="v-link" to="/museums">
              {t("map")}
              <SvgIcon kind="arrow" size={18} />
            </Link>
          </div>
          <div className="v-faq-list">
            {VISIT_FAQ.map((key, index) => (
              <details
                key={key}
                className="v-faq"
                open={index === 0 ? true : undefined}
              >
                <summary>
                  {t(`${key}Q`)}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{t(`${key}A`)}</p>
                {key === "qr" && (
                  <Link className="v-link" to="/scan">
                    {t("scan")}
                    <SvgIcon kind="arrow" size={18} />
                  </Link>
                )}
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
