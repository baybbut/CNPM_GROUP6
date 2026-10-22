import { useLang } from "../../context/LangContext";
import { NEWS } from "../../data/data";
import "./News.css";

import { useHomeImage } from "../../context/HomeImagesContext";

export default function News() {
  const { t } = useLang();
  const image = useHomeImage("home.news");
  return (
    <section className="news">
      <div
        className="news-img"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      />
      <div className="news-body">
        <h2 className="title dark">{t("news")}</h2>
        {NEWS.map((n) => (
          <p key={n.id}>{t(n.textKey)}</p>
        ))}
      </div>
    </section>
  );
}
