import { useState, useRef, useEffect } from "react";

export default function GoalRow({
  goal,
  index,
  readOnly,
  onToggle,
  onEdit,
  onDelete,
  onQueue,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(goal.text);
  const textRef = useRef(null);
  const [flashing, setFlashing] = useState(false);

  const isDone = goal.done;
  const isQueued = goal.queued;

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      // Place caret at end
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing]);

  const commitEdit = () => {
    const newText = textRef.current?.innerText?.trim();
    if (newText && newText !== goal.text) {
      onEdit(index, newText);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      textRef.current.innerText = goal.text;
      setEditing(false);
    }
  };

  const handleQueue = () => {
    setFlashing(true);
    setTimeout(() => {
      onQueue(index);
      setFlashing(false);
    }, 480);
  };

  let rowBg = "rgba(255,255,255,0.035)";
  let rowBorder = "rgba(255,255,255,0.06)";
  let rowStyle = {};

  if (isDone) {
    rowBg = "rgba(107,227,164,0.04)";
    rowStyle = { opacity: 0.45 };
  }
  if (isQueued && !isDone) {
    rowBg = "rgba(242,192,99,0.10)";
    rowStyle = { boxShadow: "inset 3px 0 0 0 #F2C063" };
  }
  if (flashing) {
    rowStyle = { ...rowStyle, animation: "gm-queue-flash 0.48s ease-out" };
  }

  return (
    <li
      className="flex items-center gap-3 py-3 px-3.5 mb-1.5 rounded-xl group transition-colors cursor-default"
      style={{
        background: rowBg,
        border: `1px solid ${rowBorder}`,
        ...rowStyle,
      }}
      draggable={!readOnly}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e, index);
      }}
      onDrop={(e) => onDrop?.(e, index)}
    >
      {/* Drag handle */}
      {!readOnly && (
        <span
          className="w-[14px] text-[14px] cursor-grab opacity-0 group-hover:opacity-60 transition-opacity select-none"
          style={{ color: "var(--text-tertiary)", letterSpacing: "-2px" }}
        >
          ⋮⋮
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={() => !readOnly && onToggle(index)}
        disabled={readOnly}
        className="w-[22px] h-[22px] rounded-[7px] border-[1.5px] flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: isDone ? "#6BE3A4" : "rgba(255,255,255,0.18)",
          background: isDone ? "#6BE3A4" : "rgba(255,255,255,0.04)",
          boxShadow: isDone ? "0 0 12px rgba(107,227,164,0.40)" : "none",
          cursor: readOnly ? "not-allowed" : "pointer",
        }}
        title={readOnly ? "Activates at 6 AM tomorrow" : ""}
      >
        {isDone && (
          <div
            className="w-[5px] h-[9px] border-r-2 border-b-2 border-[#050506]"
            style={{
              transform: "rotate(45deg) translateY(-1px)",
              animation: "check-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        )}
      </button>

      {/* Text */}
      <div className="flex-1 flex items-center flex-wrap gap-2">
        <span
          ref={textRef}
          className="text-[13px] outline-none"
          contentEditable={editing}
          suppressContentEditableWarning
          onClick={() => !readOnly && !editing && setEditing(true)}
          onBlur={commitEdit}
          onKeyDown={editing ? handleKeyDown : undefined}
          style={{
            color: isQueued && !isDone ? "#FFE2A8" : "var(--text-primary)",
            textDecoration: isDone ? "line-through" : "none",
            textDecorationColor: isDone ? "rgba(255,255,255,0.4)" : undefined,
            cursor: readOnly ? "default" : "text",
            ...(editing
              ? {
                  outline: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "0 4px",
                }
              : {}),
          }}
        >
          {goal.text}
        </span>

        {goal.isRollover && !isDone && !editing && (
          <span className="inline-flex items-center text-[9px] uppercase tracking-wider font-bold text-[#f2c063]/60 bg-[#f2c063]/10 px-1.5 py-[3px] rounded-md pointer-events-none select-none translate-y-[-1px]">
            Zaległe
          </span>
        )}
      </div>

      {/* Queue button */}
      {!readOnly && (
        <button
          onClick={handleQueue}
          className="text-sm transition-all"
          style={{
            opacity: isQueued ? 1 : 0.55,
            color: isQueued ? "#F2C063" : "var(--text-tertiary)",
            filter: isQueued
              ? "drop-shadow(0 0 4px rgba(242,192,99,0.65))"
              : "none",
          }}
        >
          ⚡
        </button>
      )}

      {/* Delete */}
      {!readOnly && (
        <button
          onClick={() => onDelete(index)}
          className="text-sm opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.target.style.color = "var(--danger)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--text-tertiary)")}
        >
          ×
        </button>
      )}
    </li>
  );
}
