import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalog } from "../../api/catalog.mjs";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { SvgIcon } from "../Icons";
import { ArtworkImage, RequestState } from "./Artworks";
import "./sculpture-showcase.css";

export default function SculptureShowcase() {
  const { lang } = useLang();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, items: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lang, category: "Tác phẩm điêu khắc" });
    setState({ loading: true, items: [], error: null });

    catalog(`/api/catalog/artworks?${params}`, controller.signal)
      .then(({ items }) => {
        if (!controller.signal.aborted) {
          setState({ loading: false, items: items.slice(0, 4), error: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ loading: false, items: [], error });
        }
      });

    return () => controller.abort();
  }, [lang, attempt]);

  const { loading, items, error } = state;
  if (!loading && !error && !items.length) return null;

  return (
    <section className="sculpture-showcase" aria-labelledby="sculpture-title">
      <h2 id="sculpture-title">{label(lang, "Sculpture")}</h2>
      <RequestState
        loading={loading}
        error={error}
        lang={lang}
        retry={() => setAttempt((n) => n + 1)}
      />
      {items.length > 0 && (
        <div className="sculpture-grid">
          {items.map((artwork) => (
            <Link
              className="sculpture-work"
              key={artwork.id}
              to={`/explore/artworks/${artwork.id}?lang=${lang}`}
            >
              <div className="sculpture-image">
                <ArtworkImage artwork={artwork} />
              </div>
              <div className="sculpture-caption">
                <div>
                  <h3>{artwork.title}</h3>
                  <p>{artwork.artist}</p>
                  {artwork.isDemo && (
                    <small>{label(lang, "Demonstration data — not a real exhibition.")}</small>
                  )}
                </div>
                <span aria-hidden="true">
                  <SvgIcon kind="arrow" size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}