import { useLang } from "../../context/LangContext";
import { NAV_LINKS } from "../../data/data";
import  TicketIcon  from "../../../icon/ticket.png";
import LangSwitcher from "../LangSwitcher/LangSwitcher";
import SearchIcon from "../../../icon/search.png";
import "./Header.css";

export default function Header() {
  const { t } = useLang();
  return (
    <header className="header">
      <nav className="nav-left">
        {NAV_LINKS.map((k) => (
          <a key={k} href="#">{t(k)}</a>
        ))}
      </nav>
      <a href="#" className="logo">MUSES</a>
      <div className="nav-right">
        <button className="search-btn">
          {t("search")} 
          <img src={SearchIcon} alt="" className="search-icon" />
        </button>
        <LangSwitcher />
        <button className="btn btn-brown"> 
          <img src={TicketIcon} alt="" className="ticket-icon" />
          {t("ticket")}
          </button>
      </div>
    </header>
  );
}
