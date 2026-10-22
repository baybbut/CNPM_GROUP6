import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import {
  useSavedState,
  uid,
  matches,
  Badge,
  Empty,
  Field,
  Panel,
  Modal,
  Stats,
  Header,
} from "./shared";
const visitorSeed = [
  {
    id: "VIS-1024",
    name: "Linh Nguyễn",
    source: "Museum check-in",
    time: "09:15",
    day: "Today",
    status: "Inside",
    party: 2,
  },
  {
    id: "VIS-1023",
    name: "Emma Williams",
    source: "Outdoor QR",
    time: "09:08",
    day: "Today",
    status: "Inside",
    party: 1,
  },
  {
    id: "VIS-1022",
    name: "Minh Trần",
    source: "Museum check-in",
    time: "08:52",
    day: "Today",
    status: "Checked out",
    party: 3,
  },
  {
    id: "VIS-1021",
    name: "Alex Martin",
    source: "Museum check-in",
    time: "14:20",
    day: "Yesterday",
    status: "Checked out",
    party: 1,
  },
];
export default function Visitors({ search, toast }) {
  const [visitors, setVisitors] = useSavedState(
      "muses-admin-visitors",
      visitorSeed,
    ),
    [selected, setSelected] = useState(visitorSeed[0].id),
    [filter, setFilter] = useState("Today"),
    [add, setAdd] = useState(false);
  const visible = visitors.filter(
    (r) => matches(r, search) && (filter === "All visits" || r.day === filter),
  );
  const current = visible.find((r) => r.id === selected) || visible[0];
  return (
    <>
      <Header
        title="Every visit tells a story"
        description="A thoughtful view of the people exploring Muses today."
        action={
          <button className="primary" onClick={() => setAdd(true)}>
            <Icon name="plus" />
            Record check-in
          </button>
        }
      />
      <Stats
        items={[
          [
            "Visitors today",
            visitors
              .filter((r) => r.day === "Today")
              .reduce((s, r) => s + r.party, 0),
            "Guests, not just numbers",
            "yellow",
            "people",
          ],
          [
            "Inside now",
            visitors
              .filter((r) => r.status === "Inside")
              .reduce((s, r) => s + r.party, 0),
            "Enjoying the collection",
            "pink",
            "pin",
          ],
          [
            "Outdoor visits",
            visitors.filter((r) => r.source === "Outdoor QR").length,
            "A little fresh perspective",
            "blue",
            "map",
          ],
        ]}
      />
      <div className="pg-two-col">
        <Panel
          title="Visitor list"
          subtitle="Select a visit to see its details."
          action={
            <select
              aria-label="Filter visits"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["Today", "Yesterday", "All visits"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
        >
          <div className="pg-person-list">
            {visible.map((v, i) => (
              <button
                className={current?.id === v.id ? "selected" : ""}
                onClick={() => setSelected(v.id)}
                key={v.id}
              >
                <span className={`pg-initial color-${i % 4}`}>
                  {v.name
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span>
                  <strong>{v.name}</strong>
                  <small>{v.source}</small>
                </span>
                <time>{v.time}</time>
              </button>
            ))}
            {!visible.length && <Empty />}
          </div>
        </Panel>
        <Panel title="Visit details" className="pg-pink-panel">
          {current ? (
            <>
              <div className="pg-detail-top">
                <h3>{current.name}</h3>
                <span>{current.id}</span>
              </div>
              <Badge>{current.status}</Badge>
              <dl className="pg-detail-list">
                <div>
                  <dt>Arrived</dt>
                  <dd>
                    {current.day} · {current.time}
                  </dd>
                </div>
                <div>
                  <dt>Check-in point</dt>
                  <dd>{current.source}</dd>
                </div>
                <div>
                  <dt>Group size</dt>
                  <dd>
                    {current.party}{" "}
                    {current.party === 1 ? "visitor" : "visitors"}
                  </dd>
                </div>
              </dl>
              <div className="pg-timeline">
                <i />
                <div>
                  <strong>Welcome to Muses</strong>
                  <p>Arrival recorded at {current.time}</p>
                </div>
              </div>
              <button
                className="primary"
                disabled={current.status === "Checked out"}
                onClick={() => {
                  setVisitors(
                    visitors.map((v) =>
                      v.id === current.id ? { ...v, status: "Checked out" } : v,
                    ),
                  );
                  toast("Check-out recorded locally");
                }}
              >
                Record check-out
              </button>
            </>
          ) : (
            <Empty text="Choose a visitor to see their story." />
          )}
        </Panel>
      </div>
      {add && (
        <Modal title="Welcome a visitor" onClose={() => setAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const id = uid();
              setVisitors([
                {
                  id,
                  name: f.get("name").trim(),
                  party: Number(f.get("party")),
                  source: f.get("source"),
                  day: "Today",
                  status: "Inside",
                  time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
                ...visitors,
              ]);
              setSelected(id);
              setAdd(false);
              toast("Check-in recorded locally");
            }}
          >
            <Field label="Visitor name">
              <input name="name" required />
            </Field>
            <Field label="Group size">
              <input
                type="number"
                min="1"
                max="100"
                name="party"
                defaultValue="1"
                required
              />
            </Field>
            <Field label="Arrival point">
              <select name="source">
                <option>Museum check-in</option>
                <option>Outdoor QR</option>
              </select>
            </Field>
            <button className="primary">Record check-in</button>
          </form>
        </Modal>
      )}
    </>
  );
}
