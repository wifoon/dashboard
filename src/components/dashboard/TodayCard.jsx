import { useState, useCallback, useRef } from "react";
import {
  getTodayGoals,
  setTodayGoals,
  getTomorrowGoals,
  setTomorrowGoals,
  getActiveDateString,
  formatDate,
  runStreakCheck,
} from "@/lib/goalStorage";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";

export default function TodayCard({ goals, reload }) {
  const [showAll, setShowAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const statusTimer = useRef(null);
  const dragFrom = useRef(null);

  const dateStr = getActiveDateString();
  const total = goals.length;
  const doneCount = goals.filter((g) => g.done).length;
  const allDone = total > 0 && doneCount === total;
  const streakCount = runStreakCheck();

  const showStatus = (text, color, duration = 3500) => {
    clearTimeout(statusTimer.current);
    setStatusMsg({ text, color });
    statusTimer.current = setTimeout(() => setStatusMsg(null), duration);
  };

  const handleToggle = (idx) => {
    const g = [...goals];
    g[idx] = { ...g[idx], done: !g[idx].done };
    if (g[idx].done) g[idx].doneAt = Date.now();
    else delete g[idx].doneAt;
    setTodayGoals(g);
    reload();
  };

  const handleEdit = (idx, newText) => {
    const g = [...goals];
    g[idx] = { ...g[idx], text: newText };
    setTodayGoals(g);
    reload();
  };

  const handleDelete = (idx) => {
    const g = [...goals];
    g.splice(idx, 1);
    setTodayGoals(g);
    reload();
  };

  const handleQueue = (idx) => {
    const g = [...goals];
    g[idx] = { ...g[idx], queued: !g[idx].queued };
    setTodayGoals(g);
    setTimeout(reload, 480);
  };

  const handleAdd = (text, polish) => {
    if (polish) {
      showStatus(
        "Polish needs an Anthropic API key — added as-typed.",
        "var(--text-tertiary)",
      );
    }
    const g = [...goals, { text, done: false }];
    setTodayGoals(g);
    reload();
  };

  const handlePush = () => {
    if (!confirm("Push all remaining goals to tomorrow?")) return;
    const unchecked = goals.filter((g) => !g.done);
    const tmr = getTomorrowGoals();
    const tmrTexts = new Set(tmr.map((g) => g.text));
    for (const g of unchecked) {
      if (!tmrTexts.has(g.text)) {
        tmr.push({ text: g.text, done: false });
      }
    }
    setTomorrowGoals(tmr);
    const remaining = goals.filter((g) => g.done);
    setTodayGoals(remaining);
    reload();
  };

  const hasUnchecked = goals.some((g) => !g.done);
  const visibleGoals = showAll ? goals : goals.slice(0, 5);
  const hiddenCount = goals.length - 5;

  let label = "no goals yet";
  if (total > 0 && allDone) label = "all done — solid day";
  else if (total > 0) label = "complete";

  return (
    <div
      className="rounded-2xl p-5 mb-4 transition-all"
      style={{
        background: allDone
          ? "radial-gradient(ellipse at top, rgba(107,227,164,0.08), rgba(255,255,255,0.04) 60%)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3 mb-3.5">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase mb-1.5"
            style={{ letterSpacing: "0.18em", color: "var(--text-tertiary)" }}
          >
            Today — {formatDate(dateStr)}
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

        {/* Streak pill */}
        <div
          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full text-[11px]"
          style={{
            background:
              streakCount > 0
                ? "rgba(242,192,99,0.10)"
                : "rgba(255,255,255,0.04)",
            color: streakCount > 0 ? "#F2C063" : "var(--text-tertiary)",
            border:
              streakCount > 0
                ? "1px solid rgba(242,192,99,0.32)"
                : "1px solid transparent",
          }}
        >
          <span
            className="text-[13px]"
            style={{
              filter:
                streakCount > 0
                  ? "drop-shadow(0 0 6px rgba(242,192,99,0.6))"
                  : "none",
            }}
          >
            ⚡
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {streakCount}
          </span>
          <span className="uppercase" style={{ letterSpacing: "0.10em" }}>
            day streak
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex gap-1 h-1.5 mb-4">
          {goals.map((g, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all"
              style={{
                background: g.done ? "#6BE3A4" : "rgba(255,255,255,0.08)",
                boxShadow: g.done ? "0 0 6px rgba(107,227,164,0.40)" : "none",
              }}
            />
          ))}
        </div>
      )}

      {/* Goal list */}
      {goals.length === 0 ? (
        <div
          className="text-xs italic text-center py-3.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          No goals for today yet — add one below.
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {visibleGoals.map((g, i) => (
            <GoalRow
              key={`${i}-${g.text}`}
              goal={g}
              index={i}
              readOnly={false}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onQueue={handleQueue}
              onDragStart={(e, idx) => {
                dragFrom.current = idx;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e, toIdx) => {
                const fromIdx = dragFrom.current;
                if (fromIdx === null || fromIdx === toIdx) return;
                const g2 = [...goals];
                const [item] = g2.splice(fromIdx, 1);
                g2.splice(toIdx, 0, item);
                setTodayGoals(g2);
                reload();
              }}
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
              Show {hiddenCount} more ▾
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
              Show less ▴
            </li>
          )}
        </ul>
      )}

      {/* Push remaining */}
      {hasUnchecked && (
        <button
          onClick={handlePush}
          className="w-full py-2.5 rounded-xl text-xs transition-all hover:bg-white/[0.06] mb-2"
          style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            color: "var(--text-tertiary)",
            background: "transparent",
          }}
        >
          Push remaining to tomorrow →
        </button>
      )}

      <GoalInput onAdd={handleAdd} statusMsg={statusMsg} />
    </div>
  );
}
