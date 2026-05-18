import { useState, useRef } from "react";
import {
  getTomorrowGoals,
  setTomorrowGoals,
  getTomorrowDateString,
  formatDate,
} from "@/lib/goalStorage";
import GoalRow from "./GoalRow";
import GoalInput from "./GoalInput";

export default function TomorrowCard({ goals, reload }) {
  const [showAll, setShowAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const statusTimer = useRef(null);
  const dragFrom = useRef(null);

  const dateStr = getTomorrowDateString();
  const total = goals.length;

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
    if (polish) {
      showStatus(
        "Polish needs an Anthropic API key — added as-typed.",
        "var(--text-tertiary)",
      );
    }
    const g = [...goals, { text, done: false }];
    setTomorrowGoals(g);
    reload();
  };

  const visibleGoals = showAll ? goals : goals.slice(0, 5);
  const hiddenCount = goals.length - 5;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3 mb-3.5">
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

      {/* Goal list */}
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
