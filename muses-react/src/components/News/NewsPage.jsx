import { Link, useParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { MUSEUM_NEWS, newsCopy, newsDate } from "../../data/museumNews";
import { SvgIcon } from "../Icons";
import "./news-page.css";
function NewsCard({ item, lang }) {
  const copy = newsCopy(item, lang);
  return (
    <article className="museum-news-card">
      <Link to={`/news/${item.slug}`}>
        <div className="museum-news-card-image">
          <img src={item.image} alt={copy.title} loading="lazy" />
        </div>
        <div className="news-meta">
          <span>{copy.category}</span>
          <time dateTime={item.date}>{newsDate(item.date, lang)}</time>
        </div>
        <h2>{copy.title}</h2>
        <p>{copy.summary}</p>
        <span className="news-read">
          {lang === "vi" ? "Đọc bài viết" : "Read story"}{" "}
          <SvgIcon kind="arrow" size={19} />
        </span>
      </Link>
    </article>
  );
}
export function NewsIndex() {
  const { lang } = useLang(),
    vi = lang === "vi";
  return (
    <div className="museum-news-page">
      <header className="museum-news-heading">
        <p>MUSES</p>
        <h1>{vi ? "Tin tức từ bảo tàng" : "News from the museum"}</h1>
        <p>
          {vi
            ? "Theo dõi thông báo, triển lãm và những trải nghiệm mới tại Muses."
            : "Stay up to date with museum notices, exhibitions and experiences."}
        </p>
      </header>
      <div className="museum-news-grid">
        {MUSEUM_NEWS.map((item) => (
          <NewsCard key={item.slug} item={item} lang={lang} />
        ))}
      </div>
    </div>
  );
}
export default function NewsArticle() {
  const { slug } = useParams(),
    { lang } = useLang(),
    vi = lang === "vi";
  const item = MUSEUM_NEWS.find((article) => article.slug === slug);
  if (!item)
    return (
      <div className="museum-news-page museum-news-missing">
        <h1>{vi ? "Không tìm thấy bài viết" : "Article not found"}</h1>
        <Link to="/news">
          {vi ? "Về trang tin tức" : "Back to museum news"}
        </Link>
      </div>
    );
  const copy = newsCopy(item, lang);
  return (
    <div className="museum-news-page">
      <article className="museum-news-article" lang={vi ? "vi" : "en"}>
        <Link className="museum-news-back" to="/news">
          <SvgIcon kind="arrow" direction="left" size={19} />
          {vi ? "Tin tức Muses" : "Museum news"}
        </Link>
        <div className="news-meta">
          <span>{copy.category}</span>
          <time dateTime={item.date}>{newsDate(item.date, lang)}</time>
        </div>
        <h1>{copy.title}</h1>
        <p className="museum-news-lead">{copy.summary}</p>
        <img className="museum-news-cover" src={item.image} alt={copy.title} />
        <div className="museum-news-text">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
            </section>
          ))}
          <Link className="museum-news-cta" to={item.href}>
            {copy.cta}
            <SvgIcon kind="arrow" size={20} />
          </Link>
        </div>
      </article>
      <section className="museum-news-related" aria-labelledby="more-news">
        <h2 id="more-news">{vi ? "Thông báo khác" : "More from Muses"}</h2>
        <div className="museum-news-grid">
          {MUSEUM_NEWS.filter((post) => post.slug !== slug).map((post) => (
            <NewsCard key={post.slug} item={post} lang={lang} />
          ))}
        </div>
      </section>
    </div>
  );
}
