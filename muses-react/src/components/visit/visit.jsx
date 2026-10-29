import { ticketText } from "../Tickets/ticketText.mjs";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import { useState } from "react";
import {
  OPENING,
  DIRECTIONS,
  FACILITIES,
  SERVICES,
  ACCESS,
  FAQ,
} from "../../data/visitData";
import "./visit.css";

/* Nếu chuỗi chưa có bản dịch, t() trả về chính chuỗi tiếng Anh */
const Label = ({ id, color, children }) => (
  <h3 id={id} className="v-label" style={{ color }}>
    <span>{children}</span>
    <i />
  </h3>
);
const Pic = ({ src, color = "#8a6a4a", className = "" }) => (
  <div
    className={`v-pic ${className}`}
    style={src ? { backgroundImage: `url("${src}")` } : { background: color }}
  />
);
const More = ({ children }) => (
  <a className="v-link" href="#">
    {children} <SvgIcon kind="arrow" size={18} />
  </a>
);

// click để scroll đến phần tương ứng
const VISIT_MENU = [
  { id: "hours", label: "Hours & admission" },
  { id: "directions", label: "Map, entrances & directions" },
  { id: "galleries", label: "List of available galleries" },
  { id: "amenities", label: "Visitor amenities" },
  { id: "restaurants", label: "Restaurants & cafés" },
  { id: "family", label: "Visit as a family" },
  { id: "group", label: "Visit as a group" },
  { id: "accessibility", label: "Accessibility" },
  { id: "faq", label: "FAQ" },
];

