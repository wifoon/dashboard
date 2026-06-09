import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_KEY = "dashboard_state";

// 1. Zablokowanie agresywnego Cache'owania przez Safari na iOS
export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          // DODANE: Wymuszenie na poziomie przeglądarki braku pamięci podręcznej dla iOS
          fetch: (url, options) => {
            return fetch(url, { ...options, cache: "no-store" });
          },
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      })
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
let isPushing = false;
let pushPending = false;

function isSyncedKey(key) {
  if (key === "po_coach_photos") return false;

  return SYNCED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function collectState() {
  const out = {};
  // Zmiana: Object.keys jest w 100% bezpieczne w iOS Safari, w przeciwieństwie do pętli po .length
  Object.keys(localStorage).forEach((k) => {
    if (isSyncedKey(k)) {
      try {
        out[k] = JSON.parse(localStorage.getItem(k));
      } catch {}
    }
  });
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

// 2. NOWY SYSTEM WYZWALANIA ZAPISU - Odporny na blokady iOS
// Omijamy nadpisywanie localStorage i reagujemy wyłącznie na wyzwalacze z wnętrza aplikacji.
const triggerSync = () => {
  if (suppressSync) return;
  localStorage.setItem("sync_dirty", "true"); // Solidne oznaczenie: "Mam tu dane do wysłania!"
  schedulePush();
};

// Nasłuchiwanie na konkretne akcje użytkownika w zakładkach
window.addEventListener("goals-changed", triggerSync);
window.addEventListener("calendar-changed", triggerSync);
window.addEventListener("notes-changed", triggerSync);
window.addEventListener("synced-storage-changed", triggerSync);

// Reagowanie na ewentualne modyfikacje lokalne między kartami
window.addEventListener("storage", (e) => {
  if (e.key && isSyncedKey(e.key) && !suppressSync) {
    triggerSync();
  }
});

function applyRemoteState(remote) {
  if (!remote || typeof remote !== "object") return false;
  suppressSync = true;
  let changed = false;

  try {
    for (const k of Object.keys(remote)) {
      const incoming = JSON.stringify(remote[k]);
      const local = localStorage.getItem(k);
      if (local !== incoming) {
        localStorage.setItem(k, incoming);
        changed = true;
      }
    }

    const keysToRemove = [];
    // Zmiana: Bezpieczna iteracja po usunięte klucze
    Object.keys(localStorage).forEach((k) => {
      if (isSyncedKey(k) && !(k in remote)) {
        keysToRemove.push(k);
      }
    });

    for (const k of keysToRemove) {
      localStorage.removeItem(k);
      changed = true;
    }
  } catch (e) {
    console.error("Error applying remote state", e);
  } finally {
    suppressSync = false;
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent("storage-synced"));
  }
}

function maybeApplyRemote(remote) {
  // Żelazna zasada: Jeśli urządzenie ma NIEZAPISANE zmiany, odrzuca próby nadpisania z serwera
  if (localStorage.getItem("sync_dirty") === "true") return;

  if (isUserEditing()) {
    pendingRemote = remote;
  } else {
    applyRemoteState(remote);
  }
}

async function pushNow() {
  if (!supabase || !currentUserId) return;

  // Kolejkowanie zapobiega blokowaniu połączenia przy szybkim klikaniu
  if (isPushing) {
    pushPending = true;
    return;
  }

  isPushing = true;
  pushPending = false;

  const state = collectState();
  const json = JSON.stringify(state);

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

    if (!error) {
      lastSyncedJson = json;
      localStorage.setItem("sync_dirty", "false"); // Zapis ukończony
    } else {
      console.error("Błąd zapisu Supabase:", error);
    }
  } catch (e) {
    console.error("Błąd zapisu Supabase:", e);
  }

  isPushing = false;
  if (pushPending) schedulePush();
}

function schedulePush() {
  if (suppressSync || !currentUserId) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 300);
}

export async function startSync(userId) {
  if (!supabase) return;
  currentUserId = userId;

  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("data")
      .eq("key", APP_KEY)
      .eq("user_id", userId)
      .maybeSingle();

    const isDirty = localStorage.getItem("sync_dirty") === "true";

    if (data && data.data && Object.keys(data.data).length > 0) {
      if (isDirty) {
        // Połączenie najnowszych danych lokalnych z danymi z serwera
        const localState = collectState();
        const mergedState = { ...data.data, ...localState };
        lastSyncedJson = JSON.stringify(mergedState);
        applyRemoteState(mergedState);
        schedulePush(); // Wypchnięcie połączonych danych z powrotem na serwer
      } else {
        // Brak lokalnych zmian -> wgrywamy czyste dane z serwera
        lastSyncedJson = JSON.stringify(data.data);
        maybeApplyRemote(data.data);
      }
    } else if (Object.keys(collectState()).length > 0) {
      localStorage.setItem("sync_dirty", "true");
      schedulePush();
    }
  } catch (e) {
    console.error("Błąd inicjalizacji sync:", e);
  }

  if (realTimeChannel) supabase.removeChannel(realTimeChannel);

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
        if (localStorage.getItem("sync_dirty") !== "true") {
          applyRemoteState(pendingRemote);
        }
        pendingRemote = null; // Czyścimy stare dane
      }
    }, 0);
  },
  true,
);

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
