# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build to dist/
npm run lint       # ESLint
npm run preview    # serve the dist/ build locally
```

There are no tests. No test runner is configured.

## Environment

Create `.env.local` at the project root for the AI coach feature:

```
VITE_GEMINI_API_KEY=your_key_here
```

Without this key, the Mind Coach chat panel in NowView falls back to an error message.

## Architecture

**Mind Manager** is a mood-aware personal task manager — a single-page React 19 app with no backend. All state lives in `localStorage` under `mind*` keys and is managed by a single React context.

### State engine: `src/context/AppContext.jsx`

`AppDataProvider` is the entire backend. All state mutations go through `apiFetch("/actions", { method: "POST", body: { action: { type, ...payload } } })` which is a local switch statement — not a real HTTP call. This pattern is intentional: the app was designed to optionally swap to a real backend without changing callers.

Action types: `set_active`, `complete`, `delete_task`, `update_task`, `create_task`, `update_daily_plan`, `toggle_subtask`, `advance_phase`, `level_drill`, `log_skill_session`, `end_drift`, `mark_chapter`, `set_reading_chapter`, `update_chapter_note`, `add_mood_tag`, `remove_mood_tag`.

All views consume state via `useAppData()`. Never read from `localStorage` directly in components — always go through the context.

### Task data model

Each task has: `id`, `title`, `kind`, `quad`, `energy` (1–5), `moods[]`, `cadence`, `done`, `createdAt`, `lastTouched`, and an optional `template`.

- **Kinds:** work, learning, body, social, wealth, music, craft, errand, drift
- **Quads (Eisenhower):** q1 (do now), q2 (schedule), q3 (delegate), q4 (drop/drift)
- **Cadences:** daily, weekly, biweekly, loose, once
- **Templates:** `project` (phases with subtasks), `book` (chapters), `skill` (drills with levels), `idle` (drift sessions with time logs)

Template data lives on the task itself under `task.project`, `task.book`, `task.skill`, or `task.idle`.

### Views (`src/views/`)

All views are lazy-loaded. They receive callbacks from `App.jsx` (`onSetActive`, `onEdit`, etc.) but read task/mood state directly from `useAppData()`.

- **NowView** — active task focus + Mind Coach (Gemini) chat panel; chat history persisted per task in `localStorage` under `mindCoach-{taskId}`
- **TodayView** — drag-and-drop daily plan; daily plans stored in `dailyPlans[date]` as ordered task ID arrays
- **TasksView** — filterable task list with kind/quad/cadence filters
- **MatrixView** — Eisenhower 2×2 grid; tasks sorted into q1–q4 quadrants
- **TimelineView** — event log (check-ins, completions, switches) rendered as a timeline

### Theming

Theme, density, and accent color are applied via `document.documentElement.dataset.theme`, `dataset.density`, and CSS custom property `--accent`. The `tweaks` object in context drives this — stored as `mindTweaks` in localStorage and applied in a `useEffect` in `AppDataProvider`.

### Gemini AI coach (`src/lib/gemini.js`)

`buildSystemPrompt()` injects active task, current mood, energy level, and recent events into a Gemini system instruction. `sendMessage()` converts the app's `{sender, text}[]` chat format to Gemini's `{role, parts}[]` format and recreates the chat session from history on every call (stateless — localStorage is the source of truth).

Model: `gemini-2.0-flash`. Switch model name in `src/lib/gemini.js` to upgrade.

### Important files

| File | Role |
|---|---|
| `src/context/AppContext.jsx` | All state + the simulated action API |
| `src/App.jsx` | Layout scaffold, celebration effects, mood check-in modal |
| `src/lib/gemini.js` | Gemini client + system prompt builder |
| `src/components/NewTaskModal.jsx` | Create/edit task form — routes through `apiFetch` |
| `src/reference_index.js` | Compiled bundle artifact — do not edit, referenced by `dist/` |

### Pending plans

`docs/superpowers/plans/` contains two implementation plans written but not yet executed:
- **plan-a** — bug fixes: `create_task` in AppContext, NewTaskModal page reload removal, TodayView `activeTaskId` missing, drag save performance, `isMobileGrid` reactivity
- **plan-b** — Gemini AI coach wiring (SDK is installed, `src/lib/gemini.js` exists, but NowView still has the old fake `setTimeout` chatbot)
