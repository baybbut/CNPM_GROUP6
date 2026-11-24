import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalog } from "../../api/catalog.mjs";
import { useLang } from "../../context/LangContext";
import { sculptureDisplay } from "../../data/sculptureDisplay";
import { label } from "../../i18n/catalog.mjs";
import "./sculpture-showcase.css";

export default function SculptureShowcase() {
  const { lang } = useLang();
  const [selected, setSelected] = useState(2);
  const [published, setPublished] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lang, category: "Tác phẩm điêu khắc" });
    setPublished([]);
    catalog(`/api/catalog/artworks?${params}`, controller.signal)
      .then(({ items }) => {
        if (!controller.signal.aborted) setPublished(items);
      })
      .catch(() => {}); // The local poster and captions also work offline.
    return () => controller.abort();
  }, [lang]);

  const selectedWork = sculptureDisplay[selected];
  const record = published.find((item) =>
    item.imageUrl?.split(/[?#]/)[0].endsWith("/" + selectedWork.filename)
  );
  const description = record?.shortDescription || record?.description;

  return (
    <section className="sculpture-showcase" aria-labelledby="sculpture-title">
      <svg width="0" height="0" className="sculpture-filter" aria-hidden="true">
        <defs>
          <filter id="sculpture-paper" colorInterpolationFilters="sRGB">
            {/* Make the light studio backdrops transparent before casting the shadow. */}
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -6 -12 -2 0 18.7" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>
      <div className="sculpture-poster">
        <div className="sculpture-stage">
          {sculptureDisplay.map((work, index) => (
            <button className="sculpture-panel" key={work.filename} type="button"
              aria-label={work.title} aria-pressed={index === selected}
              aria-controls="sculpture-caption" onClick={() => setSelected(index)}>
              <span className="sculpture-object">
                <img src={work.image} alt="" loading="lazy" />
              </span>
            </button>
          ))}
        </div>
        <div className="sculpture-caption" id="sculpture-caption" aria-live="polite">
          <h2 id="sculpture-title">{label(lang, "Sculpture")}</h2>
          <h3>{record?.title || selectedWork.title}</h3>
          <p lang={description ? record.contentLanguage : lang === "vi" ? "vi" : "en"}>
            {description || (lang === "vi" ? selectedWork.description : selectedWork.en)}
          </p>
          {record && <Link to={`/explore/artworks/${record.id}?lang=${lang}`}>{label(lang, "View artwork")} →</Link>}
        </div>
      </div>
    </section>
  );
}
