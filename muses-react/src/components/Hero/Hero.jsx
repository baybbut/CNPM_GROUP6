import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import TicketIcon from "../../../icon/ticketW.png";
import { InfoIcon } from "../Icons";
import "./Hero.css";

import { useHomeImage } from "../../context/HomeImagesContext";

export default function Hero() {
  const { t } = useLang();
  const image = useHomeImage("home.hero");
  return (
    <section className="hero" data-scroll-intro>
      <svg width="0" height="0" aria-hidden="true">
        <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
          <path d="M0,0.05 Q0.5,0.25 1,0.05 L1,0.95 Q0.5,0.8 0,0.95 Z" />
        </clipPath>
      </svg>
      <div
        className="hero-img"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      />
      <div className="welcome-bar">
        <div className="welcome-text">
          <strong>{t("welcome")}</strong>
          <span>
            {t("openToday")}
            <br />
            {t("hours")}
          </span>
        </div>
        <div className="welcome-actions">
          <Link to="/tickets" className="btn btn-brown">
            <img src={TicketIcon} alt="" className="ticket-icon" />
            {t("bookTicket")}
          </Link>
          <Link to="/visit" className="btn btn-grey">
            <InfoIcon />
            {t("prepare")}
          </Link>
        </div>
      </div>
    </section>
  );
}
