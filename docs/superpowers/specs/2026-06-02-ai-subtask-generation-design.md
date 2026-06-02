# AI Subtask Generation — Design Spec
Date: 2026-06-02

## Context

Sub-system 2 of 4 (Profile → **AI Subtask Generation** → Behavioral Coaching → Scheduling). Builds on the user profile from Part 1. Allows users to request an AI-generated subtask breakdown for any task, reviewed and approved before saving.

---

## Architecture

Three layers:

1. **Gemini function** (`src/lib/gemini.js`) — `generateSubtasks(task, userContext, personalized, profileSnapshot)`. Returns a structured object matching the task's template type.
2. **Preview modal** (`src/components/SubtaskPreviewModal.jsx`) — editable review UI before committing anything.
3. **AppContext action** — new `apply_subtasks` action type that writes the approved structure into the task's template fields and saves to Firestore.

---

## Trigger Points

The "Generate subtasks" button appears in two places:

- **NewTaskModal** — below the template selector, visible for all tasks except those with `idle` template
- **NowView** — secondary action below the active task title, only shown when the active task has no subtasks yet and is not an `idle` task

---

## Gemini Function

`generateSubtasks(task, userContext, personalized, profileSnapshot)`

**Prompt context includes:**
- Task title, kind, cadence, energy level (1–5)
- Mood tags on the task
- Template type (or "none")
- Optional free-text user context
- If personalized: key trait flags from profile snapshot (high perfectionism, low self-efficacy, etc.)

**Shaping rules baked into the system instruction:**
- Energy 4–5 → "break into smaller, lower-friction steps; first step should take under 10 minutes"
- Mood tags containing anxious / heavy / dreading → "make the first action extremely concrete and small"
- High perfectionism trait (personalized only) → "include a 'done is better than perfect' milestone"

**Return format — JSON matching the template type:**
- `project` → `{ phases: [{ title, subtasks: [{ title, done: false }] }] }`
- `book` → `{ chapters: [{ title, note: "" }] }`
- `skill` → `{ drills: [{ title, level: 1 }] }`
- No template → defaults to `project` format (and sets `task.template = "project"` on apply)

---

## Preview Modal (SubtaskPreviewModal)

**Layout:**
1. Header: task title + "AI-generated breakdown"
2. Toggle: "Personalized / General" — switching re-triggers the Gemini call
3. Optional context input: text field ("Add context for better results…") — user can type before generating or regenerate after typing
4. Generated subtasks as editable list — each item is an inline-editable text field with add and delete controls per item
5. For `project` template: grouped by phase, phases also editable
6. Footer: "Discard" (closes modal, nothing saved) and "Apply subtasks" (triggers `apply_subtasks` action)

**Loading state:** spinner on the button; modal opens immediately with skeleton placeholders while Gemini generates.

**Error state:** inline error with "Try again" button — modal stays open, nothing lost.

---

## Data Model & AppContext

No new fields on the task schema. The `apply_subtasks` action writes into the task's existing template fields.

**New action:**
```
{ type: "apply_subtasks", taskId, template, data }
```

**Merge behavior:**
- Task already has a template → appends generated items alongside existing ones (does not overwrite)
- Task has no template → sets `task.template = "project"` and writes the full generated structure

**Conflict warning:** if a task already has subtasks, the preview modal shows: "This task already has subtasks. Generated items will be added alongside them." User sees exactly what will be added before confirming.

---

## Profile Integration

Controlled by the Personalized / General toggle in the preview modal:

- **General** — uses only task metadata (title, kind, energy, mood tags, user context)
- **Personalized** — additionally passes the profile snapshot trait flags from Part 1 to shape tone, granularity, and milestone framing

The toggle defaults to Personalized if a profile exists, General otherwise.

---

## Energy & Mood Signals

These feed into the Gemini prompt regardless of personalized/general mode — they describe the task, not the user:

| Signal | Effect on generation |
|---|---|
| Energy 4–5 | Smaller steps, first step < 10 min |
| Mood: anxious / heavy / dreading | First action extremely concrete and small |
| High perfectionism (personalized) | Add a "ship it" milestone |

---

## Out of Scope

- Auto-generation on task creation (user-initiated only)
- Subtask generation for `idle` template (drift sessions have no meaningful subtask structure)
- Conflict resolution UI when merging into existing subtasks (warning only)
