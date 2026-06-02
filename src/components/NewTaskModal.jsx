import React, { useState, useEffect } from "react";
import { useAppData } from "../context/AppContext";
import SubtaskPreviewModal from "./SubtaskPreviewModal";

export default function NewTaskModal({ open, editTask, onClose }) {
  const { customMoodTags, apiFetch, tasks } = useAppData();

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showSubtaskPreview, setShowSubtaskPreview] = useState(false);
  const [subtasksAppliedAt, setSubtasksAppliedAt] = useState(null);

  // Core Fields
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("work");
  const [quad, setQuad] = useState("q2");
  const [energy, setEnergy] = useState(3);
  const [cadence, setCadence] = useState("once");
  const [selectedMoods, setSelectedMoods] = useState([]);
  
  // Template States
  const [template, setTemplate] = useState("none"); // 'none', 'book', 'skill', 'project', 'idle'
  
  // Sub-items Lists
  const [chapters, setChapters] = useState([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const [drills, setDrills] = useState([]);
  const [newDrillLabel, setNewDrillLabel] = useState("");

  const [phases, setPhases] = useState([]);
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [phaseSubs, setPhaseSubs] = useState({}); // phaseId -> array of labels
  const [newSubLabel, setNewSubLabel] = useState("");
  const [activeSubPhaseId, setActiveSubPhaseId] = useState("");

  const kindsList = ["work", "learning", "body", "social", "wealth", "music", "craft", "errand", "drift"];
  const cadenceList = [
    { value: "once", label: "once" },
    { value: "daily", label: "daily" },
    { value: "weekly", label: "weekly" },
    { value: "biweekly", label: "biweekly" },
    { value: "loose", label: "loose" },
  ];

  // Prefill in Edit Mode
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || "");
      setKind(editTask.kind || "work");
      setQuad(editTask.quad || "q2");
      setEnergy(editTask.energy ?? 3);
      setCadence(editTask.cadence || "once");
      setSelectedMoods(editTask.moods || []);
      setTemplate(editTask.template || "none");
      
      if (editTask.template === "book" && editTask.book) {
        setChapters(editTask.book.chapters || []);
      }
      if (editTask.template === "skill" && editTask.skill) {
        setDrills(editTask.skill.drills || []);
      }
      if (editTask.template === "project" && editTask.project) {
        setPhases(editTask.project.phases || []);
        const subsMap = {};
        editTask.project.phases.forEach((p) => {
          subsMap[p.id] = (p.subs || []).map((s) => s.label);
        });
        setPhaseSubs(subsMap);
      }
    } else {
      // Clear fields
      setTitle("");
      setKind("work");
      setQuad("q2");
      setEnergy(3);
      setCadence("once");
      setSelectedMoods([]);
      setTemplate("none");
      setChapters([]);
      setDrills([]);
      setPhases([]);
      setPhaseSubs({});
    }
  }, [editTask, open]);

  // Re-sync template data from context after apply_subtasks updates it
  useEffect(() => {
    if (!subtasksAppliedAt || !editTask) return;
    const updated = tasks.find(t => t.id === editTask.id);
    if (!updated) return;
    if (updated.template === "project" && updated.project) {
      setPhases(updated.project.phases || []);
      const subsMap = {};
      updated.project.phases.forEach(p => {
        subsMap[p.id] = (p.subs || []).map(s => s.label);
      });
      setPhaseSubs(subsMap);
    } else if (updated.template === "book" && updated.book) {
      setChapters(updated.book.chapters || []);
    } else if (updated.template === "skill" && updated.skill) {
      setDrills(updated.skill.drills || []);
    }
  }, [subtasksAppliedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMoodTag = (tag) => {
    if (selectedMoods.includes(tag)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== tag));
    } else {
      setSelectedMoods([...selectedMoods, tag]);
    }
  };

  // -------------------------------------------------------------
  // Template Builders Actions
  // -------------------------------------------------------------
  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const ch = {
      id: `ch-${Date.now()}-${chapters.length}`,
      title: newChapterTitle.trim(),
      status: "unread",
      note: "",
    };
    setChapters([...chapters, ch]);
    setNewChapterTitle("");
  };

  const handleRemoveChapter = (id) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const handleAddDrill = () => {
    if (!newDrillLabel.trim()) return;
    const dr = {
      id: `drill-${Date.now()}-${drills.length}`,
      label: newDrillLabel.trim(),
      level: 1,
    };
    setDrills([...drills, dr]);
    setNewDrillLabel("");
  };

  const handleRemoveDrill = (id) => {
    setDrills(drills.filter((d) => d.id !== id));
  };

  const handleAddPhase = () => {
    if (!newPhaseTitle.trim()) return;
    const phaseId = `phase-${Date.now()}-${phases.length}`;
    const p = {
      id: phaseId,
      title: newPhaseTitle.trim(),
      status: phases.length === 0 ? "doing" : "todo", // Make first phase doing
    };
    setPhases([...phases, p]);
    setPhaseSubs({ ...phaseSubs, [phaseId]: [] });
    setNewPhaseTitle("");
    setActiveSubPhaseId(phaseId);
  };

  const handleRemovePhase = (id) => {
    setPhases(phases.filter((p) => p.id !== id));
    const subsCopy = { ...phaseSubs };
    delete subsCopy[id];
    setPhaseSubs(subsCopy);
  };

  const handleAddSub = (phaseId) => {
    if (!newSubLabel.trim()) return;
    const subsList = phaseSubs[phaseId] || [];
    setPhaseSubs({
      ...phaseSubs,
      [phaseId]: [...subsList, newSubLabel.trim()],
    });
    setNewSubLabel("");
  };

  const handleRemoveSub = (phaseId, idx) => {
    const subsList = [...(phaseSubs[phaseId] || [])];
    subsList.splice(idx, 1);
    setPhaseSubs({ ...phaseSubs, [phaseId]: subsList });
  };

  // -------------------------------------------------------------
  // Submit Creation / Saving
  // -------------------------------------------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;

    setBusy(true);
    setErrorMsg(null);

    const taskData = {
      title: title.trim(),
      kind: template === "idle" ? "drift" : kind,
      quad,
      energy,
      cadence,
      moods: selectedMoods,
      template: template === "none" ? null : template,
    };

    if (template === "book") {
      taskData.book = { chapters };
    } else if (template === "skill") {
      taskData.skill = { drills, recent: editTask?.skill?.recent || [] };
    } else if (template === "project") {
      const projectPhases = phases.map((p) => {
        const subsList = phaseSubs[p.id] || [];
        return {
          ...p,
          subs: subsList.map((label, idx) => ({
            id: `sub-${idx}-${Date.now()}`,
            label,
            done: false,
          })),
        };
      });
      taskData.project = { phases: projectPhases };
    } else if (template === "idle") {
      taskData.idle = { lastDrifts: editTask?.idle?.lastDrifts || [] };
    }

    try {
      if (editTask) {
        await apiFetch("/actions", {
          method: "POST",
          body: { action: { type: "update_task", taskId: editTask.id, task: taskData } },
        });
      } else {
        await apiFetch("/actions", {
          method: "POST",
          body: { action: { type: "create_task", task: taskData } },
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to save task.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!editTask || busy) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setBusy(true);
    setErrorMsg(null);
    try {
      await apiFetch("/actions", {
        method: "POST",
        body: { action: { type: "delete_task", taskId: editTask.id } },
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete task.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <h2 className="modal-title serif">{editTask ? "Edit Focus Task" : "Create Focus Task"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {errorMsg && (
          <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 12px" }}>{errorMsg}</p>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="h-eyebrow">Task Title</label>
            <input
              type="text"
              className="field-input"
              required
              placeholder="What task wants your attention?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Quadrant & Energy & Cadence row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="h-eyebrow">Quadrant</label>
              <select
                className="field-input"
                value={quad}
                onChange={(e) => setQuad(e.target.value)}
                disabled={busy}
              >
                <option value="q1">Q1: Do Now (Urgent & Important)</option>
                <option value="q2">Q2: Schedule (Important)</option>
                <option value="q3">Q3: Delegate / Quick (Urgent)</option>
                <option value="q4">Q4: Drop or Drift</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="h-eyebrow">Energy scale</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => setEnergy(idx + 1)}
                    className="drill-dot"
                    data-on={idx < energy ? "true" : "false"}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      cursor: "pointer",
                      background: idx < energy ? "var(--accent)" : "var(--line-soft)",
                    }}
                  />
                ))}
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>{energy}/5</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Kind Category */}
            {template !== "idle" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="h-eyebrow">Category</label>
                <select
                  className="field-input"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  disabled={busy}
                >
                  {kindsList.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Recurrence Cadence */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="h-eyebrow">Recurrence Cadence</label>
              <select
                className="field-input"
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                disabled={busy}
              >
                {cadenceList.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Template Picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="h-eyebrow">Interactive Template</label>
            <select
              className="field-input"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={busy || !!editTask} // Template locked during edit
            >
              <option value="none">Standard checklist task</option>
              <option value="book">Book template (chapters tracker)</option>
              <option value="skill">Skill template (drills mastery)</option>
              <option value="project">Project template (phases workflow)</option>
              <option value="idle">Drift template (relaxation timer)</option>
            </select>
          </div>

          {/* Generate subtasks button — hidden for idle template */}
          {template !== "idle" && editTask && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => setShowSubtaskPreview(true)}
                style={{ fontSize: 11 }}
              >
                ✦ Generate subtasks
              </button>
            </div>
          )}

          {/* Chapters checklist Builder (Book Template) */}
          {template === "book" && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--panel-2)" }}>
              <span className="h-eyebrow">Chapters Builder</span>
              <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Chapter title"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                />
                <button type="button" className="btn btn-sm" onClick={handleAddChapter}>＋ Add</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                {chapters.map((ch, idx) => (
                  <div key={ch.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span>Ch {idx + 1} · {ch.title}</span>
                    <button type="button" className="modal-close" style={{ border: "none", background: "none" }} onClick={() => handleRemoveChapter(ch.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drills checklist Builder (Skill Template) */}
          {template === "skill" && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--panel-2)" }}>
              <span className="h-eyebrow">Drills Builder</span>
              <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Drill label"
                  value={newDrillLabel}
                  onChange={(e) => setNewDrillLabel(e.target.value)}
                />
                <button type="button" className="btn btn-sm" onClick={handleAddDrill}>＋ Add</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                {drills.map((dr) => (
                  <div key={dr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span>{dr.label}</span>
                    <button type="button" className="modal-close" style={{ border: "none", background: "none" }} onClick={() => handleRemoveDrill(dr.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phases Checklist builder (Project Template) */}
          {template === "project" && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--panel-2)" }}>
              <span className="h-eyebrow">Project Phases builder</span>
              <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Phase Title"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                />
                <button type="button" className="btn btn-sm" onClick={handleAddPhase}>＋ Add</button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                {phases.map((p, idx) => (
                  <div key={p.id} style={{ border: "1px solid var(--line-soft)", borderRadius: 6, padding: 8, background: "var(--panel)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "600", fontSize: 12 }}>
                      <span>Phase {idx + 1}: {p.title}</span>
                      <button type="button" className="modal-close" style={{ border: "none", background: "none" }} onClick={() => handleRemovePhase(p.id)}>×</button>
                    </div>
                    
                    {/* Subtask list builder */}
                    <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="Add subtask checklist"
                        style={{ fontSize: 11, padding: "4px 8px" }}
                        value={activeSubPhaseId === p.id ? newSubLabel : ""}
                        onChange={(e) => {
                          setActiveSubPhaseId(p.id);
                          setNewSubLabel(e.target.value);
                        }}
                      />
                      <button type="button" className="btn btn-sm" onClick={() => handleAddSub(p.id)}>＋</button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(phaseSubs[p.id] || []).map((label, sIdx) => (
                        <div key={sIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--muted)" }}>
                          <span>- {label}</span>
                          <button type="button" className="modal-close" style={{ border: "none", background: "none", fontSize: 12 }} onClick={() => handleRemoveSub(p.id, sIdx)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood tags selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="h-eyebrow">Match moods</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["focused", "creative", "calm", "social", "curious", "restless", "tired", "scattered", ...customMoodTags].map((t) => (
                <span
                  key={t}
                  onClick={() => toggleMoodTag(t)}
                  className="filter-pill"
                  data-on={selectedMoods.includes(t) ? "true" : "false"}
                  style={{ cursor: "pointer", padding: "4px 10px", fontSize: 11 }}
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={busy || !title.trim()}>
              {editTask ? "Save Focus Changes" : "Create Focus Task"}
            </button>

            {editTask && (
              <button type="button" className="btn btn-ghost" style={{ background: "#EA4335", color: "white", flex: 0.4 }} onClick={handleDelete} disabled={busy}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
      {showSubtaskPreview && editTask && (
        <SubtaskPreviewModal
          task={editTask}
          onClose={() => setShowSubtaskPreview(false)}
          onApplied={() => {
            setSubtasksAppliedAt(Date.now());
            setShowSubtaskPreview(false);
          }}
        />
      )}
    </div>
  );
}
