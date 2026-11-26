import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AdminGate, { useAdmin, adminApi } from "./AdminAuth";
import { AdminLanguageProvider, LanguageSelect, useAdminLanguage } from "./AdminLanguage";
import AdminPages from "./AdminPages";
import Icon from "./Icons";
import "./style.css";
import logo from "../../muses-react/icon/logo.png";

const favicon =
  document.querySelector('link[rel~="icon"]') ||
  document.head.appendChild(document.createElement("link"));

favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = logo;
const nav = [
  ["Overview", "home"],
  ["Reports", "chart"],
  ["CONTENT"],
  ["Artworks", "image"],
  ["Artists & Categories", "user"],
  ["Languages & Audio", "audio"],
  ["Exhibitions & Events", "calendar"],
  ["VISITS"],
  ["QR Codes", "qr"],
  ["Museum Info & Maps", "map"],
];
function currentPage() {
  try {
    const raw = decodeURIComponent(location.hash.slice(1));
    const value =
      raw === "Visitors"
        ? "Overview"
        : raw === "QR Check-in"
          ? "QR Codes"
          : raw;
    return nav.some(([name, icon]) => icon && name === value)
      ? value
      : "Overview";
  } catch {
    return "Overview";
  }
}
function App() {
  const { t } = useAdminLanguage();
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
        <a className="brand" href="#Overview" aria-label={t("Muses overview")}>
          <Icon name="museum" size={35} />
          <span>MUSES</span>
        </a>
        <button
          className="collapse"
          aria-label={t("Toggle sidebar")}
          onClick={() => setCollapsed((v) => !v)}
        >
          ›
        </button>
        <nav>
          {nav.map(([name, icon]) =>
            icon ? (
              <button
                key={name}
                aria-label={t(name === "QR Codes" ? "Manage QR" : name)}
                aria-current={active === name ? "page" : undefined}
                className={`nav-item ${active === name ? "selected" : ""}`}
                onClick={() => navigate(name)}
              >
                <Icon name={icon} />
                <span>{t(name === "QR Codes" ? "Manage QR" : name)}</span>
              </button>
            ) : (
              <div className="nav-label" key={name}>
                {t(name)}
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
            <small>{t("Administrator")}</small>
          </div>
        </div>
        <button className="signout" aria-label={t("Sign out")} onClick={logout}>
          <Icon name="logout" />
          <span>{t("Sign out")}</span>
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="search-icon">
            <Icon name="search" />
          </div>
          <input
            aria-label={t("Search {page}", { page: t(active === "QR Codes" ? "Manage QR" : active) })}
            disabled={active === "Reports"}
            placeholder={
              active === "Reports"
                ? t("Muses reports")
                : active === "Overview"
                  ? t("Find a customer or session ID…")
                  : active === "QR Codes"
                    ? t("Find a QR name or artwork…")
                    : t("Search {page}", { page: t(active) }) + "…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <LanguageSelect />
          <div className="notification-wrap">
            <button
              className="icon-button notification"
              aria-label={t("Review content")}
              aria-expanded={notifications}
              onClick={() => setNotifications((v) => !v)}
            >
              <Icon name="bell" />
            </button>
            {notifications && (
              <div className="notification-panel">
                <strong>{t("Content Review")}</strong>
                <p>{t("Check translations and information sources before publishing.")}</p>
                <button
                  onClick={() => {
                    setNotifications(false);
                    navigate("Languages & Audio");
                  }}
                >
                  {t("View Translations")} →
                </button>
              </div>
            )}
          </div>
        </header>
        <AdminPages page={active} search={search} />
        <footer className="page-footer">
          MUSES ADMIN <span>{t("A little art. A lot of possibility.")}</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label={t("Close")} onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <AdminLanguageProvider>
    <AdminGate>
      <App />
    </AdminGate>
  </AdminLanguageProvider>,
);
