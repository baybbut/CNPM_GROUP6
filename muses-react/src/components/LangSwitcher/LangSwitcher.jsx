import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import "./LangSwitcher.css";

export default function LangSwitcher() {
  const { lang, setLang, languages } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = languages.find((l) => l.code === lang);

  return (
    <div className="lang-switcher" ref={ref}>
      <button
  className="lang-toggle"
  aria-haspopup="listbox"
  aria-expanded={open}
  onClick={() => setOpen(!open)}
>
  {current.label}
  <svg
    className={`lang-arrow ${open ? "open" : ""}`}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
</button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {languages.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                className={l.code === lang ? "active" : ""}
                onClick={() => { setLang(l.code); setOpen(false); }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
