import { useLang } from "../../context/LangContext";
import { NEWS } from "../../data/data";
import "./News.css";

export default function News() {
  const { t } = useLang();
  return (
    <section className="news">
      <div className="news-img" />
      <div className="news-body">
        <h2 className="title dark">{t("news")}</h2>
        {NEWS.map((n) => <p key={n.id}>{t(n.textKey)}</p>)}
      </div>
    </section>
  );
}
