import Analytics from "./pages/Analytics";
import React, { useState, useEffect } from "react";
import { Empty } from "./pages/shared";
import "./pages.css";
export { useSavedState } from "./pages/shared";
import Artworks from "./pages/Artworks";
import Artists from "./pages/Artists";
import Languages from "./pages/Languages";
import Events from "./pages/Events";
import Outdoor from "./pages/Outdoor";
import Museum from "./pages/Museum";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
export default function AdminPages({
  page,
  search,
  rows,
  setRows,
  toast,
  preferences,
  setPreferences,
}) {
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const failed = () => setStorageError(true);
    window.addEventListener("muses-admin-storage-error", failed);
    return () =>
      window.removeEventListener("muses-admin-storage-error", failed);
  }, []);
  const props = { search, rows, setRows, toast, preferences, setPreferences };
  const pages = {
    Artworks: Artworks,
    "Artists & Categories": Artists,
    "Languages & Audio": Languages,
    "Exhibitions & Events": Events,
    "Outdoor Points · GPS": Outdoor,
    "Museum Info & Maps": Museum,
    "Staff & Permissions": Staff,
    Settings: Settings,
  };
  const Page = pages[page];
  if (page === "Visitors" || page === "Reports" || page === "QR Check-in")
    return (
      <Analytics
        mode={
          page === "Visitors"
            ? "visitors"
            : page === "QR Check-in"
              ? "points"
              : "reports"
        }
        search={search}
      />
    );
  return (
    <div className="pg-workspace">
      {storageError && (
        <p className="pg-storage-alert" role="alert">
          Browser storage is full or unavailable. New changes are kept in this
          tab only. Use smaller files or export your work before closing.
        </p>
      )}
      <div className="pg-mode">
        <span>
          <i />
          LOCAL DEMO WORKSPACE
        </span>
        <small>
          Changes stay in this browser · not connected to the museum database
        </small>
      </div>
      {Page ? (
        <Page key={page} {...props} />
      ) : (
        <Empty text="Choose a workspace from the sidebar." />
      )}
    </div>
  );
}
