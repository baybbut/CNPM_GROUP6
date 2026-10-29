import { Link, NavLink, useLocation } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { NAV_LINKS } from "../../data/data";
import { TicketIcon, SearchIcon, SvgIcon } from "../Icons";
import { label } from "../../i18n/catalog.mjs";
import LangSwitcher from "../LangSwitcher/LangSwitcher";
import "./Header.css";

export default function Header() {
  const { t, lang } = useLang();
  const { pathname } = useLocation();

  const light = pathname === "/visit"; // trang Visit: chữ trắng
  const sand = ["/exhibition", "/explore"].some((p) => pathname.startsWith(p)); // trang Exhibition: nền nâu xám

  return (
    <header className={`header ${light ? "light" : ""} ${sand ? "sand" : ""}`}>
      <nav className="nav-left">
        {NAV_LINKS.map((n) => (
          <NavLink
            key={n.key}
            to={n.to}
            className={({ isActive }) =>
              isActive && n.to !== "#" ? "active" : ""
            }
          >
            {t(n.key)}
          </NavLink>
        ))}
      </nav>

      <Link to="/" className="logo">
        MUSES
      </Link>

      <div className="nav-right">
        <Link className="search-btn" to="/explore/collection">
          <SearchIcon light={light} />
          <span>{t("search")}</span>
        </Link>
        <NavLink
          to="/scan"
          className="scan-nav"
          aria-label={lang === "vi" ? "Quét QR tác phẩm" : "Scan artwork QR"}
        >
          <SvgIcon kind="qr" size={22} />
          <span>{lang === "vi" ? "Quét QR" : "Scan QR"}</span>
        </NavLink>
        <Link
          to="/museums"
          className="account-nav"
          aria-label={label(lang, "Museums")}
        >
          <SvgIcon kind="pin" size={20} className="museum-nav-icon" />
          <span>{label(lang, "Museums")}</span>
        </Link>
        <LangSwitcher />
        <Link to="/tickets" className="btn btn-brown ticket-nav">
          <TicketIcon /> {t("ticket")}
        </Link>
      </div>
    </header>
  );
}
