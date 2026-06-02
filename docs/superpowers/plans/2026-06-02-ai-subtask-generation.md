# AI Subtask Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-triggered "Generate subtasks" button that calls Gemini, previews the result in an editable modal, and writes approved subtasks into the task's existing template structure.

**Architecture:** A new `generateSubtasks()` Gemini function builds a prompt from task metadata (energy, mood tags, kind) and optional profile traits, returning JSON in the format the existing template data model expects. A `SubtaskPreviewModal` component wraps the call with loading/edit/error states. A new `apply_subtasks` AppContext action converts the Gemini output (no IDs) to the stored format (with IDs) and writes to Firestore.

**Tech Stack:** React 19, Firebase Firestore, Gemini SDK (`@google/generative-ai`), existing `apiFetch` action pattern.

---

## Existing data model reference (read before coding)

**project template** (`task.project`):
```js
{
  phases: [
    { id: "phase-123", title: "Phase title", status: "doing"|"todo"|"done",
      subs: [{ id: "sub-456", label: "Subtask label", done: false }] }
  ]
}
```

**book template** (`task.book`):
```js
{ chapters: [{ id: "ch-123", title: "Chapter title", status: "unread", note: "" }] }
```

**skill template** (`task.skill`):
```js
{ drills: [{ id: "drill-123", label: "Drill label", level: 1 }], recent: [] }
```

**Gemini model in use:** `gemini-2.5-flash` (match exactly — do not use `gemini-2.0-flash`).

---

## Task 1: Add `generateSubtasks()` to `src/lib/gemini.js`

**Files:**
- Modify: `src/lib/gemini.js`

- [ ] **Step 1: Add the function at the bottom of `src/lib/gemini.js`**

```js
/**
 * Generates subtasks for a task using Gemini.
 * @param {object} task - Full task object (title, kind, energy, moods, template)
 * @param {string} userContext - Optional free-text context from the user
 * @param {boolean} personalized - Whether to use profile snapshot for personalization
 * @param {object|null} profileSnapshot - { traits, patterns, context } from AppContext profile state
 * @returns {Promise<object>} - Structured subtask data ready for the preview modal
 */
export async function generateSubtasks(task, userContext, personalized, profileSnapshot) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const templateType = task.template || "none";

  // Energy shaping rule
  const energyRule = task.energy >= 4
    ? "This task has high energy cost. Break it into smaller, lower-friction steps. The first step should take under 10 minutes."
    : "";

  // Mood shaping rule
  const avoidanceMoods = ["anxious", "heavy", "dreading", "stressed", "overwhelmed"];
  const hasMoodFlag = (task.moods || []).some(m => avoidanceMoods.includes(m));
  const moodRule = hasMoodFlag
    ? "The user has flagged this task with resistance-related mood tags. Make the first action extremely concrete and small — something they can do in under 5 minutes."
    : "";

  // Profile-based shaping (only when personalized)
  let profileSection = "";
  if (personalized && profileSnapshot?.traits) {
    const { traits } = profileSnapshot;
    const flags = [
      traits.perfectionism?.score > 65 ? `- High perfectionism (${traits.perfectionism.score}/100): include a "done is better than perfect" or "ship it" milestone` : null,
      traits.selfEfficacy?.score < 45 ? `- Low self-efficacy (${traits.selfEfficacy.score}/100): start with the easiest possible first step to build momentum` : null,
      traits.emotionalRegulation?.score < 45 ? `- Low emotional regulation (${traits.emotionalRegulation.score}/100): keep steps short, reduce friction at every transition` : null,
      traits.timePerspective?.score < 45 ? `- Time discounting tendency: add estimated durations to each step where possible` : null,
    ].filter(Boolean);
    if (flags.length > 0) {
      profileSection = `\nUser profile signals (use these to shape step design):\n${flags.join("\n")}`;
    }
  }

  // Format instruction based on template type
  const formatByTemplate = {
    project: `{ "phases": [{ "title": "<phase title>", "subs": ["<subtask label>", ...] }] }`,
    none:    `{ "phases": [{ "title": "<phase title>", "subs": ["<subtask label>", ...] }] }`,
    book:    `{ "chapters": ["<chapter title>", ...] }`,
    skill:   `{ "drills": ["<drill label>", ...] }`,
  };
  const formatInstruction = formatByTemplate[templateType] || formatByTemplate.none;

  const prompt = `You are breaking down a task into concrete, actionable subtasks for a personal task manager.

