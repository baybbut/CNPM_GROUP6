import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { GALLERY } from "../../data/data";
import Art from "../Art/Art";
import "./Welcome.css";

export default function Welcome() {
  const { t } = useLang();

  const galleryRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(gallery);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="welcome">
      <h2 className="title light">{t("welcomeTitle")}</h2>

      <div className="gallery" ref={galleryRef}>
        {GALLERY.map((g, index) => (
          <Art
            key={g.id}
            item={g}
            animate
            visible={visible}
            delay={index * 140}
          />
        ))}
      </div>

      <button className="btn btn-white">
        {t("exploreBtn")}
      </button>
    </section>
  );
}