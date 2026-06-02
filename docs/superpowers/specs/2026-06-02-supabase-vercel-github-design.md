# Design: Supabase Storage Migration + GitHub + Vercel Deployment

**Date:** 2026-06-02  
**Status:** Approved

## Overview

Migrate Mind Manager from a single-user localStorage-only SPA to a multi-user cloud-backed app. All state moves to Supabase (Auth + Postgres). The project is pushed to GitHub and deployed to Vercel with automatic deploys on push.

Three sub-projects executed in order:
1. GitHub — initialize repo and push
2. Supabase — schema, RLS, auth, data layer
3. Vercel — connect repo, set env vars, deploy

---

## 1. Supabase Schema

**Approach:** Hybrid — normalized rows for main entities, JSONB for nested template data.

All tables have `user_id uuid references auth.users` with Row Level Security enforcing `user_id = auth.uid()` on all SELECT / INSERT / UPDATE / DELETE operations.

### `tasks`

| column | type | notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `user_id` | uuid references auth.users not null | |
| `title` | text not null | |
| `kind` | text not null | work/learning/body/social/wealth/music/craft/errand/drift |
| `quad` | text not null | q1/q2/q3/q4 |
| `energy` | int not null | 1–5 |
| `moods` | text[] not null default '{}' | |
| `cadence` | text not null | daily/weekly/biweekly/loose/once |
| `done` | boolean not null default false | |
| `created_at` | timestamptz not null default now() | |
| `last_touched` | timestamptz not null default now() | |
| `template` | text | null / project / book / skill / idle |
| `template_data` | jsonb | full project/book/skill/idle object |

### `events`

| column | type | notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `user_id` | uuid references auth.users not null | |
| `type` | text not null | checkin / progress / switch / drift |
| `timestamp` | timestamptz not null default now() | |
| `task_id` | uuid references tasks(id) on delete set null | nullable |
| `task_title` | text | nullable |
| `title` | text | nullable |
| `energy` | int | nullable |
| `mood` | text[] not null default '{}' | |
| `mins` | int | nullable, for drift events |
| `note` | text | nullable |
| `switch_reason` | jsonb | nullable, for switch events |

### `daily_plans`

Unique constraint on `(user_id, date)`.

| column | type |
|---|---|
| `id` | uuid PK default gen_random_uuid() |
| `user_id` | uuid references auth.users not null |
| `date` | date not null |
| `task_ids` | uuid[] not null default '{}' |

### `chat_history`

Unique constraint on `(user_id, task_id)`.

| column | type | notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `user_id` | uuid references auth.users not null | |
| `task_id` | uuid references tasks(id) on delete cascade | |
| `messages` | jsonb not null default '[]' | `[{sender: "user"|"ai", text: string}]` |

### `user_preferences`

One row per user. PK is `user_id`.

| column | type | notes |
|---|---|---|
| `user_id` | uuid PK references auth.users | |
| `active_task_id` | uuid references tasks(id) on delete set null | nullable |
| `current_mood` | text | nullable |
| `last_checkin_at` | timestamptz | nullable |
| `last_checkin_energy` | int | nullable |
| `custom_mood_tags` | text[] not null default '{"productive","mindful","inspired"}' | |
| `tweaks` | jsonb not null default '{"moodModel":"energy-tags","density":"comfortable","theme":"light","accent":"#c9633f","celebrations":true,"sound":false}' | |

### RLS Policies (applied to all 5 tables)

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- etc. for all tables

-- Policy pattern (repeated per table)
CREATE POLICY "users can only access own data"
  ON tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 2. New Files

### `src/lib/supabase.js`

Supabase client singleton. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env.

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### `src/components/AuthGate.jsx`

Wraps the entire app. If no Supabase session → renders centered email/password form with toggle between Sign In and Sign Up modes. On successful auth, renders children.