Task: "${task.title}"
Kind: ${task.kind}
Energy required: ${task.energy}/5
Mood tags: ${(task.moods || []).join(", ") || "none"}
Template type: ${templateType}${userContext ? `\nUser context: "${userContext}"` : ""}${profileSection}

${energyRule}
${moodRule}

Rules:
- Generate 3–7 phases/chapters/drills maximum. Quality over quantity.
- Each step title must be an action verb (e.g. "Draft", "Review", "Set up", "Practice").
- For project template: 2–4 subtasks per phase.
- No vague steps like "Do research" — be specific to the task title.

Return JSON only — no markdown, no explanation:
${formatInstruction}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonText = text.startsWith("```") ? text.replace(/```json?\n?/g, "").replace(/```/g, "").trim() : text;
  const parsed = JSON.parse(jsonText);

  return { templateType: templateType === "none" ? "project" : templateType, data: parsed };
}
```

- [ ] **Step 2: Verify the function is syntactically correct**

Run: `npm run build 2>&1 | head -30`
Expected: no errors referencing `gemini.js`. (Build may fail on other things — only care about gemini.js here.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/gemini.js
git commit -m "feat: add generateSubtasks() to gemini.js"
```

---

## Task 2: Add `apply_subtasks` action to `src/context/AppContext.jsx`

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Add the `apply_subtasks` case inside the `switch (action.type)` block in `apiFetch`, just before the `default:` case**

The action payload shape: `{ type: "apply_subtasks", taskId: string, templateType: string, data: object }`

Where `data` comes directly from `generateSubtasks()` parsed output (no IDs yet).

```js
case "apply_subtasks": {
  const task = tasks.find(t => t.id === action.taskId);
  if (!task || !uid) break;

  const now = Date.now();
  let newTemplateType = action.templateType; // "project", "book", or "skill"
  let newTemplateData;

  if (newTemplateType === "project") {
    // Convert Gemini output phases (no IDs) to stored format (with IDs)
    // Merge with existing phases if task already has a project template
    const existingPhases = task.project?.phases || [];
    const generatedPhases = (action.data.phases || []).map((p, pi) => ({
      id: `phase-${now}-${pi}`,
      title: p.title,
      status: pi === 0 && existingPhases.length === 0 ? "doing" : "todo",
      subs: (p.subs || []).map((label, si) => ({
        id: `sub-${now}-${pi}-${si}`,
        label,
        done: false,
      })),
    }));
    newTemplateData = { phases: [...existingPhases, ...generatedPhases] };
  } else if (newTemplateType === "book") {
    const existingChapters = task.book?.chapters || [];
    const generatedChapters = (action.data.chapters || []).map((title, ci) => ({
      id: `ch-${now}-${ci}`,
      title,
      status: "unread",
      note: "",
    }));
    newTemplateData = { chapters: [...existingChapters, ...generatedChapters] };
  } else if (newTemplateType === "skill") {
    const existingDrills = task.skill?.drills || [];
    const generatedDrills = (action.data.drills || []).map((label, di) => ({
      id: `drill-${now}-${di}`,
      label,
      level: 1,
    }));
    newTemplateData = {
      drills: [...existingDrills, ...generatedDrills],
      recent: task.skill?.recent || [],
    };
  } else {
    break;
  }

  // If task had no template, assign the new one
  const updatedTemplate = task.template || newTemplateType;

  const merged = {
    ...task,
    template: updatedTemplate,
    [newTemplateType]: newTemplateData,
    lastTouched: new Date().toISOString(),
  };

  setTasks(prev => prev.map(t => t.id === action.taskId ? merged : t));
  await updateDoc(doc(db, "users", uid, "tasks", action.taskId), {
    template: updatedTemplate,
    templateData: newTemplateData,
    lastTouched: merged.lastTouched,
  });
  break;
}
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build 2>&1 | head -30`
Expected: no errors referencing `AppContext.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add apply_subtasks action to AppContext"
```

