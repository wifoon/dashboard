import { storeGet, storeSet } from "./goalStorage";

const CAL_KEY = "cal:data_v1";

const defaultCalData = {
  events: [],
  tags: [
    { id: "t1", name: "Ważne", color: "#ef4444" },
    { id: "t2", name: "Garaż / Projekty", color: "#f59e0b" },
    { id: "t3", name: "Trening bouldering", color: "#3b82f6" },
  ],
};

export function getCalData() {
  return storeGet(CAL_KEY) || defaultCalData;
}

export function saveCalData(data) {
  storeSet(CAL_KEY, data);
  window.dispatchEvent(new CustomEvent("calendar-changed"));
}
