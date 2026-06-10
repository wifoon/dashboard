import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todosApi } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";

export default function TodayCard({ goals, dateStr }) {
  const [showAll, setShowAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const statusTimer = useRef(null);
  const queryClient = useQueryClient();

  const total = goals.length;
  const doneCount = goals.filter((g) => g.done).length;
  const allDone = total > 0 && doneCount === total;

  // 🚀 OPTYMISTYCZNA MUTACJA: Przełączanie statusu (Znika delay przy kliknięciu!)
  const toggleMutation = useMutation({
    mutationFn: todosApi.updateTodo,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["todos", dateStr] });
      const previousTodos = queryClient.getQueryData(["todos", dateStr]);

      queryClient.setQueryData(["todos", dateStr], (old) =>
        old ? old.map((t) => (t.id === id ? { ...t, ...updates } : t)) : [],
      );

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] });
    },
  });

  // 🚀 OPTYMISTYCZNA MUTACJA: Dodawanie zadania (Pojawia się od razu)
  const addMutation = useMutation({
    mutationFn: todosApi.createTodo,
    onMutate: async (newTodoPayload) => {
      await queryClient.cancelQueries({ queryKey: ["todos", dateStr] });
      const previousTodos = queryClient.getQueryData(["todos", dateStr]);

      const temporaryTodo = {
        id: "temp-" + Date.now(),
        text: newTodoPayload.text,
        date: dateStr,
        done: false,
        queued: false,
        is_rollover: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(["todos", dateStr], (old) =>
        old ? [...old, temporaryTodo] : [temporaryTodo],
      );

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] });
    },
  });

  // 🚀 OPTYMISTYCZNA MUTACJA: Usuwanie zadania (Znika natychmiast z ekranu)
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
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", dateStr], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", dateStr] });
    },
  });

  const handleToggle = (goal) => {
    toggleMutation.mutate({
      id: goal.id,
      updates: {
        done: !goal.done,
        done_at: !goal.done ? new Date().toISOString() : null,
      },
    });
  };

  const handleEdit = (id, newText) => {
    toggleMutation.mutate({ id, updates: { text: newText } });
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleQueue = (goal) => {
    toggleMutation.mutate({ id: goal.id, updates: { queued: !goal.queued } });
  };

  const handleAdd = (text) => {
    addMutation.mutate({ text, date: dateStr });
  };

  const visibleGoals = showAll ? goals : goals.slice(0, 5);
  const hiddenCount = goals.length - 5;

  let label = "brak celów";
  if (total > 0 && allDone) label = "wszystko zrobione — świetna robota";
  else if (total > 0) label = "w trakcie";

  return (
    <div
      className="rounded-3xl p-6 mb-6 transition-all"
      style={{
        background: allDone
          ? "radial-gradient(ellipse at top, rgba(107,227,164,0.08), rgba(255,255,255,0.04) 60%)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase mb-1.5"
            style={{ letterSpacing: "0.18em", color: "var(--text-tertiary)" }}
          >
            Dzisiaj — {formatDate(dateStr)}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[42px] font-bold"
              style={{
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.045em",
                color: allDone ? "var(--success)" : "var(--text-primary)",
              }}
            >
              {doneCount}
            </span>
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              / {total}
            </span>
            <span
              className="text-[11px] font-semibold uppercase ml-1"
              style={{
                letterSpacing: "0.10em",
                color: allDone ? "var(--success)" : "var(--text-tertiary)",
              }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="flex gap-1 h-1.5 mb-6">
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex-1 rounded-full transition-all"
              style={{
                background: g.done ? "#6BE3A4" : "rgba(255,255,255,0.08)",
                boxShadow: g.done ? "0 0 6px rgba(107,227,164,0.40)" : "none",
              }}
            />
          ))}
        </div>
      )}

      {goals.length === 0 ? (
        <div
          className="text-xs italic text-center py-3.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Brak zaplanowanych zadań na dzisiaj
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {visibleGoals.map((g) => (
            <GoalRow
              key={g.id}
              goal={g}
              readOnly={false}
              onToggle={() => handleToggle(g)}
              onEdit={(newText) => handleEdit(g.id, newText)}
              onDelete={() => handleDelete(g.id)}
              onQueue={() => handleQueue(g)}
            />
          ))}

          {hiddenCount > 0 && (
            <li
              className="flex items-center justify-center py-2.5 mb-1.5 rounded-xl cursor-pointer text-xs transition-colors hover:bg-white/[0.04]"
              style={{
                border: "1px dashed rgba(255,255,255,0.12)",
                color: "var(--text-tertiary)",
              }}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Zwiń listę ▴" : `Pokaż ukryte (${hiddenCount}) ▾`}
            </li>
          )}
        </ul>
      )}

      <GoalInput onAdd={handleAdd} statusMsg={statusMsg} />
    </div>
  );
}
