import { useLang } from "../../context/LangContext";
import { HIGHLIGHTS } from "../../data/data";
import Art from "../Art/Art";
import "./Highlight.css";

export default function Highlight() {
  const { t } = useLang();
  return (
  <section className="highlight">
    <h2 className="title">{t("highlight")}</h2>

    <svg className="hl-arrows" viewBox="0 0 734 376" aria-hidden="true">
      <defs>
        <marker id="hl-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M1 1L9 5L1 9" fill="none" stroke="#222" strokeWidth="1.2" />
        </marker>
      </defs>
      <g fill="none" stroke="#222" strokeWidth="1.1" markerEnd="url(#hl-head)">
        <path d="M375 70 Q410 35 468 34" />
        <path d="M587 110 Q650 60 662 145" />
        <path d="M122 257 Q50 255 57 201" />
        <path d="M283 314 Q250 335 208 329" />
      </g>
    </svg>

    {HIGHLIGHTS.map((h) => <Art key={h.id} item={h} />)}
    {HIGHLIGHTS.map((h) => (
      <span key={h.id} className={`date d-${h.cls}`}>{h.date}</span>
    ))}
  </section>
);
}
