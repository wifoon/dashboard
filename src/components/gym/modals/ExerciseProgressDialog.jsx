import React, { useMemo } from "react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { LineChart as ChartIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { estimate1RM } from "@/utils/gymConfig";

export default function ExerciseProgressDialog({
  open,
  setOpen,
  ex,
  logs,
  units,
}) {
  const data = useMemo(() => {
    if (!logs || logs.length < 2) return [];
    return logs.map((l, i) => ({
      index: i + 1,
      date: format(parseISO(l.date), "MMM dd"),
      value: ex.bw ? l.reps : estimate1RM(l.weight, l.reps),
    }));
  }, [logs, ex]);

  if (!ex) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-[#6ee7b7]" /> {ex.name} Progress
          </DialogTitle>
        </DialogHeader>
        {data.length >= 2 ? (
          <div className="h-[250px] w-full mt-4">
            <ChartContainer
              config={{ value: { color: "#6ee7b7" } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickFormatter={(val) => Math.round(val)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={ex.bw ? "Max Reps" : `Est. 1RM (${units})`}
                    stroke="#6ee7b7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#111113", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-white/40 text-sm bg-white/5 rounded-2xl">
            Log at least 2 sets to see progress.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
