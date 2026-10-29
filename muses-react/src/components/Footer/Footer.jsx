import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { ABOUT_LINKS, CONTACT_LINKS } from "../../data/data";
import "./Footer.css";
import { SvgIcon } from "../Icons";

export default function Footer() {
  const { t, lang } = useLang();
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let frame;
    const update = () => {
      frame = undefined;
      const intro = document.querySelector("main [data-scroll-intro]");
      setShowTop(
        intro
          ? window.scrollY > 0 && intro.getBoundingClientRect().bottom <= 0
          : window.scrollY >= window.innerHeight,
      );
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    const intro = document.querySelector("main [data-scroll-intro]");
    if (intro) observer.observe(intro);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const topLabels = {
    vi: "Lên đầu trang",
    en: "Back to top",
    zh: "返回顶部",
    ja: "ページの先頭へ",
    ko: "맨 위로",
  };
  return (
    <footer className="footer">
      <div className="f-cols">
        <div>
          <h4>{t("about")}</h4>
          {ABOUT_LINKS.map((l) => (
            <a key={l} href="#">
              {t(l)}
            </a>
          ))}
        </div>
        <div>
          <h4>{t("contact")}</h4>
          {CONTACT_LINKS.map((l) => (
            <a key={l} href="#">
              {t(l)}
            </a>
          ))}
        </div>
        <div>
          <h4>{t("follow")}</h4>
          <div className="socials">
            {[
              ["facebook", "Facebook"],
              ["instagram", "Instagram"],
              ["twitter", "Twitter"],
            ].map(([s, name]) => (
              <a key={s} href="#" className="social" aria-label={name}>
                <SvgIcon kind={s} size={36} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="f-logo">MUSES</div>
      {showTop && (
        <button
          type="button"
          className="to-top"
          aria-label={topLabels[lang] || topLabels.en}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
            })
          }
        >
          <SvgIcon
            kind="chevron"
            size={22}
            style={{ transform: "rotate(180deg)" }}
          />
        </button>
      )}
    </footer>
  );
}
