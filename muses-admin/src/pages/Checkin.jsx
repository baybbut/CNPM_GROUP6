import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { garden } from "../assets";
import {
  useSavedState,
  uid,
  matches,
  download,
  Empty,
  Field,
  Panel,
  Modal,
  Header,
  TextButton,
} from "./shared";
import QRCode from "qrcode";
export default function Checkin({ search, toast }) {
  const [points, setPoints] = useSavedState("muses-admin-qr", [
    {
      id: "q1",
      name: "Main entrance",
      url: "http://localhost:5173/visit?checkin=main-entrance",
      active: true,
    },
    {
      id: "q2",
      name: "Sculpture garden",
      url: "http://localhost:5173/visit?checkin=sculpture-garden",
      active: true,
    },
  ]);
  const [selected, setSelected] = useState("q1"),
    [edit, setEdit] = useState(null),
    [qr, setQr] = useState(""),
    [qrError, setQrError] = useState("");
  const current = points.find((p) => p.id === selected) || points[0];
  useEffect(() => {
    let live = true;
    setQr("");
    setQrError("");
    if (current)
      QRCode.toDataURL(current.url, {
        width: 420,
        margin: 3,
        color: { dark: "#171b13", light: "#fffdf6" },
      })
        .then((data) => {
          if (live) setQr(data);
        })
        .catch(() => {
          if (live)
            setQrError(
              "This URL could not be encoded. Shorten it and try again.",
            );
        });
    return () => {
      live = false;
    };
  }, [current?.url]);
  return (
    <>
      <Header
        title="A small square. A new beginning."
        description="Create a clear, welcoming entry point to the museum experience."
        action={
          <button className="primary" onClick={() => setEdit({})}>
            <Icon name="plus" />
            Create QR point
          </button>
        }
      />
      <div className="pg-two-col">
        <Panel
          title="Check-in points"
          subtitle="QR codes open the destination URL; live scan tracking requires a backend."
        >
          <div className="pg-point-list">
            {points
              .filter((p) => matches(p, search))
              .map((p) => (
                <div key={p.id}>
                  <span className="pg-initial color-0">
                    <Icon name="qr" />
                  </span>
                  <button
                    className="pg-point-name"
                    onClick={() => setSelected(p.id)}
                  >
                    <strong>{p.name}</strong>
                    <small>
                      {p.active ? "Active" : "Inactive"} · QR destination
                    </small>
                  </button>
                  <TextButton onClick={() => setEdit(p)}>Edit</TextButton>
                </div>
              ))}
          </div>
          {!points.some((p) => matches(p, search)) && <Empty />}
        </Panel>
        <Panel
          title={current?.name || "QR preview"}
          className="pg-yellow-panel"
        >
          {current && (
            <>
              <div className="pg-qr-preview">
                {qr ? (
                  <img src={qr} alt={`QR code for ${current.name}`} />
                ) : (
                  <p role="status">{qrError || "Generating QR code…"}</p>
                )}
              </div>
              <p className="pg-qr-url">{current.url}</p>
              <p className="pg-muted">
                For phone testing, replace localhost with a reachable address.
                Deactivation changes this local list only; exported codes still
                open their URL.
              </p>
              <button
                className="primary"
                disabled={!qr}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = qr;
                  a.download = `muses-${current.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
                  a.click();
                  toast("QR image downloaded");
                }}
              >
                <Icon name="qr" size={18} />
                Download PNG
              </button>
            </>
          )}
        </Panel>
      </div>
      {edit && (
        <Modal
          title={edit.id ? "Edit QR point" : "Create QR check-in"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const item = {
                id: edit.id || uid(),
                name: f.get("name").trim(),
                url: f.get("url").trim(),
                active: f.get("active") === "on",
              };
              if (!/^https?:\/\//i.test(item.url))
                return toast("Use an http:// or https:// destination URL");
              setPoints(
                edit.id
                  ? points.map((p) => (p.id === edit.id ? item : p))
                  : [...points, item],
              );
              setSelected(item.id);
              setEdit(null);
              toast("QR point saved locally");
            }}
          >
            <Field label="Point name">
              <input name="name" required defaultValue={edit.name} />
            </Field>
            <Field label="Destination URL">
              <input
                type="url"
                name="url"
                maxLength="1500"
                required
                defaultValue={edit.url || "http://localhost:5173/visit"}
              />
            </Field>
            <label className="pg-check">
              <input
                name="active"
                type="checkbox"
                defaultChecked={edit.active ?? true}
              />
              Active in the local list
            </label>
            <button className="primary">Save QR point</button>
          </form>
        </Modal>
      )}
    </>
  );
}
