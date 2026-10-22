import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import Visit from "./components/visit/visit";
import Exhibition from "./components/exhibition/exhibition";
import Explore from "./components/explore/explore";
import Collection from "./components/explore/collection";

import ArtworkDetail from "./components/explore/ArtworkDetail";

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/visit" element={<Visit />} />
          <Route path="/exhibition" element={<Exhibition />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/collection" element={<Collection />} />
          <Route path="/explore/artworks/:id" element={<ArtworkDetail />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
