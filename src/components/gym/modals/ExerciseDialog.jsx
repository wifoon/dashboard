import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "@/lib/api";

export default function ExerciseDialog({
  state,
  setState,
  mode,
  exToEdit,
  onClose,
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    day_id: "",
    bw: false,
    start_weight: 20,
    rep_min: 6,
    rep_max: 8,
    step: 2.5,
  });

  const createMutation = useMutation({
    mutationFn: gymApi.createExercise,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gymState"] });
      setState({ ...state, currentEx: data.id, filterDay: data.day_id });
      onClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: gymApi.updateExercise,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gymState"] });
      setState({ ...state, currentEx: data.id, filterDay: data.day_id });
      onClose();
    },
  });

  useEffect(() => {
    if (mode === "edit" && exToEdit) {
      setFormData({
        name: exToEdit.name,
        day_id: exToEdit.day_id,
        bw: exToEdit.bw,
        start_weight: exToEdit.start_weight,
        rep_min: exToEdit.rep_min,
        rep_max: exToEdit.rep_max,
        step: exToEdit.step,
      });
    } else if (mode === "add") {
      setFormData((p) => ({
        ...p,
        day_id: state.filterDay,
        name: "",
        bw: false,
      }));
    }
  }, [mode, exToEdit, state.filterDay]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (mode === "edit") {
      updateMutation.mutate({
        id: exToEdit.id,
        updates: { ...formData, name: formData.name.trim() },
      });
    } else {
      createMutation.mutate({ ...formData, name: formData.name.trim() });
    }
  };

  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-sm rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Dodaj ćwiczenie" : "Edytuj ćwiczenie"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
            placeholder="Nazwa ćwiczenia"
          />
          <div className="flex gap-2 bg-black/40 p-1 border border-white/10 rounded-xl">
            {state.days.map((d) => (
              <button
                key={d.id}
                onClick={() => setFormData({ ...formData, day_id: d.id })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg ${formData.day_id === d.id ? "bg-white text-black" : "text-white/50"}`}
              >
                {d.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.bw}
              onChange={(e) =>
                setFormData({ ...formData, bw: e.target.checked })
              }
              className="w-4 h-4 accent-[#6ee7b7]"
            />
            <span className="text-sm font-medium text-white/80">
              Ciężar ciała (tylko powtórzenia)
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-12 bg-white/5 rounded-xl text-sm font-bold"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-12 bg-white text-black rounded-xl text-sm font-bold"
            >
              Zapisz
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
