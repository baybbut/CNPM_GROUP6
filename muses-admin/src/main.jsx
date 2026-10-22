import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import lilies from "../../muses-react/tranh/THIEUNUBENHOAHUE.jpg";
import spring from "../../muses-react/tranh/tranhsonmai/VUONXUANTRUNGNAMBAC.png";
import seasons from "../../muses-react/tranh/tranhsonmai/GIAOMUA.jpg";
import park from "../../muses-react/maps/MusesOutdoor.png";
import Icon from "./Icons";
import AdminPages, { useSavedState } from "./AdminPages";
const initial = [
  {
    title: "Young Woman with Lilies",
    artist: "Tô Ngọc Vân",
    content: "VI · EN · Audio",
    status: "Published",
    img: lilies,
  },
  {
    title: "Spring Garden: North, Central & South",
    artist: "Nguyễn Gia Trí",
    content: "VI · Audio",
    status: "Published",
    img: spring,
  },
  {
    title: "Changing Seasons",
    artist: "Muses Collection",
    content: "Missing translation",
    status: "Draft",
    img: seasons,
  },
];
const nav = [
  ["Overview", "home"],
  ["Visitors", "people"],
  ["Reports", "chart"],
  ["CONTENT"],
  ["Artworks", "image"],
  ["Artists & Categories", "user"],
  ["Languages & Audio", "audio"],
  ["Exhibitions & Events", "calendar"],
  ["VISITS"],
  ["Outdoor Points · GPS", "pin"],
  ["QR Check-in", "qr"],
  ["Museum Info & Maps", "map"],
  ["SYSTEM"],
  ["Staff & Permissions", "people"],
  ["Settings", "settings"],
];
function App() {
  const [active, updateActive] = useState(() => {
      try {
        const page = decodeURIComponent(window.location.hash.slice(1));
        return nav.some(([name, icon]) => name === page && icon)
          ? page
          : "Overview";
      } catch {
        return "Overview";
      }
    }),
    [search, setSearch] = useState(""),
    [range, setRange] = useState(7),
    [month, setMonth] = useState(new Date(2026, 9, 1)),
    [day, setDay] = useState(22),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [rows, setRows] = useSavedState("muses-admin-artworks", initial),
    [collapsed, setCollapsed] = useState(false),
    [notifications, setNotifications] = useState(false);
  const [preferences, setPreferences] = useSavedState("muses-admin-settings", {
    name: "Anh Thư",
    email: "anhthu@muses.example",
    language: "English",
    digest: true,
    review: true,
    visits: false,
  });
  function setActive(page) {
    updateActive(page);
    window.location.hash = encodeURIComponent(page);
  }
  useEffect(() => {
    const route = () => {
      try {
        const page = decodeURIComponent(window.location.hash.slice(1));
        updateActive(
          nav.some(([name, icon]) => name === page && icon) ? page : "Overview",
        );
        setSearch("");
      } catch {
        updateActive("Overview");
      }
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const close = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", close);
    document.querySelector(".modal input,.modal button")?.focus();
    return () => {
      document.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [modal]);
  const toast = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(""), 4000);
  };
  const open = (kind, title) => setModal({ kind, title });
  const monthLabel = month.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  const offset =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (modal.kind === "artwork") {
      setRows([
        ...rows,
        {
          title: f.get("title"),
          artist: f.get("artist"),
          content: "VI · Pending audio",
          status: "Draft",
          img: lilies,
        },
      ]);
    }
    toast(
      modal.kind === "artwork"
        ? "Artwork added as a draft"
        : `${modal.title} saved successfully`,
    );
    setModal(null);
  }
  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <a
          className="brand"
          aria-label="Muses overview"
          href="#"
          onClick={() => setActive("Overview")}
        >
          <Icon name="museum" size={35} />
          <span>MUSES</span>
        </a>
        <button
          className="collapse"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed(!collapsed)}
        >
          ›
        </button>
        <nav>
          {nav.map(([label, icon]) =>
            icon ? (
              <button
                key={label}
                aria-label={label}
                aria-current={active === label ? "page" : undefined}
                className={`nav-item ${active === label ? "selected" : ""}`}
                onClick={() => {
                  setActive(label);
                  setSearch("");
                }}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </button>
            ) : (
              <div className="nav-label" key={label}>
                {label}
              </div>
            ),
          )}
        </nav>
        <div className="account">
          <div className="avatar">
            {preferences.name
              .split(" ")
              .map((x) => x[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <strong>{preferences.name}</strong>
            <small>Administrator</small>
          </div>
        </div>
        <button
          className="signout"
          aria-label="Sign out"
          onClick={() => open("signout", "Sign out")}
        >
          <Icon name="logout" />
          <span>Sign out</span>
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="search-icon">
            <Icon name="search" />
          </div>
          <input
            aria-label={`Search ${active.toLowerCase()}`}
            disabled={["Reports", "Museum Info & Maps", "Settings"].includes(
              active,
            )}
            placeholder={
              ["Reports", "Museum Info & Maps", "Settings"].includes(active)
                ? "Muses workspace"
                : active === "Overview"
                  ? "Search artworks, artists..."
                  : `Search ${active.toLowerCase()}...`
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="notification-wrap">
            <button
              className="icon-button notification"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Icon name="bell" />
              <i />
            </button>
            {notifications && (
              <div className="notification-panel">
                <strong>You’re all caught up with Muses</strong>
                <p>
                  3 artworks need audio and 5 translations are waiting for
                  review.
                </p>
                <button
                  onClick={() => {
                    setNotifications(false);
                    setActive("Languages & Audio");
                  }}
                >
                  Review content →
                </button>
              </div>
            )}
          </div>
          <button
            className="date-button"
            onClick={() => {
              if (active !== "Overview") {
                setActive("Exhibitions & Events");
                return;
              }
              document
                .querySelector(".calendar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Icon name="calendar" />
            {monthLabel}
            <span>⌄</span>
          </button>
        </header>
        {active === "Overview" ? (
          <div className="dashboard">
            <main>
              <div className="greeting">
                <div>
                  <h1>
                    {active === "Overview"
                      ? `Good morning, ${preferences.name}`
                      : active}
                  </h1>
                  <p>
                    {active === "Overview"
                      ? "Manage the Muses visitor experience."
                      : "Your museum, thoughtfully managed."}
                  </p>
                </div>
                <div className="greeting-actions">
                  <span className="demo">
                    <i /> DEMO DATA
                  </span>
                  <button
                    className="primary"
                    onClick={() => open("artwork", "Add artwork")}
                  >
                    <Icon name="plus" />
                    Add artwork
                  </button>
                </div>
              </div>
              <div className="stats">
                {[
                  ["Artworks", 32, "In the collection", "image", "yellow"],
                  ["Online sessions", 128, "Today", "chart", "pink"],
                  ["Museum check-ins", 46, "Today", "pin", "green"],
                  ["Audio plays", 215, "Today", "audio", "blue"],
                ].map(([label, n, sub, icon, color]) => (
                  <button
                    className={`stat ${color}`}
                    key={label}
                    onClick={() =>
                      setActive(
                        label === "Artworks"
                          ? "Artworks"
                          : label === "Museum check-ins"
                            ? "Visitors"
                            : label === "Audio plays"
                              ? "Languages & Audio"
                              : "Reports",
                      )
                    }
                  >
                    <span className="stat-decoration">
                      {color === "yellow"
                        ? "+"
                        : color === "pink"
                          ? "♥"
                          : color === "green"
                            ? "◢"
                            : "✹"}
                    </span>
                    <Icon name={icon} size={29} />
                    <span className="stat-label">{label}</span>
                    <strong>
                      {n + (label === "Artworks" ? rows.length - 3 : 0)}
                    </strong>
                    <small>{sub}</small>
                    <span className="round-arrow">
                      <Icon name="arrow" size={19} />
                    </span>
                  </button>
                ))}
              </div>
              <section className="activity">
                <div className="section-heading">
                  <h2>Visitor activity</h2>
                  <div className="tabs">
                    {[7, 30].map((n) => (
                      <button
                        className={range === n ? "on" : ""}
                        key={n}
                        onClick={() => setRange(n)}
                      >
                        Last {n} days
                      </button>
                    ))}
                  </div>
                </div>
                <div className="chart-legend">
                  <span>
                    <i />
                    Online sessions
                  </span>
                  <span>
                    <i />
                    Museum check-ins
                  </span>
                </div>
                <div className="chart">
                  <svg
                    viewBox="0 0 760 170"
                    role="img"
                    aria-label={`Visitor activity for the last ${range} days`}
                  >
                    <defs>
                      <linearGradient id="pinkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="#ed2990" stopOpacity=".19" />
                        <stop offset="1" stopColor="#ed2990" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="#2877dd" stopOpacity=".22" />
                        <stop offset="1" stopColor="#2877dd" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[20, 55, 90, 125].map((y, i) => (
                      <g key={y}>
                        <line
                          x1="35"
                          x2="745"
                          y1={y}
                          y2={y}
                          stroke="#9f8597"
                          strokeDasharray="4 3"
                          opacity=".35"
                        />
                        <text x="7" y={y + 4}>
                          {300 - i * 100}
                        </text>
                      </g>
                    ))}
                    {[35, 148, 261, 374, 487, 600, 713].map((x) => (
                      <line
                        key={x}
                        x1={x}
                        x2={x}
                        y1="20"
                        y2="128"
                        stroke="#9f8597"
                        strokeDasharray="4 3"
                        opacity=".4"
                      />
                    ))}
                    <path
                      d={
                        range === 7
                          ? "M35 74 Q90 69 148 66 T261 54 T374 70 T487 52 T600 31 T713 61 L713 128H35Z"
                          : "M35 92 Q90 50 148 62 T261 30 T374 55 T487 33 T600 49 T713 25 L713 128H35Z"
                      }
                      fill="url(#pinkFill)"
                      stroke="#ed2990"
                      strokeWidth="1.6"
                    />
                    <path
                      d={
                        range === 7
                          ? "M35 103 Q90 99 148 95 T261 100 T374 107 T487 89 T600 72 T713 96 L713 128H35Z"
                          : "M35 110 Q90 80 148 87 T261 65 T374 99 T487 70 T600 78 T713 54 L713 128H35Z"
                      }
                      fill="url(#blueFill)"
                      stroke="#2877dd"
                      strokeWidth="1.6"
                    />
                    {range === 7 &&
                      [74, 66, 54, 70, 52, 31, 61].map((y, i) => (
                        <g key={i}>
                          <circle
                            cx={35 + i * 113}
                            cy={y}
                            r="4"
                            fill="#ed2990"
                            stroke="#fac2e2"
                          />
                          <circle
                            cx={35 + i * 113}
                            cy={[103, 95, 100, 107, 89, 72, 96][i]}
                            r="4"
                            fill="#2877dd"
                            stroke="#fac2e2"
                          />
                        </g>
                      ))}
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <text
                        key={n}
                        x={35 + n * 113}
                        y="151"
                        textAnchor="middle"
                      >
                        {range === 7
                          ? `${16 + n} Oct`
                          : new Date(2026, 8, 23 + n * 5).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" },
                            )}
                      </text>
                    ))}
                  </svg>
                </div>
              </section>
              <section className="recent">
                <div className="section-heading">
                  <h2>
                    {active === "Overview"
                      ? "Recent artworks"
                      : active === "Artworks"
                        ? "Artwork collection"
                        : `${active} workspace`}
                  </h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      setActive("Artworks");
                      toast("Showing the full artwork collection");
                    }}
                  >
                    View all <Icon name="arrow" size={18} />
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Artwork</th>
                        <th>Artist</th>
                        <th>Content</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r) =>
                          (r.title + " " + r.artist)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((r, i) => (
                          <tr key={i}>
                            <td>
                              <div className="artwork-cell">
                                <img src={r.img} alt={r.title} />
                                <strong>{r.title}</strong>
                              </div>
                            </td>
                            <td>{r.artist}</td>
                            <td
                              className={
                                r.content.startsWith("Missing") ? "missing" : ""
                              }
                            >
                              {r.content}
                            </td>
                            <td>
                              <span
                                className={`status ${r.status.toLowerCase()}`}
                              >
                                <i />
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="more"
                                aria-label={`Manage ${r.title}`}
                                onClick={() => open("detail", r.title)}
                              >
                                ⋮
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!rows.some((r) =>
                    (r.title + " " + r.artist)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ) && (
                    <p className="empty">
                      No artworks found. Try another title or artist.
                    </p>
                  )}
                </div>
                <p className="table-note">
                  Manage images, translations and audio for each artwork.
                </p>
              </section>
            </main>
            <aside className="right-column">
              <section className="calendar">
                <div className="section-heading">
                  <h2>{monthLabel}</h2>
                  <div>
                    <button
                      aria-label="Previous month"
                      onClick={() =>
                        setMonth(
                          new Date(
                            month.getFullYear(),
                            month.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      aria-label="Next month"
                      onClick={() =>
                        setMonth(
                          new Date(
                            month.getFullYear(),
                            month.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="calendar-grid">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <span className="weekday" key={d}>
                        {d}
                      </span>
                    ),
                  )}
                  {Array.from(
                    { length: Math.ceil((offset + count) / 7) * 7 },
                    (_, i) => {
                      let d = i - offset + 1;
                      let muted = d < 1 || d > count;
                      let display =
                        d < 1
                          ? new Date(
                              month.getFullYear(),
                              month.getMonth(),
                              0,
                            ).getDate() + d
                          : d > count
                            ? d - count
                            : d;
                      return (
                        <button
                          key={i}
                          className={`${muted ? "muted" : ""} ${!muted && day === d ? "today" : ""}`}
                          onClick={() => !muted && setDay(d)}
                        >
                          {display}
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
              <section className="actions-needed">
                <h2>
                  <Icon name="list" />
                  Action needed
                </h2>
                {[
                  ["3", "artworks missing audio", "audio", "pink"],
                  ["5", "translations to review", "list", "peach"],
                  ["2", "artworks missing images", "image", "green"],
                ].map(([n, t, icon, color]) => (
                  <button
                    className="action-row"
                    key={t}
                    onClick={() => open("review", t)}
                  >
                    <span className={`action-icon ${color}`}>
                      <Icon name={icon} size={18} />
                    </span>
                    <span>
                      <b>{n}</b> {t}
                    </span>
                    <span className="tiny-arrow">→</span>
                  </button>
                ))}
              </section>
              <section className="outdoor">
                <div className="section-heading">
                  <h2>
                    <Icon name="map" />
                    Outdoor exhibit points
                  </h2>
                  <button
                    className="round-arrow"
                    aria-label="Open outdoor exhibit points"
                    onClick={() => open("gps", "Manage outdoor points")}
                  >
                    <Icon name="arrow" size={18} />
                  </button>
                </div>
                <div className="points-summary">
                  <span>Σ</span>
                  <div>
                    <strong>6 / 8 points active</strong>
                    <small>Coordinates · Radius · Artworks</small>
                  </div>
                </div>
                <div className="map">
                  <img src={park} alt="Museum grounds map" />
                  {[
                    [27, 32],
                    [77, 25],
                    [53, 70],
                  ].map(([x, y], i) => (
                    <button
                      key={i}
                      style={{ left: x + "%", top: y + "%" }}
                      aria-label={`Exhibit point ${i + 1}`}
                      onClick={() => open("gps", `Exhibit point ${i + 1}`)}
                    >
                      <Icon name="pin" size={27} />
                    </button>
                  ))}
                  <span className="compass">
                    ▲<small>N</small>
                  </span>
                </div>
                <button
                  className="manage"
                  onClick={() => setActive("Outdoor Points · GPS")}
                >
                  Manage GPS
                </button>
              </section>
              <section className="quick">
                <h2>
                  <span>ϟ</span>Quick actions
                </h2>
                <div>
                  <button onClick={() => setActive("QR Check-in")}>
                    <Icon name="qr" />
                    Create QR check-in
                  </button>
                  <button onClick={() => setActive("Languages & Audio")}>
                    <Icon name="upload" />
                    Upload audio
                  </button>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <AdminPages
            page={active}
            search={search}
            rows={rows}
            setRows={setRows}
            toast={toast}
            preferences={preferences}
            setPreferences={setPreferences}
          />
        )}
        <footer className="page-footer">
          MUSES ADMIN <span>A little art. A lot of possibility.</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-heading">
              <h2>{modal.title}</h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <Icon name="close" />
              </button>
            </div>
            {modal.kind === "artwork" ? (
              <form onSubmit={submit}>
                <p>Add a new piece to the Muses collection.</p>
                <label>
                  Artwork title
                  <input
                    name="title"
                    required
                    placeholder="e.g. A quiet afternoon"
                    autoFocus
                  />
                </label>
                <label>
                  Artist
                  <input name="artist" required placeholder="Artist name" />
                </label>
                <label>
                  Collection
                  <select>
                    <option>Permanent collection</option>
                    <option>Temporary exhibition</option>
                  </select>
                </label>
                <button className="primary" type="submit">
                  Save as draft <Icon name="arrow" size={18} />
                </button>
              </form>
            ) : modal.kind === "upload" ? (
              <form onSubmit={submit}>
                <p>Add an audio guide to an artwork.</p>
                <label>
                  Artwork
                  <select>
                    {rows.map((r) => (
                      <option key={r.title}>{r.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Audio file
                  <input type="file" accept="audio/*" required />
                </label>
                <button className="primary">Save audio</button>
              </form>
            ) : modal.kind === "qr" ? (
              <form onSubmit={submit}>
                <p>Create a check-in point for your visitors.</p>
                <label>
                  Point name
                  <input required placeholder="Main entrance" />
                </label>
                <label>
                  Location
                  <select>
                    <option>Museum entrance</option>
                    <option>Outdoor sculpture garden</option>
                  </select>
                </label>
                <button className="primary">Create check-in point</button>
              </form>
            ) : modal.kind === "gps" ? (
              <form onSubmit={submit}>
                <p>6 of 8 outdoor exhibit points are currently active.</p>
                <label>
                  Exhibit point
                  <select>
                    <option>Sculpture garden</option>
                    <option>North entrance</option>
                    <option>Central courtyard</option>
                  </select>
                </label>
                <label>
                  Check-in radius (meters)
                  <input
                    type="number"
                    min="5"
                    max="500"
                    defaultValue="30"
                    required
                  />
                </label>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked /> Active point
                </label>
                <button className="primary">Save point</button>
              </form>
            ) : modal.kind === "signout" ? (
              <>
                <p>This is a demo dashboard. No live account is connected.</p>
                <button className="primary" onClick={() => setModal(null)}>
                  Back to dashboard
                </button>
              </>
            ) : modal.kind === "metric" ? (
              <>
                <p>Today’s collection and visitor snapshot.</p>
                <div className="metric-detail">
                  <strong>
                    {modal.title === "Artworks"
                      ? rows.length + 29
                      : modal.title === "Online sessions"
                        ? 128
                        : modal.title === "Museum check-ins"
                          ? 46
                          : 215}
                  </strong>
                  <span>{modal.title}</span>
                </div>
                <p className="muted-copy">
                  Demo data · Updated today, 22 October 2026
                </p>
              </>
            ) : (
              <>
                <p>
                  {modal.kind === "detail"
                    ? "Artwork content overview"
                    : "Content awaiting your attention"}
                </p>
                <div className="review-list">
                  {rows
                    .filter(
                      (r) => modal.kind !== "detail" || r.title === modal.title,
                    )
                    .map((r) => (
                      <div key={r.title}>
                        <img src={r.img} alt="" />
                        <div>
                          <strong>{r.title}</strong>
                          <small>
                            {r.artist} · {r.content}
                          </small>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="muted-copy">
                  Demo workspace — changes are stored for this session only.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    toast("Review marked complete for this session");
                    setModal(null);
                  }}
                >
                  Mark reviewed
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
