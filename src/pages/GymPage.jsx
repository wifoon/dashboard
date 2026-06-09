import React, { useState, useEffect, useCallback } from "react";
import { Settings, Camera, ChevronRight } from "lucide-react";
import { CONFIG, LS_KEY, WT_KEY, PHOTO_KEY, uid } from "@/utils/gymConfig";

import WeightTracker from "@/components/gym/WeightTracker";
import WorkoutLogger from "@/components/gym/WorkoutLogger";
import WorkoutHistory from "@/components/gym/WorkoutHistory";
import SettingsModal from "@/components/gym/modals/SettingsModal";
import PhotoLibraryModal from "@/components/gym/modals/PhotoLibraryModal";

export default function GymPage() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
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

  const saveToLS = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", { detail: { key } }),
    );
  }, []);

  useEffect(() => saveToLS(LS_KEY, state), [state, saveToLS]);
  useEffect(() => saveToLS(WT_KEY, wtEntries), [wtEntries, saveToLS]);
  useEffect(() => saveToLS(PHOTO_KEY, photos), [photos, saveToLS]);
  useEffect(() => {
    const syncHandler = () => {
      try {
        const rawLs = localStorage.getItem(LS_KEY);
        if (rawLs) setState(JSON.parse(rawLs));

        const rawWt = localStorage.getItem(WT_KEY);
        if (rawWt)
          setWtEntries(
            JSON.parse(rawWt).sort((a, b) =>
              a.dateKey.localeCompare(b.dateKey),
            ),
          );

        const rawPh = localStorage.getItem(PHOTO_KEY);
        if (rawPh) setPhotos(JSON.parse(rawPh));
      } catch (e) {}
    };

    window.addEventListener("storage-synced", syncHandler);
    return () => window.removeEventListener("storage-synced", syncHandler);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full max-w-6xl mx-auto pt-[max(24px,env(safe-area-inset-top))] px-5 pb-32 font-sans relative z-10">
      {/* 1. ZUNIFIKOWANY NAGŁÓWEK */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1
          className="text-[28px] font-bold tracking-tight max-sm:text-[22px] m-0"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.025em",
          }}
        >
          Trening
        </h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6 lg:space-y-8 flex flex-col">
          <div
            className="flex items-center gap-3 mb-1"
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
            <span>Pomiary</span>
            <span
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
              }}
            />
          </div>

          <WeightTracker
            wtEntries={wtEntries}
            setWtEntries={setWtEntries}
            todayKey={todayKey}
            units={state.units}
          />
          <button
            onClick={() => setPhotoLibraryOpen(true)}
            className="w-full flex items-center justify-between rounded-3xl p-6 transition-all active:scale-[0.98] group text-left hover:bg-white/[0.06]"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px) saturate(1.2)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-white/50" />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50">
                  Zdjęcia
                </span>
              </div>
              <div className="text-lg font-semibold text-white">
                {photos.length} zdjęć
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#6BE3A4] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="lg:col-span-8 space-y-6 lg:space-y-8 flex flex-col">
          <div
            className="flex items-center gap-3 mb-1"
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
            <span>Trening</span>
            <span
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
              }}
            />
          </div>

          <WorkoutLogger state={state} setState={setState} />
          <WorkoutHistory
            state={state}
            setState={setState}
            photos={photos}
            units={state.units}
          />
        </div>
      </div>

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
