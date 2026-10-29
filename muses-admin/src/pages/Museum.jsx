import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { garden, ground, first, second } from "../assets";
import { useSavedState, download, Field, Panel, Header } from "./shared";
export default function Museum({ toast }) {
  const [info, setInfo] = useSavedState("muses-admin-museum", {
      name: "Muses Museum",
      address: "66 Nguyễn Thái Học, Ba Đình, Hà Nội",
      email: "hello@muses.example",
      phone: "+84 24 0000 0000",
      open: "09:00",
      close: "21:00",
      closed: "Wednesday",
    }),
    [map, setMap] = useState("Ground floor"),
    [error, setError] = useState("");
  const maps = {
    "Ground floor": ground,
    "First floor": first,
    "Second floor": second,
    "Outdoor grounds": garden,
  };
  return (
    <>
      <Header
        title="A place worth finding"
        description="Keep the practical details as thoughtful as the art itself."
      />
      <div className="pg-two-col">
        <Panel
          title="Museum information"
          subtitle="Local preview information; not published to the visitor website."
        >
          <form
            className="pg-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (f.close <= f.open)
                return setError("Closing time must be after opening time.");
              setInfo(f);
              setError("");
              toast("Museum information saved locally");
            }}
          >
            <Field label="Museum name">
              <input name="name" required defaultValue={info.name} />
            </Field>
            <Field label="Address">
              <textarea
                name="address"
                rows="2"
                required
                defaultValue={info.address}
              />
            </Field>
            <div className="pg-form-row">
              <Field label="Contact email">
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={info.email}
                />
              </Field>
              <Field label="Phone">
                <input name="phone" defaultValue={info.phone} />
              </Field>
            </div>
            <div className="pg-form-row">
              <Field label="Opens">
                <input
                  type="time"
                  name="open"
                  required
                  defaultValue={info.open}
                />
              </Field>
              <Field label="Closes">
                <input
                  type="time"
                  name="close"
                  required
                  defaultValue={info.close}
                />
              </Field>
            </div>
            <Field label="Weekly closing day">
              <select name="closed" defaultValue={info.closed}>
                {[
                  "None",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            {error && (
              <p className="pg-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">Save information</button>
          </form>
        </Panel>
        <Panel
          title="A little orientation"
          subtitle="Browse the existing museum map assets."
          className="pg-green-panel"
          action={
            <select
              aria-label="Museum floor"
              value={map}
              onChange={(e) => setMap(e.target.value)}
            >
              {Object.keys(maps).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
        >
          <div className="pg-floor-map">
            <img src={maps[map]} alt={map} />
          </div>
          <h3>{map}</h3>
          <p className="pg-muted">
            {info.name} · {info.open}–{info.close}
          </p>
          <a
            className="pg-outline pg-map-download"
            href={maps[map]}
            download={`muses-${map}.png`}
          >
            Download map <Icon name="arrow" size={18} />
          </a>
        </Panel>
      </div>
    </>
  );
}
