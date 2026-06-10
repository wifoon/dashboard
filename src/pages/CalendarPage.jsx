import React, { useState, useEffect, useCallback } from "react";
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
  isSameDay,
} from "date-fns";
import { pl } from "date-fns/locale";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
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
  Edit3,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarApi } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const ShadcnTimePicker = ({ value, onChange }) => {
  const [h, m] = (value || "12:00").split(":");
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  return (
    <div className="flex items-center gap-2">
      <Select value={h} onValueChange={(newH) => onChange(`${newH}:${m}`)}>
        <SelectTrigger className="w-full h-12 bg-black/40 border-white/10 text-white rounded-xl focus:ring-[#6BE3A4] outline-none shadow-none text-base">
          <SelectValue placeholder="Godzina" />
        </SelectTrigger>
        <SelectContent className="bg-[#111113] border-white/10 text-white max-h-[200px] rounded-xl">
          {hours.map((hour) => (
            <SelectItem
              key={hour}
              value={hour}
              className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-base"
            >
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-white/30 font-bold text-lg pb-1">:</span>
      <Select value={m} onValueChange={(newM) => onChange(`${h}:${newM}`)}>
        <SelectTrigger className="w-full h-12 bg-black/40 border-white/10 text-white rounded-xl focus:ring-[#6BE3A4] outline-none shadow-none text-base">
          <SelectValue placeholder="Minuta" />
        </SelectTrigger>
        <SelectContent className="bg-[#111113] border-white/10 text-white max-h-[200px] rounded-xl">
          {minutes.map((minute) => (
            <SelectItem
              key={minute}
              value={minute}
              className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-base"
            >
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function CalendarPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [newEvent, setNewEvent] = useState({
    time: "12:00",
    title: "",
    tag_id: "",
  });
  const [newTag, setNewTag] = useState({ name: "", color: PALETTE[0] });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  // POBIERANIE DANYCH
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["calendar_events"],
    queryFn: calendarApi.fetchEvents,
  });
  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: ["calendar_tags"],
    queryFn: calendarApi.fetchTags,
  });

  // MUTACJE
  const createEventMut = useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] }),
  });
  const updateEventMut = useMutation({
    mutationFn: calendarApi.updateEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] }),
  });
  const deleteEventMut = useMutation({
    mutationFn: calendarApi.deleteEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] }),
  });
  const createTagMut = useMutation({
    mutationFn: calendarApi.createTag,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar_tags"] }),
  });
  const deleteTagMut = useMutation({
    mutationFn: calendarApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_tags"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const scrollToSelected = useCallback(() => {
    if (!emblaApi) return;
    const index = daysInMonth.findIndex((d) => isSameDay(d, selectedDay));
    if (index !== -1) emblaApi.scrollTo(index);
  }, [emblaApi, daysInMonth, selectedDay]);

  useEffect(() => {
    scrollToSelected();
  }, [scrollToSelected]);

  const selectedDayEvents = events
    .filter((e) => e.date === format(selectedDay, "yyyy-MM-dd"))
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const payload = {
      date: format(selectedDay, "yyyy-MM-dd"),
      time: newEvent.time,
      title: newEvent.title.trim(),
      tag_id: newEvent.tag_id || null,
    };

    if (editingEventId) {
      updateEventMut.mutate({ id: editingEventId, updates: payload });
    } else {
      createEventMut.mutate(payload);
    }

    setNewEvent({ time: "12:00", title: "", tag_id: "" });
    setEditingEventId(null);
    setAddEventOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (confirm("Usunąć wydarzenie?")) deleteEventMut.mutate(id);
  };

  const handleAddTag = () => {
    if (!newTag.name.trim()) return;
    createTagMut.mutate({ name: newTag.name.trim(), color: newTag.color });
    setNewTag({ name: "", color: PALETTE[0] });
  };

  const handleDeleteTag = (id) => {
    if (confirm("Usunąć tę kategorię?")) deleteTagMut.mutate(id);
  };

  const openAddForm = (day) => {
    setSelectedDay(day);
    setEditingEventId(null);
    setNewEvent({ time: "12:00", title: "", tag_id: tags[0]?.id || "" });
    setAddEventOpen(true);
  };

  const openEditForm = (ev) => {
    setEditingEventId(ev.id);
    setNewEvent({ time: ev.time, title: ev.title, tag_id: ev.tag_id || "" });
    setAddEventOpen(true);
  };

  const openEditFormFromDesktopGrid = (ev, day) => {
    setSelectedDay(day);
    setEditingEventId(ev.id);
    setNewEvent({ time: ev.time, title: ev.title, tag_id: ev.tag_id || "" });
    setDetailsModalOpen(true);
    setAddEventOpen(true);
  };

  const EventFormContent = () => (
    <div className="space-y-6 pt-2">
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2 ml-1">
            Tytuł wydarzenia
          </div>
          <input
            type="text"
            placeholder="Nazwa wydarzenia..."
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent({ ...newEvent, title: e.target.value })
            }
            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-base md:text-sm text-white outline-none focus:border-white/30 transition-colors"
            autoFocus={!isMobile}
          />
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2 ml-1">
            Godzina
          </div>
          <ShadcnTimePicker
            value={newEvent.time}
            onChange={(val) => setNewEvent({ ...newEvent, time: val })}
          />
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2 ml-1">
          Kategoria (Tag)
        </div>
        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar bg-black/20 p-2 rounded-2xl border border-white/5">
          <button
            onClick={() => setNewEvent({ ...newEvent, tag_id: "" })}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${!newEvent.tag_id ? "bg-white/10 border-white/20 shadow-md" : "bg-transparent border-transparent hover:bg-white/5"}`}
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20" />
            <span
              className={`text-[13px] font-bold tracking-wide ${!newEvent.tag_id ? "text-white" : "text-white/50"}`}
            >
              Brak kategorii
            </span>
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setNewEvent({ ...newEvent, tag_id: t.id })}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${newEvent.tag_id === t.id ? "bg-white/10 border-white/20 shadow-md" : "bg-transparent border-transparent hover:bg-white/5"}`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                style={{
                  backgroundColor: t.color,
                  boxShadow:
                    newEvent.tag_id === t.id ? `0 0 12px ${t.color}` : "none",
                }}
              />
              <span
                className={`text-[13px] font-bold tracking-wide ${newEvent.tag_id === t.id ? "text-white" : "text-white/50"}`}
              >
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-5 border-t border-white/10">
        <button
          onClick={() => {
            setAddEventOpen(false);
            setEditingEventId(null);
          }}
          className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
        >
          Anuluj
        </button>
        <button
          onClick={handleAddEvent}
          className="flex-1 h-12 rounded-xl text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
            color: "#0A0A0B",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          Zapisz
        </button>
      </div>
    </div>
  );

  const AgendaList = ({ eventsList }) => (
    <div className="flex flex-col gap-3">
      {eventsList.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm border border-dashed border-white/10 rounded-3xl bg-black/20">
          Brak wydarzeń.
        </div>
      ) : (
        eventsList.map((ev) => {
          const tag = tags.find((t) => t.id === ev.tag_id);
          return (
            <div
              key={ev.id}
              onClick={() => openEditForm(ev)}
              className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors"
            >
              <div
                className="flex items-center gap-1.5 text-sm font-bold font-mono px-3 py-1.5 rounded-xl shadow-inner shrink-0"
                style={{
                  backgroundColor: tag
                    ? `${tag.color}15`
                    : "rgba(255,255,255,0.05)",
                  color: tag ? tag.color : "#fff",
                }}
              >
                <Clock className="w-3.5 h-3.5 opacity-70" /> {ev.time}
              </div>
              <div className="flex-1 font-semibold text-[15px]">{ev.title}</div>
              {tag && (
                <div
                  className="flex items-center px-2.5 py-1 rounded-md shrink-0 hidden sm:flex border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}30`,
                    borderLeft: `3px solid ${tag.color}`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: tag.color }}
                  >
                    {tag.name}
                  </span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(ev.id);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white/30 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                title="Usuń"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  if (loadingEvents || loadingTags) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-[#6BE3A4] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-[max(16px,env(safe-area-inset-top))] px-3 md:px-5 pb-32 md:pb-0 relative z-10 md:h-[calc(100vh-140px)] flex flex-col">
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
          Kalendarz
        </h1>
        <button
          onClick={() => setTagsModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="rounded-[32px] md:p-6 md:bg-white/[0.04] md:backdrop-blur-xl md:shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:border md:border-white/5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 md:mb-6 px-2 md:px-0 shrink-0">
          <div className="text-xl md:text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">
            {format(currentDate, "MMMM yyyy", { locale: pl })}
          </div>
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-2xl p-1.5 shadow-inner">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDay(today);
              }}
              className="px-4 py-2 hover:bg-white/10 rounded-xl text-[13px] font-bold text-white/70 hover:text-white transition-all"
            >
              DZIŚ
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="block md:hidden">
          <div className="overflow-hidden -mx-3 px-3 mb-6" ref={emblaRef}>
            <div className="flex gap-2">
              {daysInMonth.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const isTodayDate = isToday(day);
                const dayEventsCount = events.filter(
                  (e) => e.date === format(day, "yyyy-MM-dd"),
                ).length;

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDay(day)}
                    className="relative flex-[0_0_18%] min-w-[64px] h-[80px] flex flex-col items-center justify-center rounded-2xl cursor-pointer select-none"
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-day-mobile"
                        className="absolute inset-0 bg-white/10 border border-white/30 rounded-2xl"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span
                      className={`text-[11px] font-bold uppercase z-10 ${isSelected ? "text-white" : "text-white/50"}`}
                    >
                      {format(day, "EEE", { locale: pl })}
                    </span>
                    <span
                      className={`text-[22px] font-black z-10 ${isSelected ? "text-white" : isTodayDate ? "text-white" : "text-white/90"}`}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="h-1.5 mt-1 z-10 flex gap-1">
                      {dayEventsCount > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mb-6 px-1">
            <h2 className="text-sm font-bold text-white/50 tracking-widest uppercase mb-4">
              Plan na {format(selectedDay, "d MMMM", { locale: pl })}
            </h2>
            <AgendaList eventsList={selectedDayEvents} />
          </div>
          <button
            onClick={() => openAddForm(selectedDay)}
            className="w-full py-[11px] rounded-xl text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
              color: "#0A0A0B",
            }}
          >
            <Plus className="w-4 h-4" /> Dodaj Wydarzenie
          </button>
        </div>

        <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 mb-2 shrink-0 pr-2">
            {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
              <div
                key={d}
                className="text-center text-[12px] font-bold text-white/30 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2 content-start"
            style={{ gridAutoRows: "minmax(90px, auto)" }}
          >
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = events
                .filter((e) => e.date === dateStr)
                .sort((a, b) => a.time.localeCompare(b.time));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDay(day);
                    setDetailsModalOpen(true);
                  }}
                  className={`flex flex-col p-2.5 rounded-xl cursor-pointer border relative transition-colors ${isCurrentMonth ? "bg-black/20 border-white/5 hover:bg-white/[0.06]" : "bg-transparent border-transparent opacity-10 pointer-events-none"}`}
                >
                  <div
                    className={`text-[12px] font-bold flex justify-between items-center shrink-0 ${isTodayDate ? "text-black" : "text-white/60"}`}
                  >
                    <span
                      className={
                        isTodayDate
                          ? "bg-white text-black w-7 h-7 flex items-center justify-center rounded-full font-black"
                          : ""
                      }
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2 flex-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const tag = tags.find((t) => t.id === ev.tag_id);
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditFormFromDesktopGrid(ev, day);
                          }}
                          className="pl-2.5 pr-2 py-1.5 rounded-lg flex flex-col justify-center border cursor-pointer shrink-0 transition-transform hover:-translate-y-[1px]"
                          style={{
                            backgroundColor: tag
                              ? `${tag.color}15`
                              : "rgba(255,255,255,0.03)",
                            borderColor: tag
                              ? `${tag.color}30`
                              : "rgba(255,255,255,0.08)",
                            borderLeft: `3.5px solid ${tag ? tag.color : "rgba(255,255,255,0.3)"}`,
                          }}
                        >
                          <span
                            className="font-mono text-[11px] font-bold tracking-wide leading-none mb-[2px]"
                            style={{
                              color: tag ? tag.color : "rgba(255,255,255,0.7)",
                            }}
                          >
                            {ev.time}
                          </span>
                          <span className="text-[13px] font-semibold leading-tight line-clamp-2 text-white/90">
                            {ev.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="mt-0.5 w-full text-center text-[11px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 bg-white/5 rounded-md py-1.5 border border-white/5 transition-colors cursor-pointer">
                        +{dayEvents.length - 2} więcej...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Drawer open={addEventOpen && isMobile} onOpenChange={setAddEventOpen}>
        <DrawerContent className="bg-[#111113] border-white/10 text-white rounded-t-[32px]">
          <DrawerHeader className="border-b border-white/10 pb-4 mb-4 text-left px-6">
            <DrawerTitle className="text-xl font-extrabold flex items-center gap-3">
              {editingEventId ? (
                <Edit3 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
              {editingEventId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-10">{EventFormContent()}</div>
        </DrawerContent>
      </Drawer>

      {!isMobile && (
        <Dialog
          open={detailsModalOpen}
          onOpenChange={(o) => {
            if (!o) {
              setDetailsModalOpen(false);
              setAddEventOpen(false);
              setEditingEventId(null);
            }
          }}
        >
          <DialogContent className="bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white w-[95%] max-w-lg rounded-3xl p-8">
            <DialogHeader className="mb-6 border-b border-white/10 pb-4">
              <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                <CalIcon className="w-6 h-6 text-white" />{" "}
                {selectedDay &&
                  format(selectedDay, "EEEE, dd MMMM", { locale: pl })}
              </DialogTitle>
            </DialogHeader>
            {!addEventOpen ? (
              <div className="space-y-6">
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  <AgendaList eventsList={selectedDayEvents} />
                </div>
                <button
                  onClick={() => openAddForm(selectedDay)}
                  className="w-full py-[11px] rounded-xl text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
                    color: "#0A0A0B",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <Plus className="w-4 h-4" /> Dodaj Wydarzenie
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6">
                  {editingEventId ? (
                    <Edit3 className="w-5 h-5 text-white" />
                  ) : (
                    <Plus className="w-5 h-5 text-white" />
                  )}
                  <h3 className="text-lg font-bold">
                    {editingEventId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
                  </h3>
                </div>
                {EventFormContent()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={tagsModalOpen} onOpenChange={setTagsModalOpen}>
        <DialogContent className="bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl text-white w-[95%] max-w-sm rounded-3xl p-5 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Tag className="w-5 h-5 text-white" /> Kategorie
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {tags.length === 0 && (
                <div className="text-sm text-white/40 italic text-center py-4">
                  Brak zapisanych tagów.
                </div>
              )}
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                      style={{
                        backgroundColor: t.color,
                        boxShadow: `0 0 12px ${t.color}`,
                      }}
                    />
                    <span className="text-[14px] font-bold tracking-wide">
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
            <div className="pt-6 border-t border-white/10">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-3 ml-1">
                Dodaj Nową Kategorie
              </div>
              <input
                type="text"
                placeholder="Kategoria..."
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-base md:text-sm text-white outline-none focus:border-white/30 mb-4 transition-colors"
              />
              <div className="flex flex-wrap gap-2 justify-center mb-6 bg-black/20 p-3 rounded-2xl border border-white/5">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-7 h-7 rounded-full transition-all ${newTag.color === color ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#111113] shadow-lg" : "hover:scale-110 opacity-60 hover:opacity-100"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddTag}
                className="w-full h-12 bg-white text-black font-bold rounded-xl shadow-[0_4px_14px_rgba(255,255,255,0.15)] hover:bg-gray-200 transition-all active:scale-[0.98]"
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
