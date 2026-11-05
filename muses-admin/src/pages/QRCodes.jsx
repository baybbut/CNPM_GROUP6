import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { adminApi } from "../AdminAuth";
import { Header, Panel, Modal, Field } from "./shared";
import "./catalog.css";
const languages = [
  ["vi", "Tiếng Việt"],
  ["en", "English"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["ko", "한국어"],
];
const active = (row) => Boolean(row.enabled && row.available);
const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
const date = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
export default function QRCodes({ search = "" }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [filter, setFilter] = useState("active"),
    [edit, setEdit] = useState(null),
    [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setError("");
    setData(null);
    adminApi("/api/admin/qr/artworks", "GET", undefined, c.signal)
      .then((r) => setData(r.items))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt]);
  const rows = (data || []).filter(
    (row) =>
      fold(`${row.title} ${row.label || ""} ${row.id}`).includes(
        fold(search.trim()),
      ) &&
      (filter === "all" ||
        (filter === "active" && active(row)) ||
        (filter === "paused" && row.available && !row.enabled) ||
        (filter === "unavailable" && !row.available)),
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaveError("");
    try {
      await adminApi(`/api/admin/qr/artworks/${edit.id}`, "PUT", {
        label: edit.label,
        enabled: edit.enabled,
      });
      setEdit(null);
      setPreview(null);
      setNotice("Đã lưu cấu hình QR.");
      setAttempt((n) => n + 1);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="pg-workspace qr-management">
      <Header
        title="Manage QR"
        description="QR-coded product management is being used on the website."
        action={
          <button
            className="secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Làm mới
          </button>
        }
      />
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p className="analytics-error" role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      <Panel
        title="Artwworks QR Codes"
        subtitle="Each work has a master code that governs the on/off status across all languages."
      >
        <div className="analytics-visitor-tools">
          <label>
            Status
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="active">Active</option>
              <option value="paused">Pause</option>
              <option value="unavailable">Unavailable</option>
              <option value="all">All</option>
            </select>
          </label>
          <span role="status">
            {data
              ? `${rows.length} QR Code`
              : error
                ? "Can’t load QR Codes."
                : "Loading…"}
          </span>
        </div>
        <div className="catalog-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Artwork / QR Name</th>
                <th>Status</th>
                <th>QR Scans</th>
                <th>Last Opened</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    {row.label && <p>{row.label}</p>}
                    <small>QR-{row.id}</small>
                  </td>
                  <td>
                    {active(row)
                      ? "Active"
                      : !row.available
                        ? "Artwork not published"
                        : "Paused"}
                  </td>
                  <td>{row.scans}</td>
                  <td>{date(row.lastScannedAt)}</td>
                  <td>
                    <div className="qr-row-actions">
                      <button
                        disabled={!active(row)}
                        onClick={() => setPreview(row)}
                      >
                        Xem / tải QR
                      </button>
                      <button
                        onClick={() => {
                          setSaveError("");
                          setEdit({
                            ...row,
                            label: row.label || "",
                            enabled: active(row),
                          });
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && !rows.length && (
                <tr>
                  <td colSpan={5}>No matching QR Codes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      {edit && (
        <Modal
          title={`Edit QR-${edit.id}`}
          onClose={() => {
            if (!busy) setEdit(null);
          }}
        >
          <form className="pg-form" onSubmit={save}>
            <p>{edit.title}</p>
            <Field label="QR Name">
              <input
                value={edit.label}
                maxLength={150}
                placeholder={edit.title}
                onChange={(e) => setEdit({ ...edit, label: e.target.value })}
              />
            </Field>
            <label className="qr-enabled">
              <input
                type="checkbox"
                checked={edit.enabled}
                disabled={!edit.available}
                onChange={(e) =>
                  setEdit({ ...edit, enabled: e.target.checked })
                }
              />
              Allow QR scanning on website
            </label>
            {!edit.available && (
              <p>Publish artwork and description in Vietnamese before enabling QR code.</p>
            )}
            <p>
              Disabling QR will stop all links associated with this code. Artwork
              information in the collection will still be retained.
            </p>
            <small>Last updated: {date(edit.updatedAt)}</small>
            {saveError && <p role="alert">{saveError}</p>}
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Modal>
      )}
      {preview && <QRPreview row={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
function QRPreview({ row, onClose }) {
  const [language, setLanguage] = useState("vi"),
    [base, setBase] = useState(
      import.meta.env.VITE_VISITOR_BASE_URL ||
        (import.meta.env.DEV
          ? `${location.protocol}//${location.hostname}:5173`
          : location.origin),
    ),
    [image, setImage] = useState(""),
    [error, setError] = useState("");
  let url = "";
  try {
    const root = new URL(base);
    if (
      ["http:", "https:"].includes(root.protocol) &&
      !root.username &&
      !root.password
    ) {
      const target = new URL(`/explore/artworks/${row.id}`, root);
      target.searchParams.set("lang", language);
      target.searchParams.set("source", "qr");
      url = target.href;
    }
  } catch {}
  useEffect(() => {
    let live = true;
    setImage("");
    setError("");
    if (url)
      QRCode.toDataURL(url, {
        width: 600,
        margin: 4,
        errorCorrectionLevel: "M",
      })
        .then((src) => {
          if (live) setImage(src);
        })
        .catch(() => {
          if (live) setError("Failed to generate QR code.");
        });
    return () => {
      live = false;
    };
  }, [url]);
  return (
    <Modal title={row.label || row.title} onClose={onClose}>
      <div className="pg-form">
        <Field label="Website URL">
          <input
            type="url"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          />
        </Field>
        <Field label="Languages">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(([code, name]) => (
              <option value={code} key={code}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        {image && (
          <img className="analytics-qr" src={image} alt={`QR ${row.title}`} />
        )}
        <p className="qr-preview-url">{url}</p>
        {!url && <p role="alert">Nhập địa chỉ website hợp lệ.</p>}
        {error && <p role="alert">{error}</p>}
        {image && (
          <a
            className="primary"
            href={image}
            download={`muses-qr-${row.id}-${language}.png`}
          >
            Download QR
          </a>
        )}
        <small>
          To scan with a phone, use the website address that the phone can access.
        </small>
      </div>
    </Modal>
  );
}
