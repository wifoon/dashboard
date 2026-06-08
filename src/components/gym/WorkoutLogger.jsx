import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, LineChart as ChartIcon } from "lucide-react";
import { CONFIG } from "@/utils/gymConfig";
import ExerciseDialog from "./modals/ExerciseDialog";
import ExerciseProgressDialog from "./modals/ExerciseProgressDialog";

export default function WorkoutLogger({ state, setState }) {
  const [activeRep, setActiveRep] = useState(8);
  const [weightInput, setWeightInput] = useState("");
  const [exModalMode, setExModalMode] = useState(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const filteredExercises = useMemo(
    () => state.exercises.filter((e) => e.day === state.filterDay),
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
          : currentEx.startWeight || 0
        ).toString(),
      );
    }
  }, [currentEx?.id]);

  const handleLogSet = () => {
    if (!currentEx) return;
    const w = currentEx.bw ? 0 : parseFloat(weightInput);
    if (!currentEx.bw && (isNaN(w) || w <= 0)) return;

    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        [currentEx.id]: [
          ...(prev.logs[currentEx.id] || []),
          { weight: w, reps: activeRep, date: new Date().toISOString() },
        ],
      },
    }));
  };

  const getRx = () => {
    if (!currentEx || !currentLogs.length) return null;
    const { weight, reps } = currentLogs[currentLogs.length - 1];
    const { repMin, repMax, step, bw } = currentEx;
    const upgradeAt = Math.min(CONFIG.upgradeAtReps, repMax);

    if (bw) {
      if (reps >= upgradeAt)
        return {
          type: "up",
          tag: "Push for more",
          text: `Strong! Push for ${reps + 1} reps next time.`,
        };
      if (reps >= repMin)
        return {
          type: "hold",
          tag: "Add a rep",
          text: `In target. Push for ${reps + 1} reps.`,
        };
      return {
        type: "hold",
        tag: "Repeat",
        text: `Fell short. Repeat until you hit ${repMin}+.`,
      };
    }
    if (reps >= upgradeAt)
      return {
        type: "up",
        tag: "Add weight",
        text: `Hit ${reps} reps! Add ${step}${state.units} next time.`,
      };
    if (reps >= repMin)
      return {
        type: "hold",
        tag: "Add a rep",
        text: `${reps} reps. Stay at ${weight}${state.units} & push for ${reps + 1}.`,
      };
    return {
      type: "hold",
      tag: "Repeat",
      text: `Fell short. Repeat ${weight}${state.units} until ${repMin}+ clean.`,
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

      <div className="flex gap-2.5 mb-8">
        <select
          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white outline-none focus:border-white/30 appearance-none"
          value={state.currentEx || ""}
          onChange={(e) => setState({ ...state, currentEx: e.target.value })}
        >
          {filteredExercises.length === 0 && <option>No exercises...</option>}
          {filteredExercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.bw ? "(BW)" : ""}
            </option>
          ))}
        </select>

        {currentEx && (
          <button
            onClick={() => setChartModalOpen(true)}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-[#6ee7b7] transition-colors"
          >
            <ChartIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setExModalMode("edit")}
          disabled={!currentEx}
          className="w-14 h-14 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-2xl flex items-center justify-center text-white/70 transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => setExModalMode("add")}
          className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white/70 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {currentEx && (
        <div className="bg-black/20 border border-white/5 rounded-3xl p-5 mb-6">
          {currentEx.bw ? (
            <div className="bg-[#6ee7b7]/10 text-[#6ee7b7] text-[12px] font-bold tracking-[0.1em] uppercase text-center p-3 rounded-xl mb-5">
              Bodyweight — log reps only
            </div>
          ) : (
            <div className="mb-6">
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1">
                Weight ({state.units})
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
                  className="w-14 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-2xl font-bold transition-all active:scale-95"
                >
                  −
                </button>
                <div className="flex-1 flex items-center justify-center relative">
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full text-center text-2xl font-black bg-transparent text-white outline-none"
                    style={{ appearance: "none", MozAppearance: "textfield" }}
                  />
                </div>
                <button
                  onClick={() =>
                    setWeightInput(
                      (
                        (parseFloat(weightInput) || 0) + currentEx.step
                      ).toString(),
                    )
                  }
                  className="w-14 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-2xl font-bold transition-all active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1">
              Reps
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from(
                { length: 10 },
                (_, i) => Math.max(1, currentEx.repMin || 4) + i,
              ).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRep(r)}
                  className={`h-12 rounded-xl text-[15px] font-bold transition-all border ${activeRep === r ? "bg-white text-black border-transparent shadow-md" : "bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogSet}
            className="w-full h-14 rounded-2xl bg-gradient-to-b from-white to-[#E8E5DD] text-black font-bold text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Log Set
          </button>
        </div>
      )}

      {rx && (
        <div
          className={`mt-auto rounded-2xl p-5 border ${rx.type === "up" ? "bg-[#6ee7b7]/10 border-[#6ee7b7]/20" : "bg-white/5 border-white/10"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50">
              Next Session Coach
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase ${rx.type === "up" ? "bg-[#6ee7b7]/20 text-[#6ee7b7]" : "bg-white/10 text-white/70"}`}
            >
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
        exToEdit={currentEx}
        onClose={() => setExModalMode(null)}
      />
      <ExerciseProgressDialog
        open={chartModalOpen}
        setOpen={setChartModalOpen}
        ex={currentEx}
        logs={currentLogs}
        units={state.units}
      />
    </div>
  );
}
