import { useLayoutEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { HIGHLIGHTS } from "../../data/data";
import { useHomeImages } from "../../context/HomeImagesContext";
import "./Highlight.css";

export default function Highlight() {
  const { t, lang } = useLang();
  const images = useHomeImages(HIGHLIGHTS, "highlight");
  const track = useRef(null);
  const activeRef = useRef(Math.floor(images.length / 2));
  const [active, setActive] = useState(activeRef.current);

  function moveTo(index, smooth = true) {
    const element = track.current;
    const target = Math.max(0, Math.min(images.length - 1, index));
    const card = element?.children[target];
    if (!card) return;
    element.scrollTo({
      left: card.offsetLeft - (element.clientWidth - card.offsetWidth) / 2,
      behavior:
        smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "instant",
    });
  }

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame;
    let layoutWidth = element.clientWidth;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (element.clientWidth !== layoutWidth) return;
        const center = element.scrollLeft + element.clientWidth / 2;
        const distances = [...element.children].map((card) =>
          Math.abs(card.offsetLeft + card.offsetWidth / 2 - center),
        );
        const next = distances.indexOf(Math.min(...distances));
        activeRef.current = next;
        setActive(next);
      });
    };
    const resize = new ResizeObserver(() => {
      layoutWidth = element.clientWidth;
      moveTo(activeRef.current, false);
    });
    resize.observe(element);
    moveTo(activeRef.current, false);
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
  }, [images.length]);

  function keyboard(event) {
    const keys = {
      ArrowLeft: activeRef.current - 1,
      ArrowRight: activeRef.current + 1,
      Home: 0,
      End: images.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      moveTo(keys[event.key]);
    }
  }

  return (
    <section
      className="highlight"
      aria-roledescription="carousel"
      aria-label={t("highlight")}
    >
      <h2 className="title">{t("highlight")}</h2>
      <div className="hl-track" ref={track} onKeyDown={keyboard} dir="ltr">
        {images.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`hl-card ${index === active ? "is-centered" : ""}`}
            aria-label={`${item.title}${item.date ? ` · ${item.date}` : ""}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => moveTo(index)}
            onFocus={() => moveTo(index)}
          >
            <span className="hl-picture">
              <img src={item.img} alt={item.title} draggable="false" />
              <span className="hl-caption">
                {item.title}
                {item.date && <small>{item.date}</small>}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="hl-controls">
        <button
          type="button"
          aria-label={lang === "vi" ? "Ảnh trước" : "Previous highlight"}
          disabled={active === 0}
          onClick={() => moveTo(activeRef.current - 1)}
        >
          <span aria-hidden="true">⟵</span>
        </button>
        <p className="hl-sr-only" aria-live="polite">
          {active + 1} / {images.length}: {images[active]?.title}
        </p>
        <button
          type="button"
          aria-label={lang === "vi" ? "Ảnh tiếp theo" : "Next highlight"}
          disabled={active === images.length - 1}
          onClick={() => moveTo(activeRef.current + 1)}
        >
          <span aria-hidden="true">⟶</span>
        </button>
      </div>
    </section>
  );
}
