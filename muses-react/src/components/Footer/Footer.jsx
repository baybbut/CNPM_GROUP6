import { useLang } from "../../context/LangContext";
import { ABOUT_LINKS, CONTACT_LINKS } from "../../data/data";
import "./Footer.css";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="f-cols">
        <div>
          <h4>{t("about")}</h4>
          {ABOUT_LINKS.map((l) => <a key={l} href="#">{t(l)}</a>)}
        </div>
        <div>
          <h4>{t("contact")}</h4>
          {CONTACT_LINKS.map((l) => <a key={l} href="#">{t(l)}</a>)}
        </div>
        <div>
          <h4>{t("follow")}</h4>
          <div className="socials">
            {[["f", "Facebook"], ["ig", "Instagram"], ["tw", "Twitter"]].map(([s, name]) => (
              <a key={s} href="#" className="social" aria-label={name}>{s}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="f-logo">MUSES</div>
      <button className="to-top" aria-label="Top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
    </footer>
  );
}
