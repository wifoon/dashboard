import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { todosApi, calendarApi } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";

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

  // 🚀 OPTYMISTYCZNA MUTACJA DLA EDYCJI
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

  // 🚀 OPTYMISTYCZNA MUTACJA DLA DODAWANIA
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

  // 🚀 OPTYMISTYCZNA MUTACJA DLA USUWANIA
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
                <div
                  key={ev.id}
                  className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 rounded-2xl p-3 shadow-inner"
                >
                  <div className="text-[12px] font-bold text-[#f2c063] font-mono bg-[#f2c063]/10 px-2.5 py-1 rounded-lg">
                    {ev.time}
                  </div>
                  <div className="flex-1 text-[13px] font-medium text-white/90">
                    {ev.title}
                  </div>
                  {tag && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 shrink-0">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: tag.color,
                          boxShadow: `0 0 8px ${tag.color}80`,
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
