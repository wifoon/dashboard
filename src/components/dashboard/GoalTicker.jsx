import { useState, useEffect, useRef, useCallback } from "react";
import { getTodayGoals } from "@/lib/goalStorage";

export default function GoalTicker() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState("0/0");
  const [current, setCurrent] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const cycleIdx = useRef(0);
  const isFirstRender = useRef(true);
  const intervalRef = useRef(null);

  const buildItems = useCallback(() => {
    const goals = getTodayGoals();
    const total = goals.length;
    const doneCount = goals.filter((g) => g.done).length;

    let newItems;
    if (total === 0) {
      newItems = [
        {
          status: "empty",
          text: "No goals set for today — add one to get rolling.",
        },
      ];
    } else if (doneCount === total) {
      newItems = [{ status: "done", text: "✓ All goals done — solid day." }];
    } else {
      newItems = goals
        .filter((g) => !g.done)
        .map((g) => ({ status: "pending", text: g.text }));
    }

    setMeta(`${doneCount}/${total}`);
    return newItems;
  }, []);

  const tick = useCallback(() => {
    const newItems = buildItems();
    setItems(newItems);
    const idx = cycleIdx.current % (newItems.length || 1);
    const nextItem = newItems[idx] || newItems[0];

    if (!isFirstRender.current) {
      setLeaving(current);
      setTimeout(() => setLeaving(null), 460);
    }
    isFirstRender.current = false;

    setCurrent(nextItem);
    cycleIdx.current = idx + 1;
  }, [buildItems, current]);

  useEffect(() => {
    tick();
    intervalRef.current = setInterval(tick, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const handler = () => {
      cycleIdx.current = 0;
      isFirstRender.current = false;
      const newItems = buildItems();
      setItems(newItems);
      const nextItem = newItems[0];
      setLeaving(current);
      setTimeout(() => setLeaving(null), 460);
      setCurrent(nextItem);
      cycleIdx.current = 1;
    };
    window.addEventListener("goals-changed", handler);
    return () => window.removeEventListener("goals-changed", handler);
  }, [buildItems, current]);

  const statusGlyph = (status) => {
    if (status === "done") return "✓";
    if (status === "pending") return "○";
    return "·";
  };

  const statusColor = (status) => {
    if (status === "done") return "var(--success)";
    return "var(--text-tertiary)";
  };

  return (
    <div className="mb-[18px]">
      <div
        className="flex items-center gap-2.5 py-[7px] px-3 rounded-xl relative overflow-hidden max-sm:py-[9px] max-sm:px-3"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.30) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Sweep animation */}
        <div
          className="absolute top-0 h-full pointer-events-none"
          style={{
            width: "30%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            animation: "ticker-sweep 8s linear infinite",
          }}
        />

        {/* LED dot */}
        <div className="flex items-center justify-center w-[18px]">
          <div
            className="w-[7px] h-[7px] rounded-full"
            style={{
              background: "#6BE3A4",
              boxShadow: "0 0 8px rgba(107,227,164,0.7)",
              animation: "led-pulse 1.6s ease-in-out infinite",
            }}
          />
        </div>

        {/* Label */}
        <span
          className="text-[9.5px] font-extrabold tracking-[0.18em] max-sm:text-[9px] max-sm:tracking-[0.14em]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
          }}
        >
          GOALS
        </span>

        {/* Stage */}
        <div className="flex-1 relative overflow-hidden h-[22px]">
          {leaving && (
            <div
              className="absolute inset-0 flex items-center gap-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                animation:
                  "ticker-leave 0.45s cubic-bezier(0.55, 0, 0.55, 1) forwards",
              }}
            >
              <span
                className="w-[18px] text-center"
                style={{ color: statusColor(leaving.status) }}
              >
                {statusGlyph(leaving.status)}
              </span>
              <span className="flex-1 overflow-hidden text-ellipsis">
                {leaving.text}
              </span>
            </div>
          )}
          {current && (
            <div
              className="absolute inset-0 flex items-center gap-2 max-sm:text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                animation: isFirstRender.current
                  ? "none"
                  : "ticker-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              }}
            >
              <span
                className="w-[18px] text-center"
                style={{ color: statusColor(current.status) }}
              >
                {statusGlyph(current.status)}
              </span>
              <span className="flex-1 overflow-hidden text-ellipsis">
                {current.text}
              </span>
            </div>
          )}
        </div>

        {/* Meta pill */}
        <div
          className="py-[3px] px-2 rounded-full text-[11px] font-bold max-sm:text-[10px] max-sm:py-[2px] max-sm:px-[7px]"
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-secondary)",
            background: "rgba(255,255,255,0.04)",
            letterSpacing: "0.04em",
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}
