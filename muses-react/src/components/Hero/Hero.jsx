import "./Hero.css";

import { useHomeImage } from "../../context/HomeImagesContext";

export default function Hero() {
  const image = useHomeImage("home.hero");
  return (
    <section className="hero" data-scroll-intro>
      <svg width="0" height="0" aria-hidden="true">
        <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
          <path d="M0,0.05 Q0.5,0.25 1,0.05 L1,0.95 Q0.5,0.8 0,0.95 Z" />
        </clipPath>
      </svg>
      <div
        className="hero-img"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      />
    </section>
  );
}
