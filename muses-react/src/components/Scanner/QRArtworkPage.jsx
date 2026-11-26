import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { catalog } from "../../api/catalog.mjs";
import { trackAudio, trackQRLanding } from "../../api/activity.mjs";
import { label } from "../../i18n/catalog.mjs";
import { contentLanguage } from "../../api/contentLanguages.mjs";
import { mediaUrl } from "../../api/artworks";
import Narration from "../Narration/Narration";
import ArtworkDetail from "../explore/ArtworkDetail";
function QRAudioGuide({ id, language }) {
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const t = (key) => label(language, key);
  useEffect(() => {
    const controller = new AbortController();
    setGuide(null);
    setError(false);
    catalog(`/api/artworks/${id}?lang=${language}&mode=listen`, controller.signal, 75000)
      .then(data => {
        if (!controller.signal.aborted) setGuide(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [id, language, attempt]);
  const ready = guide?.descriptionLanguage === language && guide.description;
  return (
    <section className="scan-page">
      <h1>{guide?.title || t("Translated audio guide")}</h1>
      {ready ? (
        <>
          <p>{t(guide.translationSource === "automatic" ? "Automatic translation" : "Audio guide")}</p>
          {mediaUrl(guide.audioUrl) ? (
            <>
              <audio controls preload="none" src={mediaUrl(guide.audioUrl)} onPlay={() => trackAudio(language)} />
              <p>{guide.description}</p>
            </>
          ) : (
            <Narration text={guide.description} language={language} requestedLanguage={language} />
          )}
        </>
      ) : error || guide ? (
        <div role="status">
          <p>{t("Audio guide unavailable in this language.")}</p>
          <button className="scan-primary" onClick={() => setAttempt(n => n + 1)}>{t("Try again")}</button>
        </div>
      ) : <p role="status">{t("Loading…")}</p>}
      <p><Link className="v-link" to={`/explore/artworks/${id}?lang=${language}`}>{t("Artwork information")}</Link></p>
    </section>
  );
}

export default function QRArtworkPage() {
  const { id } = useParams(),
    [query] = useSearchParams(),
    { lang } = useLang(),
    location = useLocation();
  const fromQR = query.get("source") === "qr",
    point = query.get("point") || "",
    landingKey = `${id}:${point}`,
    key = `${landingKey}:${location.key}`;
  const lastLanding = useRef("");
  const [state, setState] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!fromQR) {
      lastLanding.current = "";
      return;
    }
    const c = new AbortController();
    setState({ key, status: "loading" });
    catalog(`/api/qr/artworks/${encodeURIComponent(id)}`, c.signal)
      .then((result) => {
        if (!result?.active || String(result.id) !== id)
          throw Error("QR_UNAVAILABLE");
        if (c.signal.aborted) return;
        setState({ key, status: "active" });
        if (lastLanding.current !== landingKey) {
          lastLanding.current = landingKey;
          trackQRLanding(Number(id), point, query.get("lang") || lang);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setState({
            key,
            status: [404, 410].includes(e.status) ? "disabled" : "error",
          });
      });
    return () => c.abort();
  }, [fromQR, key, attempt]);
  if (!fromQR) return <ArtworkDetail />;
  if (state?.key === key && state.status === "active") {
    if (query.get("mode") === "listen") {
      const language = contentLanguage(query.get("lang") || lang);
      return <QRAudioGuide key={`${id}:${language}`} id={id} language={language} />;
    }
    return <ArtworkDetail />;
  }
  const status = state?.key === key ? state.status : "loading";
  return (
    <section className="scan-page">
      <h1>
        {label(
          lang,
          status === "disabled"
            ? "This QR code is no longer active."
            : status === "error"
              ? "QR unavailable. Please try again."
              : "Loading…",
        )}
      </h1>
      {status === "error" && (
        <button
          className="scan-primary"
          onClick={() => setAttempt((n) => n + 1)}
        >
          {label(lang, "Try again")}
        </button>
      )}
      {status !== "loading" && (
        <p>
          <Link to="/scan">{label(lang, "Explore artworks with QR")} →</Link>
        </p>
      )}
    </section>
  );
}