export default function Visit() {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("hours");

  const goToSection = (event, id) => {
    const section = document.getElementById(id);

    if (!section) return;

    event.preventDefault();
    setActiveTab(id);

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  return (
    <div className="visit">
      {/* HERO */}
      <section className="v-hero" data-scroll-intro>
        <div className="v-hero-text">
          <h1>VISIT</h1>
          <p>{t("Everything you need to know before visiting the museum")}</p>
        </div>
      </section>

      {/* THANH MENU */}
      <nav className="v-tabs" aria-label="Visit sections">
        <div className="v-tabs-list">
          <a
            className={activeTab === "hours" ? "is-active" : ""}
            href="#hours"
            onClick={(event) => goToSection(event, "hours")}
          >
            {t("Hour & Admission")}
          </a>
          <a
            className={activeTab === "directions" ? "is-active" : ""}
            href="#directions"
            onClick={(event) => goToSection(event, "directions")}
          >
            {t("Maps, Entrance & Direction")}
          </a>
          <a
            className={activeTab === "galleries" ? "is-active" : ""}
            href="#galleries"
            onClick={(event) => goToSection(event, "galleries")}
          >
            {t("List of available gallery")}
          </a>
          <a
            className={activeTab === "amenities" ? "is-active" : ""}
            href="#amenities"
            onClick={(event) => goToSection(event, "amenities")}
          >
            {t("Visitors amenities")}
          </a>
          <a
            className={activeTab === "restaurants" ? "is-active" : ""}
            href="#restaurants"
            onClick={(event) => goToSection(event, "restaurants")}
          >
            {t("Restaurants & Café")}
          </a>
          <a
            className={activeTab === "family" ? "is-active" : ""}
            href="#family"
            onClick={(event) => goToSection(event, "family")}
          >
            {t("Visit as a family")}
          </a>
          <a
            className={activeTab === "group" ? "is-active" : ""}
            href="#group"
            onClick={(event) => goToSection(event, "group")}
          >
            {t("Visit as a group")}
          </a>
          <a
            className={activeTab === "accessibility" ? "is-active" : ""}
            href="#accessibility"
            onClick={(event) => goToSection(event, "accessibility")}
          >
            {t("Accessibility")}
          </a>
          <a
            className={activeTab === "faq" ? "is-active" : ""}
            href="#faq"
            onClick={(event) => goToSection(event, "faq")}
          >
            {t("FAQ")}
          </a>
        </div>
      </nav>

      {/* HOUR & ADMISSION */}
      <section className="v-sec v-tan">
        <Label id="hours" color="#e0245e">
          {t("HOUR & ADMISSION")}
        </Label>

        <div className="v-row">
          <div className="v-text">
            <h4>{t("OPENING HOURS")}</h4>
            <p>
              {t(
                "The museum is open daily except Wednesday. Last entry 1 hour before closure. Visitors will be asked to vacate the exhibition 30 minutes rooms before closure.",
              )}
            </p>
          </div>
          <div className="v-card center">
            <h5>THE MUSES MUSEUM</h5>
            <p className="v-open">
              <b />
              {t(OPENING.status)}
            </p>
            {OPENING.rows.map((r) => (
              <div key={r.note} className="v-cell">
                <div className="v-time">{r.time}</div>
                <small>{t(r.note)}</small>
              </div>
            ))}
            <div className="v-cell last">
              <div className="v-time">{OPENING.closed.label}</div>
              <small>{t(OPENING.closed.note)}</small>
            </div>
          </div>
        </div>

        <div className="v-row">
          <div className="v-text">
            <h4>{t("TICKET PRICES")}</h4>
            <p>
              {t(
                "Tickets can be used to access both the permanent collections and temporary exhibitions. Time-slot bookings are recommended, including for free-admission visitors.",
              )}
            </p>
            <Link className="btn btn-brown" to="/tickets">
              {t("bookTicket")}
            </Link>
          </div>
          <div className="v-card">
            <div className="v-ticket">
              <div>
                <h6>{ticketText(lang, "chooseMuseum")}</h6>
                <small>{ticketText(lang, "secureNote")}</small>
              </div>
              <Link className="btn btn-brown" to="/tickets">
                {ticketText(lang, "tickets")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAP, ENTRANCES & DIRECTIONS */}
      <section className="v-sec">
        <Label id="directions" color="#2d9d6a">
          {t("MAP, ENTRANCES & DIRECTIONS")}
        </Label>
        <div className="v-row">
          <div className="v-text">
            <p>{t("Tips for finding your way around the Muses")}</p>
            <More>{t("Finding your way around the Muses")}</More>
          </div>
          <div>
            {DIRECTIONS.map((d) => (
              <div key={d.title} className="v-dir">
                <Pic src={d.img} />
                <div>
                  <h6>{t(d.title)}</h6>
                  <More>{t(d.link)}</More>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROOM CLOSURES */}
      <section className="v-sec v-tan">
        <Label id="galleries" color="#8a3ffc">
          {t("LIST OF AVAILABLE GALLERIES")}
        </Label>
        <div className="v-row">
          <div className="v-text">
            <h4>{t("SCHEDULE OF ROOM CLOSURES")}</h4>
            <p>
              {t(
                "Due to renovations, some rooms may be closed during the week. Please check the schedule of room closures to better plan your visit.",
              )}
            </p>
            <More>{t("See list of available galleries")}</More>
          </div>
          <Pic className="tall" color="#6f6358" />
        </div>
      </section>

      {/* FACILITIES */}
      <section className="v-sec v-dark">
        <Label id="amenities" color="#8a3ffc">
          {t("LIST OF AVAILABLE GALLERIES")}
        </Label>
        <div className="v-right">
          <div className="v-grid3">
            {FACILITIES.map((f) => (
              <div key={f.label} className="v-fac">
                <SvgIcon kind={f.icon} color={f.color} size={44} />
                <small>{t(f.label)}</small>
              </div>
            ))}
          </div>
          {SERVICES.map((s) => (
            <div key={s.label} className="v-service">
              <Pic src={s.img} color="#5c5148" />
              <div>
                <SvgIcon kind={s.icon} color="#fff" size={28} />{" "}
                <span>{t(s.label)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESTAURANTS & CAFE */}
      <section className="v-sec v-cafe-wrap">
        <Label id="restaurants" color="#f97316">
          {t("RESTAURANTS & CAFÉ")}
        </Label>
      </section>
      <section className="v-cafe">
        <h4>{t("FANCY A BREAK AND SOMETHING TO EAT ?")}</h4>
        <p>
          {t(
            "Choose from a wide range of restaurants, cafes and take-away counters in the beautiful palace setting and gardens.",
          )}
        </p>
        <More>{t("See all cafes")}</More>
      </section>

      {/* FAMILY & GROUP */}
      <section className="v-sec">
        <Label id="family" color="#1aa5b8">
          {t("VISIT AS A FAMILY")}
        </Label>
        <div className="v-row">
          <p className="v-text">
            {t(
              "Enjoy the Muses experience with your children at no extra cost – admission to the permanent collections and temporary exhibitions is free for all visitors under the age of 18",
            )}
          </p>
          <Pic className="wide" color="#7a4a2a" />
        </div>
        <Label id="group" color="#1aa5b8">
          {t("VISIT AS A GROUP")}
        </Label>
        <div className="v-row">
          <p className="v-text">
            {t(
              "The museum offers a range of activities and tools for visiting the museum with groups of school children, disabled visitors and more: how to organise your visit, training, etc.",
            )}
          </p>
          <Pic className="wide" color="#5a3a2a" />
        </div>
      </section>

      {/* ACCESSIBILITY */}
      <section className="v-sec">
        <Label id="accessibility" color="#1f3fff">
          {t("ACCESSIBILITY")}
        </Label>
        <div className="v-row">
          <div className="v-text">
            <h4>{t("OPEN TO ALL")}</h4>
            <p>
              {t(
                "The Muses strives to make the museum accessible to all visitors. Measures are taken to ensure visitors find everything they need in the exhibition rooms and at each step of their itinerary.",
              )}
            </p>
            <More>{t("More information")}</More>
          </div>
          <div className="v-grid2">
            {ACCESS.map((a) => (
              <div key={a.label} className="v-acc">
                <SvgIcon kind={a.icon} size={44} />
                <small>{t(a.label)}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="v-sec v-dark">
        <Label id="faq" color="#22c55e">
          FAQ
        </Label>
        <div className="v-row">
          <div className="v-text">
            <h4>{t("FREQUENTLY ASKED QUESTIONS")}</h4>
            <p>{t("Answer from the Muses")}</p>
            <More>{t("See FAQ")}</More>
          </div>
          <div>
            {FAQ.map((f) => (
              <details key={f.q} className="v-faq">
                <summary>{t(f.q)}</summary>
                <p>{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
