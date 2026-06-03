# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build to dist/
npm run lint       # ESLint
npm run preview    # serve the dist/ build locally
firebase deploy    # deploy dist/ to Firebase Hosting (run after npm run build)
```

There are no tests. No test runner is configured.

## Environment

Create `.env.local` at the project root:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Without `VITE_GEMINI_API_KEY`, the Mind Coach chat panel and profile analysis features will fail. Without the Firebase vars, the app won't load at all (auth is required).

## Architecture

**Mind Manager** is a mood-aware personal task manager — a single-page React 19 app backed by Firebase Auth + Firestore. All user data is stored per-user in Firestore; there is no local-only fallback.

### Auth flow

`AuthGate` wraps the entire app. It reads `{ user, loading }` from `useAppData()` — while Firebase Auth is initializing, a loading screen is shown; once resolved, unauthenticated users see an email/password sign-in form. Sign-in is handled by Firebase Auth directly in `AuthGate`.

### State engine: `src/context/AppContext.jsx`

`AppDataProvider` owns all state. On auth, `loadUserData(uid)` fetches all Firestore subcollections in parallel. All state mutations go through `apiFetch("/actions", { method: "POST", body: { action: { type, ...payload } } })` — this is still a local switch statement, not an HTTP call, but each case now writes through to Firestore immediately after updating React state.

Action types: `set_active`, `complete`, `delete_task`, `update_task`, `create_task`, `update_daily_plan`, `toggle_subtask`, `advance_phase`, `level_drill`, `log_skill_session`, `end_drift`, `mark_chapter`, `set_reading_chapter`, `update_chapter_note`, `add_mood_tag`, `remove_mood_tag`.

Additional direct async methods (not routed through `apiFetch`): `handleMoodCheckin`, `logEvent`, `setTweak`, `saveProfileTraits`, `saveProfilePatterns`, `saveProfileContext`, `saveCoachSession`, `loadCoachSessions`, `saveMonthLog`, `saveQuarterLog`, `loadMonthLogs`, `loadQuarterLogs`, `deleteCoachSessions`.

All views consume state via `useAppData()`. Never call Firestore directly from components — always go through context.

### Firestore data model

All data lives under `users/{uid}/`:

| Subcollection / Document | Contents |
|---|---|
| `tasks/{taskId}` | Task documents (see task model below) |
| `events/{eventId}` | Timeline events (checkin, progress, switch, complete) |
| `daily_plans/{date}` | `{ taskIds: string[] }` — ordered task IDs for that date |
| `preferences/prefs` | `activeTaskId`, `currentMood`, `lastCheckinAt`, `lastCheckinEnergy`, `customMoodTags`, `tweaks` |
| `profile/traits` | Six psychological trait scores + histories |
| `profile/patterns` | Computed behavioral patterns |
| `profile/context` | User-provided context (goals, life situation) |
| `profile/sessions` subcollection | Past InsightsCoach conversation sessions |
| `profile/monthLogs/{yearMonth}` | Compressed monthly summaries |
| `profile/quarterLogs/{yearQuarter}` | Compressed quarterly summaries |

New users are seeded with sample tasks and events from `src/lib/seedData.js`.

Firestore serialization: template data is stored flat as `{ template: "project", templateData: {...} }` and reconstructed on read via `docToTask()`. The in-memory task has `task[template]` (e.g. `task.project`), but Firestore stores `templateData`.

### Task data model (in-memory)

Each task: `id`, `title`, `kind`, `quad`, `energy` (1–5), `moods[]`, `cadence`, `done`, `createdAt`, `lastTouched`, optional `template`.

- **Kinds:** work, learning, body, social, wealth, music, craft, errand, drift
- **Quads (Eisenhower):** q1 (do now), q2 (schedule), q3 (delegate), q4 (drop/drift)
- **Cadences:** daily, weekly, biweekly, loose, once
- **Templates:** `project` (phases + subtasks), `book` (chapters), `skill` (drills + levels), `idle` (drift sessions + time logs)

### Views (`src/views/`)

All views are lazy-loaded. They receive callbacks from `App.jsx` (`onSetActive`, `onEdit`, etc.) but read task/mood state directly from `useAppData()`.

- **NowView** — active task focus + Mind Coach (Gemini) chat panel; chat history persisted per-task in Firestore (via `saveCoachSession`)
- **TodayView** — drag-and-drop daily plan; plans in `dailyPlans[date]` as ordered task ID arrays
- **TasksView** — filterable task list (kind / quad / cadence)
- **MatrixView** — Eisenhower 2×2 grid
- **TimelineView** — event log rendered as a timeline
- **YouView** — psychological profile: onboarding quiz, trait score cards, InsightsCoach chat, monthly/quarterly log compression

### Psychological profile system (`src/views/YouView.jsx`)

Six traits are tracked: `conscientiousness`, `perfectionism`, `emotionalRegulation`, `timePerspective`, `impulsivity`, `selfEfficacy`. Each has `{ score: 0–100, history: [] }`. Scores are updated via Gemini-powered tune sessions (`generateTuneQuestions` / `updateProfileFromTune`). `computePatterns()` in `src/lib/profileUtils.js` derives behavioral patterns from task events. Monthly and quarterly summaries are compressed via `compressToMonthLog` / `compressToQuarterLog`.

### Theming

Theme, density, and accent color are applied to `document.documentElement` via `dataset.theme`, `dataset.density`, and CSS custom property `--accent`. `applyTweaksToDOM()` in AppDataProvider handles this; persisted in `preferences/prefs`.

### Gemini AI (`src/lib/gemini.js`)

Functions: `buildSystemPrompt()` (injects active task, mood, energy, events), `sendMessage()` (chat history reconstruction), `scoreOnboardingAnswers()` (trait scoring from quiz), `generateTuneQuestions()` / `updateProfileFromTune()` (adaptive trait recalibration), `compressToMonthLog()` / `compressToQuarterLog()` (session compression).

Model: `gemini-2.0-flash`. Switch model name in `src/lib/gemini.js` to upgrade.

### Important files

| File | Role |
|---|---|
| `src/context/AppContext.jsx` | All state, Firestore reads/writes, `apiFetch` action router |
| `src/App.jsx` | Layout scaffold, celebration effects, mood check-in modal |
| `src/lib/firebase.js` | Firebase app init, exports `auth` and `db` |
| `src/lib/gemini.js` | Gemini client, system prompt builder, profile AI functions |
| `src/lib/profileUtils.js` | `computePatterns()` and date utilities for YouView |
| `src/components/NewTaskModal.jsx` | Create/edit task form — routes through `apiFetch` |
| `src/components/AuthGate.jsx` | Auth wall — renders sign-in/sign-up or children |
| `src/components/ProfileOnboarding.jsx` | First-run trait questionnaire |
| `src/components/InsightsCoach.jsx` | Persistent Gemini chat for psychological coaching |
