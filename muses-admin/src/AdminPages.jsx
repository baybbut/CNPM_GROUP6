import QRCodes from "./pages/QRCodes";
import Catalog from "./pages/Catalog";
import Analytics from "./pages/Analytics";
import "./pages.css";
const catalogPages = {
  Artworks: "artworks",
  "Artists & Categories": "artists",
  "Languages & Audio": "translations",
  "Exhibitions & Events": "schedules",
  "Museum Info & Maps": "museums",
};
export default function AdminPages({ page, search }) {
  if (page === "QR Codes") return <QRCodes search={search} />;
  if (catalogPages[page])
    return <Catalog key={page} entity={catalogPages[page]} search={search} />;
  return (
    <Analytics
      mode={page === "Reports" ? "reports" : "overview"}
      search={search}
    />
  );
}
