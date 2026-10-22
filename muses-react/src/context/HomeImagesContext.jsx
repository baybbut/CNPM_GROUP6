import { createContext, useContext, useEffect, useState } from "react";
import { mediaUrl } from "../api/artworks";

const Context = createContext({});
export function HomeImagesProvider({ children }) {
  const [images, setImages] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    fetch(`${base}/api/site-images`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Site images unavailable");
        return r.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        for (const row of rows) {
          const src = mediaUrl(row.imageUrl);
          if (
            !src ||
            typeof row.slot !== "string" ||
            !row.slot.startsWith("home.")
          )
            continue;
          const image = new Image();
          image.onload = () => {
            if (!controller.signal.aborted)
              setImages((old) => ({
                ...old,
                [row.slot]: { src, artworkId: row.artworkId },
              }));
          };
          image.src = src;
        }
      })
      .catch(() => {
        /* Keep the original images if setup or network is unavailable. */
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  return <Context.Provider value={images}>{children}</Context.Provider>;
}
export function useHomeImage(slot, fallback) {
  return useContext(Context)[slot]?.src || fallback;
}
export function useHomeImages(items, section) {
  const images = useContext(Context);
  return items.map((item) => ({
    ...item,
    img: images[`home.${section}.${item.cls}`]?.src || item.img,
    artworkId:
      images[`home.${section}.${item.cls}`]?.artworkId || item.artworkId,
  }));
}
