import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { Hero, Crumb, Pic } from "./part";
import { HERO_IMG, COLLECTIONS_CARD as C, INTRO } from "../../data/exploreData";
import "./explore.css";

export default function Explore() {
  const { t } = useLang();
  return (
    <div className="xp">
      <Hero img={HERO_IMG} />
      <Crumb />

      <Link to="/explore/collection" className="xp-big">
        <Pic src={C.img} color={C.color} className="xp-big-pic" />
        <span>{t(C.title)}</span>
        <i><SvgIcon kind="arrow" size={30} /></i>
      </Link>

      <div className="xp-text">
        {INTRO.map((p, i) => <p key={i}>{t(p)}</p>)}
      </div>
    </div>
  );
}