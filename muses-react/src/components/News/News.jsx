import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { MUSEUM_NEWS, newsCopy, newsDate } from "../../data/museumNews";
import { useHomeImage } from "../../context/HomeImagesContext";
import { SvgIcon } from "../Icons";
import "./News.css";
export default function News() {
  const { t, lang } = useLang(),
    vi = lang === "vi";
  const featured = MUSEUM_NEWS[0],
    copy = newsCopy(featured, lang);
  const image = useHomeImage("home.news", featured.image);
  return (
    <section className="news" aria-labelledby="home-news-title">
      <Link
        className="news-img"
        to={`/news/${featured.slug}`}
        aria-label={copy.title}
        style={{ backgroundImage: `url("${image}")` }}
      />
      <div className="news-body">
        <h2 className="title dark" id="home-news-title">
          {t("news")}
        </h2>
        <p className="news-intro">
          {vi
            ? "Thông báo và câu chuyện mới nhất từ bảo tàng."
            : "The latest notices and stories from the museum."}
        </p>
        <div className="news-notices">
          {MUSEUM_NEWS.slice(0, 3).map((item) => {
            const text = newsCopy(item, lang);
            return (
              <article key={item.slug}>
                <Link to={`/news/${item.slug}`} className="news-notice">
                  <div className="news-meta">
                    <span>{text.category}</span>
                    <time dateTime={item.date}>
                      {newsDate(item.date, lang)}
                    </time>
                  </div>
                  <h3>{text.title}</h3>
                  <span className="news-read">
                    {vi ? "Đọc thông báo" : "Read story"}{" "}
                    <SvgIcon kind="arrow" size={19} />
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
        <Link to="/news" className="news-all">
          {vi ? "Tất cả tin tức" : "All museum news"}{" "}
          <SvgIcon kind="arrow" size={20} />
        </Link>
      </div>
    </section>
  );
}
