import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalIcon,
  X,
  Tag,
  Settings,
  Trash2,
  Clock,
} from "lucide-react";
import { getCalData, saveCalData } from "@/lib/calendarStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6ee7b7",
  "#f2c063",
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({ events: [], tags: [] });

  const [selectedDay, setSelectedDay] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    time: "12:00",
    title: "",
    tagId: "",
  });
  const [newTag, setNewTag] = useState({ name: "", color: PALETTE[0] });

  useEffect(() => {
    setData(getCalData());
    const handler = () => setData(getCalData());
    window.addEventListener("calendar-changed", handler);
    return () => window.removeEventListener("calendar-changed", handler);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const ev = {
      id: "ev_" + Date.now(),
      date: format(selectedDay, "yyyy-MM-dd"),
      time: newEvent.time,
      title: newEvent.title.trim(),
      tagId: newEvent.tagId || (data.tags.length > 0 ? data.tags[0].id : null),
    };
    saveCalData({ ...data, events: [...data.events, ev] });
    setNewEvent({ time: "12:00", title: "", tagId: "" });
    setEventModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (!confirm("Usunąć wydarzenie?")) return;
    saveCalData({ ...data, events: data.events.filter((e) => e.id !== id) });
  };

  const handleAddTag = () => {
    if (!newTag.name.trim()) return;
    const t = {
      id: "tag_" + Date.now(),
      name: newTag.name.trim(),
      color: newTag.color,
    };
    saveCalData({ ...data, tags: [...data.tags, t] });
    setNewTag({ name: "", color: PALETTE[0] });
  };

  const handleDeleteTag = (id) => {
    if (!confirm("Usunąć tę kategorię? Powiązane wydarzenia stracą kolor."))
      return;
    saveCalData({
      ...data,
      tags: data.tags.filter((t) => t.id !== id),
      events: data.events.map((e) =>
        e.tagId === id ? { ...e, tagId: null } : e,
      ),
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-[max(16px,env(safe-area-inset-top))] px-3 md:px-5 pb-32 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1
          className="text-[22px] md:text-[28px] font-bold tracking-tight flex items-center gap-2 md:gap-3 m-0"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.025em",
          }}
        >
          <CalIcon className="w-6 h-6 md:w-8 md:h-8 text-[#6ee7b7]" /> Kalendarz
        </h1>
        <button
          onClick={() => setTagsModalOpen(true)}
          className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/60 transition-colors shadow-sm"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div
        className="rounded-2xl md:rounded-[32px] p-3 md:p-6 lg:p-8"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px) saturate(1.2)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Nawigacja Miesiąca */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="text-lg md:text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-[14px] md:rounded-2xl p-1 md:p-1.5 shadow-inner">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl text-white/70 hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-white/10 rounded-lg md:rounded-xl text-[11px] md:text-[13px] font-bold text-white/70 hover:text-white transition-all"
            >
              DZIŚ
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl text-white/70 hover:text-white transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Siatka Kalendarza */}
        <div className="grid grid-cols-7 gap-1 md:gap-3 lg:gap-4">
          {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] md:text-[13px] font-bold text-white/40 uppercase tracking-widest mb-1 md:mb-3"
            >
              {d}
            </div>
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = data.events
              .filter((e) => e.date === dateStr)
              .sort((a, b) => a.time.localeCompare(b.time));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedDay(day);
                  setNewEvent({ ...newEvent, tagId: data.tags[0]?.id || "" });
                }}
                className={`flex flex-col min-h-[60px] md:min-h-[100px] p-1 md:p-3 lg:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border relative overflow-hidden group
                  ${
                    isTodayDate
                      ? "bg-[#6ee7b7]/10 border-[#6ee7b7]/30 shadow-[0_0_20px_rgba(110,231,183,0.15)] ring-1 ring-[#6ee7b7]/50"
                      : isCurrentMonth
                        ? "bg-black/20 border-white/5 hover:bg-white/[0.08] hover:border-white/20"
                        : "bg-transparent border-transparent opacity-30 pointer-events-none"
                  }
                `}
              >
                {/* Numer dnia */}
                <div
                  className={`text-[11px] md:text-sm font-bold flex justify-center md:justify-between items-center ${isTodayDate ? "text-[#6ee7b7]" : "text-white/70 group-hover:text-white"}`}
                >
                  <span
                    className={
                      isTodayDate
                        ? "bg-[#6ee7b7] text-black w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full shadow-lg"
                        : ""
                    }
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Widok Mobile: Kolorowe Kropki */}
                <div className="flex md:hidden flex-wrap gap-1 mt-1 md:mt-2 justify-center items-center w-full">
                  {dayEvents.slice(0, 4).map((ev) => {
                    const tag = data.tags.find((t) => t.id === ev.tagId);
                    return (
                      <div
                        key={ev.id}
                        className="w-1.5 h-1.5 rounded-full shadow-sm"
                        style={{ backgroundColor: tag?.color || "#fff" }}
                      />
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px] text-white/50 leading-none">
                      +{dayEvents.length - 4}
                    </span>
                  )}
                </div>

                {/* Widok Desktop: Pigułki Wydarzeń */}
                <div className="hidden md:flex flex-col gap-1 overflow-y-auto flex-1 mt-2 custom-scrollbar pr-1">
                  {dayEvents.map((ev) => {
                    const tag = data.tags.find((t) => t.id === ev.tagId);
                    return (
                      <div
                        key={ev.id}
                        className="text-[10px] lg:text-[11px] truncate px-1.5 py-1 rounded-md flex items-center gap-1.5 font-semibold transition-transform hover:scale-[1.02]"
                        style={{
                          backgroundColor: tag
                            ? `${tag.color}25`
                            : "rgba(255,255,255,0.08)",
                          color: tag ? tag.color : "rgba(255,255,255,0.9)",
                          borderLeft: `2px solid ${tag ? tag.color : "rgba(255,255,255,0.3)"}`,
                        }}
                      >
                        <span className="opacity-70 font-mono text-[9px] tracking-tight">
                          {ev.time}
                        </span>
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Szczegółów Dnia */}
      <Dialog
        open={!!selectedDay}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedDay(null);
            setEventModalOpen(false);
          }
        }}
      >
        <DialogContent className="bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white w-[95%] max-w-lg rounded-3xl p-5 md:p-8">
          <DialogHeader className="mb-4 md:mb-6 border-b border-white/10 pb-4">
            <DialogTitle className="text-xl md:text-2xl font-extrabold flex items-center gap-3">
              <CalIcon className="w-5 h-5 md:w-6 md:h-6 text-[#6ee7b7]" />{" "}
              {selectedDay && format(selectedDay, "EEEE, dd MMMM")}
            </DialogTitle>
          </DialogHeader>

          {!eventModalOpen ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {selectedDay &&
                  data.events
                    .filter((e) => e.date === format(selectedDay, "yyyy-MM-dd"))
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((ev) => {
                      const tag = data.tags.find((t) => t.id === ev.tagId);
                      return (
                        <div
                          key={ev.id}
                          className="flex items-center gap-3 md:gap-4 bg-white/[0.03] p-3 md:p-4 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-colors group"
                        >
                          <div
                            className="flex items-center gap-1.5 text-xs md:text-sm font-bold font-mono px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl shadow-inner"
                            style={{
                              backgroundColor: tag
                                ? `${tag.color}15`
                                : "rgba(255,255,255,0.05)",
                              color: tag ? tag.color : "#fff",
                            }}
                          >
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-70" />{" "}
                            {ev.time}
                          </div>
                          <div className="flex-1 font-semibold text-sm md:text-[15px]">
                            {ev.title}
                          </div>
                          {tag && (
                            <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1 rounded-md bg-black/40 border border-white/5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: tag.color,
                                  boxShadow: `0 0 8px ${tag.color}80`,
                                }}
                                title={tag.name}
                              />
                              <span
                                className="hidden sm:inline text-[9px] md:text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl text-white/20 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors md:opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                      );
                    })}
                {selectedDay &&
                  data.events.filter(
                    (e) => e.date === format(selectedDay, "yyyy-MM-dd"),
                  ).length === 0 && (
                    <div className="text-center py-12 md:py-16 text-white/30 text-sm border border-dashed border-white/10 rounded-3xl bg-black/20">
                      Brak wydarzeń. Czysta karta!
                    </div>
                  )}
              </div>
              <button
                onClick={() => setEventModalOpen(true)}
                className="w-full h-12 md:h-14 bg-white hover:bg-gray-200 text-black rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> Dodaj Nowe Wydarzenie
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex gap-3 md:gap-4">
                <div className="w-1/3">
                  <div className="text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-1.5 md:mb-2 ml-1">
                    Godzina
                  </div>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                    className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-2 md:px-4 text-sm md:text-base font-bold text-white outline-none focus:border-[#6ee7b7]/50 transition-colors"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div className="w-2/3">
                  <div className="text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-1.5 md:mb-2 ml-1">
                    Nazwa
                  </div>
                  <input
                    type="text"
                    placeholder="Trening..."
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 text-sm md:text-base text-white outline-none focus:border-[#6ee7b7]/50 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-1.5 md:mb-2 ml-1">
                  Przypisz Kategorię
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewEvent({ ...newEvent, tagId: "" })}
                    className={`h-10 md:h-12 border rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${!newEvent.tagId ? "bg-white text-black border-white shadow-md" : "bg-black/40 border-white/10 text-white/50 hover:bg-white/5"}`}
                  >
                    Brak tagu
                  </button>
                  {data.tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setNewEvent({ ...newEvent, tagId: t.id })}
                      className={`h-10 md:h-12 border rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${newEvent.tagId === t.id ? "bg-white/10 border-white/30 text-white shadow-md" : "bg-black/40 border-white/10 text-white/50 hover:bg-white/5"}`}
                    >
                      <div
                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full"
                        style={{
                          backgroundColor: t.color,
                          boxShadow: `0 0 8px ${t.color}80`,
                        }}
                      />
                      <span className="truncate max-w-[80px] md:max-w-none">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 md:gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEventModalOpen(false)}
                  className="flex-1 h-12 md:h-14 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-[2] h-12 md:h-14 bg-white text-black rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-lg transition-all hover:bg-gray-200 active:scale-[0.98]"
                >
                  Zapisz
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Zarządzania Tagami */}
      <Dialog open={tagsModalOpen} onOpenChange={setTagsModalOpen}>
        <DialogContent className="bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl text-white w-[95%] max-w-sm rounded-3xl p-5 md:p-8">
          <DialogHeader className="mb-4 md:mb-6">
            <DialogTitle className="text-lg md:text-xl font-extrabold flex items-center gap-2">
              <Tag className="w-4 h-4 md:w-5 md:h-5 text-white" /> Zarządzaj
              Kategoriami
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-2 max-h-[200px] md:max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {data.tags.length === 0 && (
                <div className="text-sm text-white/40 italic text-center py-4">
                  Brak zapisanych tagów.
                </div>
              )}
              {data.tags.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3.5 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full ring-2 ring-white/10"
                      style={{
                        backgroundColor: t.color,
                        boxShadow: `0 0 12px ${t.color}`,
                      }}
                    />
                    <span className="text-[13px] md:text-[14px] font-bold tracking-wide">
                      {t.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-white/20 hover:text-[#ff6b6b] transition-colors md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 md:pt-6 border-t border-white/10">
              <div className="text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2 md:mb-3 ml-1">
                Dodaj Nową Kategorie
              </div>
              <input
                type="text"
                placeholder="Np. Uczelnia..."
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="w-full h-10 md:h-12 bg-black/40 border border-white/10 rounded-xl px-3 md:px-4 text-sm text-white outline-none focus:border-white/30 mb-3 md:mb-4 transition-colors"
              />
              <div className="flex flex-wrap gap-2 justify-center mb-4 md:mb-6 bg-black/20 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-6 h-6 md:w-7 md:h-7 rounded-full transition-all ${newTag.color === color ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#111113] shadow-lg" : "hover:scale-110 opacity-60 hover:opacity-100"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddTag}
                className="w-full h-10 md:h-12 bg-white text-black font-bold rounded-xl shadow-[0_4px_14px_rgba(255,255,255,0.15)] hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Stwórz Tag
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
