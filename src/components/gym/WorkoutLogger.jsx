import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, LineChart, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "@/lib/api";
import { CONFIG } from "@/utils/gymConfig";
import ExerciseDialog from "./modals/ExerciseDialog";
import ExerciseProgressDialog from "./modals/ExerciseProgressDialog";

export default function WorkoutLogger({ state, setState }) {
  const queryClient = useQueryClient();
  const [activeRep, setActiveRep] = useState(8);
  const [weightInput, setWeightInput] = useState("");
  const [exModalMode, setExModalMode] = useState(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const filteredExercises = useMemo(
    () => state.exercises.filter((e) => e.day_id === state.filterDay),
    [state.exercises, state.filterDay],
  );

  const currentEx = useMemo(
    () =>
      filteredExercises.find((e) => e.id === state.currentEx) ||
      filteredExercises[0],
    [filteredExercises, state.currentEx],
  );

  const currentLogs = currentEx ? state.logs[currentEx.id] || [] : [];

  useEffect(() => {
    if (currentEx && !currentEx.bw) {
      setWeightInput(
        (currentLogs.length
          ? currentLogs[currentLogs.length - 1].weight
          : currentEx.start_weight || 0
        ).toString(),
      );
    }
  }, [currentEx?.id, currentLogs.length]);

  // 🚀 OPTYMISTYCZNA MUTACJA LOGOWANIA SERII
  const logSetMutation = useMutation({
    mutationFn: gymApi.logSet,
    onMutate: async (newSet) => {
      await queryClient.cancelQueries({ queryKey: ["gymState"] });
      const previousState = queryClient.getQueryData(["gymState"]);

      queryClient.setQueryData(["gymState"], (old) => {
        if (!old) return old;
        const updatedLogs = { ...old.logs };
        if (!updatedLogs[newSet.exerciseId])
          updatedLogs[newSet.exerciseId] = [];
        updatedLogs[newSet.exerciseId] = [
          ...updatedLogs[newSet.exerciseId],
          {
            id: "temp-" + Date.now(),
            weight: newSet.weight,
            reps: newSet.reps,
            date: new Date().toISOString(),
          },
        ];
        return { ...old, logs: updatedLogs };
      });
      return { previousState };
    },
    onError: (err, newSet, context) => {
      if (context?.previousState)
        queryClient.setQueryData(["gymState"], context.previousState);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["gymState"] }),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: gymApi.deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymState"] });
      setState({ ...state, currentEx: null });
    },
  });

  const handleLogSet = () => {
    if (!currentEx) return;
    const w = currentEx.bw ? 0 : parseFloat(weightInput);
    if (!currentEx.bw && (isNaN(w) || w <= 0)) return;

    logSetMutation.mutate({
      exerciseId: currentEx.id,
      weight: w,
      reps: activeRep,
    });
  };

  const handleDeleteExercise = () => {
    if (!currentEx) return;
    if (confirm(`Czy na pewno chcesz usunąć ćwiczenie "${currentEx.name}"?`)) {
      deleteExerciseMutation.mutate(currentEx.id);
    }
  };

  const getRx = () => {
    if (!currentEx || !currentLogs.length) return null;
    const { weight, reps } = currentLogs[currentLogs.length - 1];
    const { rep_min, rep_max, step, bw } = currentEx;
    const upgradeAt = Math.min(CONFIG.upgradeAtReps, rep_max);

    if (bw) {
      if (reps >= upgradeAt)
        return {
          type: "up",
          tag: "Więcej",
          text: `Świetnie! Następnym razem spróbuj ${reps + 1} powtórzeń.`,
        };
      if (reps >= rep_min)
        return {
          type: "hold",
          tag: "Dodaj powtórzenie",
          text: `Jesteś w zakresie celu. Spróbuj ${reps + 1} powtórzeń.`,
        };
      return {
        type: "hold",
        tag: "Powtórz",
        text: `Nie udało się osiągnąć celu. Powtarzaj, aż dojdziesz do ${rep_min}+.`,
      };
    }
    if (reps >= upgradeAt)
      return {
        type: "up",
        tag: "Dodaj ciężar",
        text: `Udało się ${reps} powtórzeń! Następnym razem dodaj ${step}kg.`,
      };
    if (reps >= rep_min)
      return {
        type: "hold",
        tag: "Dodaj powtórzenie",
        text: `${reps} powtórzeń. Zostań przy ${weight}kg i spróbuj ${reps + 1}.`,
      };
    return {
      type: "hold",
      tag: "Powtórz",
      text: `Nie udało się osiągnąć celu. Powtarzaj ${weight}kg, aż zrobisz ${rep_min}+ poprawnie.`,
    };
  };

  const rx = getRx();

  return (
    <div
      className="rounded-3xl p-6 flex flex-col"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-6 bg-black/40 border border-white/10 p-1.5 rounded-2xl overflow-x-auto">
        {state.days.map((d) => (
          <button
            key={d.id}
            onClick={() =>
              setState({ ...state, filterDay: d.id, currentEx: null })
            }
            className={`flex-1 min-w-[80px] py-2.5 text-[13px] font-bold rounded-xl transition-all ${state.filterDay === d.id ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white hover:bg-white/5"}`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
        <select
          className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white outline-none"
          value={state.currentEx || ""}
          onChange={(e) => setState({ ...state, currentEx: e.target.value })}
        >
          {filteredExercises.length === 0 && (
            <option value="">Brak ćwiczeń...</option>
          )}
          {filteredExercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.bw ? "(BW)" : ""}
            </option>
          ))}
        </select>

        <div className="flex gap-2.5">
          {currentEx && (
            <>
              <button
                onClick={() => setChartModalOpen(true)}
                className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-[#6BE3A4] transition-colors"
              >
                <LineChart className="w-5 h-5" />
              </button>
              <button
                onClick={() => setExModalMode("edit")}
                className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white/70 transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteExercise}
                className="w-14 h-14 bg-white/5 hover:bg-[#f87171]/20 border border-white/10 rounded-2xl flex items-center justify-center text-white/70 hover:text-[#f87171] transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={() => setExModalMode("add")}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white/70 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {currentEx && (
        <div className="bg-black/20 border border-white/5 rounded-3xl p-5 mb-6">
          {currentEx.bw ? (
            <div className="bg-[#6BE3A4]/10 text-[#6BE3A4] text-[12px] font-bold tracking-[0.1em] uppercase text-center p-3 rounded-xl mb-5">
              Ciężar ciała — loguj tylko powtórzenia
            </div>
          ) : (
            <div className="mb-6">
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1">
                Obciążenie (kg)
              </div>
              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl h-[60px] p-1.5 shadow-inner">
                <button
                  onClick={() =>
                    setWeightInput(
                      Math.max(
                        0,
                        (parseFloat(weightInput) || 0) - currentEx.step,
                      ).toString(),
                    )
                  }
                  className="w-14 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-2xl font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full text-center text-2xl font-black bg-transparent text-white outline-none"
                />
                <button
                  onClick={() =>
                    setWeightInput(
                      (
                        (parseFloat(weightInput) || 0) + currentEx.step
                      ).toString(),
                    )
                  }
                  className="w-14 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1">
              Powtórzenia
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from(
                { length: 10 },
                (_, i) => Math.max(1, currentEx.rep_min || 4) + i,
              ).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRep(r)}
                  className={`h-12 rounded-xl text-[15px] font-bold transition-all border ${activeRep === r ? "bg-white text-black border-transparent shadow-md" : "bg-black/40 border-white/10 text-white/60 hover:bg-white/5"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogSet}
            className="w-full h-14 rounded-2xl bg-gradient-to-b from-white to-[#E8E5DD] text-black font-bold text-[15px] transition-all"
          >
            Zapisz Serię
          </button>
        </div>
      )}

      {rx && (
        <div className="mt-auto rounded-2xl p-5 border bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50">
              Trener - Następna Seria
            </span>
            <span className="px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase bg-white/10 text-white/70">
              {rx.tag}
            </span>
          </div>
          <div className="text-[14px] font-medium text-white/90 leading-relaxed">
            {rx.text}
          </div>
        </div>
      )}

      <ExerciseDialog
        state={state}
        setState={setState}
        mode={exModalMode}
        exToEdit={exModalMode === "edit" ? currentEx : null}
        onClose={() => setExModalMode(null)}
      />
      {currentEx && (
        <ExerciseProgressDialog
          open={chartModalOpen}
          setOpen={setChartModalOpen}
          ex={currentEx}
          logs={currentLogs}
          units={state.units}
        />
      )}
    </div>
  );
}
