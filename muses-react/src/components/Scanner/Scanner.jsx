import { Link } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { CONTENT_LANGUAGES } from "../../api/contentLanguages.mjs";
import { label } from "../../i18n/catalog.mjs";
import { ArtworkCollection } from "../explore/Artworks";
import WebsiteQR from "./WebsiteQR";
import "./scanner.css";

export default function Scanner() {
  const { lang, setLang } = useLang();
  const t = (key) => label(lang, key);
  return (
    <div className="scan-page scan-catalogue">
      <div className="scan-intro">
        <p>MUSES · QR</p>
        <h1>{t("Explore artworks with QR")}</h1>
        <p>
          {t(
            "Choose an artwork to display its QR code. Scan with your phone to see the images, full details and audio guide.",
          )}
        </p>
      </div>
      <WebsiteQR />
      <div className="scan-catalogue-tools">
        <label>
          {t("Content language")}
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {CONTENT_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <Link className="scan-outline" to="/scan/camera">
          {t("Scan an existing code")}
        </Link>
      </div>
      <ArtworkCollection qrMode />
    </div>
  );
}
