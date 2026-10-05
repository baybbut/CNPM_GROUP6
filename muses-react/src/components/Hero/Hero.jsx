import { useLang } from "../../context/LangContext";
import TicketIcon from "../../../icon/ticket.png";
import { InfoIcon } from "../Icons";
import "./Hero.css";

export default function Hero() {
  const { t } = useLang();
  return (
    <section className="hero">
      <svg width="0" height="0" aria-hidden="true">
        <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
          <path d="M0,0.05 Q0.5,0.25 1,0.05 L1,0.95 Q0.5,0.8 0,0.95 Z" />
        </clipPath>
      </svg>
      <div className="hero-img" />
      <div className="welcome-bar">
        <div className="welcome-text">
          <strong>{t("welcome")}</strong>
          <span>{t("openToday")}<br />{t("hours")}</span>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-brown">
            <img src={TicketIcon} alt="" className="ticket-icon" />
             {t("bookTicket")}</button>
          <button className="btn btn-grey">
            <InfoIcon />
            {t("prepare")}</button>
        </div>
      </div>
    </section>
  );
}
