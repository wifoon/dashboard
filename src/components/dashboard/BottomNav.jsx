import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  Calendar,
  Cloud,
  LogOut, // <-- Dodany import ikony
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext"; // <-- Dodany import autoryzacji

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); // <-- Wyciągamy funkcję wylogowania

  const tabs = [
    {
      id: "main",
      path: "/",
      label: "MAIN",
      icon: <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
    {
      id: "gym",
      path: "/gym",
      label: "GYM",
      icon: <Dumbbell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
    {
      id: "notes",
      path: "/notes",
      label: "NOTES",
      icon: <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
    {
      id: "calendar",
      path: "/calendar",
      label: "KALENDARZ",
      icon: <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
    {
      id: "files",
      path: "/files",
      label: "DYSK",
      icon: <Cloud className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
  ];

  return (
    // Zmieniono z-[100] na z-40, aby Drawery (z-50) otwierały się NAD nawigacją
    <div className="fixed left-0 right-0 bottom-0 z-40 flex justify-center p-3 pb-4 sm:pb-5 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-[540px] gap-1 p-1 bg-[#141416]/80 backdrop-blur-xl border border-white/10 rounded-[18px] shadow-2xl justify-between items-center">
        {/* Renderowanie głównych zakładek */}
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex-1 inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 rounded-[13px] text-[9px] sm:text-[12px] font-semibold transition-all active:scale-95"
              style={{
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.12)" : "transparent"}`,
              }}
            >
              {tab.icon}
              <span className="max-sm:text-[8px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Separator wizualny */}
        <div className="w-px h-8 bg-white/10 mx-1 shrink-0" />

        {/* Przycisk wylogowania jako osobny element */}
        <button
          onClick={logout}
          title="Wyloguj się"
          className="inline-flex flex-col items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-3 rounded-[13px] text-white/30 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </div>
  );
}