---

## Task 3: Build `src/components/SubtaskPreviewModal.jsx`

**Files:**
- Create: `src/components/SubtaskPreviewModal.jsx`

This modal:
1. Auto-triggers generation on open
2. Renders a skeleton while generating
3. Renders editable items (inline text fields + delete buttons) once done
4. Re-triggers on Personalized/General toggle
5. Calls `apply_subtasks` on approve

- [ ] **Step 1: Create the file**

```jsx
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
      // Flatten Gemini output into editable string arrays
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
    // Convert editable string arrays back to the format apply_subtasks expects
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

  // Project: update phase title
  const updatePhaseTitle = (pi, val) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => i === pi ? { ...p, title: val } : p);
      return { ...prev, data: { phases } };
    });
  };

  // Project: update sub label
  const updateSubLabel = (pi, si, val) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: p.subs.map((s, j) => j === si ? val : s) };
      });
      return { ...prev, data: { phases } };
    });
  };

  // Project: delete sub
  const deleteSub = (pi, si) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: p.subs.filter((_, j) => j !== si) };
      });
      return { ...prev, data: { phases } };
    });
  };

  // Project: delete phase
  const deletePhase = (pi) => {
    setEditableData(prev => ({
      ...prev,
      data: { phases: prev.data.phases.filter((_, i) => i !== pi) },
    }));
  };

  // Project: add sub
  const addSub = (pi) => {
    setEditableData(prev => {
      const phases = prev.data.phases.map((p, i) => {
        if (i !== pi) return p;
        return { ...p, subs: [...p.subs, ""] };
      });
      return { ...prev, data: { phases } };
    });
  };

  // Book: update chapter title
  const updateChapter = (ci, val) => {
    setEditableData(prev => ({
      ...prev,
      data: { chapters: prev.data.chapters.map((c, i) => i === ci ? val : c) },
    }));
  };

  // Book: delete chapter
  const deleteChapter = (ci) => {
    setEditableData(prev => ({
      ...prev,
      data: { chapters: prev.data.chapters.filter((_, i) => i !== ci) },
    }));
  };

  // Skill: update drill label
  const updateDrill = (di, val) => {
    setEditableData(prev => ({
      ...prev,
      data: { drills: prev.data.drills.map((d, i) => i === di ? val : d) },
    }));
  };

  // Skill: delete drill
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SubtaskPreviewModal.jsx
git commit -m "feat: add SubtaskPreviewModal component"
```

---

## Task 4: Wire "Generate subtasks" button into `NewTaskModal.jsx`

**Files:**
- Modify: `src/components/NewTaskModal.jsx`

- [ ] **Step 1: Add the import at the top of `NewTaskModal.jsx`**

After the existing imports, add:
```js
import SubtaskPreviewModal from "./SubtaskPreviewModal";
```

- [ ] **Step 2: Add state for the preview modal inside the `NewTaskModal` component**

After the existing `useState` declarations:
```js
const [showSubtaskPreview, setShowSubtaskPreview] = useState(false);
```

- [ ] **Step 3: Add the "Generate subtasks" button below the template selector**

The template selector block ends around line 361 with `</div>` (closing the `Interactive Template` section). Add the button immediately after that closing `</div>` and before the `{/* Chapters checklist Builder */}` comment:

```jsx
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
```

Note: the button is only shown when `editTask` is set (i.e., editing an existing task). For a brand new task, the task doesn't exist yet — instruct users to save first, then edit to generate. This avoids the complexity of creating the task mid-flow just to generate subtasks.

- [ ] **Step 4: Add the `SubtaskPreviewModal` at the bottom of the return, before the final closing tags**

Inside the `return (...)` block, just before the final closing `</div>` of `modal-sheet`:
```jsx
{showSubtaskPreview && editTask && (
  <SubtaskPreviewModal
    task={editTask}
    onClose={() => setShowSubtaskPreview(false)}
  />
)}
```

