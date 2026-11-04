import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CooperativeProvider } from "./context/CooperativeContext";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemen root #root tidak ditemukan.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <CooperativeProvider>
          <App />
        </CooperativeProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
