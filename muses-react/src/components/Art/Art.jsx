import "./Art.css";

export default function Art({ item }) {
  const style = item.img
    ? {
        backgroundImage: `url("${item.img}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : { background: item.color };

  return <div className={`art ${item.cls}`} style={style} />;
}