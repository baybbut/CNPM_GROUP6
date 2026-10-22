import { useLang } from "../../context/LangContext";
import { ABOUT_LINKS, CONTACT_LINKS } from "../../data/data";
import "./Footer.css";
import { SvgIcon } from "../Icons";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="f-cols">
        <div>
          <h4>{t("about")}</h4>
          {ABOUT_LINKS.map((l) => (
            <a key={l} href="#">
              {t(l)}
            </a>
          ))}
        </div>
        <div>
          <h4>{t("contact")}</h4>
          {CONTACT_LINKS.map((l) => (
            <a key={l} href="#">
              {t(l)}
            </a>
          ))}
        </div>
        <div>
          <h4>{t("follow")}</h4>
          <div className="socials">
            {[
              ["facebook", "Facebook"],
              ["instagram", "Instagram"],
              ["twitter", "Twitter"],
            ].map(([s, name]) => (
              <a key={s} href="#" className="social" aria-label={name}>
                <SvgIcon kind={s} size={36} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="f-logo">MUSES</div>
      <button
        className="to-top"
        aria-label="Top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <SvgIcon
          kind="chevron"
          size={22}
          style={{ transform: "rotate(180deg)" }}
        />
      </button>
    </footer>
  );
}
