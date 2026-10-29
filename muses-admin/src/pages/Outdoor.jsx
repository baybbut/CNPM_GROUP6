import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { garden } from "../assets";
import {
  useSavedState,
  uid,
  matches,
  Badge,
  Empty,
  Field,
  Panel,
  Modal,
  Header,
  TextButton,
} from "./shared";
const pointSeed = [
  {
    id: "p1",
    name: "Sculpture garden",
    lat: 21.0302,
    lng: 105.8353,
    radius: 30,
    active: true,
  },
  {
    id: "p2",
    name: "North entrance",
    lat: 21.0306,
    lng: 105.8358,
    radius: 25,
    active: true,
  },
  {
    id: "p3",
    name: "Central courtyard",
    lat: 21.0304,
    lng: 105.8356,
    radius: 20,
    active: false,
  },
];
export default function Outdoor({ search, toast }) {
  const [points, setPoints] = useSavedState("muses-admin-points", pointSeed),
    [selected, setSelected] = useState("p1"),
    [edit, setEdit] = useState(null);
  const current = points.find((p) => p.id === selected) || points[0];
  return (
    <>
      <Header
        title="Art, a little further afield"
        description="Shape a journey through the museum’s outdoor spaces."
        action={
          <button className="primary" onClick={() => setEdit({})}>
            <Icon name="plus" />
            Add exhibit point
          </button>
        }
      />
      <div className="pg-two-col pg-map-layout">
        <Panel
          title="Outdoor exhibit map"
          subtitle="Schematic markers · select a point to inspect its coordinates."
        >
          <div className="pg-large-map">
            <img src={garden} alt="Museum outdoor grounds" />
            {points.map((p, i) => (
              <button
                key={p.id}
                className={`${selected === p.id ? "selected" : ""} ${p.active ? "" : "inactive"}`}
                style={{
                  left: `${20 + ((i * 23) % 65)}%`,
                  top: `${22 + ((i * 21) % 55)}%`,
                }}
                onClick={() => setSelected(p.id)}
                aria-label={p.name}
              >
                <Icon name="pin" size={28} />
              </button>
            ))}
          </div>
          <div className="pg-map-legend">
            <i />
            {points.filter((p) => p.active).length} of {points.length} points
            active<span>Diagram positions are illustrative</span>
          </div>
        </Panel>
        <Panel title="Point details" className="pg-blue-panel">
          {current ? (
            <>
              <div className="pg-big-icon">
                <Icon name="pin" size={32} />
              </div>
              <h3>{current.name}</h3>
              <Badge>{current.active ? "Active" : "Inactive"}</Badge>
              <dl className="pg-detail-list">
                <div>
                  <dt>Latitude</dt>
                  <dd>{current.lat}</dd>
                </div>
                <div>
                  <dt>Longitude</dt>
                  <dd>{current.lng}</dd>
                </div>
                <div>
                  <dt>Check-in radius</dt>
                  <dd>{current.radius} m</dd>
                </div>
              </dl>
              <button className="primary" onClick={() => setEdit(current)}>
                Edit point
              </button>
            </>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
      <Panel
        title="All exhibit points"
        subtitle="GPS configuration is saved locally; this demo does not validate a visitor’s real location."
      >
        <div className="pg-point-list">
          {points
            .filter((p) => matches(p, search))
            .map((p) => (
              <div key={p.id}>
                <span className="pg-initial color-2">
                  <Icon name="pin" />
                </span>
                <button
                  className="pg-point-name"
                  onClick={() => setSelected(p.id)}
                >
                  <strong>{p.name}</strong>
                  <small>
                    {p.lat}, {p.lng} · {p.radius} m radius
                  </small>
                </button>
                <button
                  className={`pg-switch ${p.active ? "on" : ""}`}
                  role="switch"
                  aria-checked={p.active}
                  aria-label={`Activate ${p.name}`}
                  onClick={() => {
                    setPoints(
                      points.map((x) =>
                        x.id === p.id ? { ...x, active: !x.active } : x,
                      ),
                    );
                    toast("Point status updated locally");
                  }}
                >
                  <i />
                </button>
                <TextButton onClick={() => setEdit(p)}>Edit</TextButton>
              </div>
            ))}
        </div>
        {!points.some((p) => matches(p, search)) && <Empty />}
      </Panel>
      {edit && (
        <Modal
          title={edit.id ? "Edit exhibit point" : "A new place to discover"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const item = {
                id: edit.id || uid(),
                name: f.get("name").trim(),
                lat: Number(f.get("lat")),
                lng: Number(f.get("lng")),
                radius: Number(f.get("radius")),
                active: f.get("active") === "on",
              };
              setPoints(
                edit.id
                  ? points.map((p) => (p.id === edit.id ? item : p))
                  : [...points, item],
              );
              setSelected(item.id);
              setEdit(null);
              toast("Exhibit point saved locally");
            }}
          >
            <Field label="Point name">
              <input name="name" required defaultValue={edit.name} />
            </Field>
            <div className="pg-form-row">
              <Field label="Latitude">
                <input
                  name="lat"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  defaultValue={edit.lat}
                />
              </Field>
              <Field label="Longitude">
                <input
                  name="lng"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  defaultValue={edit.lng}
                />
              </Field>
            </div>
            <Field label="Radius (meters)">
              <input
                name="radius"
                type="number"
                min="5"
                max="1000"
                required
                defaultValue={edit.radius || 30}
              />
            </Field>
            <label className="pg-check">
              <input
                type="checkbox"
                name="active"
                defaultChecked={edit.active ?? true}
              />
              Active point
            </label>
            <button className="primary">Save point</button>
          </form>
        </Modal>
      )}
    </>
  );
}
