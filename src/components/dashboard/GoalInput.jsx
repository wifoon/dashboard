import { useState, useRef } from "react";

export default function GoalInput({ onAdd, statusMsg }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, false);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div
      className="pt-3.5 mt-3.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a goal for today…"
          className="flex-1 py-[11px] px-[14px] rounded-xl text-[13px] outline-none transition-all w-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        />
        <button
          onClick={handleAdd}
          className="px-6 py-[11px] rounded-xl text-[13px] font-bold shrink-0 transition-all active:scale-95"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #E8E5DD 100%)",
            color: "#0A0A0B",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          + Add
        </button>
      </div>
      {statusMsg && (
        <p
          className="text-[11px] mt-2"
          style={{ color: statusMsg.color || "var(--text-tertiary)" }}
        >
          {statusMsg.text}
        </p>
      )}
    </div>
  );
}
