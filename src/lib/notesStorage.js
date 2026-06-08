const NOTES_KEY = "stack:notes_v1";

export function getNotes() {
  const v = localStorage.getItem(NOTES_KEY);
  if (!v) return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

export function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent("notes-changed"));
}

export function generateNoteId() {
  return "note_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}
