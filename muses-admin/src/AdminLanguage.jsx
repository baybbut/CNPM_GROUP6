import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES } from "../../muses-react/src/i18n/i18n";
import { messages, translationIndex } from "./dashboardMessages";

const languages = LANGUAGES.filter(({ code }) => code === "en" || Object.hasOwn(translationIndex, code));
const storageKey = "muses-admin-language";
const LanguageContext = createContext(null);
export const useAdminLanguage = () => useContext(LanguageContext);

function initialLanguage() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (languages.some(({ code }) => code === saved)) return saved;
  } catch {
    // Storage may be disabled in a private browsing session.
  }
  const browser = navigator.language.split("-")[0];
  return languages.some(({ code }) => code === browser) ? browser : "en";
}

export function AdminLanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(storageKey, lang);
    } catch {
      // The selection still applies to this session.
    }
  }, [lang]);

  function t(key, values) {
    const text = messages[key]?.[translationIndex[lang]] ?? key;
    return values ? text.replace(/\{(\w+)\}/g, (token, name) => values[name] ?? token) : text;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function LanguageSelect() {
  const { lang, setLang, t } = useAdminLanguage();
  return (
    <select
      className="admin-language"
      aria-label={t("Language")}
      value={lang}
      onChange={(event) => setLang(event.target.value)}
    >
      {languages.map(({ code, label }) => (
        <option key={code} value={code} lang={code}>{label}</option>
      ))}
    </select>
  );
}
