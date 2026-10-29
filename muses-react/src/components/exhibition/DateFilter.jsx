import { useEffect, useRef, useState } from "react";
import { SvgIcon } from "../Icons";
export default function DateFilter({ value, onChange, vi, allLabel }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null),
    button = useRef(null),
    input = useRef(null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const label = value ? value.split("-").reverse().join("/") : allLabel;
  return (
    <div className="ex-dates" ref={root}>
      <button
        ref={button}
        type="button"
        className="ex-date-trigger"
        aria-expanded={open}
        aria-controls="ex-date-picker"
        onClick={() => setOpen(!open)}
      >
        <SvgIcon kind="calendar" size={30} />
        <span>{label}</span>
        <SvgIcon kind="chevron" size={18} />
      </button>
      {open && (
        <div id="ex-date-picker" className="ex-date-picker">
          <label htmlFor="ex-specific-date">
            {vi ? "Chọn ngày / tháng / năm" : "Choose day / month / year"}
          </label>
          <input
            ref={input}
            id="ex-specific-date"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="ex-date-actions">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                button.current?.focus();
              }}
            >
              {allLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
            >
              {vi ? "Xong" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
