import React from "react";
import ReactDOM from "react-dom/client";
import { MuseumLocationProvider } from "./context/MuseumLocation";
import App from "./App.jsx";
import { LangProvider } from "./context/LangContext.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter>
        <MuseumLocationProvider>
          <App />
        </MuseumLocationProvider>
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>,
);
