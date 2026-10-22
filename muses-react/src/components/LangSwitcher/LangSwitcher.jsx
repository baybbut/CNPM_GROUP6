import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LangContext";
import "./LangSwitcher.css";
import { SvgIcon } from "../Icons";

export default function LangSwitcher() {
  const { lang, setLang, languages } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
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
        <SvgIcon
          kind="chevron"
          size={14}
          className={`lang-arrow ${open ? "open" : ""}`}
        />
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {languages.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                className={l.code === lang ? "active" : ""}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
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
