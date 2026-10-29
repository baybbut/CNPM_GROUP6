import { label } from "../../i18n/catalog.mjs";
import DateFilter from "./DateFilter";
import { matchesEventDate } from "./eventDates.mjs";
import { useState } from "react";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import {
  EXHIBITION_HERO,
  UPCOMING,
  SPOTLIGHT,
  EVENTS,
  TOURS,
} from "../../data/exhibitionData";
import "./exhibition.css";
import {
  HomeImagesProvider,
  useHomeImage,
} from "../../context/HomeImagesContext";

const TABS = [
  { key: "exhibition", label: "Exhibition" },
  { key: "events", label: "Events & Activities" },
  { key: "tour", label: "Guide Tour" },
];

function Pic({ src, slot, color, alt = "", className = "" }) {
  const image = useHomeImage(slot, src);
  return (
    <div className={`ex-pic ${className}`} style={{ backgroundColor: color }}>
      <img
        key={image}
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.getAttribute("src") !== src)
            e.currentTarget.src = src;
        }}
      />
    </div>
  );
}

const Head = ({ children, line }) => (
  <h3 className="ex-head">
    <SvgIcon kind="leaf" size={30} />
    <span>{children}</span>
    {line && <i />}
  </h3>
);

export default function Exhibition() {
  return (
    <HomeImagesProvider>
      <ExhibitionContent />
    </HomeImagesProvider>
  );
}

function ExhibitionContent() {
  const { t, lang } = useLang();
  const hero = useHomeImage(EXHIBITION_HERO.slot, EXHIBITION_HERO.img);
  const [tab, setTab] = useState("exhibition");
  const [date, setDate] = useState("");
  const [type, setType] = useState("all");

  const changeTab = (k) => {
    setTab(k);
    setDate("");
    setType("all");
  };

  const source = tab === "events" ? EVENTS : TOURS;
  const types = [...new Set(source.flatMap((g) => g.items.map((i) => i.tag)))];
  const groups = source
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => (type === "all" || i.tag === type) && matchesEventDate(i, date),
      ),
    }))
    .filter((g) => g.items.length);

  return (
    <div className="ex">
      {/* HERO */}
      <section
        className="ex-hero" data-scroll-intro
        style={{ "--ex-hero-image": `url("${hero}")` }}
      >
        <h1>{t("EXHIBITION AND EVENTS")}</h1>
        <p>{t("News")}</p>
      </section>

      <p className="catalog-demo" style={{ margin: "20px 5%" }}>
        {label(lang, "Demonstration data — not a real exhibition.")}
      </p>
      {/* TABS */}
      <div className="ex-wrap">
        <div className="ex-tabs" role="tablist">
          {TABS.map((x) => (
            <button
              key={x.key}
              role="tab"
              aria-selected={tab === x.key}
              className={tab === x.key ? "active" : ""}
              onClick={() => changeTab(x.key)}
            >
              {t(x.label)}
            </button>
          ))}
        </div>

        {/* TAB: EXHIBITION */}
        {tab === "exhibition" && (
          <>
            <a href="#" className="ex-past">
              {t("See past exhibition")} <SvgIcon kind="arrow" size={18} />
            </a>

            <Head>{t("UPCOMING")}</Head>
            <article className="ex-card big">
              <div className="ex-imgbox">
                <Pic
                  slot={UPCOMING.slot}
                  alt={t(UPCOMING.title)}
                  src={UPCOMING.img}
                  color={UPCOMING.color}
                />
                <span className="ex-badge">{t("Upcoming")}</span>
              </div>
              <h4>{t(UPCOMING.title)}</h4>
              <p>{UPCOMING.date}</p>
            </article>

            <Head line>{t("SPOTLIGHT COLLECTION")}</Head>
            <div className="ex-spot">
              {SPOTLIGHT.map((s) => (
                <article key={s.id} className="ex-card">
                  <Pic
                    slot={s.slot}
                    alt={t(s.title)}
                    src={s.img}
                    color={s.color}
                  />
                  <h4>{t(s.title)}</h4>
                  <p>{s.date}</p>
                </article>
              ))}
            </div>
          </>
        )}

        {/* TAB: EVENTS / GUIDE TOUR */}
        {tab !== "exhibition" && (
          <>
            <div className="ex-filter">
              <DateFilter
                value={date}
                onChange={setDate}
                vi={lang === "vi"}
                allLabel={t("ALL DATES")}
              />
              <span className="ex-gap" />
              <label className="ex-type">
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">{t("Type")}</option>
                  {types.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <SvgIcon kind="chevron" size={18} />
              </label>
            </div>

            {!groups.length && (
              <p className="ex-empty" role="status">
                {lang === "vi"
                  ? "Không có lịch phù hợp với lựa chọn của bạn."
                  : "No events match your selection."}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setDate("");
                    setType("all");
                  }}
                >
                  {lang === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                </button>
              </p>
            )}
            {groups.map((g) => (
              <section key={g.month} className="ex-month">
                <h3>
                  {date
                    ? new Intl.DateTimeFormat(lang, {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(`${date}T12:00:00Z`))
                    : g.month}
                </h3>
                {g.items.map((i) => (
                  <article key={i.id} className="ex-row">
                    <strong className="ex-date">{i.date}</strong>
                    <Pic
                      slot={i.slot}
                      alt={t(i.title)}
                      src={i.img}
                      color={i.color}
                      className="ex-rowpic"
                    />
                    <div className="ex-body">
                      <div className="ex-top">
                        <span className="ex-tag">{t(i.tag)}</span>
                        {i.age && <span className="ex-age">{i.age}</span>}
                        {i.audience && (
                          <span className="ex-aud">
                            <SvgIcon kind={i.icon} size={34} /> {t(i.audience)}
                          </span>
                        )}
                        {!i.audience && <h4>{t(i.title)}</h4>}
                      </div>
                      {i.audience && <h4>{t(i.title)}</h4>}
                      <small>{t(i.note)}</small>
                      <a href="#" className="ex-discover">
                        {t("DISCOVER")} <SvgIcon kind="arrow" size={16} />
                      </a>
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
