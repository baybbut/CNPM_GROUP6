import { Hero, Crumb } from "./part";
import { HERO_IMG } from "../../data/exploreData";
import { ArtworkCollection } from "./Artworks";
import "./explore.css";

export default function Collection() {
  return (
    <div className="xp">
      <Hero img={HERO_IMG} />
      <Crumb />
      <ArtworkCollection />
    </div>
  );
}
