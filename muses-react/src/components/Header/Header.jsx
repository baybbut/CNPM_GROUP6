import { Link, NavLink, useLocation } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { NAV_LINKS } from "../../data/data";
import { TicketIcon, SearchIcon, SvgIcon } from "../Icons";
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
        <button className="search-btn" type="button">
          <SearchIcon light={light} />
          <span>{t("search")}</span>
        </button>
        <NavLink
          to="/scan"
          className="scan-nav"
          aria-label={lang === "vi" ? "Quét QR tác phẩm" : "Scan artwork QR"}
        >
          <SvgIcon kind="qr" size={22} />
          <span>{lang === "vi" ? "Quét QR" : "Scan QR"}</span>
        </NavLink>
        <LangSwitcher />
        <button className="btn btn-brown">
          <TicketIcon /> {t("ticket")}
        </button>
      </div>
    </header>
  );
}
