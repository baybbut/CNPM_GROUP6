import "./Art.css";

export default function Art({
  item,
  animate = false,
  visible = true,
  delay = 0,
}) {
  return (
    <div
      className={[
        "art",
        item.cls || "",
        animate ? "art-reveal" : "",
        visible ? "is-visible" : "",
      ].join(" ")}
      style={{
        background: item.img
          ? `center / cover no-repeat url("${item.img}")`
          : item.color,
        "--reveal-delay": `${delay}ms`,
      }}
    />
  );
}