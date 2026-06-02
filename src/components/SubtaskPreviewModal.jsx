import React, { useState, useEffect, useCallback } from "react";
import { generateSubtasks } from "../lib/gemini.js";
import { useAppData } from "../context/AppContext";

/**
 * SubtaskPreviewModal
 * Props:
 *   task         — full task object
 *   onClose      — () => void
 */
export default function SubtaskPreviewModal({ task, onClose }) {
  const { apiFetch, profile } = useAppData();

  const hasProfile = !!profile?.traits?.onboardingComplete;
  const [personalized, setPersonalized] = useState(hasProfile);
  const [userContext, setUserContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // editableData: null | { templateType: string, data: object }
  // For project: data = { phases: [{ title, subs: string[] }] }
  // For book:    data = { chapters: string[] }
  // For skill:   data = { drills: string[] }
  const [editableData, setEditableData] = useState(null);

  const hasExistingSubtasks =
    (task.template === "project" && (task.project?.phases || []).length > 0) ||
    (task.template === "book"    && (task.book?.chapters || []).length > 0) ||
    (task.template === "skill"   && (task.skill?.drills || []).length > 0);

  const triggerGeneration = useCallback(async (isPersonalized, ctx) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateSubtasks(
        task,
        ctx,
        isPersonalized,
        isPersonalized ? profile : null
      );
      if (result.templateType === "project") {
        setEditableData({
          templateType: "project",
          data: {
            phases: (result.data.phases || []).map(p => ({
              title: p.title,
              subs: p.subs || [],
            })),
          },
        });
      } else if (result.templateType === "book") {
        setEditableData({
          templateType: "book",
          data: { chapters: result.data.chapters || [] },
        });
      } else if (result.templateType === "skill") {
        setEditableData({
          templateType: "skill",
          data: { drills: result.data.drills || [] },
        });
      }
    } catch (err) {
      setError("Generation failed. Check your API key or try again.");
    } finally {
      setGenerating(false);
    }
  }, [task, profile]);

  // Auto-generate on mount
  useEffect(() => {
    triggerGeneration(personalized, userContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePersonalizedToggle = (val) => {
    setPersonalized(val);
    triggerGeneration(val, userContext);
  };

  const handleRegenerate = () => {
    triggerGeneration(personalized, userContext);
  };

  const handleApply = async () => {
    if (!editableData) return;
    let dataPayload;
    if (editableData.templateType === "project") {
      dataPayload = {
        phases: editableData.data.phases
          .filter(p => p.title.trim())
          .map(p => ({ title: p.title.trim(), subs: p.subs.filter(s => s.trim()) })),
      };
    } else if (editableData.templateType === "book") {
      dataPayload = { chapters: editableData.data.chapters.filter(c => c.trim()) };
    } else if (editableData.templateType === "skill") {
      dataPayload = { drills: editableData.data.drills.filter(d => d.trim()) };
    }
    await apiFetch("/actions", {
      method: "POST",
      body: {
        action: {
          type: "apply_subtasks",
          taskId: task.id,
          templateType: editableData.templateType,
          data: dataPayload,
        },
      },
    });
    onClose();
  };

  // ── Edit helpers ──────────────────────────────────────────────

  const updatePhaseTitle = (pi, val) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => i === pi ? { ...p, title: val } : p);
      return { ...prev, data: { phases } };
    });
  };

  const updateSubLabel = (pi, si, val) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: p.subs.map((s, j) => j === si ? val : s) };
      });
      return { ...prev, data: { phases } };
    });
  };

  const deleteSub = (pi, si) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: p.subs.filter((_, j) => j !== si) };
      });
      return { ...prev, data: { phases } };
    });
  };

  const deletePhase = (pi) => {
    setEditableData(prev => ({
      ...prev,
      data: { phases: prev.data.phases.filter((_, i) => i !== pi) },
    }));
  };

  const addSub = (pi) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: [...p.subs, ""] };
      });
      return { ...prev, data: { phases } };
    });
  };

  const updateChapter = (ci, val) => {
    setEditableData(prev => ({
      ...prev,
      data: { chapters: prev.data.chapters.map((c, i) => i === ci ? val : c) },
    }));
  };

  const deleteChapter = (ci) => {
    setEditableData(prev => ({
      ...prev,
      data: { chapters: prev.data.chapters.filter((_, i) => i !== ci) },
    }));
  };

  const updateDrill = (di, val) => {
    setEditableData(prev => ({
      ...prev,
      data: { drills: prev.data.drills.map((d, i) => i === di ? val : d) },
    }));
  };

  const deleteDrill = (di) => {
    setEditableData(prev => ({
      ...prev,
      data: { drills: prev.data.drills.filter((_, i) => i !== di) },
    }));
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title serif" style={{ marginBottom: 2 }}>AI-generated breakdown</h2>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{task.title}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Personalized / General toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["Personalized", "General"].map(opt => (
            <button
              key={opt}
              type="button"
              className="btn btn-sm"
              disabled={!hasProfile && opt === "Personalized"}
              style={{
                opacity: !hasProfile && opt === "Personalized" ? 0.4 : 1,
                background: (opt === "Personalized") === personalized ? "var(--accent)" : undefined,
                color: (opt === "Personalized") === personalized ? "#fff" : undefined,
              }}
              onClick={() => handlePersonalizedToggle(opt === "Personalized")}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Context input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="field-input"
            placeholder="Add context for better results… (optional)"
            value={userContext}
            onChange={e => setUserContext(e.target.value)}
            disabled={generating}
            style={{ flex: 1, fontSize: 12 }}
          />
          <button
            type="button"
            className="btn btn-sm"
            disabled={generating}
            onClick={handleRegenerate}
          >
            {generating ? "…" : "Regenerate"}
          </button>
        </div>

        {/* Existing subtasks warning */}
        {hasExistingSubtasks && (
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, padding: "6px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
            This task already has subtasks. Generated items will be added alongside them.
          </p>
        )}

        {/* Loading skeleton */}
        {generating && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[70, 55, 80, 60].map((w, i) => (
              <div key={i} style={{ height: 14, width: `${w}%`, background: "var(--line-soft)", borderRadius: 4, opacity: 0.6 }} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!generating && error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, marginBottom: 10 }}>{error}</p>
            <button type="button" className="btn btn-sm" onClick={handleRegenerate}>Try again</button>
          </div>
        )}

        {/* Editable content */}
        {!generating && !error && editableData && (

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── Project template ── */}
            {editableData.templateType === "project" && editableData.data.phases.map((phase, pi) => (
              <div key={pi} style={{ border: "1px solid var(--line-soft)", borderRadius: 8, padding: 10, background: "var(--panel-2)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input
                    className="field-input"
                    value={phase.title}
                    onChange={e => updatePhaseTitle(pi, e.target.value)}
                    style={{ flex: 1, fontWeight: 600, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    className="modal-close"
                    style={{ border: "none", background: "none", flexShrink: 0 }}
                    onClick={() => deletePhase(pi)}
                  >×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {phase.subs.map((sub, si) => (
                    <div key={si} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>–</span>
                      <input
                        className="field-input"
                        value={sub}
                        onChange={e => updateSubLabel(pi, si, e.target.value)}
                        style={{ flex: 1, fontSize: 11, padding: "3px 8px" }}
                      />
                      <button
                        type="button"
                        className="modal-close"
                        style={{ border: "none", background: "none", fontSize: 12, flexShrink: 0 }}
                        onClick={() => deleteSub(pi, si)}
                      >×</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ alignSelf: "flex-start", marginTop: 4, fontSize: 11 }}
                    onClick={() => addSub(pi)}
                  >+ step</button>
                </div>
              </div>
            ))}

            {/* ── Book template ── */}
            {editableData.templateType === "book" && editableData.data.chapters.map((ch, ci) => (
              <div key={ci} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>Ch {ci + 1}</span>
                <input
                  className="field-input"
                  value={ch}
                  onChange={e => updateChapter(ci, e.target.value)}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="button"
                  className="modal-close"
                  style={{ border: "none", background: "none" }}
                  onClick={() => deleteChapter(ci)}
                >×</button>
              </div>
            ))}

            {/* ── Skill template ── */}
            {editableData.templateType === "skill" && editableData.data.drills.map((dr, di) => (
              <div key={di} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>Drill {di + 1}</span>
                <input
                  className="field-input"
                  value={dr}
                  onChange={e => updateDrill(di, e.target.value)}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="button"
                  className="modal-close"
                  style={{ border: "none", background: "none" }}
                  onClick={() => deleteDrill(di)}
                >×</button>
              </div>
            ))}

          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
          <button type="button" className="btn" onClick={onClose}>Discard</button>
          <button
            type="button"
            className="btn"
            disabled={!editableData || generating}
            style={{ background: "var(--accent)", color: "#fff" }}
            onClick={handleApply}
          >
            Apply subtasks
          </button>
        </div>

      </div>
    </div>
  );
}
