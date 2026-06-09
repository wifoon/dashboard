import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { History, Pencil, Trash2, Check, X, Plus } from "lucide-react";

export default function WorkoutHistory({ state, setState, photos, units }) {
  const [editingExId, setEditingExId] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState({});
  const [editDrafts, setEditDrafts] = useState({});

  const historyByDate = useMemo(() => {
    const grouped = {};
    Object.entries(state.logs).forEach(([exId, sets]) => {
      const ex = state.exercises.find((e) => e.id === exId) || {
        name: "Usunięte ćwiczenie",
        bw: false,
      };
      sets.forEach((set, originalIdx) => {
        const dateStr = set.date.slice(0, 10);
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
        grouped[dateStr].exercises[exId].sets.push({ ...set, originalIdx });
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
      drafts[s.originalIdx] = { weight: s.weight, reps: s.reps };
    });
    setEditDrafts(drafts);
  };

  const saveEdits = (exId) => {
    setState((prev) => {
      const exLogs = [...(prev.logs[exId] || [])];
      Object.entries(editDrafts).forEach(([idx, vals]) => {
        const i = parseInt(idx);
        if (exLogs[i]) {
          exLogs[i] = {
            ...exLogs[i],
            weight: parseFloat(vals.weight) || 0,
            reps: parseInt(vals.reps) || 0,
          };
        }
      });
      return { ...prev, logs: { ...prev.logs, [exId]: exLogs } };
    });
    setEditingExId(null);
    setEditDrafts({});
  };

  const handleDeleteSet = (exId, originalIdx) => {
    setState((prev) => {
      const exLogs = [...(prev.logs[exId] || [])];
      exLogs.splice(originalIdx, 1);
      const newLogs = { ...prev.logs };
      if (exLogs.length === 0) delete newLogs[exId];
      else newLogs[exId] = exLogs;
      return { ...prev, logs: newLogs };
    });
  };

  const handleDeleteExercise = (exId, exName) => {
    if (!confirm(`Delete all sets for "${exName}"?`)) return;
    setState((prev) => {
      const newLogs = { ...prev.logs };
      delete newLogs[exId];
      return { ...prev, logs: newLogs };
    });
  };

  const addSetToEditing = (exId) => {
    setState((prev) => {
      const exLogs = [...(prev.logs[exId] || [])];
      const lastSet = exLogs[exLogs.length - 1];
      const newSet = {
        weight: lastSet ? lastSet.weight : 0,
        reps: lastSet ? lastSet.reps : 8,
        date: new Date().toISOString(),
      };
      exLogs.push(newSet);
      const newIdx = exLogs.length - 1;
      setEditDrafts((d) => ({
        ...d,
        [newIdx]: { weight: newSet.weight, reps: newSet.reps },
      }));
      return { ...prev, logs: { ...prev.logs, [exId]: exLogs } };
    });
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

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {historyByDate.map((day) => {
          const dayPhotos = photos.filter((p) => p.dateKey === day.dateStr);
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
                                <button
                                  onClick={() =>
                                    handleDeleteExercise(exId, exData.name)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-[#f87171]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5 mt-4">
                            {exData.sets.map((s, i) => {
                              const draft = editDrafts[s.originalIdx] || {
                                weight: s.weight,
                                reps: s.reps,
                              };
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-6 h-6 rounded-md bg-black/40 flex items-center justify-center text-[10px] text-white/40 font-mono font-bold">
                                      {i + 1}
                                    </div>
                                    {exData.bw ? (
                                      <div className="flex-1 flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={draft.reps}
                                          onChange={(e) =>
                                            setEditDrafts((d) => ({
                                              ...d,
                                              [s.originalIdx]: {
                                                ...d[s.originalIdx],
                                                reps: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-16 h-10 bg-black/50 border border-white/10 rounded-lg text-center text-sm text-white outline-none focus:border-[#6ee7b7]/50"
                                        />
                                        <span className="text-[11px] font-semibold text-white/40 uppercase">
                                          reps
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex-1 flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={draft.weight}
                                          onChange={(e) =>
                                            setEditDrafts((d) => ({
                                              ...d,
                                              [s.originalIdx]: {
                                                ...d[s.originalIdx],
                                                weight: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-16 h-10 bg-black/50 border border-white/10 rounded-lg text-center text-sm text-white outline-none focus:border-[#6ee7b7]/50"
                                        />
                                        <span className="text-[11px] text-white/30">
                                          {units} ×
                                        </span>
                                        <input
                                          type="number"
                                          value={draft.reps}
                                          onChange={(e) =>
                                            setEditDrafts((d) => ({
                                              ...d,
                                              [s.originalIdx]: {
                                                ...d[s.originalIdx],
                                                reps: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-14 h-10 bg-black/50 border border-white/10 rounded-lg text-center text-sm text-white outline-none focus:border-[#6ee7b7]/50"
                                        />
                                        <span className="text-[11px] text-white/30">
                                          reps
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteSet(exId, s.originalIdx)
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-[#f87171] hover:bg-[#f87171]/15"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              onClick={() => addSetToEditing(exId)}
                              className="w-full flex items-center justify-center gap-2 py-3 mt-3 text-[11px] font-bold uppercase tracking-wider text-[#6BE3A4]/80 hover:text-[#6BE3A4] bg-[#6BE3A4]/5 border border-dashed border-[#6BE3A4]/20 rounded-xl transition-all"
                            >
                              <Plus className="w-4 h-4" /> Dodaj Serię
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {exData.sets.map((s, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center bg-white/5 border border-white/[0.06] rounded-md px-2 py-1 text-[11px] text-white/60 font-mono"
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
                  {dayPhotos.length > 0 && (
                    <div className="pt-3 border-t border-white/5 flex gap-2 overflow-x-auto">
                      {dayPhotos.map((p) => (
                        <div
                          key={p.id}
                          className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#6ee7b7]/20 relative"
                        >
                          <img
                            src={p.dataUrl}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
