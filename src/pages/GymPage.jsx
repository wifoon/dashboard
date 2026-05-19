import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Camera,
  ChevronRight,
  Activity,
  TrendingUp,
  History,
  LineChart as ChartIcon,
  Image as ImageIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// ==========================================
// CONFIGURATION & INITIALIZATION
// ==========================================
const CONFIG = {
  appTitle: "Progressive Overload",
  units: "kg",
  days: [
    { id: "push", name: "Push" },
    { id: "pull", name: "Pull" },
    { id: "legs", name: "Legs" },
  ],
  upgradeAtReps: 8,
  defaultExercises: [
    {
      name: "Bench press",
      day: "push",
      repMin: 5,
      repMax: 8,
      step: 2.5,
      startWeight: 60,
      bw: false,
    },
    {
      name: "Overhead press",
      day: "push",
      repMin: 5,
      repMax: 8,
      step: 2.5,
      startWeight: 35,
      bw: false,
    },
    {
      name: "Tricep pushdown",
      day: "push",
      repMin: 8,
      repMax: 12,
      step: 2.5,
      startWeight: 25,
      bw: false,
    },
    {
      name: "Pull-ups",
      day: "pull",
      repMin: 5,
      repMax: 10,
      step: 1,
      startWeight: 0,
      bw: true,
    },
    {
      name: "Barbell row",
      day: "pull",
      repMin: 6,
      repMax: 10,
      step: 2.5,
      startWeight: 50,
      bw: false,
    },
    {
      name: "Bicep curl",
      day: "pull",
      repMin: 8,
      repMax: 12,
      step: 1.25,
      startWeight: 15,
      bw: false,
    },
    {
      name: "Back squat",
      day: "legs",
      repMin: 5,
      repMax: 8,
      step: 5,
      startWeight: 80,
      bw: false,
    },
    {
      name: "Romanian deadlift",
      day: "legs",
      repMin: 6,
      repMax: 10,
      step: 5,
      startWeight: 60,
      bw: false,
    },
  ],
};

const LS_KEY = "po_coach_v1";
const WT_KEY = "po_coach_weights";
const PHOTO_KEY = "po_coach_photos";

