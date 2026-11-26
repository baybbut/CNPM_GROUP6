import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { Hero, Crumb } from "./part";

import {
  HERO_IMG,
  COLLECTIONS_CARD,
  EXPLORE_COPY,
} from "../../data/exploreData";

import "./explore.css";

export default function Explore() {
  const { lang } = useLang();
  const copy = EXPLORE_COPY[lang] ?? EXPLORE_COPY.en;

  return (
    <div className="xp">
      <Hero img={HERO_IMG} />
      <Crumb />

      <Link to="/explore/collection" className="xp-big">
        <img
          src={COLLECTIONS_CARD.img}
          alt=""
          className="xp-big-pic"
          loading="lazy"
          decoding="async"
        />

        <span>{copy.collectionTitle}</span>

        <i>
          <SvgIcon kind="arrow" size={30} />
        </i>
      </Link>

      <div className="xp-text">
        {copy.intro.map((paragraph, index) => (
          <p key={`${lang}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}