import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { lilies, spring, seasons } from "../assets";
import {
  useSavedState,
  uid,
  matches,
  pretty,
  Badge,
  Empty,
  Field,
  Panel,
  Modal,
  Stats,
  Header,
  TextButton,
} from "./shared";
const eventSeed = [
  {
    id: "e1",
    title: "The poetry of lacquer",
    type: "Exhibition",
    start: "2026-10-23",
    end: "2026-11-30",
    location: "Gallery 02",
    status: "Published",
    image: spring,
  },
  {
    id: "e2",
    title: "An afternoon with Vietnamese art",
    type: "Guided tour",
    start: "2026-10-25",
    end: "2026-10-25",
    location: "Main entrance",
    status: "Published",
    image: lilies,
  },
  {
    id: "e3",
    title: "Meet the makers",
    type: "Workshop",
    start: "2026-11-07",
    end: "2026-11-07",
    location: "Learning studio",
    status: "Draft",
    image: seasons,
  },
];
export default function Events({ search, toast }) {
  const [events, setEvents] = useSavedState("muses-admin-events", eventSeed),
    [type, setType] = useState("All events"),
    [edit, setEdit] = useState(null),
    [error, setError] = useState("");
  return (
    <>
      <Header
        title="Something to look forward to"
        description="Bring art to life through exhibitions, tours and shared experiences."
        action={
          <button
            className="primary"
            onClick={() => {
              setEdit({});
              setError("");
            }}
          >
            <Icon name="plus" />
            Create event
          </button>
        }
      />
      <Stats
        items={[
          [
            "On the calendar",
            events.length,
            "Experiences to discover",
            "yellow",
            "calendar",
          ],
          [
            "Published",
            events.filter((e) => e.status === "Published").length,
            "Ready to welcome visitors",
            "green",
            "people",
          ],
          [
            "In the making",
            events.filter((e) => e.status === "Draft").length,
            "Ideas taking shape",
            "pink",
            "image",
          ],
        ]}
      />
      <Panel
        title="Exhibitions & events"
        action={
          <select
            aria-label="Event type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All events", "Exhibition", "Guided tour", "Workshop"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        }
      >
        <div className="pg-event-grid">
          {events
            .filter(
              (e) =>
                matches(e, search) &&
                (type === "All events" || e.type === type),
            )
            .map((e) => (
              <article className="pg-event" key={e.id}>
                <img src={e.image} alt={e.title} />
                <div>
                  <div className="pg-event-meta">
                    <small>{e.type}</small>
                    <Badge>{e.status}</Badge>
                  </div>
                  <h3>{e.title}</h3>
                  <p>
                    <Icon name="calendar" size={15} />
                    {pretty(e.start)}
                    {e.end !== e.start ? ` — ${pretty(e.end)}` : ""}
                  </p>
                  <p>
                    <Icon name="pin" size={15} />
                    {e.location}
                  </p>
                  <TextButton
                    onClick={() => {
                      setEdit(e);
                      setError("");
                    }}
                  >
                    Edit event
                  </TextButton>
                </div>
              </article>
            ))}
        </div>
        {!events.some(
          (e) =>
            matches(e, search) && (type === "All events" || e.type === type),
        ) && <Empty />}
      </Panel>
      {edit && (
        <Modal
          title={edit.id ? "Edit experience" : "Create an experience"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (f.get("end") < f.get("start"))
                return setError("End date must be on or after the start date.");
              const item = {
                ...edit,
                id: edit.id || uid(),
                title: f.get("title").trim(),
                type: f.get("type"),
                start: f.get("start"),
                end: f.get("end"),
                location: f.get("location").trim(),
                status: f.get("status"),
                image: edit.image || spring,
              };
              setEvents(
                edit.id
                  ? events.map((x) => (x.id === edit.id ? item : x))
                  : [...events, item],
              );
              setEdit(null);
              toast("Event saved locally");
            }}
          >
            <Field label="Title">
              <input name="title" required defaultValue={edit.title} />
            </Field>
            <Field label="Experience type">
              <select name="type" defaultValue={edit.type || "Exhibition"}>
                <option>Exhibition</option>
                <option>Guided tour</option>
                <option>Workshop</option>
              </select>
            </Field>
            <div className="pg-form-row">
              <Field label="Starts">
                <input
                  type="date"
                  name="start"
                  required
                  defaultValue={edit.start}
                />
              </Field>
              <Field label="Ends">
                <input
                  type="date"
                  name="end"
                  required
                  defaultValue={edit.end}
                />
              </Field>
            </div>
            <Field label="Location">
              <input name="location" required defaultValue={edit.location} />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={edit.status || "Draft"}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </Field>
            {error && (
              <p className="pg-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">Save event</button>
          </form>
        </Modal>
      )}
    </>
  );
}
