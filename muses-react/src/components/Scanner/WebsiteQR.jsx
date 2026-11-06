import { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";
import { SvgIcon } from "../Icons";
import { isLocalWebsite, websiteAccessUrl } from "./websiteAccess.mjs";

export default function WebsiteQR() {
  const { lang } = useLang();
  const t = (key) => label(lang, key);
  const [image, setImage] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  let url = "";
  try {
    url = websiteAccessUrl(
      window.location.origin,
      import.meta.env.VITE_VISITOR_BASE_URL,
    );
  } catch {
    // Keep the artwork catalogue usable if the configured sharing URL is wrong.
  }

  useEffect(() => {
    let active = true;
    setImage("");
    setError(false);
    if (!url) {
      setError(true);
      return;
    }
    import("qrcode")
      .then((module) =>
        (module.default || module).toDataURL(url, {
          width: 1024,
          margin: 4,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#FFFFFF" },
        }),
      )
      .then((src) => {
        if (active) setImage(src);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [url, attempt]);

  return (
    <section className="website-qr" aria-labelledby="website-qr-title">
      <div className="website-qr-content">
        <p className="website-qr-eyebrow">
          <SvgIcon kind="qr" size={20} /> MUSES · {t("Share the experience")}
        </p>
        <h2 id="website-qr-title">{t("Website access QR")}</h2>
        <p className="website-qr-description">
          {t(
            "Scan with your phone camera to open the Muses homepage and explore the collection.",
          )}
        </p>
        {url && (
          <div className="website-qr-address">
            <span>{t("Website address")}</span>
            <a href={url}>{url}</a>
          </div>
        )}
        <div className="website-qr-actions">
          {image && (
            <a
              className="scan-primary"
              href={image}
              download="muses-website-qr.png"
            >
              {t("Download website QR")}
              <SvgIcon
                kind="arrow"
                size={18}
                style={{ transform: "rotate(90deg)" }}
              />
            </a>
          )}
          {url && (
            <a className="scan-outline" href={url}>
              {t("Open homepage")}
              <SvgIcon kind="arrow" size={18} />
            </a>
          )}
        </div>
        {url && isLocalWebsite(url) && (
          <p className="website-qr-note">
            {t(
              "Connect your phone to the same Wi-Fi as the computer running Muses. Keep the website running while scanning.",
            )}
          </p>
        )}
      </div>
      <div className="website-qr-card" aria-busy={!image && !error}>
        {image ? (
          <img
            className="website-qr-image"
            src={image}
            width="240"
            height="240"
            alt={t("QR linking to the Muses homepage")}
          />
        ) : error ? (
          <div className="website-qr-status" role="alert">
            <p>{t("Could not create the website QR. Please try again.")}</p>
            <button
              type="button"
              className="scan-outline"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t("Try again")}
            </button>
          </div>
        ) : (
          <p className="website-qr-status" role="status">
            {t("Creating website QR…")}
          </p>
        )}
        <p className="website-qr-caption">MUSES</p>
        <p className="website-qr-scan-label">{t("Scan to visit")}</p>
      </div>
    </section>
  );
}
