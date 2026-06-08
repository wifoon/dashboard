import { useState, useEffect } from "react";

const WAKE_HOUR = 8;
const SLEEP_HOUR = 24;
const CIRCUMFERENCE = 2 * Math.PI * 52;

const PALETTE = [
  [255, 216, 158],
  [255, 205, 121],
  [255, 227, 143],
  [255, 183, 106],
  [255, 149, 89],
  [243, 111, 79],
  [226, 93, 122],
  [123, 91, 176],
  [47, 58, 102],
];

function lerpColor(percent) {
  const p = Math.max(0, Math.min(100, percent));
  const idx = (p / 100) * (PALETTE.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, PALETTE.length - 1);
  const t = idx - lo;
  return `rgb(${PALETTE[lo].map((c, i) => Math.round(c + (PALETTE[hi][i] - c) * t)).join(",")})`;
}

function formatClock(now) {
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getPhaseAndStatus(percent) {
  if (percent < 25)
    return { phase: "MORNING", status: "☀️ Morning — fresh start" };
  if (percent < 50)
    return { phase: "MIDDAY", status: "⚡ Midday — keep moving" };
  if (percent < 75)
    return { phase: "AFTERNOON", status: "🔥 Afternoon — push it" };
  return { phase: "EVENING", status: "⏳ Evening — wrap up" };
}

export default function DayRing() {
  const [state, setState] = useState(() => compute());

  function compute() {
    const now = new Date();
    const hours =
      now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

    if (hours < WAKE_HOUR) {
      const minsLeft = Math.round((WAKE_HOUR - hours) * 60);
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      return {
        percent: 0,
        strokeColor: "#4D4B47",
        percentText: "—",
        phase: "SLEEPING",
        status: "😴 Still sleeping",
        remaining: `${h}h ${m}m until wake-up`,
        clock: formatClock(now),
      };
    }

    if (hours >= SLEEP_HOUR) {
      return {
        percent: 100,
        strokeColor: "#E25D7A",
        percentText: "100%",
        phase: "LATE NIGHT",
        status: "⚠️ Late night",
        remaining: "Sleep!",
        clock: formatClock(now),
      };
    }

    const percent = ((hours - WAKE_HOUR) / (SLEEP_HOUR - WAKE_HOUR)) * 100;
    const minsLeft = Math.round((SLEEP_HOUR - hours) * 60);
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    const { phase, status } = getPhaseAndStatus(percent);

    return {
      percent,
      strokeColor: lerpColor(percent),
      percentText: `${Math.round(percent)}%`,
      phase,
      status,
      remaining: `${h}h ${m}m awake time left`,
      clock: formatClock(now),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => setState(compute()), 60000);
    return () => clearInterval(interval);
  }, []);

  const offset = CIRCUMFERENCE * (1 - state.percent / 100);

  return (
    <div className="flex items-center justify-center gap-[26px] flex-wrap mb-8">
      {/* Ring */}
      <div className="relative w-[168px] h-[168px] max-sm:w-[144px] max-sm:h-[144px] shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={state.strokeColor}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            filter="url(#glow)"
            style={{
              transition:
                "stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-[40px] font-extrabold max-sm:text-[32px]"
            style={{
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
            }}
          >
            {state.percentText}
          </span>
          <span
            className="text-[9.5px] font-extrabold uppercase mt-[-5px]"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              color: "var(--text-tertiary)",
            }}
          >
            {state.phase}
          </span>
          <span
            className="text-[10.5px] mt-1"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            {state.clock}
          </span>
        </div>
      </div>

      {/* Right info */}
      <div className="flex flex-col gap-1.5" style={{ maxWidth: 280 }}>
        <span
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {state.status}
        </span>
        <span
          className="text-xs"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
          }}
        >
          {state.remaining}
        </span>
        <span
          className="text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
          }}
        >
          8:00 AM – 12:00 AM
        </span>
      </div>
    </div>
  );
}
