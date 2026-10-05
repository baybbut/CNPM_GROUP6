import { useLang } from "../../context/LangContext";
import { GALLERY } from "../../data/data";
import Art from "../Art/Art";
import "./Welcome.css";

export default function Welcome() {
  const { t } = useLang();
  return (
    <section className="welcome">
      <h2 className="title light">{t("welcomeTitle")}</h2>
      <div className="gallery">
        {GALLERY.map((g) => <Art key={g.id} item={g} />)}
      </div>
      <button className="btn btn-white">{t("exploreBtn")}</button>
    </section>
  );
}
