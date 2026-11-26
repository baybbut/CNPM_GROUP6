import { useEffect, useRef, useState } from "react";
import { CONTENT_LANGUAGES } from "../../api/contentLanguages.mjs";
import { artworkQRPath } from "./parseArtworkQR.mjs";
import { catalog } from "../../api/catalog.mjs";
import { label } from "../../i18n/catalog.mjs";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import "./scanner.css";
export default function ArtworkQR({
  id,
  language,
  vi,
  children,
  className,
  title,
}) {
  const [open, setOpen] = useState(false),
    [listen, setListen] = useState(false),
    [voiceLang, setVoiceLang] = useState(language),
    [code, setCode] = useState(null),
    [error, setError] = useState(false),
    [disabled, setDisabled] = useState(false);
  const dialog = useRef(null),
    trigger = useRef(null);
  const titleId = `qr-title-${id}`;
  const path = artworkQRPath(id, listen ? voiceLang : language, { listen });
  const url = window.location.origin + path;
  const image = code?.url === url ? code.image : "";
  const t = (key) => label(language, key);
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      trigger.current?.focus();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setCode(null);
    setError(false);
    setDisabled(false);
    const c = new AbortController();
    catalog(`/api/qr/artworks/${encodeURIComponent(id)}`, c.signal)
      .then((result) => {
        if (!result?.active || String(result.id) !== String(id))
          throw Error("QR_UNAVAILABLE");
        return import("qrcode");
      })
      .then((m) =>
        (m.default || m).toDataURL(url, {
          width: 600,
          margin: 4,
          errorCorrectionLevel: "M",
        }),
      )
      .then((src) => {
        if (active) setCode({ url, image: src });
      })
      .catch((e) => {
        if (active) {
          setError(true);
          setDisabled([404, 410].includes(e.status));
        }
      });
    return () => {
      active = false;
      c.abort();
    };
  }, [open, id, url]);
  return (
    <>
      <button
        ref={trigger}
        className={className || "detail-qr-button"}
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setListen(false);
          setVoiceLang(language);
          setOpen(true);
        }}
      >
        {children || (vi ? "Mã QR tác phẩm" : "Artwork QR")}
      </button>
      {open &&
        createPortal(
          <div className="artwork-qr-backdrop" onClick={() => setOpen(false)}>
            <section
              ref={dialog}
              className="artwork-qr-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Tab") {
                  const nodes =
                    dialog.current.querySelectorAll("button,select,a[href]");
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
              <header>
                <h2 id={titleId}>
                  {title || (vi ? "Mã QR tác phẩm" : "Artwork QR")}
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={vi ? "Đóng" : "Close"}
                >
                  ×
                </button>
              </header>
              <div className="artwork-qr-options">
                <label>
                  {t("QR type")}
                  <select value={listen ? "listen" : "details"} onChange={e => setListen(e.target.value === "listen")}>
                    <option value="details">{t("Artwork information")}</option>
                    <option value="listen">{t("Translated audio guide")}</option>
                  </select>
                </label>
                {listen && (
                  <label>
                    {t("Listening language")}
                    <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)}>
                      {CONTENT_LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {image ? (
                <img
                  src={image}
                  alt={listen ? t("Translated audio guide") : vi ? "QR mở tác phẩm" : "QR linking to artwork"}
                />
              ) : (
                <p role="status">
                  {error
                    ? label(
                        language,
                        disabled
                          ? "This QR code is no longer active."
                          : "QR unavailable. Please try again.",
                      )
                    : vi
                      ? "Đang tạo QR…"
                      : "Creating QR…"}
                </p>
              )}
              <p>
                {vi
                  ? "Quét bằng mục Quét QR trên web hoặc camera điện thoại."
                  : "Scan with the website QR scanner or your phone camera."}
              </p>
              {image && <p className="qr-url">{url}</p>}
              {["localhost", "127.0.0.1", "[::1]"].includes(
                window.location.hostname,
              ) && (
                <p role="status">
                  {vi
                    ? "Để quét bằng điện thoại, hãy mở website bằng địa chỉ IP mạng của máy tính rồi tạo lại mã QR. Hai thiết bị cần kết nối cùng Wi-Fi."
                    : "To scan on your phone, open this website using your computer’s network IP address and create the QR again. Both devices need the same Wi-Fi."}
                </p>
              )}
              {!disabled && (
                <Link
                  to={path}
                  onClick={() => setOpen(false)}
                >
                  {listen ? t("Open audio guide") : vi ? "Xem đầy đủ tác phẩm" : "View full artwork"}
                </Link>
              )}
              {image && (
                <a href={image} download={`muses-artwork-${id}${listen ? `-listen-${voiceLang}` : ""}.png`}>
                  {vi ? "Tải ảnh QR" : "Download QR"}
                </a>
              )}
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
