import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { fetchArtworks, mediaUrl } from "../../api/artworks";
import "./artworks.css";

function useArtworks(id) {
  const { lang } = useLang();
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    setState({ loading: true, data: null, error: null });
    fetchArtworks(lang, id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted || timedOut)
          setState({ loading: false, data: null, error });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [lang, id, attempt]);
  return {
    ...state,
    retry: () => setAttempt((n) => n + 1),
    lang,
    vi: lang === "vi",
  };
}

function ArtworkImage({ artwork }) {
  const src = mediaUrl(artwork.imageUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      src={src}
      alt={artwork.title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="aw-no-image" role="img" aria-label={artwork.title}>
      <span>◇</span>
      <small>MUSES COLLECTION</small>
    </div>
  );
}

function RequestState({ loading, error, retry, vi }) {
  if (loading)
    return (
      <div className="aw-request" role="status">
        <span className="aw-loader" />
        {vi ? "Đang tải bộ sưu tập…" : "Loading the collection…"}
      </div>
    );
  if (error)
    return (
      <div className="aw-request" role="alert">
        <h3>
          {error.status === 404
            ? vi
              ? "Không tìm thấy tác phẩm"
              : "Artwork not found"
            : vi
              ? "Chưa thể tải dữ liệu"
              : "The collection is unavailable"}
        </h3>
        <p>
          {vi
            ? "Vui lòng thử lại hoặc quay lại sau."
            : "Please try again or come back in a moment."}
        </p>
        <button onClick={retry}>{vi ? "Thử lại" : "Try again"}</button>
      </div>
    );
  return null;
}

export function ArtworkCollection({ compact = false }) {
  const state = useArtworks();
  const { data, loading, error, vi } = state;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = [
    ...new Map(
      (data || []).map((a) => [String(a.categoryId), a.category]),
    ).entries(),
  ];
  const filtered = (data || []).filter(
    (a) =>
      (!category || String(a.categoryId) === category) &&
      `${a.title} ${a.artist} ${a.category}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const visible = compact ? filtered.slice(0, 4) : filtered;
  return (
    <section
      className={`aw-section ${compact ? "aw-compact" : ""}`}
      aria-labelledby="collection-title"
    >
      <div className="aw-heading">
        <div>
          <p className="aw-eyebrow">
            MUSES · {vi ? "BỘ SƯU TẬP" : "THE COLLECTION"}
          </p>
          <h2 id="collection-title">
            {vi
              ? "Khám phá những câu chuyện qua nghệ thuật"
              : "Discover the stories behind the art"}
          </h2>
        </div>
        {compact && (
          <Link className="aw-link" to="/explore/collection">
            {vi ? "Xem bộ sưu tập" : "Explore collection"} ↗
          </Link>
        )}
      </div>
      {!compact && (
        <div className="aw-filters">
          <label>
            <span>
              {vi ? "Tìm tác phẩm hoặc nghệ sĩ" : "Search artworks or artists"}
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                vi ? "Tên tác phẩm, nghệ sĩ…" : "Artwork title, artist…"
              }
            />
          </label>
          <label>
            <span>{vi ? "Chất liệu / Thể loại" : "Category"}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">
                {vi ? "Tất cả bộ sưu tập" : "All collections"}
              </option>
              {categories.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <RequestState {...state} />
      {!loading && !error && (
        <>
          <p className="aw-count" role="status">
            {vi ? `${filtered.length} tác phẩm` : `${filtered.length} artworks`}
            {!["vi", "en"].includes(state.lang) &&
              (vi ? "" : " · Artwork text available in English")}
          </p>
          {visible.length ? (
            <div className="aw-grid">
              {visible.map((a) => (
                <Link
                  className="aw-card"
                  to={`/explore/artworks/${a.id}`}
                  key={a.id}
                >
                  <div className="aw-image">
                    <ArtworkImage artwork={a} />
                    {a.isNationalTreasure && (
                      <span className="aw-treasure">
                        {vi ? "Bảo vật quốc gia" : "National treasure"}
                      </span>
                    )}
                  </div>
                  <div className="aw-card-info">
                    <p>{a.category}</p>
                    <h3>{a.title}</h3>
                    <span>{a.artist}</span>
                    {a.creationPeriod && <small>{a.creationPeriod}</small>}
                    <span className="aw-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="aw-request">
              {vi
                ? "Không tìm thấy tác phẩm phù hợp."
                : "No artworks match your search."}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function ArtworkDetail() {
  const { id } = useParams();
  const state = useArtworks(id);
  const { data: artwork, loading, error, vi } = state;
  return (
    <div className="aw-detail-page">
      <Link className="aw-link" to="/explore/collection">
        ← {vi ? "Trở về bộ sưu tập" : "Back to the collection"}
      </Link>
      <RequestState {...state} />
      {!loading && !error && artwork && (
        <article className="aw-detail">
          <div className="aw-detail-image">
            <ArtworkImage artwork={artwork} />
          </div>
          <div className="aw-detail-text">
            <p className="aw-eyebrow">{artwork.category}</p>
            <h1>{artwork.title}</h1>
            <p className="aw-artist">{artwork.artist}</p>
            <dl>
              {[
                [vi ? "Chất liệu" : "Material", artwork.material],
                [vi ? "Thời gian sáng tác" : "Created", artwork.creationPeriod],
                [vi ? "Kích thước" : "Dimensions", artwork.dimensions],
                [
                  vi ? "Năm công nhận bảo vật" : "National treasure since",
                  artwork.isNationalTreasure && artwork.treasureYear,
                ],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="aw-description">
              {artwork.description ||
                (vi
                  ? "Thông tin tác phẩm đang được cập nhật."
                  : "More information about this artwork is coming soon.")}
            </p>
            {artwork.descriptionLanguage &&
              artwork.descriptionLanguage !== (vi ? "vi" : "en") && (
                <p className="aw-language-note">
                  {vi
                    ? "Hiển thị mô tả bằng ngôn ngữ hiện có."
                    : "This description is shown in Vietnamese while the translation is being prepared."}
                </p>
              )}
            {mediaUrl(artwork.audioUrl) && (
              <div className="aw-audio">
                <h2>{vi ? "Nghe thuyết minh" : "Listen to the story"}</h2>
                <audio
                  key={artwork.audioUrl}
                  controls
                  preload="none"
                  src={mediaUrl(artwork.audioUrl)}
                >
                  {vi
                    ? "Trình duyệt không hỗ trợ audio."
                    : "Your browser does not support audio."}
                </audio>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
