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
import { getCalData } from "@/lib/calendarStorage";

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

  const calData = getCalData();
  const todayEvents = calData.events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

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
    const newGoal = { text, done: false };
    const g = [...goals];

    const firstRolloverIdx = g.findIndex((x) => x.isRollover);

    if (firstRolloverIdx !== -1) {
      g.splice(firstRolloverIdx, 0, newGoal);
    } else {
      g.push(newGoal);
    }

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

      {total > 0 && (
        <div className="flex gap-1 h-1.5 mb-6">
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

      {todayEvents.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></span>
            Wydarzenia na dziś
          </div>
          <div className="grid gap-2">
            {todayEvents.map((ev) => {
              const tag = calData.tags.find((t) => t.id === ev.tagId);
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 rounded-2xl p-3"
                >
                  <div
                    className="text-[12px] font-bold font-mono px-2.5 py-1 rounded-lg"
                    style={{
                      color: tag ? tag.color : "white",
                      backgroundColor: tag
                        ? `${tag.color}1A`
                        : "rgba(255,255,255,0.10)",
                    }}
                  >
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
              Pokaż ukryte ({hiddenCount}) ▾
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
              Zwiń listę ▴
            </li>
          )}
        </ul>
      )}

      {hasUnchecked && (
        <button
          onClick={handlePush}
          className="w-full py-2.5 rounded-xl text-xs transition-all hover:bg-white/[0.06] mb-2 mt-2"
          style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            color: "var(--text-tertiary)",
            background: "transparent",
          }}
        >
          Przenieś nieukończone na jutro →
        </button>
      )}

      <GoalInput onAdd={handleAdd} statusMsg={statusMsg} />
    </div>
  );
}
