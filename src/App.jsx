import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";

import PageNotFound from "./lib/PageNotFound";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login-Page";
import ProtectedRoute from "./components/ProtectedRoute";
import GymPage from "./pages/GymPage";
import NotesPage from "./pages/NotesPage";
import CalendarPage from "./pages/CalendarPage";
import FilesPage from "./pages/FilesPage"; // <-- 1. DODAJ TEN IMPORT
import Layout from "./Layout";

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              element={
                <ProtectedRoute unauthenticatedElement={<LoginPage />} />
              }
            >
              {/* Główny Layout z BottomNav dla chronionych tras */}
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gym" element={<GymPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/files" element={<FilesPage />} />{" "}
                {/* <-- 2. DODAJ TĘ TRASĘ */}
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
