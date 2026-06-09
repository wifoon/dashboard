const syncedKeyPrefixes = ["goals:", "stack:", "po_coach", "cal:", "habits:"];
const syncedExactKeys = ["goal_streak_v1"];

function isSynced(key) {
  return (
    typeof key === "string" &&
    (syncedKeyPrefixes.some((prefix) => key.startsWith(prefix)) ||
      syncedExactKeys.includes(key))
  );
}

// localStorage helpers for goals
export function storeGet(key) {
  const v = localStorage.getItem(key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function storeSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key.startsWith("goals:")) {
    window.dispatchEvent(new CustomEvent("goals-changed"));
  }
  if (isSynced(key)) {
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", { detail: { key } }),
    );
  }
}

export function storeDelete(key) {
  localStorage.removeItem(key);
  if (key.startsWith("goals:")) {
    window.dispatchEvent(new CustomEvent("goals-changed"));
  }
  if (isSynced(key)) {
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", { detail: { key } }),
    );
  }
}

export function storeListKeys(prefix) {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(prefix))
    .sort();
}

// 6 AM is the day boundary
export function getActiveDateString() {
  const now = new Date();
  if (now.getHours() < 6) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTomorrowDateString() {
  const now = new Date();
  if (now.getHours() >= 6) {
    now.setDate(now.getDate() + 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Niedz.", "Pon.", "Wt.", "Śr.", "Czw.", "Pt.", "Sob."];
  const months = [
    "Sty",
    "Lut",
    "Mar",
    "Kwi",
    "Maj",
    "Cze",
    "Lip",
    "Sie",
    "Wrz",
    "Paź",
    "Lis",
    "Gru",
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export function getTodayGoals() {
  return storeGet(`goals:${getActiveDateString()}`) || [];
}

export function setTodayGoals(goals) {
  storeSet(`goals:${getActiveDateString()}`, goals);
}

export function getTomorrowGoals() {
  return storeGet(`goals:${getTomorrowDateString()}`) || [];
}

export function setTomorrowGoals(goals) {
  storeSet(`goals:${getTomorrowDateString()}`, goals);
}

// Rollover old undone goals to today
export function runRollover() {
  const activeDate = getActiveDateString();
  const keys = storeListKeys("goals:");
  const todayGoals = getTodayGoals();
  const todayTexts = new Set(todayGoals.map((g) => g.text));
  let hasChanges = false;

  for (const key of keys) {
    const dateStr = key.replace("goals:", "");
    if (dateStr >= activeDate) continue;

    const old = storeGet(key) || [];
    const undone = old.filter((g) => !g.done);
    for (const g of undone) {
      if (!todayTexts.has(g.text)) {
        todayGoals.push({ ...g, done: false, isRollover: true });
        todayTexts.add(g.text);
        hasChanges = true;
      }
    }
    localStorage.removeItem(key);
    hasChanges = true;
  }

  if (hasChanges) {
    localStorage.setItem(`goals:${activeDate}`, JSON.stringify(todayGoals));
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", {
        detail: { key: `goals:${activeDate}` },
      }),
    );
  }
}

// Streak calculation
export function getStreak() {
  return storeGet("goal_streak_v1") || { count: 0, lastProcessedDate: null };
}

export function isSyncedKey(key) {
  return isSynced(key);
}

export function runStreakCheck() {
  const activeDate = getActiveDateString();
  const streak = storeGet("goal_streak_v1") || {
    count: 0,
    lastProcessedDate: null,
  };
  const keys = storeListKeys("goals:")
    .map((k) => k.replace("goals:", ""))
    .filter((d) => d < activeDate)
    .sort();

  let { count, lastProcessedDate } = streak;
  const startIdx = lastProcessedDate ? keys.indexOf(lastProcessedDate) + 1 : 0;
  let hasChanges = false;

  for (let i = startIdx < 0 ? 0 : startIdx; i < keys.length; i++) {
    const goals = storeGet(`goals:${keys[i]}`) || [];
    if (goals.length === 0) continue;
    if (goals.every((g) => g.done)) {
      count++;
    } else {
      count = 0;
    }
    lastProcessedDate = keys[i];
    hasChanges = true;
  }

  if (hasChanges) {
    // Cichy zapis
    localStorage.setItem(
      "goal_streak_v1",
      JSON.stringify({ count, lastProcessedDate }),
    );
    window.dispatchEvent(
      new CustomEvent("synced-storage-changed", {
        detail: { key: "goal_streak_v1" },
      }),
    );
  }
  return count;
}
