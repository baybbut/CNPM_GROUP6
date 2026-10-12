import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";

export const Pic = ({ src, color, className = "" }) => (
  <div className={`xp-pic ${className}`}
    style={src ? { backgroundImage: `url("${src}")` } : { background: color }} />
);

export function Hero({ img }) {
  const { t } = useLang();
  return (
    <section className="xp-hero"
      style={img ? { backgroundImage: `linear-gradient(rgba(90,70,50,.25),rgba(90,70,50,.25)), url("${img}")` } : undefined}>
      <h1>{t("EXPLORE")}</h1>
      <p>{t("Collection")}</p>
    </section>
  );
}

export function Crumb() {
  const { t } = useLang();
  return (
    <nav className="xp-crumb" aria-label="breadcrumb">
      <Link to="/"><SvgIcon kind="leaf" size={32} /></Link>
      <SvgIcon kind="chevronRight" size={16} />
      <Link to="/explore">{t("EXPLORE")}</Link>
      <SvgIcon kind="chevronRight" size={16} />
      <Link to="/explore/collection">{t("COLLECTION")}</Link>
    </nav>
  );
}