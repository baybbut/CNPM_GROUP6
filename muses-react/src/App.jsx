import Tickets, { TicketReceipt } from "./components/Tickets/Tickets";
import Museums from "./components/Museums/Museums";
import ActivityTracker from "./components/ActivityTracker";
import VisitorAccount from "./components/VisitorAccount";
import NewsArticle, { NewsIndex } from "./components/News/NewsPage";
import Scanner from "./components/Scanner/Scanner";
import { useLang } from "./context/LangContext";
import { CONTENT_LANGUAGES } from "./api/contentLanguages.mjs";
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
  const { pathname, hash, search } = useLocation();
  const { setLang } = useLang();
  useEffect(() => {
    const code = new URLSearchParams(search).get("lang");
    if (CONTENT_LANGUAGES.some((l) => l.code === code)) setLang(code);
  }, [search, setLang]);
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
      <ActivityTracker />
      <Header />
      <main>
        <Routes>
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/confirmation/:id" element={<TicketReceipt />} />
          <Route path="/tickets/result" element={<TicketReceipt />} />
          <Route path="/museums" element={<Museums />} />
          <Route path="/museums/:id" element={<Museums />} />
          <Route path="/account" element={<VisitorAccount />} />
          <Route path="/news" element={<NewsIndex />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          <Route path="/scan" element={<Scanner />} />
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
