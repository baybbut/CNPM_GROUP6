import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { catalog } from "../../api/catalog.mjs";
import { trackQRLanding } from "../../api/activity.mjs";
import { label } from "../../i18n/catalog.mjs";
import ArtworkDetail from "../explore/ArtworkDetail";
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
  if (state?.key === key && state.status === "active") return <ArtworkDetail />;
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
