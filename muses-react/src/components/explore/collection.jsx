import { useState } from "react";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { Hero, Crumb, Pic } from "./part";
import { HERO_IMG, COLLECTIONS, THEMES, MAP } from "../../data/exploreData";
import "./explore.css";

export default function Collection() {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const match = (x) => t(x.title).toLowerCase().includes(q.trim().toLowerCase());
  const cols = COLLECTIONS.filter(match);
  const themes = THEMES.filter(match);

  return (
    <div className="xp">
      <Hero img={HERO_IMG} />
      <Crumb />

      <label className="xp-search">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t("Search the Muses Collections")} />
        <SvgIcon kind="search" size={28} />
      </label>

      {cols.length > 0 && (
        <div className="xp-cols">
          {cols.map((c) => (
            <a key={c.id} href="#" className="xp-col">
              <Pic src={c.img} color={c.color} />
              <h3>{t(c.title)}</h3>
            </a>
          ))}
        </div>
      )}

      <div className="xp-themehead">
        <i /><h2>{t("THEME COLLECTION")}</h2><i />
      </div>

      <div className="xp-themes">
        {themes.map((c) => (
          <a key={c.id} href="#" className="xp-theme">
            <Pic src={c.img} color={c.color} />
            <p>{t(c.title)}</p>
          </a>
        ))}
      </div>
      {cols.length + themes.length === 0 && <p className="xp-empty">{t("No results found")}</p>}

      <div className="xp-more"><a href="#">{t("SEE MORE THEMED")}</a></div>

      <section className="xp-mapwrap">
        <a href="#" className="xp-map"
          style={MAP.img ? { backgroundImage: `url("${MAP.img}")` } : { background: MAP.color }}>
          <span>{t(MAP.title)}</span>
        </a>
      </section>
    </div>
  );
}