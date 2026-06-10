import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { History, Pencil, Trash2, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "@/lib/api";

export default function WorkoutHistory({ state, photos, units }) {
  const queryClient = useQueryClient();
  const [editingExId, setEditingExId] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState({});
  const [editDrafts, setEditDrafts] = useState({});

  const updateSetMutation = useMutation({
    mutationFn: gymApi.updateSet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gymState"] }),
  });
  const deleteSetMutation = useMutation({
    mutationFn: gymApi.deleteSet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gymState"] }),
  });

  const historyByDate = useMemo(() => {
    const grouped = {};
    Object.entries(state.logs).forEach(([exId, sets]) => {
      const ex = state.exercises.find((e) => e.id === exId) || {
        name: "Usunięte ćwiczenie",
        bw: false,
      };
      sets.forEach((set) => {
        const safeDate = set.date || new Date().toISOString();
        const dateStr = format(parseISO(safeDate), "yyyy-MM-dd");

        if (!grouped[dateStr])
          grouped[dateStr] = { dateStr, sets: 0, volume: 0, exercises: {} };
        grouped[dateStr].sets += 1;
        grouped[dateStr].volume += (set.weight || 0) * set.reps;
        if (!grouped[dateStr].exercises[exId])
          grouped[dateStr].exercises[exId] = {
            name: ex.name,
            bw: ex.bw,
            sets: [],
          };
        grouped[dateStr].exercises[exId].sets.push(set);
      });
    });
    return Object.values(grouped).sort((a, b) =>
      b.dateStr.localeCompare(a.dateStr),
    );
  }, [state.logs, state.exercises]);

  const startEditing = (exId, sets) => {
    setEditingExId(exId);
    const drafts = {};
    sets.forEach((s) => {
      drafts[s.id] = { weight: s.weight, reps: s.reps };
    });
    setEditDrafts(drafts);
  };

  const saveEdits = (exId) => {
    Object.entries(editDrafts).forEach(([id, vals]) => {
      updateSetMutation.mutate({
        id,
        weight: parseFloat(vals.weight) || 0,
        reps: parseInt(vals.reps) || 0,
      });
    });
    setEditingExId(null);
  };

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
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-white/50" />
        <h2 className="text-lg font-bold text-white m-0">Historia Treningów</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {historyByDate.map((day) => {
          const isCollapsed = collapsedDays[day.dateStr];
          return (
            <div
              key={day.dateStr}
              className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setCollapsedDays((p) => ({
                    ...p,
                    [day.dateStr]: !p[day.dateStr],
                  }))
                }
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] text-left"
              >
                <div>
                  <div className="text-[13px] font-bold text-white capitalize">
                    {format(parseISO(day.dateStr), "EEEE, d MMMM", {
                      locale: pl,
                    })}
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">
                    {day.sets} serii · {Math.round(day.volume).toLocaleString()}{" "}
                    {units} obj.
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className="px-5 pb-5 space-y-4">
                  {Object.entries(day.exercises).map(([exId, exData]) => {
                    const isEditing = editingExId === exId;
                    return (
                      <div
                        key={exId}
                        className={`rounded-xl border p-2 transition-all ${isEditing ? "bg-white/[0.04] border-white/10" : "border-transparent"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-bold text-white/80">
                            {exData.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdits(exId)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#6ee7b7]/15 text-[#6ee7b7]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingExId(null)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    startEditing(exId, exData.sets)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/70"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            {exData.sets.map((s, i) => {
                              const draft = editDrafts[s.id] || {
                                weight: s.weight,
                                reps: s.reps,
                              };
                              return (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between gap-3 bg-black/40 border border-white/5 rounded-xl p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={draft.weight}
                                      onChange={(e) =>
                                        setEditDrafts((d) => ({
                                          ...d,
                                          [s.id]: {
                                            ...d[s.id],
                                            weight: e.target.value,
                                          },
                                        }))
                                      }
                                      className="w-14 h-8 bg-black border border-white/10 rounded-lg text-center text-xs text-white"
                                    />
                                    <span className="text-[10px] text-white/40">
                                      kg ×
                                    </span>
                                    <input
                                      type="number"
                                      value={draft.reps}
                                      onChange={(e) =>
                                        setEditDrafts((d) => ({
                                          ...d,
                                          [s.id]: {
                                            ...d[s.id],
                                            reps: e.target.value,
                                          },
                                        }))
                                      }
                                      className="w-12 h-8 bg-black border border-white/10 rounded-lg text-center text-xs text-white"
                                    />
                                    <span className="text-[10px] text-white/40">
                                      reps
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      deleteSetMutation.mutate(s.id)
                                    }
                                    className="text-white/30 hover:text-[#f87171] p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {exData.sets.map((s, i) => (
                              <span
                                key={i}
                                className="bg-white/5 border border-white/[0.06] rounded-md px-2 py-1 text-[11px] text-white/60 font-mono"
                              >
                                {exData.bw
                                  ? `${s.reps}r`
                                  : `${s.weight}×${s.reps}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
