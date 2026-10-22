import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { GALLERY } from "../../data/data";
import Art from "../Art/Art";
import { Link } from "react-router-dom";
import { useArtworks, RequestState } from "../explore/Artworks";
import "./Welcome.css";

import { useHomeImages } from "../../context/HomeImagesContext";

export default function Welcome() {
  const { t, lang } = useLang();
  const [selectedId, setSelectedId] = useState(null);
  const trigger = useRef(null);
  const images = useHomeImages(GALLERY, "welcome");

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
      },
    );

    observer.observe(gallery);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="welcome">
      <h2 className="title light">{t("welcomeTitle")}</h2>

      <div className="gallery" ref={galleryRef}>
        {images.map((g, index) => (
          <Art
            key={g.id}
            item={g}
            animate
            visible={visible}
            delay={index * 140}
            onClick={
              g.artworkId
                ? (event) => {
                    trigger.current = event.currentTarget;
                    setSelectedId(g.artworkId);
                  }
                : undefined
            }
          />
        ))}
      </div>

      <Link className="btn btn-white" to="/explore/collection">
        {t("exploreBtn")}
      </Link>
      {selectedId && (
        <ArtworkPreview
          id={selectedId}
          vi={lang === "vi"}
          onClose={() => {
            setSelectedId(null);
            trigger.current?.focus();
          }}
        />
      )}
    </section>
  );
}

function ArtworkPreview({ id, vi, onClose }) {
  const state = useArtworks(id);
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    dialog.current?.querySelector("button")?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const artwork = state.data;
  return (
    <div
      className="artwork-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <section
        ref={dialog}
        className="artwork-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={vi ? "Chi tiết tác phẩm" : "Artwork details"}
        onKeyDown={(e) => {
          if (e.key === "Escape") close.current();
          if (e.key === "Tab") {
            const nodes = dialog.current.querySelectorAll("button,a[href]");
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <button
          className="artwork-modal-close"
          onClick={onClose}
          aria-label={vi ? "Đóng" : "Close"}
        >
          ×
        </button>
        <RequestState {...state} />
        {!state.loading && !state.error && artwork && (
          <>
            <h2>{artwork.title}</h2>
            {[
              [vi ? "Nghệ sĩ" : "Artist", artwork.artist],
              [vi ? "Thể loại" : "Category", artwork.category],
              [vi ? "Chất liệu" : "Material", artwork.material],
              [vi ? "Năm" : "Year", artwork.creationPeriod],
              [vi ? "Kích thước" : "Dimensions", artwork.dimensions],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <p key={label}>
                  <strong>{label}: </strong>
                  {value}
                </p>
              ))}
            <p>{artwork.description || artwork.shortDescription}</p>
            <Link to={`/explore/artworks/${id}`} className="btn btn-brown">
              {vi ? "Xem tác phẩm" : "View artwork"}
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
