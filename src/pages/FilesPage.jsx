import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseSync";
import { UploadCloud, File, Download, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { session } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const BUCKET_NAME = "pliki";

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list();
    if (error) {
      console.error("Błąd pobierania plików:", error);
    } else {
      // Sortowanie: najnowsze na górze
      setFiles(
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      );
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { upsert: false });

      if (error) throw error;
      fetchFiles();
    } catch (error) {
      alert("Błąd podczas wgrywania: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      // Unikalna nazwa pliku, żeby uniknąć konfliktów
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { upsert: false });

      if (error) throw error;
      fetchFiles();
    } catch (error) {
      alert("Błąd podczas wgrywania: " + error.message);
    } finally {
      setUploading(false);
      event.target.value = null; // Czyszczenie inputa
    }
  };

  const downloadFile = async (fileName) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60, { download: true });

    if (error) {
      alert("Błąd pobierania: " + error.message);
      return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;

    const cleanFileName = fileName.substring(fileName.indexOf("_") + 1);

    link.setAttribute("download", cleanFileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteFile = async (fileName) => {
    if (!confirm("Na pewno usunąć ten plik?")) return;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) alert("Błąd usuwania: " + error.message);
    else fetchFiles();
  };

  // Formatowanie rozmiaru pliku (bajty na MB/KB)
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto pt-[max(24px,env(safe-area-inset-top))] px-5 pb-32 font-sans relative z-10">
      {/* 1. ZUNIFIKOWANY NAGŁÓWEK */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1
          className="text-[28px] font-bold tracking-tight max-sm:text-[22px] m-0"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.025em",
          }}
        >
          Dysk
        </h1>
      </div>

      {/* 2. ZUNIFIKOWANY SEPARATOR */}
      <div
        className="flex items-center gap-3 mb-5"
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        <span
          className="w-[18px] h-px"
          style={{ background: "var(--text-tertiary)", opacity: 0.6 }}
        />
        <span>Wgrywanie Plików</span>
        <span
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
          }}
        />
      </div>

      {/* 3. KARTA W STYLU DASHBOARDU */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-3xl p-8 mb-8 flex flex-col items-center justify-center text-center relative transition-all duration-300 ${
          isDragging ? "bg-white/[0.08] border-[#6BE3A4]/50 scale-[1.02]" : ""
        }`}
        style={{
          background: isDragging
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px) saturate(1.2)",
          boxShadow: isDragging
            ? "0 0 30px rgba(107,227,164,0.15)"
            : "0 12px 40px rgba(0,0,0,0.45)",
          border: `1px ${isDragging ? "dashed" : "solid"} ${
            isDragging ? "#6BE3A4" : "rgba(255,255,255,0.05)"
          }`,
        }}
      >
        <UploadCloud className="w-12 h-12 text-[#6BE3A4] mb-4 opacity-80" />
        <h3 className="text-lg font-bold text-white mb-2">Wyślij nowy plik</h3>
        <p className="text-sm text-white/50 mb-6 max-w-sm">
          Wrzuć dokumenty, skrypty lub zdjęcia. Pliki są szyfrowane i dostępne
          tylko dla Ciebie.
        </p>

        {/* 4. GŁÓWNY PRZYCISK Z DASHBOARDU */}
        <label
          className="px-6 py-[11px] rounded-xl text-[13px] font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
            color: "#0A0A0B",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          {uploading ? "Wgrywanie..." : "Wybierz plik z dysku"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              handleFileUpload(e.target.files[0]);
              e.target.value = null;
            }}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Lista plików */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-3 mb-5"
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          <span
            className="w-[18px] h-px"
            style={{ background: "var(--text-tertiary)", opacity: 0.6 }}
          />
          <span>Twoje Pliki ({files.length})</span>
          <span
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
            }}
          />
        </div>

        {files.length === 0 && !uploading && (
          <div className="text-center py-12 text-white/30 text-sm border border-white/5 rounded-3xl bg-black/20">
            Dysk jest pusty.
          </div>
        )}

        {files.map(
          (file) =>
            // Ignorujemy ukryty plik konfiguracyjny Supabase
            file.name !== ".emptyFolderPlaceholder" && (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 transition-colors group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 text-[#6ee7b7]">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-white/90 truncate mb-0.5">
                      {/* Usuwamy timestamp z wyświetlanej nazwy dla czystości */}
                      {file.name.substring(file.name.indexOf("_") + 1)}
                    </div>
                    <div className="text-[11px] font-mono text-white/40">
                      {formatBytes(file.metadata.size)} •{" "}
                      {new Date(file.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-4 shrink-0">
                  <button
                    onClick={() => downloadFile(file.name)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-[#6ee7b7]/20 transition-all"
                    title="Pobierz"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFile(file.name)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
