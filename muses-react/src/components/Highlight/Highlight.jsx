import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { HIGHLIGHTS } from "../../data/data";
import { useHomeImages } from "../../context/HomeImagesContext";
import { useArtworks, ArtworkImage, RequestState } from "../explore/Artworks";
import { highlightArtworks, nextHighlight } from "./highlightModel.mjs";
import { SvgIcon } from "../Icons";
import "./Highlight.css";

export default function Highlight() {
  const { t, lang } = useLang();
  const slots = useHomeImages(HIGHLIGHTS, "highlight");
  const catalogue = useArtworks();
  const items = useMemo(
    () => highlightArtworks(catalogue.data || [], slots),
    [catalogue.data, slots],
  );
  const [active, setActive] = useState(2);
  const track = useRef(null);
  const current = Math.min(active, Math.max(0, items.length - 1));
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const center = (smooth) => {
      const card = element.children[current];
      if (!card || !window.matchMedia("(max-width: 760px)").matches) return;
      element.scrollTo({
        left: card.offsetLeft - (element.clientWidth - card.offsetWidth) / 2,
        behavior:
          smooth &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "smooth"
            : "instant",
      });
    };
    let width = element.clientWidth;
    const resize = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        center(false);
      }
    });
    resize.observe(element);
    center(true);
    return () => resize.disconnect();
  }, [current, items.length]);
  function move(delta, focus = false) {
    const next = nextHighlight(current, delta, items.length);
    setActive(next);
    if (focus)
      track.current?.children[next]
        ?.querySelector(".hl-select")
        ?.focus({ preventScroll: true });
  }
  function keyboard(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight")
      move(event.key === "ArrowRight" ? 1 : -1, true);
    else {
      const next = event.key === "Home" ? 0 : items.length - 1;
      setActive(next);
      track.current?.children[next]
        ?.querySelector(".hl-select")
        ?.focus({ preventScroll: true });
    }
  }
  function swipeEnd() {
    const element = track.current;
    if (!element || !window.matchMedia("(max-width: 760px)").matches) return;
    const center = element.scrollLeft + element.clientWidth / 2;
    const distance = [...element.children].map((card) =>
      Math.abs(card.offsetLeft + card.offsetWidth / 2 - center),
    );
    if (distance.length) setActive(distance.indexOf(Math.min(...distance)));
  }
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let timer;
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(swipeEnd, 160);
    };
    element.addEventListener("scroll", settle, { passive: true });
    element.addEventListener("scrollend", swipeEnd);
    return () => {
      clearTimeout(timer);
      element.removeEventListener("scroll", settle);
      element.removeEventListener("scrollend", swipeEnd);
    };
  }, [items.length]);
  return (
    <section className="highlight" aria-label={t("highlight")}>
      <div className="hl-heading">
        <h2>{t("highlight")}</h2>
        <div>
          <p>{label(lang, "Discover the collection")}</p>
          <Link to="/visit#hours">
            {label(lang, "Plan your visit")}
            <SvgIcon kind="arrow" size={18} />
          </Link>
        </div>
      </div>
      <RequestState {...catalogue} />
      {!catalogue.loading && !catalogue.error && !items.length && (
        <p className="hl-empty">{label(lang, "No results found.")}</p>
      )}
      {items.length > 0 && (
        <>
          <div className="hl-track" ref={track} onKeyDown={keyboard} dir="ltr">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`hl-card ${index === current ? "is-active" : ""}`}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(index);
                }}
                onFocusCapture={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <div className="hl-picture">
                  <ArtworkImage artwork={item} />
                </div>
                <span className="hl-category">
                  {item.category || label(lang, "Artworks")}
                </span>
                <div className="hl-caption">
                  <h3>
                    <button
                      type="button"
                      className="hl-select"
                      aria-expanded={index === current}
                      aria-controls={`hl-details-${item.id}`}
                      onClick={() => setActive(index)}
                    >
                      {item.title}
                    </button>
                  </h3>
                  <p className="hl-meta">
                    {[item.artist, item.creationPeriod]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div
                    className="hl-details"
                    id={`hl-details-${item.id}`}
                    hidden={index !== current}
                  >
                    {(item.shortDescription || item.description) && (
                      <p>{item.shortDescription || item.description}</p>
                    )}
                    <Link to={`/explore/artworks/${item.id}?lang=${lang}`}>
                      {label(lang, "View artwork")}
                      <SvgIcon kind="arrow" size={20} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="hl-footer">
            <p className="hl-position" aria-live="polite" aria-atomic="true">
              <span>{String(current + 1).padStart(2, "0")}</span>
              <span className="hl-divider" />{" "}
              {String(items.length).padStart(2, "0")}
            </p>
            <Link className="hl-collection" to="/explore/collection">
              {label(lang, "Explore collection")}
              <SvgIcon kind="arrow" size={22} />
            </Link>
            <div className="hl-controls">
              <button
                type="button"
                disabled={items.length < 2}
                aria-label={label(lang, "Previous highlight")}
                onClick={() => move(-1)}
              >
                <SvgIcon kind="arrow" direction="left" size={25} />
              </button>
              <button
                type="button"
                disabled={items.length < 2}
                aria-label={label(lang, "Next highlight")}
                onClick={() => move(1)}
              >
                <SvgIcon kind="arrow" size={25} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
