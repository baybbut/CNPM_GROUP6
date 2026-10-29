import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { InfoIcon } from "../Icons";
import "./Prepare.css";

import { useHomeImage } from "../../context/HomeImagesContext";

export default function Prepare() {
  const { t } = useLang();
  const image = useHomeImage("home.prepare");
  return (
    <section
      className="prepare"
      style={
        image
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)), url("${image}")`,
            }
          : undefined
      }
    >
      <h2>{t("prepare")}</h2>
      <p>{t("prepareDesc")}</p>
      <Link to="/visit" className="btn btn-grey">
        <InfoIcon /> {t("prepare")}
      </Link>
    </section>
  );
}
