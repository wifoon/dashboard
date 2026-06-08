import { useState, useRef } from "react";
import {
  getTomorrowGoals,
  setTomorrowGoals,
  getTomorrowDateString,
  formatDate,
} from "@/lib/goalStorage";
import { getCalData } from "@/lib/calendarStorage";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";

export default function TomorrowCard({ goals, reload }) {
  const [showAll, setShowAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const statusTimer = useRef(null);
  const dragFrom = useRef(null);

  const dateStr = getTomorrowDateString();
  const total = goals.length;

  const calData = getCalData();
  const tomorrowEvents = calData.events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const showStatus = (text, color, duration = 3500) => {
    clearTimeout(statusTimer.current);
    setStatusMsg({ text, color });
    statusTimer.current = setTimeout(() => setStatusMsg(null), duration);
  };

  const handleEdit = (idx, newText) => {
    const g = [...goals];
    g[idx] = { ...g[idx], text: newText };
    setTomorrowGoals(g);
    reload();
  };

  const handleDelete = (idx) => {
    const g = [...goals];
    g.splice(idx, 1);
    setTomorrowGoals(g);
    reload();
  };

  const handleAdd = (text, polish) => {
    const g = [...goals, { text, done: false }];
    setTomorrowGoals(g);
    reload();
  };

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
            Plan tomorrow — {formatDate(dateStr)}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Write tonight, locked until 6 AM.
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
          {total} planned
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
              const tag = calData.tags.find((t) => t.id === ev.tagId);
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
          Nothing planned for tomorrow yet
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {visibleGoals.map((g, i) => (
            <GoalRow
              key={`${i}-${g.text}`}
              goal={g}
              index={i}
              readOnly={true}
              onToggle={() => {}}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onQueue={() => {}}
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
                setTomorrowGoals(g2);
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

      <GoalInput onAdd={handleAdd} statusMsg={statusMsg} />
    </div>
  );
}
