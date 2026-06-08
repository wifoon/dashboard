import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  Calendar,
  Cloud,
} from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

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
      label: "CALENDAR",
      icon: <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    },
    {
      id: "files",
      path: "/files",
      label: "FILES",
      icon: <Cloud className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    }, // <-- NOWA ZAKŁADKA
  ];

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[100] flex justify-center p-3 pb-4 sm:pb-5 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-[540px] gap-1 p-1 bg-[#141416]/80 backdrop-blur-xl border border-white/10 rounded-[18px] shadow-2xl justify-between">
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
      </div>
    </div>
  );
}
