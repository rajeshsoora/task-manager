import React, { useMemo } from "react";
import { useAppData } from "../context/AppContext";

function MatrixCell({ q, label, accent, tasks, activeTaskId, onSetActive, onToggleDone }) {
  return (
    <div className="matrix-cell" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--panel)" }}>
      <div className="matrix-cell-head" style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span className="swatch" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: accent, marginRight: 8 }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span style={{ marginLeft: "auto", color: "var(--faint)", fontSize: 12, fontFamily: "monospace" }}>{tasks.length}</span>
      </div>

      <div className="matrix-cell-list" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 100, overflowY: "auto" }}>
        {tasks.length === 0 ? (
          <div className="matrix-cell-empty" style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic", textAlign: "center", margin: "auto" }}>
            Empty — good.
          </div>
        ) : (
          tasks.map((t) => {
            const active = t.id === activeTaskId;
            return (
              <div
                key={t.id}
                onClick={() => onSetActive(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  border: active ? "1.5px solid var(--accent)" : "1px solid var(--line-soft)",
                  background: active ? "var(--panel-2)" : "var(--panel)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <button
                    className="task-check"
                    data-done="false"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDone(t.id);
                    }}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "1.5px solid var(--line)",
                      background: "transparent",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MatrixView({ activeTaskId, onSetActive, onToggleDone }) {
  const { tasks } = useAppData();

  const openTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks]);

  const cellTasks = useMemo(() => {
    const cells = { q1: [], q2: [], q3: [], q4: [] };
    openTasks.forEach((t) => {
      const q = t.quad && cells[t.quad] ? t.quad : "q2";
      cells[q].push(t);
    });
    return cells;
  }, [openTasks]);

  return (
    <div>
      <div className="h-eyebrow">Eisenhower</div>
      <h1 className="h-display serif" style={{ margin: "4px 0 8px" }}>Priority matrix</h1>
      <p className="h-section" style={{ color: "var(--muted)", marginBottom: 24, fontSize: 13 }}>
        Urgent × important. Most of your weeks should sit in <em>Schedule</em> — that's the calm work.
      </p>

      {/* Grid Axis Layout */}
      <div className="matrix" style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gridTemplateRows: "auto 1fr auto 1fr",
        gap: 12,
        alignItems: "center"
      }}>
        {/* Row 0 Header Columns labels */}
        <div></div>
        <div className="matrix-axis-x" style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Urgent</div>
        <div className="matrix-axis-x" style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Not urgent</div>

        {/* Row 1 Content: Important */}
        <div className="matrix-axis-y" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", padding: 8 }}>
          Important
        </div>
        <MatrixCell
          q="q1"
          label="Do now"
          accent="var(--quad-q1)"
          tasks={cellTasks.q1}
          activeTaskId={activeTaskId}
          onSetActive={onSetActive}
          onToggleDone={onToggleDone}
        />
        <MatrixCell
          q="q2"
          label="Schedule"
          accent="var(--quad-q2)"
          tasks={cellTasks.q2}
          activeTaskId={activeTaskId}
          onSetActive={onSetActive}
          onToggleDone={onToggleDone}
        />

        {/* Row 2 Axis Label spacer */}
        <div></div>
        <div></div>
        <div></div>

        {/* Row 3 Content: Not Important */}
        <div className="matrix-axis-y" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", padding: 8 }}>
          Not important
        </div>
        <MatrixCell
          q="q3"
          label="Delegate / quick"
          accent="var(--quad-q3)"
          tasks={cellTasks.q3}
          activeTaskId={activeTaskId}
          onSetActive={onSetActive}
          onToggleDone={onToggleDone}
        />
        <MatrixCell
          q="q4"
          label="Drop or drift"
          accent="var(--quad-q4)"
          tasks={cellTasks.q4}
          activeTaskId={activeTaskId}
          onSetActive={onSetActive}
          onToggleDone={onToggleDone}
        />
      </div>
    </div>
  );
}
