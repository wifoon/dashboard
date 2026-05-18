import { storeGet, storeSet, storeDelete, isSyncedKey } from "./goalStorage";

const STORE_ENDPOINT = "/.netlify/functions/store";
const POLL_INTERVAL_MS = 5000;
const PUSH_DEBOUNCE_MS = 300;

let pendingRemote = null;
let pushTimer = null;
let lastPushedJson = null;
let initialSyncCompleted = false;
let activeEditableCount = 0;

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const isEditable = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.matches("input,textarea,[contenteditable=true]") ||
    target.isContentEditable
  );
};

const getSyncedLocalState = () => {
  const state = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!isSyncedKey(key)) continue;
    const value = storeGet(key);
    if (value !== null) {
      state[key] = value;
    }
  }
  return state;
};

const getStateJson = (state) => stableStringify(state);

const hasPendingLocalData = () => Object.keys(getSyncedLocalState()).length > 0;

const notifySyncChange = () => {
  window.dispatchEvent(new CustomEvent("synced-state-changed"));
};

const pushLocalState = async (force = false) => {
  const state = getSyncedLocalState();
  const json = getStateJson(state);
  if (!force && json === lastPushedJson) return;
  try {
    const res = await fetch(STORE_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      throw new Error(`Push failed: ${res.status}`);
    }
    lastPushedJson = json;
  } catch (error) {
    console.warn("Cloud sync push failed", error);
  }
};

const schedulePush = () => {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushLocalState(), PUSH_DEBOUNCE_MS);
};

const applyRemoteState = (remoteState) => {
  const localState = getSyncedLocalState();
  const remoteKeys = new Set(Object.keys(remoteState));
  let changed = false;

  for (const key of Object.keys(remoteState)) {
    const remoteValue = remoteState[key];
    const localValue = localState[key];
    if (getStateJson(localValue) !== getStateJson(remoteValue)) {
      storeSet(key, remoteValue);
      changed = true;
    }
  }

  for (const localKey of Object.keys(localState)) {
    if (!remoteKeys.has(localKey)) {
      storeDelete(localKey);
      changed = true;
    }
  }

  if (changed) {
    notifySyncChange();
  }
  return changed;
};

const fetchRemoteState = async () => {
  try {
    const res = await fetch(STORE_ENDPOINT, { method: "GET" });
    if (!res.ok) {
      console.warn("Cloud sync fetch failed", res.status);
      return null;
    }
    const data = await res.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {};
    }
    return data;
  } catch (error) {
    console.warn("Cloud sync fetch error", error);
    return null;
  }
};

const applyOrQueueRemoteState = (remoteState) => {
  if (activeEditableCount > 0) {
    pendingRemote = remoteState;
    return;
  }
  pendingRemote = null;
  applyRemoteState(remoteState);
};

const performInitialSync = async () => {
  const remoteState = await fetchRemoteState();
  if (remoteState === null) {
    initialSyncCompleted = true;
    return;
  }

  const remoteIsEmpty = Object.keys(remoteState).length === 0;
  const localHasData = hasPendingLocalData();

  if (remoteIsEmpty && localHasData) {
    await pushLocalState(true);
  } else if (!remoteIsEmpty) {
    applyRemoteState(remoteState);
    lastPushedJson = getStateJson(getSyncedLocalState());
  }

  initialSyncCompleted = true;
};

const pollRemote = async () => {
  if (!initialSyncCompleted) return;
  const remoteState = await fetchRemoteState();
  if (remoteState === null) return;
  if (activeEditableCount > 0) {
    pendingRemote = remoteState;
    return;
  }
  applyRemoteState(remoteState);
};

window.addEventListener("synced-storage-changed", schedulePush);
window.addEventListener("storage", (event) => {
  if (!event.key || !isSyncedKey(event.key)) return;
  if (activeEditableCount > 0) {
    return;
  }
  pollRemote();
});

window.addEventListener("focusin", (event) => {
  if (isEditable(event.target)) {
    activeEditableCount += 1;
  }
});

window.addEventListener("focusout", () => {
  activeEditableCount = Math.max(0, activeEditableCount - 1);
  if (activeEditableCount === 0 && pendingRemote) {
    applyRemoteState(pendingRemote);
    pendingRemote = null;
  }
});

window.addEventListener("focus", () => {
  if (activeEditableCount === 0) {
    pollRemote();
  }
});

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && activeEditableCount === 0) {
    pollRemote();
  }
});

setInterval(pollRemote, POLL_INTERVAL_MS);
performInitialSync();
