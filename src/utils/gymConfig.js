export const CONFIG = {
  appTitle: "Progressive Overload",
  units: "kg",
  days: [
    { id: "push", name: "Push" },
    { id: "pull", name: "Pull" },
    { id: "legs", name: "Legs" },
  ],
  upgradeAtReps: 8,
  defaultExercises: [
    {
      name: "Bench press",
      day: "push",
      repMin: 5,
      repMax: 8,
      step: 2.5,
      startWeight: 60,
      bw: false,
    },
    {
      name: "Overhead press",
      day: "push",
      repMin: 5,
      repMax: 8,
      step: 2.5,
      startWeight: 35,
      bw: false,
    },
    {
      name: "Tricep pushdown",
      day: "push",
      repMin: 8,
      repMax: 12,
      step: 2.5,
      startWeight: 25,
      bw: false,
    },
    {
      name: "Pull-ups",
      day: "pull",
      repMin: 5,
      repMax: 10,
      step: 1,
      startWeight: 0,
      bw: true,
    },
    {
      name: "Barbell row",
      day: "pull",
      repMin: 6,
      repMax: 10,
      step: 2.5,
      startWeight: 50,
      bw: false,
    },
    {
      name: "Bicep curl",
      day: "pull",
      repMin: 8,
      repMax: 12,
      step: 1.25,
      startWeight: 15,
      bw: false,
    },
    {
      name: "Back squat",
      day: "legs",
      repMin: 5,
      repMax: 8,
      step: 5,
      startWeight: 80,
      bw: false,
    },
    {
      name: "Romanian deadlift",
      day: "legs",
      repMin: 6,
      repMax: 10,
      step: 5,
      startWeight: 60,
      bw: false,
    },
  ],
};

export const LS_KEY = "po_coach_v1";
export const WT_KEY = "po_coach_weights";
export const PHOTO_KEY = "po_coach_photos";

export function uid() {
  return "ex_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

export const estimate1RM = (w, r) => (r < 2 ? w : w * (1 + r / 30));
