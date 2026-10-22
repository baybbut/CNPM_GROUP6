
import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import { getArtworks, getArtwork } from "../../api";
import { GALLERY } from "../../data/data";
import Art from "../Art/Art";
import "./Welcome.css";

export default function Welcome() {
  const { t } = useLang();

  const galleryRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  async function handleArtworkClick(artworkId) {
    if (!artworkId) return;

    setSelectedArtwork(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const artwork = await getArtwork(artworkId, "vi");
      setSelectedArtwork(artwork);
    } catch (err) {
      setDetailError(
        err.message || "Không tải được chi tiết tác phẩm."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadArtworks() {
      try {
        const data = await getArtworks("vi");

        if (!cancelled) {
          setArtworks(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không tải được danh sách tác phẩm.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArtworks();

    return () => {
      cancelled = true;
    };
  }, []);

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
      { threshold: 0.1 }
    );

    async function handleArtworkClick(artworkId) {
      if (!artworkId) return;

      setSelectedArtwork(null);
      setDetailError("");
      setDetailLoading(true);

      try {
        const artwork = await getArtwork(artworkId, "vi");
        setSelectedArtwork(artwork);
      } catch (err) {
        setDetailError(
          err.message || "Không tải được chi tiết tác phẩm."
        );
      } finally {
        setDetailLoading(false);
      }
    }

    observer.observe(gallery);

    return () => observer.disconnect();
  }, []);

  const galleryItems = GALLERY.map((item, index) => {
    const artwork = artworks.find(
      (art) => Number(art.id) === item.artworkId
    );

    return {
      ...item,
      title: artwork?.title || "",
      artist: artwork?.artist || "",
      material: artwork?.material || "",
      imageUrl: artwork?.imageUrl || null,
    };
  });


  return (
    <section className="welcome">
      <h2 className="title light">{t("welcomeTitle")}</h2>

      {error && (
        <p role="status">
          Không tải được dữ liệu mới; đang hiển thị ảnh có sẵn.
        </p>
      )}

      {loading && <p role="status">Đang tải tác phẩm...</p>}

      <div className="gallery" ref={galleryRef}>
        {galleryItems.map((item, index) => (
          <Art
            key={item.id}
            item={{
              ...item,
              color: "#d8d0bd",
            }}
            animate
            visible={visible}
            delay={index * 140}
            onClick={() => handleArtworkClick(item.artworkId)}
          />
        ))}
      </div>

      <button
        type="button"
        className="btn btn-white"
        onClick={() => {
          document
            .querySelector(".gallery")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      >
        {t("exploreBtn")}
      </button>

      {(detailLoading || detailError || selectedArtwork) && (
        <div
          className="artwork-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết tác phẩm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedArtwork(null);
              setDetailError("");
            }
          }}
        >
          <div className="artwork-modal-content">
            <button
              type="button"
              className="artwork-modal-close"
              onClick={() => {
                setSelectedArtwork(null);
                setDetailError("");
              }}
              aria-label="Đóng chi tiết"
            >
              ×
            </button>

            {detailLoading && <p>Đang tải chi tiết tác phẩm...</p>}

            {detailError && <p role="alert">{detailError}</p>}

            {selectedArtwork && (
              <>
                <h2>{selectedArtwork.title}</h2>
                <p><strong>Họa sĩ:</strong> {selectedArtwork.artist || "Chưa có dữ liệu"}</p>
                <p><strong>Thể loại:</strong> {selectedArtwork.category || "Chưa có dữ liệu"}</p>
                <p><strong>Chất liệu:</strong> {selectedArtwork.material || "Chưa có dữ liệu"}</p>
                <p><strong>Thời gian sáng tác:</strong> {selectedArtwork.creationPeriod || "Chưa có dữ liệu"}</p>
                <p><strong>Kích thước:</strong> {selectedArtwork.dimensions || "Chưa có dữ liệu"}</p>
                <p>
                  <strong>Mô tả:</strong>{" "}
                  {selectedArtwork.description ||
                    selectedArtwork.shortDescription ||
                    "Chưa có mô tả cho tác phẩm này."}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );

}