- [ ] **Step 5: Verify the build passes**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/NewTaskModal.jsx
git commit -m "feat: wire Generate subtasks button in NewTaskModal"
```

---

## Task 5: Add secondary "Generate subtasks" button in `NowView.jsx`

**Files:**
- Modify: `src/views/NowView.jsx`

- [ ] **Step 1: Add the import at the top of `NowView.jsx`**

After the existing imports:
```js
import SubtaskPreviewModal from "../components/SubtaskPreviewModal";
```

- [ ] **Step 2: Add state for the preview modal inside `NowView`**

After the existing `useState` declarations near the top of the component:
```js
const [showSubtaskPreview, setShowSubtaskPreview] = useState(false);
```

- [ ] **Step 3: Determine where to insert the button**

The active task title area renders the task info when `activeTask` exists. Find the section that renders the active task's title (search for `activeTask.title` in the JSX). Add the button below the task title, only when:
- `activeTask` exists
- `activeTask.template !== "idle"`
- The task has no existing subtasks yet

Insert this just below where the active task title is rendered:

```jsx
{/* Generate subtasks nudge — only when task has no subtasks */}
{activeTask && activeTask.template !== "idle" &&
  !(activeTask.template === "project" && (activeTask.project?.phases || []).length > 0) &&
  !(activeTask.template === "book"    && (activeTask.book?.chapters || []).length > 0) &&
  !(activeTask.template === "skill"   && (activeTask.skill?.drills || []).length > 0) && (
  <button
    type="button"
    className="btn btn-sm"
    style={{ fontSize: 11, marginTop: 6 }}
    onClick={() => setShowSubtaskPreview(true)}
  >
    ✦ Generate subtasks
  </button>
)}
```

- [ ] **Step 4: Add the modal at the end of the NowView return block**

Just before the closing `</div>` of the NowView root:
```jsx
{showSubtaskPreview && activeTask && (
  <SubtaskPreviewModal
    task={activeTask}
    onClose={() => setShowSubtaskPreview(false)}
  />
)}
```

- [ ] **Step 5: Verify the build passes**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/NowView.jsx
git commit -m "feat: add Generate subtasks button to NowView"
```

---

## Task 6: Manual end-to-end verification

No automated tests in this project. Verify manually.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open the app in a browser.

- [ ] **Step 2: Test from NewTaskModal (edit path)**

1. Open any existing task for editing (not an idle/drift task).
2. Confirm "✦ Generate subtasks" button appears below the template selector.
3. Click it — the SubtaskPreviewModal should open with a skeleton loading state.
4. Wait for generation — subtasks should appear as editable fields.
5. Edit one subtask label and delete another.
6. Click "Apply subtasks" — modal closes.
7. Reopen the task — confirm the generated (and edited) subtasks are present.

- [ ] **Step 3: Test Personalized / General toggle**

1. Open the SubtaskPreviewModal again on a task.
2. Toggle between "Personalized" and "General" — verify it re-generates (skeleton reappears).
3. If no profile exists, confirm "Personalized" button is visually disabled.

- [ ] **Step 4: Test context input**

1. Type something in the context field ("This is for a client pitch on Thursday").
2. Click "Regenerate" — verify the subtasks reflect the context.

- [ ] **Step 5: Test existing subtasks warning**

1. Open a task that already has phases/chapters/drills.
2. Open SubtaskPreviewModal — confirm the warning message appears.
3. Apply — confirm generated items are *appended*, not replaced.

- [ ] **Step 6: Test NowView button**

1. Set an active task that has no subtasks.
2. Go to NowView — confirm "✦ Generate subtasks" appears below the task title.
3. Click it — modal opens and works.
4. Set an active task that already HAS subtasks — confirm the button does NOT appear.

- [ ] **Step 7: Test error state**

1. Temporarily set `VITE_GEMINI_API_KEY` to an invalid value in `.env.local`.
2. Open SubtaskPreviewModal — confirm the error message appears with a "Try again" button.
3. Restore the valid key.

- [ ] **Step 8: Final commit if any fixes were made**

```bash
git add -p
git commit -m "fix: subtask generation edge cases from manual testing"
```
