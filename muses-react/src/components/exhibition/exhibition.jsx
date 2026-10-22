import { useState } from "react";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { UPCOMING, SPOTLIGHT, EVENTS, TOURS } from "../../data/exhibitionData";
import "./exhibition.css";

const TABS = [
  { key: "exhibition", label: "Exhibition" },
  { key: "events", label: "Events & Activities" },
  { key: "tour", label: "Guide Tour" },
];

const Pic = ({ src, color, className = "" }) => (
  <div className={`ex-pic ${className}`}
    style={src ? { backgroundImage: `url("${src}")` } : { background: color }} />
);

const Head = ({ children, line }) => (
  <h3 className="ex-head">
    <SvgIcon kind="leaf" size={30} /><span>{children}</span>{line && <i />}
  </h3>
);

export default function Exhibition() {
  const { t } = useLang();
  const [tab, setTab] = useState("exhibition");
  const [month, setMonth] = useState("all");
  const [type, setType] = useState("all");

  const changeTab = (k) => { setTab(k); setMonth("all"); setType("all"); };

  const source = tab === "events" ? EVENTS : TOURS;
  const types = [...new Set(source.flatMap((g) => g.items.map((i) => i.tag)))];
  const groups = source
    .filter((g) => month === "all" || g.month === month)
    .map((g) => ({ ...g, items: g.items.filter((i) => type === "all" || i.tag === type) }))
    .filter((g) => g.items.length);

  return (
    <div className="ex">
      {/* HERO */}
      <section className="ex-hero">
        <h1>{t("EXHIBITION AND EVENTS")}</h1>
        <p>{t("News")}</p>
      </section>

      {/* TABS */}
      <div className="ex-wrap">
        <div className="ex-tabs" role="tablist">
          {TABS.map((x) => (
            <button key={x.key} role="tab" aria-selected={tab === x.key}
              className={tab === x.key ? "active" : ""} onClick={() => changeTab(x.key)}>
              {t(x.label)}
            </button>
          ))}
        </div>

        {/* TAB: EXHIBITION */}
        {tab === "exhibition" && (
          <>
            <a href="#" className="ex-past">{t("See past exhibition")} <SvgIcon kind="arrow" size={18} /></a>

            <Head>{t("UPCOMING")}</Head>
            <article className="ex-card big">
              <div className="ex-imgbox">
                <Pic src={UPCOMING.img} color={UPCOMING.color} />
                <span className="ex-badge">{t("Upcoming")}</span>
              </div>
              <h4>{t(UPCOMING.title)}</h4>
              <p>{UPCOMING.date}</p>
            </article>

            <Head line>{t("SPOTLIGHT COLLECTION")}</Head>
            <div className="ex-spot">
              {SPOTLIGHT.map((s) => (
                <article key={s.id} className="ex-card">
                  <Pic src={s.img} color={s.color} />
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
              <label className="ex-dates">
                <SvgIcon kind="calendar" size={30} />
                <select value={month} onChange={(e) => setMonth(e.target.value)}>
                  <option value="all">{t("ALL DATES")}</option>
                  {source.map((g) => <option key={g.month} value={g.month}>{g.month}</option>)}
                </select>
                <SvgIcon kind="chevron" size={18} />
              </label>
              <span className="ex-gap" />
              <label className="ex-type">
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">{t("Type")}</option>
                  {types.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <SvgIcon kind="chevron" size={18} />
              </label>
            </div>

            {groups.map((g) => (
              <section key={g.month} className="ex-month">
                <h3>{g.month}</h3>
                {g.items.map((i) => (
                  <article key={i.id} className="ex-row">
                    <strong className="ex-date">{i.date}</strong>
                    <Pic src={i.img} color={i.color} className="ex-rowpic" />
                    <div className="ex-body">
                      <div className="ex-top">
                        <span className="ex-tag">{t(i.tag)}</span>
                        {i.age && <span className="ex-age">{i.age}</span>}
                        {i.audience && (
                          <span className="ex-aud"><SvgIcon kind={i.icon} size={34} /> {t(i.audience)}</span>
                        )}
                        {!i.audience && <h4>{t(i.title)}</h4>}
                      </div>
                      {i.audience && <h4>{t(i.title)}</h4>}
                      <small>{t(i.note)}</small>
                      <a href="#" className="ex-discover">{t("DISCOVER")} <SvgIcon kind="arrow" size={16} /></a>
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