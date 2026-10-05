import { useState } from "react";
import "./Art.css";

export default function Art({
  item,
  animate = false,
  visible = true,
  delay = 0,
  flip = false,
  flipTitle = "",
}) {
  const [flipped, setFlipped] = useState(false);

  const background = item.img
    ? `center / cover no-repeat url("${item.img}")`
    : item.color;

  const className = [
    "art",
    item.cls || "",
    animate ? "art-reveal" : "",
    visible ? "is-visible" : "",
    flip ? "art--flip" : "",
    flip && flipped ? "is-flipped" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Art thông thường: giữ cách hiển thị cũ.
  if (!flip) {
    return (
      <div
        className={className}
        style={{
          background,
          "--reveal-delay": `${delay}ms`,
        }}
      />
    );
  }

  // Art có hai mặt: dùng cho Highlight.
  return (
    <button
      type="button"
      className={className}
      style={{ "--reveal-delay": `${delay}ms` }}
      aria-label={flipTitle || item.date || "Artwork"}
      aria-pressed={flipped}
      onClick={() => setFlipped((value) => !value)}
    >
      <span className="art-flip-inner" aria-hidden="true">
        {/* Mặt trước */}
        <span
          className="art-face art-front"
          style={{ background }}
        />

        {/* Mặt sau */}
        <span
          className="art-face art-back"
          style={{ background }}
        >
          <span className="art-caption">
            {flipTitle || item.date || ""}
          </span>
        </span>
      </span>
    </button>
  );
}