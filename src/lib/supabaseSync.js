import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_KEY = "dashboard_state"; // Główny klucz dla Twojej aplikacji

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Prefiksy kluczy z localStorage, które chcemy synchronizować z chmurą
const SYNCED_PREFIXES = [
  "goals:",
  "goal_streak",
  "stack:",
  "po_coach",
  "po_water",
];

let pushTimer = null;
let suppressSync = false;
let pendingRemote = null;
let lastSyncedJson = null;

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

// Przechwytywanie zapisów do localStorage
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
    // Aplikowanie nowych danych
    for (const k of Object.keys(remote)) {
      const incoming = JSON.stringify(remote[k]);
      const local = localStorage.getItem(k);
      if (local !== incoming) {
        origSet(k, incoming);
        changed = true;
      }
    }
    // Usuwanie kluczy, których nie ma w chmurze
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (isSyncedKey(k) && !(k in remote)) {
        origRemove(k);
        changed = true;
      }
    }
  } finally {
    suppressSync = false;
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent("storage-synced")); // Sygnał dla Reacta do re-renderu
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
  const state = collectState();
  const json = JSON.stringify(state);
  if (json === lastSyncedJson) return;

  try {
    const { error } = await supabase
      .from("app_state")
      .upsert(
        { key: APP_KEY, data: state, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );

    if (!error) lastSyncedJson = json;
  } catch (e) {
    console.error("Błąd zapisu Supabase:", e);
  }
}

function schedulePush() {
  if (suppressSync) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 250);
}

function flushPushOnUnload() {
  const state = collectState();
  const json = JSON.stringify(state);
  if (json === lastSyncedJson) return;

  try {
    fetch(`${SUPABASE_URL}/rest/v1/app_state?on_conflict=key`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        key: APP_KEY,
        data: state,
        updated_at: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
    lastSyncedJson = json;
  } catch (e) {}
}

// Inicjalizacja
export async function initSupabaseSync() {
  const { data } = await supabase
    .from("app_state")
    .select("data")
    .eq("key", APP_KEY)
    .maybeSingle();

  if (data && data.data && Object.keys(data.data).length > 0) {
    lastSyncedJson = JSON.stringify(data.data);
    maybeApplyRemote(data.data);
  } else if (Object.keys(collectState()).length > 0) {
    schedulePush(); // Wysłanie lokalnych danych, jeśli chmura jest pusta
  }

  // Nasłuchiwanie na zmiany w czasie rzeczywistym
  supabase
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

// Event Listeners
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

window.addEventListener("pagehide", flushPushOnUnload);
window.addEventListener("beforeunload", flushPushOnUnload);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushPushOnUnload();
});
