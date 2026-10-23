import Analytics from "./pages/Analytics";
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
          onClick={async () => {
            try {
              const response = await fetch(
                `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")}/api/auth/logout`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: "{}",
                  credentials: "include",
                },
              );
              if (!response.ok) throw new Error("Sign out failed");
              location.reload();
            } catch {
              toast("Chưa đăng xuất được. Thử lại.");
            }
          }}
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
            onClick={() => setActive("Reports")}
            aria-label="Xem báo cáo theo ngày"
          >
            <Icon name="calendar" />
            Báo cáo theo ngày
          </button>
        </header>
        {active === "Overview" ? (
          <Analytics mode="overview" search={search} />
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
