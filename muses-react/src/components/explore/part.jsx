import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { EXPLORE_COPY } from "../../data/exploreData";

export const Pic = ({ src, color, className = "" }) => (
  <div
    className={`xp-pic ${className}`}
    style={
      src
        ? { backgroundImage: `url("${src}")` }
        : { background: color }
    }
  />
);

export function Hero({ img }) {
  const { t, lang } = useLang();
  const copy = EXPLORE_COPY[lang] ?? EXPLORE_COPY.en;

  return (
    <section
      className="xp-hero"
      data-scroll-intro
      style={
        img
          ? {
              backgroundImage: `
                linear-gradient(
                  180deg,
                  rgba(21, 18, 13, 0.25),
                  rgba(21, 18, 13, 0.78)
                ),
                url("${img}")
              `,
            }
          : undefined
      }
    >
      <h1>{t("explore")}</h1>
      <p>{copy.collectionTitle}</p>
    </section>
  );
}

export function Crumb() {
  const { t, lang } = useLang();
  const copy = EXPLORE_COPY[lang] ?? EXPLORE_COPY.en;

  return (
    <nav
      className="xp-crumb"
      aria-label={`${t("explore")} / ${copy.collectionTitle}`}
    >
      <Link to="/" aria-label={copy.home}>
        <SvgIcon kind="leaf" size={32} />
      </Link>

      <SvgIcon kind="chevronRight" size={16} />

      <Link to="/explore">
        {t("explore")}
      </Link>

      <SvgIcon kind="chevronRight" size={16} />

      <Link to="/explore/collection">
        {copy.collectionTitle}
      </Link>
    </nav>
  );
}