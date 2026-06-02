import React, { useState, useMemo, useEffect } from "react";
import { useAppData, useTasks, useDailyPlan } from "../context/AppContext";

const FILTER_PILLS = [
  { id: "all", label: "all" },
  { id: "open", label: "open" },
  { id: "done", label: "done" },
  { id: "work", label: "work" },
  { id: "learning", label: "learning" },
  { id: "body", label: "body" },
  { id: "social", label: "social" },
  { id: "wealth", label: "wealth" },
  { id: "music", label: "music" },
  { id: "craft", label: "craft" },
  { id: "errand", label: "errand" },
];

const QUAD_LABELS = {
  q1: "Do now",
  q2: "Schedule",
  q3: "Delegate / quick",
  q4: "Drop or drift",
};

const KIND_ICONS = {
  work: "💼",
  learning: "📚",
  body: "💪",
  social: "💬",
  wealth: "💰",
  music: "🎵",
  craft: "🎨",
  errand: "🛒",
  drift: "🧘",
};

const PAGE_SIZE = 10;

export default function TasksView({ activeTaskId, onSetActive, onNew, onEdit, filter = "open", onFilterChange }) {
  const { tasks, apiFetch } = useAppData();
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "all") return true;
      if (filter === "open") return !t.done;
      if (filter === "done") return t.done;
      return t.kind === filter && !t.done;
    });
  }, [tasks, filter]);

  // Pagination logic
  const pageCount = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const activePage = Math.min(currentPage, Math.max(0, pageCount - 1));
  const pageTasks = useMemo(() => {
    const start = activePage * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, activePage]);

  // Group tasks on this page by Eisenhower quadrant
  const groupedTasks = useMemo(() => {
    const groups = { q1: [], q2: [], q3: [], q4: [] };
    pageTasks.forEach((t) => {
      const q = t.quad && groups[t.quad] ? t.quad : "q2";
      groups[q].push(t);
    });
    return groups;
  }, [pageTasks]);

  // Pre-calculate counts for each filter pill
  const pillCounts = useMemo(() => {
    const counts = { all: tasks.length, open: 0, done: 0 };
    tasks.forEach((t) => {
      if (t.done) {
        counts.done += 1;
      } else {
        counts.open += 1;
        if (t.kind) {
          counts[t.kind] = (counts[t.kind] || 0) + 1;
        }
      }
    });
    return counts;
  }, [tasks]);

  const handleToggleDone = async (e, id) => {
    e.stopPropagation();
    try {
      await apiFetch("/actions", {
        method: "POST",
        body: { action: { type: "complete", taskId: id } },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getTaskTemplateLabel = (t) => {
    if (!t.template) return "";
    if (t.template === "book" && t.book) {
      const done = t.book.chapters.filter((c) => c.status === "done").length;
      return `${done}/${t.book.chapters.length} ch`;
    }
    if (t.template === "skill" && t.skill) {
      return `${t.skill.drills.length} drills`;
    }
    if (t.template === "project" && t.project) {
      const done = t.project.phases.filter((p) => p.status === "done").length;
      return `${done}/${t.project.phases.length} phases`;
    }
    return t.template;
  };

  return (
    <div>
      <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="h-eyebrow">{pillCounts.open} open tasks</div>
          <h1 className="h-display serif" style={{ margin: "4px 0 8px" }}>All tasks</h1>
        </div>

        <div className="list-header-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {/* Filters pills row */}
          <div className="list-filters" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FILTER_PILLS.map((p) => {
              const count = pillCounts[p.id] || 0;
              // Don't show category filters if count is 0 (except all/open/done)
              if (p.id !== "all" && p.id !== "open" && p.id !== "done" && count === 0) return null;
              
              return (
                <button
                  key={p.id}
                  className="filter-pill"
                  data-on={filter === p.id ? "true" : "false"}
                  onClick={() => onFilterChange(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                    borderRadius: 20,
                    border: "1px solid var(--line)",
                    background: filter === p.id ? "var(--accent)" : "var(--panel)",
                    color: filter === p.id ? "white" : "var(--ink)",
                  }}
                >
                  <span>{p.label}</span>
                  <span className="pill-count" style={{
                    fontSize: 10,
                    background: filter === p.id ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontWeight: 600
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button className="btn btn-primary" onClick={onNew}>
            ＋ New task
          </button>
        </div>
      </div>

      <div className="hint" style={{ fontSize: 12, color: "var(--muted)", margin: "16px 0", fontStyle: "italic" }}>
        Click a task to open it as the current active target. Each task carries its own progress template.
      </div>

      {filteredTasks.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 24 }}>
          {filter === "open"
            ? "No open tasks. Create one above."
            : filter === "done"
            ? "Nothing completed yet."
            : `No ${filter} tasks.`}
        </p>
      )}

      {/* Group tasks by quadrants */}
      {["q1", "q2", "q3", "q4"].map((q) => {
        const qTasks = groupedTasks[q] || [];
        if (qTasks.length === 0) return null;

        return (
          <div key={q} className="task-group" style={{ marginBottom: 20 }}>
            <div className="task-group-label" style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 8,
              borderBottom: "1px solid var(--line-soft)",
              paddingBottom: 4
            }}>
              <span className="task-quad" data-q={q} style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: `var(--quad-${q})`,
                display: "inline-block"
              }} />
              <span>{QUAD_LABELS[q]}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {qTasks.map((t) => {
                const active = t.id === activeTaskId;
                const done = t.done;
                const templateLabel = getTaskTemplateLabel(t);

                return (
                  <div
                    key={t.id}
                    className="task-row"
                    data-active={active ? "true" : "false"}
                    onClick={() => onSetActive(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      border: active ? "1.5px solid var(--accent)" : "1px solid var(--line)",
                      background: active ? "var(--panel-2)" : "var(--panel)",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      {/* Done checkbox circle */}
                      <button
                        className="task-check"
                        data-done={done ? "true" : "false"}
                        onClick={(e) => handleToggleDone(e, t.id)}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: done ? "none" : "1.5px solid var(--line)",
                          background: done ? "var(--accent)" : "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 10,
                        }}
                      >
                        {done && "✓"}
                      </button>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{
                          fontSize: 14,
                          textDecoration: done ? "line-through" : "none",
                          color: done ? "var(--faint)" : "var(--ink)",
                          fontWeight: active ? "600" : "normal",
                        }}>
                          {t.title}
                          {t.template && (
                            <span className="task-template-pill" style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 600,
                              textTransform: "uppercase"
                            }}>
                              {t.template}
                            </span>
                          )}
                        </span>
                        
                        {templateLabel && (
                          <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {templateLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Kind category icon */}
                      {t.kind && (
                        <span title={t.kind} style={{ fontSize: 16 }}>
                          {KIND_ICONS[t.kind] || "📝"}
                        </span>
                      )}

                      {/* Energy dots */}
                      {t.energy && (
                        <div style={{ display: "flex", gap: 4 }}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span
                              key={idx}
                              className="task-energy-dot"
                              data-on={idx < t.energy ? "true" : "false"}
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: idx < t.energy ? "var(--accent)" : "var(--line-soft)",
                                display: "inline-block",
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(t);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 24,
          fontSize: 13,
          color: "var(--muted)"
        }}>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={activePage === 0}
          >
            ← Prev
          </button>
          <span>
            {activePage + 1} / {pageCount} &nbsp;({filteredTasks.length} total)
          </span>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={activePage === pageCount - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
