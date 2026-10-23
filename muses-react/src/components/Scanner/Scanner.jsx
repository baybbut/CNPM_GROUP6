import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import {
  CONTENT_LANGUAGES,
  contentLanguage,
} from "../../api/contentLanguages.mjs";
import { parseArtworkQR } from "./parseArtworkQR.mjs";
import { SvgIcon } from "../Icons";
import "./scanner.css";

export default function Scanner() {
  const { lang, setLang } = useLang(),
    vi = lang === "vi",
    navigate = useNavigate();
  const [selected, setSelected] = useState(contentLanguage(lang)),
    [status, setStatus] = useState("idle"),
    [error, setError] = useState(""),
    [manual, setManual] = useState("");
  const video = useRef(null),
    controls = useRef(null),
    stream = useRef(null),
    run = useRef(0),
    locked = useRef(false);
  function release() {
    controls.current?.stop();
    controls.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }
  function stop() {
    run.current++;
    release();
    setStatus("idle");
  }
  useEffect(
    () => () => {
      run.current++;
      release();
    },
    [],
  );
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  function open(text, generation) {
    if (generation !== run.current || locked.current) return;
    let parsed;
    try {
      parsed = parseArtworkQR(text, window.location.origin);
    } catch {
      setError(
        vi
          ? "Mã này không phải QR tác phẩm Muses. Hãy quét mã gắn trên tác phẩm."
          : "This is not a Muses artwork QR. Scan the code beside an artwork.",
      );
      return;
    }
    locked.current = true;
    run.current++;
    release();
    setLang(selectedRef.current);
    navigate(
      `/explore/artworks/${parsed.id}?lang=${selectedRef.current}&source=qr${parsed.point ? `&point=${encodeURIComponent(parsed.point)}` : ""}`,
    );
  }
  async function camera() {
    stop();
    setError("");
    locked.current = false;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        vi
          ? "Chưa thể mở camera. Bạn có thể tải ảnh QR hoặc dán mã bên dưới."
          : "Camera unavailable. Upload a QR image or paste its link below.",
      );
      return;
    }
    const generation = run.current;
    setStatus("starting");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (generation !== run.current) return;
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (generation !== run.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const reader = new BrowserQRCodeReader();
      const session = await reader.decodeFromStream(
        media,
        video.current,
        (result, scanError) => {
          if (generation !== run.current) return;
          if (result) {
            open(result.getText(), generation);
          } else if (
            scanError &&
            ![
              "NotFoundException",
              "ChecksumException",
              "FormatException",
            ].includes(scanError.name)
          ) {
            // Unexpected decoder failures stop ZXing's loop; don't leave a frozen scanning state.
            stop();
            setError(
              vi
                ? "Quá trình quét bị gián đoạn. Hãy thử lại hoặc chọn ảnh QR."
                : "Scanning was interrupted. Try again or upload a QR image.",
            );
          }
        },
      );
      if (generation !== run.current) {
        session.stop();
        return;
      }
      controls.current = session;
      setStatus("scanning");
    } catch (e) {
      if (generation !== run.current) return;
      release();
      setStatus("idle");
      setError(
        vi
          ? e.name === "NotAllowedError"
            ? "Bạn chưa cho phép dùng camera. Hãy cấp quyền hoặc tải ảnh QR."
            : e.name === "NotFoundError"
              ? "Không tìm thấy camera. Bạn có thể tải ảnh QR."
              : "Chưa mở được camera. Hãy đóng ứng dụng đang dùng camera rồi thử lại."
          : e.name === "NotAllowedError"
            ? "Camera permission was denied. Allow access or upload a QR image."
            : "Camera unavailable. Upload a QR image or try again.",
      );
    }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    stop();
    setError("");
    locked.current = false;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError(
        vi ? "Chọn ảnh QR dưới 10 MB." : "Choose a QR image under 10 MB.",
      );
      event.target.value = "";
      return;
    }
    const generation = run.current,
      url = URL.createObjectURL(file);
    setStatus("decoding");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(url);
      if (generation === run.current) {
        setStatus("idle");
        open(result.getText(), generation);
      }
    } catch {
      if (generation === run.current) {
        setStatus("idle");
        setError(
          vi
            ? "Không đọc được QR trong ảnh. Hãy chọn ảnh rõ, có đủ bốn góc của mã."
            : "No readable QR found. Choose a clear image showing the whole code.",
        );
      }
    } finally {
      URL.revokeObjectURL(url);
      event.target.value = "";
    }
  }
  const busy = status !== "idle";
  return (
    <div className="scan-page">
      <div className="scan-intro">
        <p>MUSES · {vi ? "KHÁM PHÁ NGHỆ THUẬT" : "DISCOVER THE COLLECTION"}</p>
        <h1>
          {vi ? "Mỗi mã QR, một câu chuyện" : "A small code. A whole story."}
        </h1>
        <p>
          {vi
            ? "Quét mã bên tác phẩm để xem hình ảnh, mô tả và nghe thuyết minh theo ngôn ngữ bạn chọn."
            : "Scan the code beside an artwork to explore its story in your preferred language."}
        </p>
      </div>
      <div className="scan-layout">
        <section className="scan-camera-panel">
          <div className="scan-camera">
            <video
              ref={video}
              muted
              playsInline
              aria-label={vi ? "Khung camera quét QR" : "QR camera preview"}
            />
            {status === "idle" && (
              <div className="scan-placeholder">
                <SvgIcon kind="qr" size={64} />
                <p>
                  {vi
                    ? "Đặt mã QR vào giữa khung"
                    : "Place the artwork QR inside the frame"}
                </p>
              </div>
            )}
            <div className="scan-corners" aria-hidden="true" />
            {busy && (
              <span className="scan-status" role="status">
                {status === "starting"
                  ? vi
                    ? "Đang mở camera…"
                    : "Starting camera…"
                  : status === "decoding"
                    ? vi
                      ? "Đang đọc ảnh QR…"
                      : "Reading QR image…"
                    : vi
                      ? "Đang tìm mã QR…"
                      : "Looking for an artwork QR…"}
              </span>
            )}
          </div>
          <div className="scan-camera-actions">
            <button className="scan-primary" onClick={busy ? stop : camera}>
              {busy
                ? vi
                  ? "Dừng quét"
                  : "Stop scanning"
                : vi
                  ? "Mở camera quét QR"
                  : "Scan with camera"}
            </button>
            <label className="scan-upload">
              {vi ? "Chọn ảnh QR" : "Upload QR image"}
              <input type="file" accept="image/*" onChange={upload} />
            </label>
          </div>
          {error && (
            <p className="scan-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <aside className="scan-options">
          <h2>
            {vi ? "Khám phá theo cách của bạn" : "Make the story your own"}
          </h2>
          <label>
            {vi ? "Ngôn ngữ nội dung" : "Content language"}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {CONTENT_LANGUAGES.map((l) => (
                <option value={l.code} key={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <div className="scan-divider" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              stop();
              setError("");
              locked.current = false;
              open(manual, run.current);
            }}
          >
            <label>
              {vi
                ? "Hoặc dán đường dẫn / nội dung mã QR"
                : "Or paste an artwork link / QR text"}
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="muses:artwork:1"
                required
                maxLength={4096}
              />
            </label>
            <button className="scan-outline">
              {vi ? "Mở tác phẩm" : "Open artwork"}
              <SvgIcon kind="arrow" size={19} />
            </button>
          </form>
          <Link to="/explore/collection" className="scan-browse">
            {vi
              ? "Không có mã? Xem bộ sưu tập"
              : "No code? Browse the collection"}{" "}
            →
          </Link>
        </aside>
      </div>
    </div>
  );
}
