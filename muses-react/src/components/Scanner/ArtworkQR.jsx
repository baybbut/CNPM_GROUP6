import { useEffect, useRef, useState } from "react";
import "./scanner.css";
export default function ArtworkQR({ id, language, vi }) {
  const [open, setOpen] = useState(false),
    [image, setImage] = useState(""),
    [error, setError] = useState(false);
  const dialog = useRef(null),
    trigger = useRef(null);
  const url = `${window.location.origin}/explore/artworks/${id}?lang=${language}`;
  useEffect(() => {
    if (!open) return;
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
      trigger.current?.focus();
    };
  }, [open, url]);
  return (
    <>
      <button
        ref={trigger}
        className="detail-qr-button"
        onClick={() => setOpen(true)}
      >
        {vi ? "Mã QR tác phẩm" : "Artwork QR"}
      </button>
      {open && (
        <div className="artwork-qr-backdrop" onClick={() => setOpen(false)}>
          <section
            ref={dialog}
            className="artwork-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Tab") {
                const nodes = dialog.current.querySelectorAll("button,a[href]");
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
              <h2 id="qr-title">{vi ? "Mã QR tác phẩm" : "Artwork QR"}</h2>
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
            {image && (
              <a href={image} download={`muses-artwork-${id}.png`}>
                {vi ? "Tải ảnh QR" : "Download QR"}
              </a>
            )}
          </section>
        </div>
      )}
    </>
  );
}
