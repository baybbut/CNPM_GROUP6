import { useLang } from "../../context/LangContext";
import { InfoIcon } from "../Icons";
import "./Prepare.css";

export default function Prepare() {
  const { t } = useLang();
  return (
    <section className="prepare">
      <h2>{t("prepare")}</h2>
      <p>{t("prepareDesc")}</p>
      <button className="btn btn-grey"><InfoIcon /> {t("prepare")}</button>
    </section>
  );
}
