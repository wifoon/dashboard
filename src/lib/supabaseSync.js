import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_KEY = "dashboard_state";

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const SYNCED_PREFIXES = [
  "goals:",
  "goal_streak",
  "stack:",
  "po_coach",
  "cal:",
  "habits:",
];

let pushTimer = null;
let suppressSync = false;
let pendingRemote = null;
let lastSyncedJson = null;
let currentUserId = null;
let realTimeChannel = null;

function isSyncedKey(key) {
  return SYNCED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function collectState() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (isSyncedKey(k)) {
      try {
        out[k] = JSON.parse(localStorage.getItem(k));
      } catch {}
    }
  }
  return out;
}

function isUserEditing() {
  const ae = document.activeElement;
  if (!ae) return false;
  const tag = ae.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (ae.getAttribute && ae.getAttribute("contenteditable") === "true")
    return true;
  return false;
}

const origSet = localStorage.setItem.bind(localStorage);
const origRemove = localStorage.removeItem.bind(localStorage);

localStorage.setItem = function (k, v) {
  origSet(k, v);
  if (!suppressSync && isSyncedKey(k)) schedulePush();
};

localStorage.removeItem = function (k) {
  origRemove(k);
  if (!suppressSync && isSyncedKey(k)) schedulePush();
};

function applyRemoteState(remote) {
  if (!remote || typeof remote !== "object") return false;
  suppressSync = true;
  let changed = false;

  try {
    for (const k of Object.keys(remote)) {
      const incoming = JSON.stringify(remote[k]);
      const local = localStorage.getItem(k);
      if (local !== incoming) {
        origSet(k, incoming);
        changed = true;
      }
    }

    // Zabezpieczona pętla usuwająca osierocone klucze
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (isSyncedKey(k) && !(k in remote)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      origRemove(k);
      changed = true;
    }
  } finally {
    suppressSync = false;
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent("storage-synced"));
  }
}

function maybeApplyRemote(remote) {
  if (isUserEditing()) {
    pendingRemote = remote;
  } else {
    applyRemoteState(remote);
  }
}

async function pushNow() {
  if (!supabase || !currentUserId) return;
  const state = collectState();
  const json = JSON.stringify(state);
  if (json === lastSyncedJson) return;

  try {
    const { error } = await supabase.from("app_state").upsert(
      {
        user_id: currentUserId,
        key: APP_KEY,
        data: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, key" },
    );

    if (!error) lastSyncedJson = json;
  } catch (e) {
    console.error("Błąd zapisu Supabase:", e);
  }
}

function schedulePush() {
  if (suppressSync || !currentUserId) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 50); // Skrócono czas zapisu
}

export async function startSync(userId) {
  if (!supabase) return;
  currentUserId = userId;

  const { data } = await supabase
    .from("app_state")
    .select("data")
    .eq("key", APP_KEY)
    .eq("user_id", userId)
    .maybeSingle();

  if (data && data.data && Object.keys(data.data).length > 0) {
    // Łączenie danych lokalnych (offline) z danymi z chmury zamiast bezwzględnego usuwania
    const localState = collectState();
    let needsPush = false;
    for (const k in localState) {
      if (!(k in data.data)) {
        data.data[k] = localState[k];
        needsPush = true;
      }
    }
    lastSyncedJson = JSON.stringify(data.data);
    maybeApplyRemote(data.data);
    if (needsPush) schedulePush();
  } else if (Object.keys(collectState()).length > 0) {
    schedulePush();
  }

  realTimeChannel = supabase
    .channel("app_state_updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_state",
        filter: `key=eq.${APP_KEY}`,
      },
      (payload) => {
        if (!payload.new || !payload.new.data) return;
        const incoming = JSON.stringify(payload.new.data);
        if (incoming === lastSyncedJson) return;
        lastSyncedJson = incoming;
        maybeApplyRemote(payload.new.data);
      },
    )
    .subscribe();
}

export function stopSync() {
  if (realTimeChannel) {
    supabase.removeChannel(realTimeChannel);
    realTimeChannel = null;
  }
  currentUserId = null;
}

document.addEventListener(
  "focusout",
  () => {
    setTimeout(() => {
      if (pendingRemote && !isUserEditing()) {
        applyRemoteState(pendingRemote);
        pendingRemote = null;
      }
    }, 0);
  },
  true,
);
