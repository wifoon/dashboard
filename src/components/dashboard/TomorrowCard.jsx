import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { todosApi, calendarApi } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";
import { AlignLeft, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function TomorrowCard({ goals, dateStr }) {
  const [showAll, setShowAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const queryClient = useQueryClient();

  const total = goals.length;

  const { data: events = [] } = useQuery({
    queryKey: ["calendar_events"],
    queryFn: calendarApi.fetchEvents,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["calendar_tags"],
    queryFn: calendarApi.fetchTags,
  });

  const tomorrowEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  // MUTACJE ZADAŃ
  const updateMutation = useMutation({
    mutationFn: todosApi.updateTodo,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["todos", dateStr] });
      const previousTodos = queryClient.getQueryData(["todos", dateStr]);
      queryClient.setQueryData(["todos", dateStr], (old) =>
        old ? old.map((t) => (t.id === id ? { ...t, ...updates } : t)) : [],
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos)
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] }),
  });

  const addMutation = useMutation({
    mutationFn: todosApi.createTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos", dateStr] });
      const previousTodos = queryClient.getQueryData(["todos", dateStr]);
      const tempTodo = {
        id: "temp-" + Date.now(),
        text: newTodo.text,
        date: dateStr,
        done: false,
        queued: false,
        is_rollover: false,
      };
      queryClient.setQueryData(["todos", dateStr], (old) =>
        old ? [...old, tempTodo] : [tempTodo],
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos)
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] }),
  });

  const deleteMutation = useMutation({
    mutationFn: todosApi.deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todos", dateStr] });
      const previousTodos = queryClient.getQueryData(["todos", dateStr]);
      queryClient.setQueryData(["todos", dateStr], (old) =>
        old ? old.filter((t) => t.id !== id) : [],
      );
      return { previousTodos };
    },
    onError: (err, id, context) => {
      if (context?.previousTodos)
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] }),
  });

  // MUTACJA WYDARZEŃ (Optymistyczne Odhaczanie)
  const toggleEventMutation = useMutation({
    mutationFn: ({ id, updates }) => calendarApi.updateEvent({ id, updates }),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["calendar_events"] });
      const previousEvents = queryClient.getQueryData(["calendar_events"]);
      queryClient.setQueryData(["calendar_events"], (old) =>
        old ? old.map((e) => (e.id === id ? { ...e, ...updates } : e)) : [],
      );
      return { previousEvents };
    },
    onError: (err, vars, context) => {
      if (context?.previousEvents)
        queryClient.setQueryData(["calendar_events"], context.previousEvents);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] }),
  });

  const handleEdit = (id, newText) =>
    updateMutation.mutate({ id, updates: { text: newText } });
  const handleDelete = (id) => deleteMutation.mutate(id);
  const handleAdd = (text) =>
    addMutation.mutate({ text, date: dateStr, isRollover: false });

  const visibleGoals = showAll ? goals : goals.slice(0, 5);
  const hiddenCount = goals.length - 5;

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase mb-1"
            style={{ letterSpacing: "0.18em", color: "var(--text-tertiary)" }}
          >
            Plan na jutro — {formatDate(dateStr)}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Zapisz dziś, karta zablokowana do 6:00 rano.
          </p>
        </div>
        <span
          className="text-[11px] uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-tertiary)",
          }}
        >
          {total} zaplanowane
        </span>
      </div>

      {tomorrowEvents.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2c063]"></span>
            Zaplanowane wydarzenia
          </div>
          <div className="grid gap-2">
            {tomorrowEvents.map((ev) => {
              const tag = tags.find((t) => t.id === ev.tag_id);
              return (
                <Popover key={ev.id}>
                  <PopoverTrigger asChild>
                    <div
                      className={`flex items-center gap-3 transition-colors border rounded-2xl p-3 shadow-inner cursor-pointer ${ev.is_done ? "bg-[#6BE3A4]/5 border-[#6BE3A4]/20" : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5"}`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventMutation.mutate({
                            id: ev.id,
                            updates: { is_done: !ev.is_done },
                          });
                        }}
                        className={`w-[22px] h-[22px] rounded-[7px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${ev.is_done ? "border-[#6BE3A4] bg-[#6BE3A4] shadow-[0_0_12px_rgba(107,227,164,0.40)]" : "border-white/20 bg-white/5"}`}
                      >
                        {ev.is_done && (
                          <div
                            className="w-[5px] h-[9px] border-r-2 border-b-2 border-[#050506]"
                            style={{
                              transform: "rotate(45deg) translateY(-1px)",
                              animation:
                                "check-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                          />
                        )}
                      </button>

                      <div
                        className={`text-[12px] font-bold font-mono px-2.5 py-1 rounded-lg ${ev.is_done ? "bg-white/5 text-white/40" : "bg-[#f2c063]/10 text-[#f2c063]"}`}
                      >
                        {ev.time}
                      </div>

                      <div
                        className={`flex-1 text-[13px] font-medium flex flex-wrap items-center gap-2 ${ev.is_done ? "text-white/40 line-through decoration-white/20" : "text-white/90"}`}
                      >
                        {ev.title}
                        {ev.description && (
                          <AlignLeft className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        )}
                      </div>

                      {tag && (
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0 border ${ev.is_done ? "bg-white/5 border-white/5 opacity-50" : "bg-white/5 border-white/5"}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: tag.color,
                              boxShadow: ev.is_done
                                ? "none"
                                : `0 0 8px ${tag.color}80`,
                            }}
                          />
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>

                  {/* Zaktualizowany Popup */}
                  <PopoverContent
                    side="top"
                    sideOffset={8}
                    className="bg-[#111113]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl p-4 text-white w-[280px] z-[200]"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h4
                        className={`font-bold text-[15px] leading-tight ${ev.is_done ? "text-white/40 line-through" : "text-white/90"}`}
                      >
                        {ev.title}
                      </h4>
                      <div
                        className="text-[11px] font-bold font-mono px-2 py-1 rounded-md shrink-0"
                        style={{
                          color: ev.is_done
                            ? "rgba(255,255,255,0.4)"
                            : tag
                              ? tag.color
                              : "#f2c063",
                          backgroundColor: ev.is_done
                            ? "rgba(255,255,255,0.05)"
                            : tag
                              ? `${tag.color}15`
                              : "#f2c06315",
                        }}
                      >
                        {ev.time}
                      </div>
                    </div>
                    {ev.description ? (
                      <div
                        className={`text-[13px] leading-relaxed bg-black/40 p-3 rounded-xl mb-4 border border-white/5 whitespace-pre-wrap break-words ${ev.is_done ? "text-white/30" : "text-white/70"}`}
                      >
                        {ev.description}
                      </div>
                    ) : (
                      <div className="text-xs text-white/40 italic mb-4">
                        Brak dodatkowej notatki.
                      </div>
                    )}
                    <button
                      onClick={() => {
                        toggleEventMutation.mutate({
                          id: ev.id,
                          updates: { is_done: !ev.is_done },
                        });
                      }}
                      className={`w-full text-xs py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 border ${ev.is_done ? "bg-[#6BE3A4]/10 text-[#6BE3A4] hover:bg-[#6BE3A4]/20 border-[#6BE3A4]/20" : "bg-white/10 text-white hover:bg-white/20 border-white/5"}`}
                    >
                      <Check className="w-4 h-4" />{" "}
                      {ev.is_done
                        ? "Cofnij ukończenie"
                        : "Oznacz jako wykonane"}
                    </button>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div
          className="text-xs italic text-center py-3.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Brak zaplanowanych zadań na jutro
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {visibleGoals.map((g) => (
            <GoalRow
              key={g.id}
              goal={g}
              readOnly={true}
              onToggle={() => {}}
              onEdit={(newText) => handleEdit(g.id, newText)}
              onDelete={() => handleDelete(g.id)}
              onQueue={() => {}}
            />
          ))}
          {hiddenCount > 0 && !showAll && (
            <li
              className="flex items-center justify-center py-2.5 mb-1.5 rounded-xl cursor-pointer text-xs transition-colors hover:bg-white/[0.04]"
              style={{
                border: "1px dashed rgba(255,255,255,0.12)",
                color: "var(--text-tertiary)",
              }}
              onClick={() => setShowAll(true)}
            >
              Pokaż {hiddenCount} więcej ▾
            </li>
          )}
          {showAll && hiddenCount > 0 && (
            <li
              className="flex items-center justify-center py-2.5 mb-1.5 rounded-xl cursor-pointer text-xs transition-colors hover:bg-white/[0.04]"
              style={{
                border: "1px dashed rgba(255,255,255,0.12)",
                color: "var(--text-tertiary)",
              }}
              onClick={() => setShowAll(false)}
            >
              Zwiń ▴
            </li>
          )}
        </ul>
      )}

      <GoalInput onAdd={handleAdd} statusMsg={statusMsg} />
    </div>
  );
}
