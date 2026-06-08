import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { uid } from "@/utils/gymConfig";

export default function ExerciseDialog({
  state,
  setState,
  mode,
  exToEdit,
  onClose,
}) {
  const [formData, setFormData] = useState({
    name: "",
    day: "push",
    bw: false,
    startWeight: 20,
    repMin: 6,
    repMax: 8,
    step: 2.5,
  });

  useEffect(() => {
    if (mode === "edit" && exToEdit) setFormData({ ...exToEdit });
    else if (mode === "add")
      setFormData((p) => ({ ...p, day: state.filterDay, name: "", bw: false }));
  }, [mode, exToEdit, state.filterDay]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    const newEx = {
      ...formData,
      id: mode === "edit" ? exToEdit.id : uid(),
      name: formData.name.trim(),
    };
    setState((prev) => {
      const nextExs =
        mode === "edit"
          ? prev.exercises.map((e) => (e.id === exToEdit.id ? newEx : e))
          : [...prev.exercises, newEx];
      return {
        ...prev,
        exercises: nextExs,
        currentEx: newEx.id,
        filterDay: newEx.day,
      };
    });
    onClose();
  };

  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-sm rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Exercise" : "Edit Exercise"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
            placeholder="Exercise Name"
          />
          <div className="flex gap-2 bg-black/40 p-1 border border-white/10 rounded-xl">
            {state.days.map((d) => (
              <button
                key={d.id}
                onClick={() => setFormData({ ...formData, day: d.id })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg ${formData.day === d.id ? "bg-white text-black" : "text-white/50"}`}
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
              Bodyweight (reps only)
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-12 bg-white/5 rounded-xl text-sm font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-12 bg-white text-black rounded-xl text-sm font-bold"
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
