import { useEffect, useRef, useState } from "react";
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
    [image, setImage] = useState(""),
    [error, setError] = useState(false);
  const dialog = useRef(null),
    trigger = useRef(null);
  const titleId = `qr-title-${id}`;
  const url = `${window.location.origin}/explore/artworks/${id}?lang=${language}&source=qr`;
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let active = true;
    setImage("");
    setError(false);
    dialog.current?.querySelector("button")?.focus();
    import("qrcode")
      .then((m) =>
        (m.default || m).toDataURL(url, {
          width: 600,
          margin: 4,
          errorCorrectionLevel: "M",
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
      document.body.style.overflow = overflow;
      trigger.current?.focus();
    };
  }, [open, url]);
  return (
    <>
      <button
        ref={trigger}
        className={className || "detail-qr-button"}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
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
                    dialog.current.querySelectorAll("button,a[href]");
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
              {image ? (
                <img
                  src={image}
                  alt={vi ? "QR mở tác phẩm" : "QR linking to artwork"}
                />
              ) : (
                <p role="status">
                  {error
                    ? "QR unavailable"
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
              <p className="qr-url">{url}</p>
              {["localhost", "127.0.0.1", "[::1]"].includes(
                window.location.hostname,
              ) && (
                <p role="status">
                  {vi
                    ? "Để quét bằng điện thoại, hãy mở website bằng địa chỉ IP mạng của máy tính rồi tạo lại mã QR. Hai thiết bị cần kết nối cùng Wi-Fi."
                    : "To scan on your phone, open this website using your computer’s network IP address and create the QR again. Both devices need the same Wi-Fi."}
                </p>
              )}
              <Link
                to={`/explore/artworks/${id}?lang=${language}&source=qr`}
                onClick={() => setOpen(false)}
              >
                {vi ? "Xem đầy đủ tác phẩm" : "View full artwork"}
              </Link>
              {image && (
                <a href={image} download={`muses-artwork-${id}.png`}>
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
