import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, TRANSLATIONS } from "../i18n/i18n";

const supported = LANGUAGES.filter((l) =>
  ["vi", "en", "zh", "ja", "ko"].includes(l.code),
);
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("muses-lang");
      if (supported.some((l) => l.code === saved)) return saved;
    } catch {}
    const nav = (navigator.language || "en").slice(0, 2);
    return supported.some((l) => l.code === nav) ? nav : "vi";
  });

  useEffect(() => {
    const info = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info?.rtl ? "rtl" : "ltr";
    try {
      localStorage.setItem("muses-lang", lang);
    } catch {}
  }, [lang]);

  const t = (key) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t, languages: supported }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
