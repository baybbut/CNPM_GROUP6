import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
export function useSavedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved ?? initial;
    } catch {
      return initial;
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
      window.dispatchEvent(new Event("muses-admin-storage-error"));
    }
  }, [key, value]);
  return [value, setValue, storageError];
}
export const uid = () => crypto.randomUUID();
export const matches = (value, search) =>
  JSON.stringify(value).toLowerCase().includes(search.trim().toLowerCase());
export const rowKey = (r) => r.id || r.title;
export const pretty = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function download(name, content, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows) {
  return rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value ?? "")
              .replaceAll('"', '""')
              .replace(/^[=+@-]/, "'$&")}"`,
        )
        .join(","),
    )
    .join("\r\n");
}
export function Badge({ children }) {
  return (
    <span
      className={`pg-badge ${["Draft", "Pending", "Inactive", "Needs review"].includes(children) ? "amber" : "sage"}`}
    >
      <i />
      {children}
    </span>
  );
}
export function Empty({ text = "No results found. Try another search." }) {
  return (
    <div className="pg-empty">
      <Icon name="search" size={30} />
      <p>{text}</p>
    </div>
  );
}
export function Field({ label, children }) {
  return (
    <label className="pg-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Panel({ title, subtitle, children, action, className = "" }) {
  return (
    <section className={`pg-panel ${className}`}>
      <div className="pg-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const old = document.activeElement;
    const first = ref.current?.querySelector("input,select,textarea,button");
    first?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            "button,input,select,textarea,a[href]",
          ),
        ].filter((x) => !x.disabled);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal pg-modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="section-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="pg-stats">
      {items.map(([label, value, note, color = "pink", icon = "chart"]) => (
        <div className={`pg-stat ${color}`} key={label}>
          <Icon name={icon} size={25} />
          <small>{label}</small>
          <strong>{value}</strong>
          <span>{note}</span>
          <b aria-hidden="true">
            {color === "pink"
              ? "♥"
              : color === "blue"
                ? "✹"
                : color === "green"
                  ? "◢"
                  : "+"}
          </b>
        </div>
      ))}
    </div>
  );
}
export function Header({ title, description, action }) {
  return (
    <div className="pg-heading">
      <div>
        <p className="pg-kicker">YOUR MUSEUM, THOUGHTFULLY MANAGED</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function TextButton({ children, onClick, ...rest }) {
  return (
    <button className="pg-text-btn" onClick={onClick} {...rest}>
      {children}
      <Icon name="arrow" size={17} />
    </button>
  );
}

export const categorySeed = [
  {
    id: "c1",
    name: "Oil painting",
    description: "Colour, light and everyday life",
  },
  {
    id: "c2",
    name: "Lacquer",
    description: "Layers of Vietnamese craftsmanship",
  },
  { id: "c3", name: "Sculpture", description: "Stories in three dimensions" },
];