Handles:
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signUp({ email, password })`
- `supabase.auth.signOut()`
- `supabase.auth.onAuthStateChange(...)` to reactively update session

---

## 3. Modified Files

### `src/context/AppContext.jsx`

**Removals:**
- All `localStorage.getItem/setItem` calls
- All `useEffect` persistence hooks
- The simulated `apiFetch` switch statement
- `DEMO_TASKS` and `DEMO_EVENTS` constants (moved to a `src/lib/seedData.js` helper)

**Additions:**
- Import `supabase` from `src/lib/supabase.js`
- `user` state from `supabase.auth.getUser()`
- `loadUserData(userId)` — fetches all 5 tables for the user on login; if `user_preferences` row doesn't exist yet (first login), seeds demo data then fetches
- `apiFetch` internals replaced — the exported function signature stays identical so no component changes are needed; internally it now dispatches to Supabase instead of the local switch
- `signOut` exposed via context so any component can trigger logout
- Apply `tweaks` to `document.documentElement` on data load (same behavior as before)

**Action → Supabase mapping:**

| action.type | Supabase operation |
|---|---|
| `create_task` | `tasks.insert` |
| `update_task` | `tasks.update` |
| `delete_task` | `tasks.delete` |
| `complete` | `tasks.update` (toggle done) |
| `set_active` | `user_preferences.update` (active_task_id) |
| `update_daily_plan` | `daily_plans.upsert` |
| `toggle_subtask` | `tasks.update` (template_data JSONB patch) |
| `advance_phase` | `tasks.update` (template_data JSONB patch) |
| `level_drill` | `tasks.update` (template_data JSONB patch) |
| `log_skill_session` | `tasks.update` (template_data JSONB patch) |
| `end_drift` | `tasks.update` (template_data JSONB patch) |
| `mark_chapter` | `tasks.update` (template_data JSONB patch) |
| `set_reading_chapter` | `tasks.update` (template_data JSONB patch) |
| `update_chapter_note` | `tasks.update` (template_data JSONB patch) |
| `add_mood_tag` | `user_preferences.update` (custom_mood_tags append) |
| `remove_mood_tag` | `user_preferences.update` (custom_mood_tags filter) |
| checkin (mood/energy) | `user_preferences.update` + `events.insert` |

All action handlers also update local React state optimistically so the UI feels instant.

### `src/views/NowView.jsx`

Replace `localStorage.getItem/setItem("mindCoach-{taskId}")` with:
- On task load: `supabase.from('chat_history').select('messages').eq('task_id', taskId).eq('user_id', userId).single()`
- On message send: `supabase.from('chat_history').upsert({ user_id, task_id, messages: updatedMessages })`

---

## 4. Seed Data

### `src/lib/seedData.js`

Exports `DEMO_TASKS` and `DEMO_EVENTS` arrays (moved from AppContext). Used only during first-login seeding.

Seeding flow in `loadUserData`:
1. Check if `user_preferences` row exists for `userId`
2. If not → first login: insert demo tasks, demo events, default `user_preferences` row
3. Fetch all data and populate state

---

## 5. Environment Variables

### `.env.local` (local dev)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### Vercel (production)
Same 3 variables set in Vercel project → Settings → Environment Variables.

---

## 6. GitHub

1. `git init` in project root
2. `git add .` (`.env.local` excluded by `.gitignore` via `*.local`)
3. Initial commit
4. Create repo on GitHub (manually or via `gh repo create`)
5. `git remote add origin` + `git push -u origin main`

---

## 7. Vercel Deployment

1. Connect GitHub repo to Vercel (import project)
2. Vercel auto-detects Vite — build command `npm run build`, output dir `dist`
3. Add `vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
4. Set env vars in Vercel dashboard
5. Deploy — subsequent pushes to `main` auto-deploy

---

## 8. Manual Supabase Setup Steps (before implementation)

These are done by the developer in the Supabase dashboard, not automated:

1. Create a new Supabase project at supabase.com
2. Run the SQL migration script (generated during implementation) in the SQL editor
3. Enable **Email** provider in Authentication → Providers
4. Copy `Project URL` and `anon public key` from Project Settings → API into `.env.local`

---

## Out of Scope

- OAuth providers (Google/GitHub) — can be added later via Supabase Auth settings
- Realtime subscriptions — on-demand fetch is sufficient
- Data export / import of existing localStorage data
- Email confirmation flow (can be disabled in Supabase Auth settings for simplicity)
