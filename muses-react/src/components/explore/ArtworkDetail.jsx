import { trackAudio } from "../../api/activity.mjs";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import {
  CONTENT_LANGUAGES,
  contentLanguage,
} from "../../api/contentLanguages.mjs";
import ArtworkQR from "../Scanner/ArtworkQR";
import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useArtworks, ArtworkImage, RequestState } from "./Artworks";
import { mediaUrl } from "../../api/artworks";
import indoorMap from "../../../maps/Mapindoormain.png";
import "./artwork-detail.css";
import Narration from "../Narration/Narration";
import { SvgIcon } from "../Icons";

function RelatedArtworks({ artwork, vi }) {
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
          {vi ? "CÁC TÁC PHẨM CÙNG NGHỆ SĨ" : "MORE BY THE SAME ARTIST"}
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
                aria-label={vi ? "Tác phẩm trước" : "Previous artworks"}
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
                aria-label={vi ? "Tác phẩm tiếp theo" : "Next artworks"}
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
            {vi
              ? "Chưa có tác phẩm khác của nghệ sĩ này trong bộ sưu tập."
              : "More works by this artist will be added to the collection."}
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
  return (
    <div className="artwork-detail-page">
      <div className="detail-language-bar" style={{ padding: "100px 5% 0" }}>
        <label>
          {vi ? "Ngôn ngữ nội dung" : "Content language"}
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
                  {vi ? "Bộ sưu tập" : "The collection"}
                </Link>
                <h1>{artwork.title}</h1>
                <p className="detail-short-description">
                  {artwork.shortDescription ||
                    artwork.description ||
                    (vi
                      ? "Khám phá tác phẩm trong bộ sưu tập Muses."
                      : "Discover this work in the Muses collection.")}
                </p>
                <dl className="detail-facts">
                  {[
                    [vi ? "NGHỆ SĨ" : "ARTIST", artwork.artist],
                    [vi ? "CHẤT LIỆU" : "MATERIAL", artwork.material],
                    [vi ? "NĂM" : "YEAR", artwork.creationPeriod],
                    [vi ? "KÍCH THƯỚC" : "DIMENSIONS", artwork.dimensions],
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
                    ◇ {vi ? "Bảo vật quốc gia" : "National treasure"}
                    {artwork.treasureYear ? ` · ${artwork.treasureYear}` : ""}
                  </p>
                )}
                {mediaUrl(artwork.audioUrl) && (
                  <div className="detail-audio">
                    <h2>{vi ? "Nghe thuyết minh" : "Audio guide"}</h2>
                    <audio
                      controls
                      onPlay={(event) => {
                        window.dispatchEvent(new Event("muses-audio-play"));
                        if (!event.currentTarget.dataset.counted) {
                          trackAudio(contentLanguage(lang));
                          event.currentTarget.dataset.counted = "true";
                        }
                      }}
                      onEnded={(event) => {
                        delete event.currentTarget.dataset.counted;
                      }}
                      preload="none"
                      src={mediaUrl(artwork.audioUrl)}
                      key={`${id}-${artwork.audioUrl}`}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="detail-editorial">
              <section aria-labelledby="description-title">
                <h2 id="description-title">{vi ? "MÔ TẢ" : "DESCRIPTION"}</h2>
                {artwork.description ? (
                  <Narration
                    key={`${id}-${artwork.descriptionLanguage || (vi ? "vi" : "en")}`}
                    text={artwork.description}
                    language={artwork.descriptionLanguage || (vi ? "vi" : "en")}
                    requestedLanguage={contentLanguage(lang)}
                    vi={vi}
                  />
                ) : (
                  <p>
                    {vi
                      ? "Mô tả tác phẩm đang được cập nhật."
                      : "The description of this artwork is being prepared."}
                  </p>
                )}
                {artwork.translationSource === "automatic" && (
                  <p className="detail-translation-status">
                    {vi ? "Bản dịch tự động" : "Automatic translation"}
                  </p>
                )}
                {(artwork.translationStatus === "unavailable" ||
                  (artwork.descriptionLanguage &&
                    artwork.descriptionLanguage !== contentLanguage(lang))) && (
                  <p className="detail-translation-status" role="status">
                    {vi
                      ? "Chưa có bản dịch. Đang hiển thị bản gốc."
                      : "Translation unavailable. Showing the original."}{" "}
                    <button onClick={state.retry}>
                      {vi ? "Thử lại" : "Retry"}
                    </button>
                  </p>
                )}
              </section>
              <section aria-labelledby="history-title">
                <h2 id="history-title">{vi ? "LỊCH SỬ" : "HISTORY"}</h2>
                <p>
                  {artwork.history ||
                    (vi
                      ? "Thông tin về lịch sử tác phẩm đang được cập nhật."
                      : "The history of this artwork is being prepared.")}
                </p>
              </section>
            </div>
          </article>
          <RelatedArtworks key={id} artwork={artwork} vi={vi} />
          <section className="detail-map-section">
            <Link to="/visit#directions" className="detail-map-link">
              <img
                src={indoorMap}
                alt={
                  vi
                    ? "Sơ đồ các phòng trưng bày bảo tàng"
                    : "Museum gallery floor plan"
                }
              />
              <span>
                {vi
                  ? "BẢN ĐỒ TƯƠNG TÁC CỦA BẢO TÀNG"
                  : "INTERACTIVE MAPS OF THE MUSEUM"}
              </span>
              <i aria-hidden="true">
                <SvgIcon kind="arrow" size={24} />
              </i>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
