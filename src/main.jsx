import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initSupabaseSync } from "./lib/supabaseSync";

// Uruchamiamy synchronizację Supabase Realtime
initSupabaseSync();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
