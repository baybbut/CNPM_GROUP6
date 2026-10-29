import { CurrentExhibition } from "../Museums/Museums";
import { label } from "../../i18n/catalog.mjs";
import { trackAudio } from "../../api/activity.mjs";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import {
  CONTENT_LANGUAGES,
  contentLanguage,
} from "../../api/contentLanguages.mjs";
import ArtworkQR from "../Scanner/ArtworkQR";
import { useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useArtworks, ArtworkImage, RequestState } from "./Artworks";
import { mediaUrl } from "../../api/artworks";
import "./artwork-detail.css";
import Narration from "../Narration/Narration";
import { SvgIcon } from "../Icons";

function RelatedArtworks({ artwork, vi }) {
  const { lang } = useLang();
  const state = useArtworks();
  const track = useRef(null);
  const related = (state.data || []).filter(
    (item) =>
      String(item.id) !== String(artwork.id) &&
      (item.artistId != null && artwork.artistId != null
        ? String(item.artistId) === String(artwork.artistId)
        : item.artist === artwork.artist),
  );
  return (
    <section
      className="detail-related"
      aria-labelledby="related-artworks-title"
    >
      <div className="detail-related-heading">
        <h2 id="related-artworks-title">
          {label(lang, "MORE BY THE SAME ARTIST", "CÁC TÁC PHẨM CÙNG NGHỆ SĨ")}
        </h2>
        <span>{artwork.artist}</span>
      </div>
      <RequestState {...state} />
      {!state.loading &&
        !state.error &&
        (related.length ? (
          <>
            <div className="detail-related-track" ref={track}>
              {related.map((item) => (
                <Link
                  className="detail-related-card"
                  key={item.id}
                  to={`/explore/artworks/${item.id}`}
                >
                  <div className="detail-related-image">
                    <ArtworkImage artwork={item} />
                  </div>
                  <h3>{item.title}</h3>
                  {item.creationPeriod && <p>{item.creationPeriod}</p>}
                </Link>
              ))}
            </div>
            <div className="detail-related-controls">
              <button
                type="button"
                aria-label={label(lang, "Previous artworks", "Tác phẩm trước")}
                onClick={() =>
                  track.current?.scrollBy({
                    left: -track.current.clientWidth * 0.8,
                    behavior: "smooth",
                  })
                }
              >
                <SvgIcon kind="arrow" direction="left" size={32} />
              </button>
              <button
                type="button"
                aria-label={label(lang, "Next artworks", "Tác phẩm tiếp theo")}
                onClick={() =>
                  track.current?.scrollBy({
                    left: track.current.clientWidth * 0.8,
                    behavior: "smooth",
                  })
                }
              >
                <SvgIcon kind="arrow" size={32} />
              </button>
            </div>
          </>
        ) : (
          <p className="detail-related-empty">
            {label(
              lang,
              "More works by this artist will be added to the collection.",
              "Chưa có tác phẩm khác của nghệ sĩ này trong bộ sưu tập.",
            )}
          </p>
        ))}
    </section>
  );
}

