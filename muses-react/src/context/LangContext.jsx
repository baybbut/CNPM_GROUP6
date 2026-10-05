import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, TRANSLATIONS } from "../i18n/i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("muses-lang");
      if (TRANSLATIONS[saved]) return saved;
    } catch {}
    const nav = (navigator.language || "en").slice(0, 2);
    return TRANSLATIONS[nav] ? nav : "en";
  });

  useEffect(() => {
    const info = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info.rtl ? "rtl" : "ltr";
    try { localStorage.setItem("muses-lang", lang); } catch {}
  }, [lang]);

  const t = (key) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
