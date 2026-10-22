import { useLayoutEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { HIGHLIGHTS } from "../../data/data";
import { useHomeImages } from "../../context/HomeImagesContext";
import "./Highlight.css";
import { SvgIcon } from "../Icons";

export default function Highlight() {
  const { t, lang } = useLang();
  const images = useHomeImages(HIGHLIGHTS, "highlight");
  const track = useRef(null);
  const count = images.length;
  const slides = [...images, ...images, ...images];
  const activeRef = useRef(count + Math.floor(count / 2));
  const resetting = useRef(false);
  const [active, setActive] = useState(activeRef.current);

  function moveTo(index, smooth = true) {
    const element = track.current;
    const target = Math.max(0, Math.min(slides.length - 1, index));
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
    let settleTimer;
    let resetFrame;
    let layoutWidth = element.clientWidth;
    const recenter = () => {
      const current = activeRef.current;
      if (current >= count && current < count * 2) return;
      const target = count + (((current % count) + count) % count);
      resetting.current = true;
      element.classList.add("is-resetting");
      activeRef.current = target;
      setActive(target);
      moveTo(target, false);
      if (element.contains(document.activeElement))
        element.children[target]?.focus({ preventScroll: true });
      cancelAnimationFrame(resetFrame);
      resetFrame = requestAnimationFrame(() => {
        resetting.current = false;
        element.classList.remove("is-resetting");
      });
    };
    const onScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(recenter, 180);
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
    element.addEventListener("scrollend", recenter);
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resetFrame);
      clearTimeout(settleTimer);
      element.removeEventListener("scrollend", recenter);
      element.removeEventListener("scroll", onScroll);
    };
  }, [images.length]);

  function keyboard(event) {
    const keys = {
      ArrowLeft: activeRef.current - 1,
      ArrowRight: activeRef.current + 1,
      Home: count,
      End: count * 2 - 1,
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
        {slides.map((item, index) => (
          <button
            type="button"
            key={`${item.id}-${index}`}
            className={`hl-card ${index === active ? "is-centered" : ""}`}
            aria-label={`${item.title}${item.date ? ` · ${item.date}` : ""}`}
            aria-current={index === active ? "true" : undefined}
            aria-hidden={index < count || index >= count * 2 ? true : undefined}
            tabIndex={index >= count && index < count * 2 ? 0 : -1}
            onClick={() => moveTo(index)}
            onFocus={() => {
              if (!resetting.current) moveTo(index);
            }}
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
          onClick={() => moveTo(activeRef.current - 1)}
        >
          <SvgIcon kind="arrow" direction="left" size={36} />
        </button>
        <p className="hl-sr-only" aria-live="polite">
          {(active % count) + 1} / {count}: {images[active % count]?.title}
        </p>
        <button
          type="button"
          aria-label={lang === "vi" ? "Ảnh tiếp theo" : "Next highlight"}
          onClick={() => moveTo(activeRef.current + 1)}
        >
          <SvgIcon kind="arrow" size={36} />
        </button>
      </div>
    </section>
  );
}
