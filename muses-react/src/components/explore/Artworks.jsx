import { catalog } from "../../api/catalog.mjs";
import { label } from "../../i18n/catalog.mjs";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { fetchArtworks, mediaUrl } from "../../api/artworks";
import "./artworks.css";
import { SvgIcon } from "../Icons";

export function useArtworks(id) {
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

export function ArtworkImage({ artwork }) {
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
      <SvgIcon kind="photo" size={48} />
      <small>MUSES COLLECTION</small>
    </div>
  );
}

export function RequestState({
  loading,
  error,
  retry,
  vi,
  lang = label(lang, "en", "vi"),
}) {
  if (loading)
    return (
      <div className="aw-request" role="status">
        <span className="aw-loader" />
        {label(lang, "Loading the collection…", "Đang tải bộ sưu tập…")}
      </div>
    );
  if (error)
    return (
      <div className="aw-request" role="alert">
        <h3>
          {error.status === 404
            ? label(lang, "Artwork not found", "Không tìm thấy tác phẩm")
            : label(
                lang,
                "The collection is unavailable",
                "Chưa thể tải dữ liệu",
              )}
        </h3>
        <p>
          {label(
            lang,
            "Please try again or come back in a moment.",
            "Vui lòng thử lại hoặc quay lại sau.",
          )}
        </p>
        <button onClick={retry}>{label(lang, "Try again", "Thử lại")}</button>
      </div>
    );
  return null;
}

export function ArtworkCollection({ compact = false }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [query, setQuery] = useState(""),
    [artist, setArtist] = useState(""),
    [material, setMaterial] = useState(""),
    [museum, setMuseum] = useState(""),
    [page, setPage] = useState(1),
    [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState({
      artists: [],
      materials: [],
      museums: [],
    }),
    [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: null, data: null });
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          lang,
          q: query,
          artist,
          material,
          museum,
          page: String(page),
        });
        const [data, options] = await Promise.all([
          catalog(`/api/catalog/artworks?${params}`, controller.signal),
          catalog("/api/catalog/filters", controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setFilters(options);
          setState({ loading: false, error: null, data });
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ loading: false, error, data: null });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lang, query, artist, material, museum, page, attempt]);
  function change(setter, value) {
    setter(value);
    setPage(1);
  }
  const { data, error, loading } = state,
    items = compact ? (data?.items || []).slice(0, 4) : data?.items || [];
  return (
    <section
      className={`aw-section ${compact ? "aw-compact" : ""}`}
      aria-labelledby="collection-title"
    >
      <div className="aw-heading">
        <div>
          <p className="aw-eyebrow">MUSES · {t("Artworks")}</p>
          <h2 id="collection-title">
            {t("Discover the stories behind the art")}
          </h2>
        </div>
        {compact && (
          <Link className="aw-link" to="/explore/collection">
            {t("Explore collection")} <SvgIcon kind="arrow" size={20} />
          </Link>
        )}
      </div>
      {!compact && (
        <div className="aw-filters">
          <label>
            <span>{t("Search artworks or artists")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => change(setQuery, e.target.value)}
            />
          </label>
          {[
            [t("Artist"), artist, setArtist, filters.artists],
            [t("Material"), material, setMaterial, filters.materials],
            [t("Current museum"), museum, setMuseum, filters.museums],
          ].map(([name, value, setter, options]) => (
            <label key={name}>
              <span>{name}</span>
              <select
                value={value}
                onChange={(e) => change(setter, e.target.value)}
              >
                <option value="">{t("All")}</option>
                {options.map((o) => (
                  <option value={o.id} key={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {loading ? (
        <p className="aw-request" role="status">
          {t("Loading…")}
        </p>
      ) : error ? (
        <p className="aw-request" role="alert">
          {t("Unable to load data. Please try again.")}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>
            {t("Try again")}
          </button>
        </p>
      ) : (
        <>
          <p role="status">
            {t("Results")}: {data.total}
          </p>
          {items.length ? (
            <div className="aw-grid">
              {items.map((a) => (
                <Link
                  className="aw-card"
                  to={`/explore/artworks/${a.id}?lang=${lang}`}
                  key={a.id}
                >
                  <div className="aw-image">
                    <ArtworkImage artwork={a} />
                    {a.isNationalTreasure && (
                      <span className="aw-treasure">
                        {t("National treasure")}
                      </span>
                    )}
                  </div>
                  <div className="aw-card-info">
                    <p>{a.category}</p>
                    <h3>{a.title}</h3>
                    <span>{a.artist}</span>
                    {a.creationPeriod && <small>{a.creationPeriod}</small>}
                    {a.isDemo && (
                      <small>
                        {t("Demonstration data — not a real exhibition.")}
                      </small>
                    )}
                    <span className="aw-card-arrow" aria-hidden="true">
                      <SvgIcon kind="arrow" size={20} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="aw-request">{t("No results found.")}</p>
          )}
          {!compact && (
            <nav className="catalog-pagination" aria-label={t("Page")}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                {t("Previous")}
              </button>
              <span>
                {t("Page")} {page} /{" "}
                {Math.max(1, Math.ceil(data.total / data.pageSize))}
              </span>
              <button
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((n) => n + 1)}
              >
                {t("Next")}
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
