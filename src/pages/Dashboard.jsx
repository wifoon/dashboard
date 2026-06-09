import { useState, useEffect, useCallback } from "react";
import {
  getTodayGoals,
  getTomorrowGoals,
  runRollover,
  runStreakCheck,
} from "@/lib/goalStorage";
import PageTitle from "@/components/dashboard/PageTitle";
import GoalTicker from "@/components/dashboard/GoalTicker";
import TodayCard from "@/components/dashboard/TodayCard";
import TomorrowCard from "@/components/dashboard/TomorrowCard";

export default function Dashboard() {
  const [todayGoals, setTodayGoals] = useState([]);
  const [tomorrowGoals, setTomorrowGoals] = useState([]);

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
    window.addEventListener("calendar-changed", handler); // DODANO NASŁUCHIWANIE KALENDARZA
    window.addEventListener("storage-synced", handler);
    window.addEventListener("synced-state-changed", handler);
    return () => {
      window.removeEventListener("goals-changed", handler);
      window.removeEventListener("calendar-changed", handler);
      window.removeEventListener("storage-synced", handler);
      window.removeEventListener("synced-state-changed", handler);
    };
  }, [loadAll]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <div className="relative z-10 max-w-[1100px] mx-auto px-5 pt-[max(24px,env(safe-area-inset-top))]">
        <PageTitle />
        <GoalTicker />

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
          <span>Lista Zadań</span>
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
    </div>
  );
}