function uid() {
  return "ex_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

const estimate1RM = (w, r) => (r < 2 ? w : w * (1 + r / 30));

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function GymPage() {
  // --- STATE ---
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (!s.exercises)
          s.exercises = CONFIG.defaultExercises.map((e) => ({
            ...e,
            id: uid(),
          }));
        if (!s.days) s.days = CONFIG.days;
        return s;
      }
    } catch (e) {}
    return {
      units: CONFIG.units,
      days: CONFIG.days,
      exercises: CONFIG.defaultExercises.map((e) => ({ ...e, id: uid() })),
      logs: {},
      filterDay: CONFIG.days[0].id,
      currentEx: null,
    };
  });

  const [wtEntries, setWtEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(WT_KEY);
      return raw
        ? JSON.parse(raw).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        : [];
    } catch {
      return [];
    }
  });

  const [photos, setPhotos] = useState(() => {
    try {
      const raw = localStorage.getItem(PHOTO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [photoLibraryOpen, setPhotoLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // --- SYNC EFFECTS ---
  const saveToLS = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", { detail: { key } }),
    );
  }, []);

  useEffect(() => saveToLS(LS_KEY, state), [state, saveToLS]);
  useEffect(() => saveToLS(WT_KEY, wtEntries), [wtEntries, saveToLS]);
  useEffect(() => saveToLS(PHOTO_KEY, photos), [photos, saveToLS]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  return (
    <div className="w-full max-w-6xl mx-auto pt-6 px-5 pb-24 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white m-0">
          <Activity className="inline-block w-7 h-7 md:w-8 md:h-8 text-[#6ee7b7] mr-2 -mt-1" />
          {CONFIG.appTitle}
        </h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8 flex flex-col">
          <WeightTracker
            wtEntries={wtEntries}
            setWtEntries={setWtEntries}
            todayKey={todayKey}
            units={state.units}
          />
          <button
            onClick={() => setPhotoLibraryOpen(true)}
            className="w-full flex items-center justify-between bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.15] rounded-3xl p-6 shadow-xl transition-all active:scale-[0.98] group text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-white/50" />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50">
                  Photos
                </span>
              </div>
              <div className="text-lg font-semibold text-white">
                {photos.length} photos
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#6ee7b7] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8 flex flex-col">
          <WorkoutLogger state={state} setState={setState} />
          <WorkoutHistory
            state={state}
            setState={setState}
            photos={photos}
            units={state.units}
          />
        </div>
      </div>

      {/* Modals & Toasts */}
      <PhotoLibraryModal
        open={photoLibraryOpen}
        setOpen={setPhotoLibraryOpen}
        photos={photos}
        setPhotos={setPhotos}
        todayKey={todayKey}
        lastWt={wtEntries[wtEntries.length - 1]}
        units={state.units}
        showToast={showToast}
      />
      <SettingsModal
        open={settingsOpen}
        setOpen={setSettingsOpen}
        state={state}
        setState={setState}
      />
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-3 rounded-full text-sm font-medium z-[500] transition-all duration-300 pointer-events-none ${toastMsg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {toastMsg}
      </div>
    </div>
  );
}

// ==========================================
// WEIGHT TRACKER
// ==========================================
function WeightTracker({ wtEntries, setWtEntries, todayKey, units }) {
  const [dailyInput, setDailyInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const todayEntry = wtEntries.find((e) => e.dateKey === todayKey);
  const lastEntry = wtEntries[wtEntries.length - 1];

  const handleSaveWeight = () => {
    const w = parseFloat(dailyInput);
    if (isNaN(w) || w <= 0) return;
    const newArr = [...wtEntries];
    const existingIdx = newArr.findIndex((e) => e.dateKey === todayKey);
    if (existingIdx >= 0) newArr[existingIdx].weight = w;
    else {
      newArr.push({ dateKey: todayKey, weight: w });
      newArr.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }
    setWtEntries(newArr);
    setIsEditing(false);
  };

  const chartData = useMemo(() => {
    if (wtEntries.length === 0) return [];
    const data = [];
    let lastKnown = wtEntries[0].weight;

    for (let i = 29; i >= 0; i--) {
      const targetDate = startOfDay(subDays(new Date(), i));
      const entry = wtEntries.find((e) =>
        isSameDay(parseISO(e.dateKey), targetDate),
      );
      if (entry) lastKnown = entry.weight;
      data.push({ date: format(targetDate, "MMM dd"), weight: lastKnown });
    }
    return data;
  }, [wtEntries]);

  const yMin = chartData.length
    ? Math.floor(Math.min(...chartData.map((d) => d.weight)) - 2)
    : 0;
  const yMax = chartData.length
    ? Math.ceil(Math.max(...chartData.map((d) => d.weight)) + 2)
    : 100;

  return (
    <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-[#6ee7b7]" />
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50">
          Body Weight
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-bold tracking-tight text-white">
          {lastEntry ? lastEntry.weight.toFixed(1) : "—"}
        </span>
        <span className="text-lg text-white/40 font-medium">{units}</span>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[140px] w-full mb-6">
          <ChartContainer
            config={{ weight: { color: "#6ee7b7" } }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis dataKey="date" hide />
                <YAxis domain={[yMin, yMax]} hide />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#6ee7b7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fillWeight)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-2xl mb-6">
          Log weight to see progress
        </div>
      )}

      {todayEntry && !isEditing ? (
        <div className="flex items-center justify-between bg-[#6ee7b7]/10 border border-[#6ee7b7]/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#6ee7b7]/80 font-bold mb-0.5">
                LOGGED TODAY
              </div>
              <div className="text-base font-semibold text-white">
                {todayEntry.weight.toFixed(1)} {units}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setDailyInput(todayEntry.weight.toString());
              setIsEditing(true);
            }}
            className="text-[#6ee7b7] font-semibold px-3 py-2 hover:bg-[#6ee7b7]/10 rounded-xl transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.1"
              value={dailyInput}
              onChange={(e) => setDailyInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-lg font-bold text-white outline-none focus:border-[#6ee7b7]/50 transition-colors"
              placeholder="0.0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">
              {units}
            </span>
          </div>
          <button
            onClick={handleSaveWeight}
            className="bg-[#6ee7b7] hover:bg-[#5cd4a3] text-black rounded-2xl px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#6ee7b7]/20"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// WORKOUT LOGGER
// ==========================================
function WorkoutLogger({ state, setState }) {
  const [activeRep, setActiveRep] = useState(8);
  const [weightInput, setWeightInput] = useState("");
  const [exModalMode, setExModalMode] = useState(null); // 'add' | 'edit'
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
    <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl flex flex-col">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setWeightInput(
                      Math.max(
                        0,
                        (parseFloat(weightInput) || 0) - currentEx.step,
                      ).toString(),
                    )
                  }
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xl font-bold transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl text-center text-2xl font-bold text-white outline-none focus:border-white/30"
                />
                <button
                  onClick={() =>
                    setWeightInput(
                      (
                        (parseFloat(weightInput) || 0) + currentEx.step
                      ).toString(),
                    )
                  }
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xl font-bold transition-colors"
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
              )
                .slice(0, 10)
                .map((r) => (
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
          className={`mt-auto rounded-2xl p-5 border ${rx.type === "up" ? "bg-[#6ee7b7]/10 border-[#6ee7b7]/20" : rx.type === "down" ? "bg-[#f87171]/10 border-[#f87171]/20" : "bg-white/5 border-white/10"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50">
              Next Session Coach
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase ${rx.type === "up" ? "bg-[#6ee7b7]/20 text-[#6ee7b7]" : rx.type === "down" ? "bg-[#f87171]/20 text-[#f87171]" : "bg-white/10 text-white/70"}`}
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

// ==========================================
// WORKOUT HISTORY (EDITABLE + PHOTOS)
// ==========================================
function WorkoutHistory({ state, setState, photos, units }) {
  const historyByDate = useMemo(() => {
    const grouped = {};
    Object.entries(state.logs).forEach(([exId, sets]) => {
      const ex = state.exercises.find((e) => e.id === exId) || {
        name: "Deleted Exercise",
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

  const handleDeleteSet = (exId, originalIdx) => {
    if (!confirm("Remove this set?")) return;
    setState((prev) => {
      const exLogs = [...(prev.logs[exId] || [])];
      exLogs.splice(originalIdx, 1);
      const newLogs = { ...prev.logs };
      if (exLogs.length === 0) delete newLogs[exId];
      else newLogs[exId] = exLogs;
      return { ...prev, logs: newLogs };
    });
  };

  return (
    <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl flex flex-col max-h-[600px]">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-white/50" />
        <h2 className="text-lg font-bold text-white m-0">Workout History</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {historyByDate.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">
            No recorded workouts.
          </div>
        ) : (
          historyByDate.map((day) => {
            const dayPhotos = photos.filter((p) => p.dateKey === day.dateStr);
            return (
              <div
                key={day.dateStr}
                className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[13px] font-bold text-white">
                      {format(parseISO(day.dateStr), "EEEE, MMM dd")}
                    </div>
                    <div className="text-[11px] text-white/40 mt-1">
                      {day.sets} sets ·{" "}
                      {Math.round(day.volume).toLocaleString()} {units} vol
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(day.exercises).map(([exId, exData]) => (
                    <div key={exId} className="flex flex-col gap-2">
                      <span className="text-[12px] font-bold text-white/80">
                        {exData.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {exData.sets.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-1 group"
                          >
                            <span className="text-[11px] text-white/60 font-mono tabular-nums">
                              {exData.bw
                                ? `${s.reps}r`
                                : `${s.weight}×${s.reps}`}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteSet(exId, s.originalIdx)
                              }
                              className="text-white/20 hover:text-[#f87171] opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attached Photos */}
                {dayPhotos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 overflow-x-auto">
                    {dayPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-[#6ee7b7]/20 relative"
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
            );
          })
        )}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }`,
        }}
      />
    </div>
  );
}

// ==========================================
// EXERCISE PROGRESS DIALOG
// ==========================================
function ExerciseProgressDialog({ open, setOpen, ex, logs, units }) {
  const data = useMemo(() => {
    if (!logs || logs.length < 2) return [];
    return logs.map((l, i) => ({
      index: i + 1,
      date: format(parseISO(l.date), "MMM dd"),
      value: ex.bw ? l.reps : estimate1RM(l.weight, l.reps),
    }));
  }, [logs, ex]);

  if (!ex) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-lg rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-[#6ee7b7]" /> {ex.name} Progress
          </DialogTitle>
        </DialogHeader>
        {data.length >= 2 ? (
          <div className="h-[250px] w-full mt-4">
            <ChartContainer
              config={{ value: { color: "#6ee7b7" } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickFormatter={(val) => Math.round(val)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={ex.bw ? "Max Reps" : `Est. 1RM (${units})`}
                    stroke="#6ee7b7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#111113", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-white/40 text-sm bg-white/5 rounded-2xl">
            Log at least 2 sets to see progress.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD/EDIT EXERCISE DIALOG
// ==========================================
function ExerciseDialog({ state, setState, mode, exToEdit, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    day: "push",
    bw: false,
    startWeight: 20,
    repMin: 6,
    repMax: 8,
    step: 2.5,
  });

  useEffect(() => {
    if (mode === "edit" && exToEdit) {
      setFormData({
        name: exToEdit.name,
        day: exToEdit.day,
        bw: exToEdit.bw || false,
        startWeight: exToEdit.startWeight || 20,
        repMin: exToEdit.repMin || 6,
        repMax: exToEdit.repMax || 8,
        step: exToEdit.step || 2.5,
      });
    } else if (mode === "add") {
      setFormData((prev) => ({
        ...prev,
        day: state.filterDay,
        name: "",
        startWeight: 20,
        bw: false,
      }));
    }
  }, [mode, exToEdit, state.filterDay]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    const newEx = {
      id: mode === "edit" ? exToEdit.id : uid(),
      name: formData.name.trim(),
      day: formData.day,
      bw: formData.bw,
      repMin: parseInt(formData.repMin),
      repMax: parseInt(formData.repMax),
      step: parseFloat(formData.step),
      startWeight: parseFloat(formData.startWeight),
    };
    setState((prev) => {
      const nextExs =
        mode === "edit"
          ? prev.exercises.map((e) => (e.id === exToEdit.id ? newEx : e))
          : [...prev.exercises, newEx];
      return {
        ...prev,
        exercises: nextExs,
        currentEx: newEx.id,
        filterDay: newEx.day,
      };
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirm("Delete this exercise and its logs?")) return;
    setState((prev) => {
      const nextExs = prev.exercises.filter((e) => e.id !== exToEdit.id);
      const nextLogs = { ...prev.logs };
      delete nextLogs[exToEdit.id];
      return { ...prev, exercises: nextExs, logs: nextLogs, currentEx: null };
    });
    onClose();
  };

  return (
    <Dialog open={!!mode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-sm rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">
            {mode === "add" ? "Add Exercise" : "Edit Exercise"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              placeholder="e.g. Incline DB press"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
              Day
            </label>
            <div className="flex gap-2 bg-black/40 p-1 border border-white/10 rounded-xl">
              {state.days.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setFormData({ ...formData, day: d.id })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.day === d.id ? "bg-white text-black" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={formData.bw}
              onChange={(e) =>
                setFormData({ ...formData, bw: e.target.checked })
              }
              className="w-4 h-4 accent-[#6ee7b7]"
            />
            <span className="text-sm font-medium text-white/80">
              Bodyweight (reps only)
            </span>
          </label>
          {!formData.bw && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
                  Start Weight
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.startWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, startWeight: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
                  Increment
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.step}
                  onChange={(e) =>
                    setFormData({ ...formData, step: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
                Min Reps
              </label>
              <input
                type="number"
                value={formData.repMin}
                onChange={(e) =>
                  setFormData({ ...formData, repMin: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 block mb-2 ml-1">
                Max Reps
              </label>
              <input
                type="number"
                value={formData.repMax}
                onChange={(e) =>
                  setFormData({ ...formData, repMax: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            {mode === "edit" && (
              <button
                onClick={handleDelete}
                className="w-12 h-12 flex items-center justify-center bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 h-12 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// PHOTO LIBRARY & COMPRESSION
// ==========================================
function PhotoLibraryModal({
  open,
  setOpen,
  photos,
  setPhotos,
  todayKey,
  lastWt,
  units,
  showToast,
}) {
  const compressPhoto = (dataUrl, maxDim = 1080) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round(h * (maxDim / w));
            w = maxDim;
          } else {
            w = Math.round(w * (maxDim / h));
            h = maxDim;
          }
        }
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleAdd = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const compressed = await compressPhoto(e.target.result);
      const newP = {
        id: uid(),
        dataUrl: compressed,
        dateKey: todayKey,
        date: format(new Date(), "MMM dd"),
        dateUpper: format(new Date(), "MMM dd").toUpperCase(),
        weight: lastWt ? `${lastWt.weight.toFixed(1)} ${units}` : "—",
      };
      setPhotos([newP, ...photos]);
      showToast("Photo added");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#000] border-none text-white w-full max-w-lg h-[90vh] md:h-[80vh] flex flex-col p-0 rounded-t-2xl md:rounded-3xl overflow-hidden gap-0">
        <div className="flex items-center gap-4 p-5">
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"
          >
            ←
          </button>
          <div className="text-xl font-bold">Progress Gallery</div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 mb-4">
          <label className="h-14 rounded-xl bg-[#6ee7b7] text-black font-bold flex items-center justify-center cursor-pointer">
            <Camera className="w-5 h-5 mr-2" /> Take Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleAdd(e.target.files[0])}
              className="hidden"
            />
          </label>
          <label className="h-14 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer hover:bg-white/20">
            <ImageIcon className="w-5 h-5 mr-2" /> Library
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleAdd(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 grid grid-cols-2 gap-3">
          {photos.length === 0 && (
            <div className="col-span-2 text-center text-white/40 mt-10">
              No photos yet.
            </div>
          )}
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-[3/4] rounded-xl overflow-hidden group"
            >
              <img
                src={p.dataUrl}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end text-xs font-medium">
                <span className="text-[#6ee7b7]">{p.date}</span>
                <span>{p.weight}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this photo?"))
                    setPhotos(photos.filter((x) => x.id !== p.id));
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-[#f87171]" />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// SETTINGS
// ==========================================
function SettingsModal({ open, setOpen, state, setState }) {
  const [days, setDays] = useState(state.days);
  const [units, setUnits] = useState(state.units);

  useEffect(() => {
    if (open) {
      setDays(state.days);
      setUnits(state.units);
    }
  }, [open, state]);

  const handleSave = () => {
    setState((prev) => ({
      ...prev,
      days,
      units,
      filterDay: days.find((d) => d.id === prev.filterDay)
        ? prev.filterDay
        : days[0].id,
    }));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-sm rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-3">
              Units
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              {["kg", "lbs"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm ${units === u ? "bg-white text-black" : "text-white/50 hover:bg-white/5"}`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-3">
              Training Split
            </div>
            <div className="space-y-2">
              {days.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => {
                      const n = [...days];
                      n[i].name = e.target.value;
                      setDays(n);
                    }}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => {
                      if (days.length > 1)
                        setDays(days.filter((_, idx) => idx !== i));
                    }}
                    className="w-10 flex items-center justify-center bg-white/5 hover:bg-[#f87171]/20 text-white/40 hover:text-[#f87171] rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setDays([...days, { id: uid(), name: "New Day" }])
                }
                className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-sm text-white/50 font-medium hover:bg-white/5 transition-colors"
              >
                + Add Day
              </button>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full h-12 bg-white text-black font-bold rounded-xl"
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
