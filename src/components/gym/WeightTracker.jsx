import React, { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function WeightTracker({
  wtEntries,
  setWtEntries,
  todayKey,
  units,
}) {
  const [dailyInput, setDailyInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const todayEntry = wtEntries.find((e) => e.dateKey === todayKey);
  const lastEntry = wtEntries[wtEntries.length - 1];

  const handleSaveWeight = () => {
    const w = parseFloat(dailyInput);
    if (isNaN(w) || w <= 0) return;
    const newArr = [...wtEntries];
    const existingIdx = newArr.findIndex((e) => e.dateKey === todayKey);
    if (existingIdx >= 0) newArr[existingIdx].weight = w;
    else {
      newArr.push({ dateKey: todayKey, weight: w });
      newArr.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }
    setWtEntries(newArr);
    setIsEditing(false);
  };

  const chartData = useMemo(() => {
    if (wtEntries.length === 0) return [];
    const data = [];
    let lastKnown = wtEntries[0].weight;

    for (let i = 29; i >= 0; i--) {
      const targetDate = startOfDay(subDays(new Date(), i));
      const entry = wtEntries.find((e) =>
        isSameDay(parseISO(e.dateKey), targetDate),
      );
      if (entry) lastKnown = entry.weight;
      data.push({
        date: format(targetDate, "d MMM", { locale: pl }),
        weight: lastKnown,
      });
    }
    return data;
  }, [wtEntries]);

  const yMin = chartData.length
    ? Math.floor(Math.min(...chartData.map((d) => d.weight)) - 2)
    : 0;
  const yMax = chartData.length
    ? Math.ceil(Math.max(...chartData.map((d) => d.weight)) + 2)
    : 100;

  return (
    <div
      className="rounded-3xl p-6 flex flex-col"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(1.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-[#6ee7b7]" />
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50">
          Body Weight
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-bold tracking-tight text-white">
          {lastEntry ? lastEntry.weight.toFixed(1) : "—"}
        </span>
        <span className="text-lg text-white/40 font-medium">{units}</span>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[140px] w-full mb-6">
          <ChartContainer
            config={{ weight: { color: "#6ee7b7" } }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis dataKey="date" hide />
                <YAxis domain={[yMin, yMax]} hide />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#6ee7b7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fillWeight)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-2xl mb-6">
          Zaloguj wagę, aby zobaczyć postępy
        </div>
      )}

      {todayEntry && !isEditing ? (
        <div className="flex items-center justify-between bg-[#6ee7b7]/10 border border-[#6ee7b7]/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#6ee7b7]/80 font-bold mb-0.5">
                DZISIAJ ZAPISANO
              </div>
              <div className="text-base font-semibold text-white">
                {todayEntry.weight.toFixed(1)} {units}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setDailyInput(todayEntry.weight.toString());
              setIsEditing(true);
            }}
            className="text-[#6ee7b7] font-semibold px-3 py-2 hover:bg-[#6ee7b7]/10 rounded-xl transition-colors"
          >
            Edytuj
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative justify-between bg-black/40 border border-white/10 rounded-2xl h-[60px] p-1.5 shadow-inner flex items-center">
            <button
              onClick={() =>
                setDailyInput(
                  Math.max(0, (parseFloat(dailyInput) || 0) - 0.1).toFixed(1),
                )
              }
              className="w-12 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xl font-bold transition-all active:scale-95"
            >
              −
            </button>
            <input
              type="number"
              step="0.1"
              value={dailyInput}
              onChange={(e) => setDailyInput(e.target.value)}
              className="w-full bg-transparent text-center text-lg font-bold text-white outline-none"
              placeholder={lastEntry ? lastEntry.weight.toFixed(1) : "0.0"}
              style={{ appearance: "none", MozAppearance: "textfield" }}
            />
            <button
              onClick={() =>
                setDailyInput(
                  (
                    (parseFloat(dailyInput) ||
                      (lastEntry ? lastEntry.weight : 70)) + 0.1
                  ).toFixed(1),
                )
              }
              className="w-12 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xl font-bold transition-all active:scale-95"
            >
              +
            </button>
          </div>
          <button
            onClick={handleSaveWeight}
            className="rounded-2xl h-[60px] px-6 font-bold transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] flex items-center justify-center text-[13px] active:scale-95"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
              color: "#0A0A0B",
            }}
          >
            Zapisz
          </button>
        </div>
      )}
    </div>
  );
}
