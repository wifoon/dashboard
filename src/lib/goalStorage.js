const syncedKeyPrefixes = ["goals:"];
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
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(prefix)) keys.push(k);
  }
  return keys.sort();
}

// 6 AM is the day boundary
export function getActiveDateString() {
  const now = new Date();
  if (now.getHours() < 6) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().slice(0, 10);
}

export function getTomorrowDateString() {
  const now = new Date();
  if (now.getHours() < 6) {
    return new Date().toISOString().slice(0, 10);
  }
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  return tmr.toISOString().slice(0, 10);
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
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

  for (const key of keys) {
    const dateStr = key.replace("goals:", "");
    if (dateStr >= activeDate) continue;
    const old = storeGet(key) || [];
    const undone = old.filter((g) => !g.done);
    for (const g of undone) {
      if (!todayTexts.has(g.text)) {
        todayGoals.push({ text: g.text, done: false });
        todayTexts.add(g.text);
      }
    }
    storeDelete(key);
  }
  setTodayGoals(todayGoals);
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
  const streak = getStreak();
  const keys = storeListKeys("goals:")
    .map((k) => k.replace("goals:", ""))
    .filter((d) => d < activeDate)
    .sort();

  let { count, lastProcessedDate } = streak;
  const startIdx = lastProcessedDate ? keys.indexOf(lastProcessedDate) + 1 : 0;

  for (let i = startIdx < 0 ? 0 : startIdx; i < keys.length; i++) {
    const goals = storeGet(`goals:${keys[i]}`) || [];
    if (goals.length === 0) continue;
    if (goals.every((g) => g.done)) {
      count++;
    } else {
      count = 0;
    }
    lastProcessedDate = keys[i];
  }

  storeSet("goal_streak_v1", { count, lastProcessedDate });
  return count;
}
