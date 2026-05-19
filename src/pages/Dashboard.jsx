import { useState, useEffect, useCallback } from "react";
import {
  getTodayGoals,
  getTomorrowGoals,
  runRollover,
  runStreakCheck,
} from "@/lib/goalStorage";
import PageTitle from "@/components/dashboard/PageTitle";
import GoalTicker from "@/components/dashboard/GoalTicker";
import DayRing from "@/components/dashboard/DayRing";
import TodayCard from "@/components/dashboard/TodayCard";
import TomorrowCard from "@/components/dashboard/TomorrowCard";
import GymPage from "./GymPage";

export default function Dashboard() {
  const [todayGoals, setTodayGoals] = useState([]);
  const [tomorrowGoals, setTomorrowGoals] = useState([]);
  const [activeTab, setActiveTab] = useState("main");

  const loadAll = useCallback(() => {
    setTodayGoals(getTodayGoals());
    setTomorrowGoals(getTomorrowGoals());
  }, []);

  useEffect(() => {
    runRollover();
    runStreakCheck();
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = () => {
      runRollover();
      runStreakCheck();
      loadAll();
    };

    window.addEventListener("goals-changed", handler);
    window.addEventListener("storage-synced", handler);
    window.addEventListener("synced-state-changed", handler);
    return () => {
      window.removeEventListener("goals-changed", handler);
      window.removeEventListener("storage-synced", handler);
      window.removeEventListener("synced-state-changed", handler);
    };
  }, [loadAll]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      {/* Dynamiczna zawartość z marginesem na dolny pasek */}
      <div className="pb-[120px]">
        {activeTab === "main" ? (
          <div className="relative z-10 max-w-[1100px] mx-auto px-5 pt-[max(24px,env(safe-area-inset-top))]">
            <PageTitle />
            <GoalTicker />
            <DayRing />

            <div
              className="flex items-center gap-3 mb-5"
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              <span
                className="w-[18px] h-px"
                style={{ background: "var(--text-tertiary)", opacity: 0.6 }}
              />
              <span>To Do List</span>
              <span
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
                }}
              />
            </div>

            <TodayCard goals={todayGoals} reload={loadAll} />
            <TomorrowCard goals={tomorrowGoals} reload={loadAll} />
          </div>
        ) : (
          <GymPage />
        )}
      </div>

      {/* Dolny pasek nawigacyjny (Tab Bar) */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 flex justify-center p-3 pb-[calc(10px+env(safe-area-inset-bottom))] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,11,0) 0%, rgba(10,10,11,0.78) 38%, rgba(10,10,11,0.94) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div className="pointer-events-auto flex w-full max-w-[460px] gap-1.5 p-1.5 bg-[#141416]/70 border border-white/10 rounded-[18px] shadow-2xl">
          <button
            onClick={() => setActiveTab("main")}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 rounded-[13px] text-[13px] font-semibold transition-all"
            style={{
              background:
                activeTab === "main" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeTab === "main" ? "#ffffff" : "rgba(255,255,255,0.6)",
              border: `1px solid ${
                activeTab === "main" ? "rgba(255,255,255,0.10)" : "transparent"
              }`,
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            MAIN
          </button>
          <button
            onClick={() => setActiveTab("gym")}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 rounded-[13px] text-[13px] font-semibold transition-all"
            style={{
              background:
                activeTab === "gym" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeTab === "gym" ? "#ffffff" : "rgba(255,255,255,0.6)",
              border: `1px solid ${
                activeTab === "gym" ? "rgba(255,255,255,0.10)" : "transparent"
              }`,
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M6 5v14M18 5v14M2 7h4v10H2zM18 7h4v10h-4zM6 12h12"></path>
            </svg>
            GYM
          </button>
        </div>
      </div>
    </div>
  );
}
