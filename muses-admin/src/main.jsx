import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import lilies from "../../muses-react/tranh/THIEUNUBENHOAHUE.jpg";
import spring from "../../muses-react/tranh/tranhsonmai/VUONXUANTRUNGNAMBAC.png";
import seasons from "../../muses-react/tranh/tranhsonmai/GIAOMUA.jpg";
import park from "../../muses-react/maps/MusesOutdoor.png";
const paths = {
  home: "m3 10 9-7 9 7v11h-6v-7H9v7H3z",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
  chart: "M4 21V11h4v10 M10 21V3h4v18 M16 21V7h4v14",
  image: "M3 3h18v18H3z M3 16l6-6 12 11 M15 7h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M3 22a9 9 0 0 1 18 0",
  audio: "M3 14v-3a9 9 0 0 1 18 0v3 M3 12h4v9H3z M17 12h4v9h-4z",
  calendar: "M3 5h18v16H3z M7 2v6 M17 2v6 M3 11h18",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  qr: "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h2v2h-2z M21 15v6h-6",
  map: "m3 6 6-3 6 3 6-3v16l-6 3-6-3-6 3z M9 3v16 M15 6v16",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 2-1 4-4 3-3-2-4-1-3-4 2-3 1-4z",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M9 21h6",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  plus: "M12 4v16 M4 12h16",
  logout: "M9 3H3v18h6 M9 12h13 M17 7l5 5-5 5",
  upload:
    "M7 18H5a4 4 0 0 1-1-8 8 8 0 0 1 15-2 5 5 0 0 1 0 10h-2 M12 21V10 M8 14l4-4 4 4",
  list: "M8 5h13 M8 12h13 M8 19h13 M3 5h.01 M3 12h.01 M3 19h.01",
  museum:
    "m2 8 10-6 10 6z M2 22h20 M4 19h16 M6 10v7 M10 10v7 M14 10v7 M18 10v7",
  close: "m6 6 12 12 M6 18 18 6",
};
function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.list} />
    </svg>
  );
}
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
  const [active, setActive] = useState("Overview"),
    [search, setSearch] = useState(""),
    [range, setRange] = useState(7),
    [month, setMonth] = useState(new Date(2026, 9, 1)),
    [day, setDay] = useState(22),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [rows, setRows] = useState(initial),
    [collapsed, setCollapsed] = useState(false),
    [notifications, setNotifications] = useState(false);
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
        <a className="brand" href="#" onClick={() => setActive("Overview")}>
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
          <div className="avatar">AT</div>
          <div>
            <strong>Anh Thư</strong>
            <small>Administrator</small>
          </div>
        </div>
        <button className="signout" onClick={() => open("signout", "Sign out")}>
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
            aria-label="Search artworks or artists"
            placeholder="Search artworks, artists..."
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
                    open("review", "Review content");
                  }}
                >
                  Review content →
                </button>
              </div>
            )}
          </div>
          <button
            className="date-button"
            onClick={() =>
              document
                .querySelector(".calendar")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            <Icon name="calendar" />
            {monthLabel}
            <span>⌄</span>
          </button>
        </header>
        <div className="dashboard">
          <main>
            <div className="greeting">
              <div>
                <h1>
                  {active === "Overview" ? "Good morning, Anh Thư" : active}
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
                  onClick={() => open("metric", label)}
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
                    <text key={n} x={35 + n * 113} y="151" textAnchor="middle">
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
                        new Date(month.getFullYear(), month.getMonth() - 1, 1),
                      )
                    }
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next month"
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() + 1, 1),
                      )
                    }
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span className="weekday" key={d}>
                    {d}
                  </span>
                ))}
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
                onClick={() => open("gps", "Manage GPS")}
              >
                Manage GPS
              </button>
            </section>
            <section className="quick">
              <h2>
                <span>ϟ</span>Quick actions
              </h2>
              <div>
                <button onClick={() => open("qr", "Create QR check-in")}>
                  <Icon name="qr" />
                  Create QR check-in
                </button>
                <button onClick={() => open("upload", "Upload audio")}>
                  <Icon name="upload" />
                  Upload audio
                </button>
              </div>
            </section>
          </aside>
        </div>
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
