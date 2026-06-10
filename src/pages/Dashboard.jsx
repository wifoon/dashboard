import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todosApi } from "@/lib/api";
import { getActiveDateString, getTomorrowDateString } from "@/lib/dates";

import PageTitle from "@/components/dashboard/PageTitle";
import GoalTicker from "@/components/dashboard/GoalTicker";
import TodayCard from "@/components/dashboard/TodayCard";
import TomorrowCard from "@/components/dashboard/TomorrowCard";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const todayStr = getActiveDateString();
  const tomorrowStr = getTomorrowDateString();

  // Pobieranie danych z bazy - React Query zadba o cache i automatyczny refetch przy wybudzeniu!
  const { data: todayGoals = [], isLoading: isLoadingToday } = useQuery({
    queryKey: ["todos", todayStr],
    queryFn: () => todosApi.fetchTodos(todayStr),
  });

  const { data: tomorrowGoals = [], isLoading: isLoadingTomorrow } = useQuery({
    queryKey: ["todos", tomorrowStr],
    queryFn: () => todosApi.fetchTodos(tomorrowStr),
  });

  // Uruchomienie mechanizmu Rollover (przeniesienie wczorajszych niezrobionych zadań)
  useEffect(() => {
    const runDailyRollover = async () => {
      try {
        await todosApi.runRollover(todayStr);
        queryClient.invalidateQueries({ queryKey: ["todos", todayStr] });
      } catch (e) {
        console.error("Rollover error:", e);
      }
    };
    runDailyRollover();
  }, [todayStr, queryClient]);

  if (isLoadingToday || isLoadingTomorrow) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-[#6BE3A4] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <div className="relative z-10 max-w-[1100px] mx-auto px-5 pt-[max(24px,env(safe-area-inset-top))]">
        <PageTitle />
        <GoalTicker todayGoals={todayGoals} />

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

        <TodayCard goals={todayGoals} dateStr={todayStr} />
        <TomorrowCard goals={tomorrowGoals} dateStr={tomorrowStr} />
      </div>
    </div>
  );
}