export default function ArtworkDetail() {
  const { id } = useParams();
  const { lang, setLang } = useLang();
  const [query, setQuery] = useSearchParams();
  const state = useArtworks(id);
  const { data: artwork, loading, error, vi } = state;
  const audioRef = useRef(null);
  useEffect(() => {
    const player = audioRef.current;
    return () => player?.pause();
  }, [id, lang, artwork?.audioUrl]);
  return (
    <div className="artwork-detail-page">
      <div className="detail-language-bar" style={{ padding: "100px 5% 0" }}>
        <label>
          {label(lang, "Content language", "Ngôn ngữ nội dung")}
          <select
            value={contentLanguage(lang)}
            onChange={(e) => {
              setLang(e.target.value);
              const next = new URLSearchParams(query);
              next.set("lang", e.target.value);
              setQuery(next, { replace: true });
            }}
          >
            {CONTENT_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <ArtworkQR id={id} language={contentLanguage(lang)} vi={vi} />
      </div>
      <RequestState {...state} />
      {!loading && !error && artwork && (
        <>
          <article className="detail-content">
            <div className="detail-intro">
              <div className="detail-main-image">
                <ArtworkImage artwork={artwork} />
              </div>
              <div className="detail-summary">
                <Link className="detail-back" to="/explore/collection">
                  <SvgIcon kind="arrow" direction="left" size={17} />{" "}
                  {label(lang, "The collection", "Bộ sưu tập")}
                </Link>
                <h1>{artwork.title}</h1>
                <p className="detail-short-description">
                  {artwork.shortDescription ||
                    artwork.description ||
                    label(
                      lang,
                      "Discover this work in the Muses collection.",
                      "Khám phá tác phẩm trong bộ sưu tập Muses.",
                    )}
                </p>
                <dl className="detail-facts">
                  {[
                    [label(lang, "ARTIST", "NGHỆ SĨ"), artwork.artist],
                    [label(lang, "MATERIAL", "CHẤT LIỆU"), artwork.material],
                    [label(lang, "YEAR", "NĂM"), artwork.creationPeriod],
                    [
                      label(lang, "DIMENSIONS", "KÍCH THƯỚC"),
                      artwork.dimensions,
                    ],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}:</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                </dl>
                {Boolean(artwork.isNationalTreasure) && (
                  <p className="detail-treasure">
                    ◇ {label(lang, "National treasure", "Bảo vật quốc gia")}
                    {artwork.treasureYear ? ` · ${artwork.treasureYear}` : ""}
                  </p>
                )}
                {mediaUrl(artwork.audioUrl) && (
                  <div className="detail-audio">
                    <h2>{label(lang, "Audio guide", "Nghe thuyết minh")}</h2>
                    <audio
                      ref={audioRef}
                      controls
                      onPlay={(event) => {
                        window.dispatchEvent(new Event("muses-audio-play"));
                        if (!event.currentTarget.dataset.counted) {
                          trackAudio(
                            artwork.contentLanguage ||
                              artwork.descriptionLanguage,
                          );
                          event.currentTarget.dataset.counted = "true";
                        }
                      }}
                      onEnded={(event) => {
                        delete event.currentTarget.dataset.counted;
                      }}
                      preload="none"
                      src={mediaUrl(artwork.audioUrl)}
                      key={`${id}-${lang}-${artwork.contentLanguage}-${artwork.audioUrl}`}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="detail-editorial">
              <section aria-labelledby="description-title">
                <h2 id="description-title">
                  {label(lang, "DESCRIPTION", "MÔ TẢ")}
                </h2>
                {artwork.description ? (
                  <Narration
                    key={`${id}-${lang}-${artwork.contentLanguage}`}
                    text={artwork.description}
                    language={
                      artwork.contentLanguage ||
                      artwork.descriptionLanguage ||
                      "vi"
                    }
                    requestedLanguage={contentLanguage(lang)}
                    vi={vi}
                  />
                ) : (
                  <p>
                    {label(
                      lang,
                      "The description of this artwork is being prepared.",
                      "Mô tả tác phẩm đang được cập nhật.",
                    )}
                  </p>
                )}
                {artwork.isFallback && (
                  <p className="detail-translation-status" role="status">
                    {label(
                      lang,
                      "Published translation unavailable; showing Vietnamese.",
                    )}
                  </p>
                )}
                <p>
                  <strong>{label(lang, "Source")}: </strong>
                  {artwork.source}
                </p>
                {artwork.imageSource && (
                  <p>
                    <strong>{label(lang, "Image source")}: </strong>
                    {artwork.imageSource}
                  </p>
                )}
                {artwork.isDemo && (
                  <p className="catalog-demo">
                    {label(lang, "Demonstration data — not a real exhibition.")}
                  </p>
                )}
              </section>
              <section aria-labelledby="history-title">
                <h2 id="history-title">{label(lang, "HISTORY", "LỊCH SỬ")}</h2>
                <p>
                  {artwork.history ||
                    label(
                      lang,
                      "The history of this artwork is being prepared.",
                      "Thông tin về lịch sử tác phẩm đang được cập nhật.",
                    )}
                </p>
              </section>
            </div>
          </article>
          <RelatedArtworks key={id} artwork={artwork} vi={vi} />
          <div style={{ padding: "0 5% 50px" }}>
            <CurrentExhibition artwork={artwork} />
          </div>
        </>
      )}
    </div>
  );
}
