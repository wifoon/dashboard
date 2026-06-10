import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { uid } from "@/utils/gymConfig";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "@/lib/api";

export default function SettingsModal({ open, setOpen, state }) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(state.days);
  const [units, setUnits] = useState(state.units);

  const updateSettingsMutation = useMutation({
    mutationFn: gymApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymState"] });
      setOpen(false);
    },
  });

  useEffect(() => {
    if (open) {
      setDays(state.days);
      setUnits(state.units);
    }
  }, [open, state]);

  const handleSave = () => {
    updateSettingsMutation.mutate({ days, units });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-sm rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Ustawienia</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-3">
              Jednostki
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              {["kg", "lbs"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm ${units === u ? "bg-white text-black" : "text-white/50 hover:bg-white/5"}`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-3">
              Dni Treningowe
            </div>
            <div className="space-y-2">
              {days.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => {
                      const n = [...days];
                      n[i].name = e.target.value;
                      setDays(n);
                    }}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => {
                      if (days.length > 1)
                        setDays(days.filter((_, idx) => idx !== i));
                    }}
                    className="w-10 flex items-center justify-center bg-white/5 hover:bg-[#f87171]/20 text-white/40 hover:text-[#f87171] rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setDays([...days, { id: uid(), name: "New Day" }])
                }
                className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-sm text-white/50 font-medium hover:bg-white/5 transition-colors"
              >
                + Dodaj Dzień
              </button>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="w-full h-12 bg-white text-black font-bold rounded-xl"
          >
            {updateSettingsMutation.isPending ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
