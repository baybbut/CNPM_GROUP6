import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AdminGate, { useAdmin, adminApi } from "./AdminAuth";
import AdminPages from "./AdminPages";
import Icon from "./Icons";
import "./style.css";
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
  ["QR Check-in", "qr"],
  ["Museum Info & Maps", "map"],
];
function currentPage() {
  try {
    const value = decodeURIComponent(location.hash.slice(1));
    return nav.some(([name, icon]) => icon && name === value)
      ? value
      : "Overview";
  } catch {
    return "Overview";
  }
}
function App() {
  const { user } = useAdmin();
  const [active, setActive] = useState(currentPage),
    [search, setSearch] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [notifications, setNotifications] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const changed = () => {
      setActive(currentPage());
      setSearch("");
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(page) {
    setActive(page);
    setSearch("");
    location.hash = encodeURIComponent(page);
  }
  async function logout() {
    try {
      await adminApi("/api/auth/logout", "POST", {});
      location.reload();
    } catch (e) {
      setNotice(e.message);
    }
  }
  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <a className="brand" href="#Overview" aria-label="Muses overview">
          <Icon name="museum" size={35} />
          <span>MUSES</span>
        </a>
        <button
          className="collapse"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((v) => !v)}
        >
          ›
        </button>
        <nav>
          {nav.map(([name, icon]) =>
            icon ? (
              <button
                key={name}
                aria-label={name}
                aria-current={active === name ? "page" : undefined}
                className={`nav-item ${active === name ? "selected" : ""}`}
                onClick={() => navigate(name)}
              >
                <Icon name={icon} />
                <span>{name}</span>
              </button>
            ) : (
              <div className="nav-label" key={name}>
                {name}
              </div>
            ),
          )}
        </nav>
        <div className="account">
          <div className="avatar">
            {user.name
              .split(" ")
              .filter(Boolean)
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <strong>{user.name}</strong>
            <small>Administrator</small>
          </div>
        </div>
        <button className="signout" aria-label="Sign out" onClick={logout}>
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
            disabled={active === "Reports"}
            placeholder={
              active === "Reports"
                ? "Muses reports"
                : `Search ${active.toLowerCase()}…`
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="notification-wrap">
            <button
              className="icon-button notification"
              aria-label="Review content"
              aria-expanded={notifications}
              onClick={() => setNotifications((v) => !v)}
            >
              <Icon name="bell" />
            </button>
            {notifications && (
              <div className="notification-panel">
                <strong>Kiểm duyệt nội dung</strong>
                <p>Kiểm tra bản dịch và nguồn thông tin trước khi công bố.</p>
                <button
                  onClick={() => {
                    setNotifications(false);
                    navigate("Languages & Audio");
                  }}
                >
                  Xem bản dịch →
                </button>
              </div>
            )}
          </div>
          <button
            className="date-button"
            onClick={() => navigate("Reports")}
            aria-label="Xem báo cáo theo ngày"
          >
            <Icon name="calendar" />
            Báo cáo theo ngày
          </button>
        </header>
        <AdminPages page={active} search={search} />
        <footer className="page-footer">
          MUSES ADMIN <span>A little art. A lot of possibility.</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <AdminGate>
    <App />
  </AdminGate>,
);
