import React, { useState, useEffect, useMemo } from "react";
import { getNotes, saveNotes, generateNoteId } from "@/lib/notesStorage";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Copy,
  CheckCheck,
  AlertCircle,
  Maximize2,
  Pin,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// --- Komponent Lightbox do obrazków ---
const ImageLightbox = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <img
        src={src}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [editTab, setEditTab] = useState("write"); // 'write' | 'preview'
  const [newTag, setNewTag] = useState("");
  const [zoomedImg, setZoomedImg] = useState(null);

  useEffect(() => {
    setNotes(getNotes());
    const handler = () => setNotes(getNotes());
    window.addEventListener("notes-changed", handler);
    return () => window.removeEventListener("notes-changed", handler);
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes]
      .filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase()) ||
          n.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.createdAt - a.createdAt; // Priorytet już nie winduje do góry
      });
  }, [notes, search]);

  const handleCreateNote = () => {
    setEditingNote({
      id: generateNoteId(),
      title: "",
      content: "",
      tags: [],
      isPriority: false,
      isPinned: false,
      createdAt: Date.now(),
    });
    setEditTab("write");
  };

  const handleSaveNote = () => {
    if (!editingNote) return;
    const isExisting = notes.some((n) => n.id === editingNote.id);
    const updatedNotes = isExisting
      ? notes.map((n) => (n.id === editingNote.id ? editingNote : n))
      : [editingNote, ...notes];
    saveNotes(updatedNotes);
    setViewingNote(editingNote); // Powrót do podglądu
    setEditingNote(null);
  };

  const handleDeleteNote = (id) => {
    if (!confirm("Na pewno chcesz usunąć tę notatkę?")) return;
    saveNotes(notes.filter((n) => n.id !== id));
    if (editingNote?.id === id) setEditingNote(null);
    if (viewingNote?.id === id) setViewingNote(null);
  };

  const togglePin = (id) => {
    saveNotes(
      notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    );
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        const compressed = await compressImage(file);
        const imageMarkdown = `\n![Obrazek](${compressed})\n`;
        const cursorPosition = e.target.selectionStart;
        const textBefore = editingNote.content.substring(0, cursorPosition);
        const textAfter = editingNote.content.substring(cursorPosition);
        setEditingNote({
          ...editingNote,
          content: textBefore + imageMarkdown + textAfter,
        });
      }
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (!editingNote.tags.includes(tag)) {
      setEditingNote({
        ...editingNote,
        tags: [...(editingNote.tags || []), tag],
      });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove) => {
    setEditingNote({
      ...editingNote,
      tags: editingNote.tags.filter((t) => t !== tagToRemove),
    });
  };

  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const [copied, setCopied] = useState(false);
      const codeStr = String(children).replace(/\n$/, "");

      const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(codeStr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      if (!inline) {
        return (
          <div className="relative group mt-4 mb-4 rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner">
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest">
                {match ? match[1] : "Code"}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#6ee7b7]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-white/80 custom-scrollbar">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      return (
        <code
          className="bg-[#6ee7b7]/10 text-[#6ee7b7] rounded px-1.5 py-0.5 font-mono text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      );
    },
    img({ src, alt }) {
      return (
        <div
          className="relative group inline-block my-4 cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            setZoomedImg(src);
          }}
        >
          <img
            src={src}
            alt={alt}
            className="rounded-xl border border-white/10 max-h-[400px] object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>
        </div>
      );
    },
  };

  // --- MODAL EDYCJI ---
  if (editingNote) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm p-4 md:p-8 flex justify-center items-start overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-4xl bg-[#111113]/95 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl p-6 flex flex-col min-h-[85vh] animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="Tytuł notatki..."
              value={editingNote.title}
              onChange={(e) =>
                setEditingNote({ ...editingNote, title: e.target.value })
              }
              className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white outline-none placeholder:text-white/20"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  setEditingNote({
                    ...editingNote,
                    isPinned: !editingNote.isPinned,
                  })
                }
                className={`p-3 rounded-xl transition-all border ${editingNote.isPinned ? "bg-[#f2c063]/20 border-[#f2c063]/40 text-[#f2c063] shadow-[0_0_15px_rgba(242,192,99,0.3)]" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"}`}
                title="Przypnij na górze"
              >
                <Pin className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setEditingNote({
                    ...editingNote,
                    isPriority: !editingNote.isPriority,
                  })
                }
                className={`p-3 rounded-xl transition-all border ${editingNote.isPriority ? "bg-[#ef4444]/20 border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"}`}
                title="Oznacz jako ważne (Priorytet)"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={addTag} className="flex gap-2 mb-6">
            <div className="flex flex-wrap gap-2 items-center flex-1 bg-black/30 border border-white/10 rounded-xl p-2">
              {editingNote.tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white/80 text-xs font-bold rounded-lg"
                >
                  {tag}{" "}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-[#ef4444]"
                    onClick={() => removeTag(tag)}
                  />
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Dodaj tag i wciśnij Enter..."
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 flex-1 min-w-[150px] p-1"
              />
            </div>
          </form>

          <div className="flex bg-black/40 p-1 border border-white/10 rounded-xl mb-4 w-fit">
            <button
              onClick={() => setEditTab("write")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors ${editTab === "write" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Edycja
            </button>
            <button
              onClick={() => setEditTab("preview")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors ${editTab === "preview" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Podgląd
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            {editTab === "write" ? (
              <textarea
                value={editingNote.content}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, content: e.target.value })
                }
                onPaste={handlePaste}
                placeholder="Wpisz treść... Obsługuje Markdown. Możesz wklejać kod oraz zdjęcia (Ctrl+V)!"
                className="w-full flex-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none focus:border-[#6ee7b7]/50 resize-none font-mono custom-scrollbar"
              />
            ) : (
              <div className="w-full flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-sm text-white/90 overflow-y-auto custom-scrollbar prose prose-invert max-w-none prose-img:m-0">
                {editingNote.content ? (
                  <ReactMarkdown components={markdownComponents}>
                    {editingNote.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-white/20 italic">
                    Podgląd pojawi się tutaj...
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-white/10">
            <button
              onClick={() => {
                setEditingNote(null);
                if (!notes.find((n) => n.id === editingNote.id))
                  setViewingNote(null);
              }}
              className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              Anuluj
            </button>
            <button
              onClick={handleSaveNote}
              className="px-6 py-3 rounded-xl font-bold bg-[#6ee7b7] hover:bg-[#5cd4a3] text-black shadow-[0_4px_14px_rgba(110,231,183,0.2)] transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Zapisz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MODAL PODGLĄDU ---
  if (viewingNote) {
    return (
      <div
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm p-4 md:p-8 flex justify-center items-start overflow-y-auto custom-scrollbar"
        onClick={() => setViewingNote(null)}
      >
        <div
          className="w-full max-w-4xl bg-[#111113]/95 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl flex flex-col min-h-[85vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-extrabold text-white">
                  {viewingNote.title || "Bez tytułu"}
                </h2>
                <div className="flex items-center gap-1.5">
                  {viewingNote.isPinned && (
                    <Pin className="w-5 h-5 text-[#f2c063]" />
                  )}
                  {viewingNote.isPriority && (
                    <AlertCircle className="w-5 h-5 text-[#ef4444]" />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {viewingNote.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-white/10 border border-white/10 text-white/60 text-[11px] font-bold rounded-md uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingNote(viewingNote);
                  setEditTab("write");
                }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewingNote(null)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar prose prose-invert max-w-none prose-img:m-0">
            <ReactMarkdown components={markdownComponents}>
              {viewingNote.content}
            </ReactMarkdown>
          </div>
        </div>
        <ImageLightbox src={zoomedImg} onClose={() => setZoomedImg(null)} />
      </div>
    );
  }

  // --- WIDOK LISTY NOTATEK ---
  return (
    <div className="w-full max-w-[1100px] mx-auto pt-[max(24px,env(safe-area-inset-top))] px-5 pb-32 font-sans relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1
          className="text-[28px] font-bold tracking-tight max-sm:text-[22px]"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.025em",
          }}
        >
          Moje Notatki
        </h1>
        <button
          onClick={handleCreateNote}
          className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nowa notatka
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Szukaj w tytule, treści lub po tagach..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-4 pl-12 pr-4 outline-none transition-all rounded-2xl text-[14px]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {sortedNotes.length === 0 ? (
        <div
          className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          Brak notatek. Kliknij "Nowa notatka", aby zacząć.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setViewingNote(note)}
              className={`group rounded-3xl p-6 flex flex-col h-[240px] transition-all cursor-pointer hover:bg-white/[0.06] ${note.isPriority ? "note-priority" : ""}`}
              style={
                note.isPriority
                  ? {
                      background:
                        "linear-gradient(180deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                      backdropFilter: "blur(24px) saturate(1.2)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderTop: "2px solid #ef4444",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(24px) saturate(1.2)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }
              }
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight pr-2">
                  {note.title || "Bez tytułu"}
                </h3>
                <div className="flex gap-1.5 shrink-0">
                  {note.isPinned && <Pin className="w-4 h-4 text-[#f2c063]" />}
                  {note.isPriority && (
                    <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {note.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white/60 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex-1 text-[13px] text-white/50 line-clamp-4 prose prose-invert overflow-hidden pointer-events-none">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                <span className="text-[10px] text-white/30 font-mono">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(note.id);
                    }}
                    className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${note.isPinned ? "text-[#f2c063]" : "text-white/40 hover:text-white"}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-2 bg-white/5 hover:bg-[#f87171]/20 rounded-lg text-white/60 hover:text-[#f87171] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ImageLightbox src={zoomedImg} onClose={() => setZoomedImg(null)} />
    </div>
  );
}
