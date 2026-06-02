# Supabase + Vercel + GitHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Mind Manager from localStorage to Supabase (multi-user, auth, cloud data), push to GitHub, and deploy to Vercel.

**Architecture:** Supabase Auth handles email/password login; all app state moves to 5 Postgres tables with Row Level Security; `AppContext.jsx` is fully rewritten to replace `localStorage` reads/writes with Supabase calls while keeping the same exported interface so zero view components change; an `AuthGate` component wraps `AppLayout` to show a login form when no session exists.

**Tech Stack:** React 19, Vite, Supabase JS SDK v2, Vercel

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/lib/supabase.js` | Supabase client singleton |
| Create | `src/lib/seedData.js` | Demo data factory for first-login seeding |
| Create | `src/components/AuthGate.jsx` | Login/signup form shown when no session |
| Create | `vercel.json` | SPA rewrite rule so direct URLs don't 404 |
| Rewrite | `src/context/AppContext.jsx` | Replace localStorage with Supabase; real auth |
| Modify | `src/App.jsx` | Add `<AuthGate>`, remove `localStorage` for view |
| Modify | `src/views/NowView.jsx` | Chat history read/write via Supabase |

---

## Prerequisites (Manual — Do Before Any Coding)

- [ ] **Create a Supabase project** at [supabase.com](https://supabase.com). Note your **Project URL** and **anon public key** from Project Settings → API.
- [ ] **Enable Email provider** in Supabase dashboard → Authentication → Providers → Email. Disable "Confirm email" for easier dev testing (you can re-enable for production).
- [ ] **Create a GitHub repo** at github.com (name it `mind-manager` or similar). Note the remote URL.
- [ ] Make sure `gh` CLI is authenticated (`gh auth status`) or you have git credentials set up.

---

## Task 1: GitHub — Init Repo and Push

**Files:** none (git operations only)

- [ ] **Step 1: Initialize git repo**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
git init
git branch -M main
```

Expected: `Initialized empty Git repository in .../Task Manager/.git/`

- [ ] **Step 2: Verify .gitignore excludes secrets**

Check that `.gitignore` contains `*.local` (it does — this excludes `.env.local` which holds API keys).

- [ ] **Step 3: Stage and commit everything**

```bash
git add CLAUDE.md README.md eslint.config.js index.html package.json package-lock.json vite.config.js src public docs
git commit -m "chore: initial commit — Mind Manager SPA"
```

Expected: commit succeeds, shows file count.

- [ ] **Step 4: Add remote and push**

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Expected: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

---

## Task 2: Install Supabase SDK

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
npm install @supabase/supabase-js
```

Expected: output contains `added 1 package` (or similar), no errors.

- [ ] **Step 2: Add Supabase env vars to .env.local**

Open `.env.local` and add (fill in real values from Supabase dashboard):

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_GEMINI_API_KEY=your-existing-key
```

- [ ] **Step 3: Commit dependency change**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js"
```

---

## Task 3: SQL Migration — Run in Supabase SQL Editor

**Files:** none (SQL runs in Supabase dashboard)

- [ ] **Step 1: Open SQL Editor** in Supabase dashboard and paste the entire script below, then click Run.

```sql
-- tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  kind text NOT NULL,
  quad text NOT NULL,
  energy int NOT NULL,
  moods text[] NOT NULL DEFAULT '{}',
  cadence text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_touched timestamptz NOT NULL DEFAULT now(),
  template text,
  template_data jsonb
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_tasks" ON tasks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text,
  title text,
  energy int,
  mood text[] NOT NULL DEFAULT '{}',
  mins int,
  note text,
  switch_reason jsonb
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_events" ON events FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- daily_plans table
CREATE TABLE daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  task_ids uuid[] NOT NULL DEFAULT '{}',
  UNIQUE (user_id, date)
);
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_daily_plans" ON daily_plans FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- chat_history table
CREATE TABLE chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  UNIQUE (user_id, task_id)
);
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_chat_history" ON chat_history FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_preferences table
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  active_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  current_mood text,
  last_checkin_at timestamptz,
  last_checkin_energy int,
  custom_mood_tags text[] NOT NULL DEFAULT '{"productive","mindful","inspired"}',
  tweaks jsonb NOT NULL DEFAULT '{"moodModel":"energy-tags","density":"comfortable","theme":"light","accent":"#c9633f","celebrations":true,"sound":false}'
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_preferences" ON user_preferences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

- [ ] **Step 2: Verify tables exist**

In Supabase dashboard → Table Editor, confirm 5 tables appear: `tasks`, `events`, `daily_plans`, `chat_history`, `user_preferences`.

---

## Task 4: Create `src/lib/supabase.js`

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Create the file**

`src/lib/supabase.js`:
```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: add Supabase client singleton"
```

---

## Task 5: Create `src/lib/seedData.js`

**Files:**
- Create: `src/lib/seedData.js`

- [ ] **Step 1: Create the file**

`src/lib/seedData.js`:
```js
export function createSeedData(userId) {
  const id1 = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  const id3 = crypto.randomUUID();
  const id4 = crypto.randomUUID();
  const now = new Date().toISOString();
  const d1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const tasks = [
    {
      id: id1,
      user_id: userId,
      title: "Launch Mind Manager Application",
      kind: "work",
      quad: "q1",
      energy: 5,
      moods: ["focused", "creative"],
      cadence: "once",
      done: false,
      created_at: now,
      last_touched: now,
      template: "project",
      template_data: {
        phases: [
          {
            id: "phase-1",
            title: "Local State Engine Scaffold",
            status: "done",
            subs: [
              { id: "sub-1", label: "Create AppContext.jsx store", done: true },
              { id: "sub-2", label: "Implement local storage caching", done: true },
            ],
          },
          {
            id: "phase-2",
            title: "Build Premium Views & Drag-and-Drop Planning",
            status: "doing",
            subs: [
              { id: "sub-3", label: "Integrate Eisenhower Priority Matrix Grid", done: true },
              { id: "sub-4", label: "Implement Drag and Drop in Today's Plan", done: false },
              { id: "sub-5", label: "Design SVG Timeline charts", done: false },
            ],
          },
          {
            id: "phase-3",
            title: "Verify Responsiveness & Sound Celebrations",
            status: "todo",
            subs: [
              { id: "sub-6", label: "Add soft completes chime audio", done: false },
              { id: "sub-7", label: "Verify Light/Dark theme density controls", done: false },
            ],
          },
        ],
      },
    },
    {
      id: id2,
      user_id: userId,
      title: "Read 'Atomic Habits' by James Clear",
      kind: "learning",
      quad: "q2",
      energy: 2,
      moods: ["calm", "curious"],
      cadence: "daily",
      done: false,
      created_at: d1,
      last_touched: now,
      template: "book",
      template_data: {
        chapters: [
          { id: "ch-1", title: "The Fundamentals: Why Tiny Changes Make a Big Difference", status: "done", note: "1% better every day compounding effect." },
          { id: "ch-2", title: "The 1st Law: Make It Obvious", status: "reading", note: "Implementation intentions and habit stacking." },
          { id: "ch-3", title: "The 2nd Law: Make It Attractive", status: "unread", note: "" },
          { id: "ch-4", title: "The 3rd Law: Make It Easy", status: "unread", note: "" },
          { id: "ch-5", title: "The 4th Law: Make It Satisfying", status: "unread", note: "" },
        ],
      },
    },
    {
      id: id3,
      user_id: userId,
      title: "Master HSL & OKLCH Color Gradients",
      kind: "craft",
      quad: "q2",
      energy: 4,
      moods: ["creative", "focused"],
      cadence: "weekly",
      done: false,
      created_at: d3,
      last_touched: now,
      template: "skill",
      template_data: {
        drills: [
          { id: "drill-1", label: "Fluid Type Scales Layouts", level: 3 },
          { id: "drill-2", label: "OKLCH Lightness and Chroma Mapping", level: 4 },
          { id: "drill-3", label: "CSS Variables Animation Transitions", level: 2 },
        ],
        recent: [
          { when: now, drill: "OKLCH Lightness and Chroma Mapping", note: "Adjusted lightness curve from 20% to 95%." },
          { when: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), drill: "Fluid Type Scales Layouts", note: "Configured CSS clamp() font rules." },
        ],
      },
    },
    {
      id: id4,
      user_id: userId,
      title: "Mindfulness and Deep Breathing",
      kind: "drift",
      quad: "q4",
      energy: 1,
      moods: ["calm", "restless", "tired"],
      cadence: "daily",
      done: false,
      created_at: now,
      last_touched: now,
      template: "idle",
      template_data: {
        lastDrifts: [
          { when: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), mins: 15, note: "Felt very relaxed and recharged.", mood: ["calm"] },
        ],
      },
    },
  ];

  const events = [
    {
      user_id: userId,
      type: "checkin",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      energy: 3,
      mood: ["calm", "focused"],
    },
    {
      user_id: userId,
      type: "progress",
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      task_id: id2,
      task_title: "Read 'Atomic Habits' by James Clear",
      title: "Marked Chapter 1 as Done",
      energy: 3,
      mood: ["calm"],
    },
    {
      user_id: userId,
      type: "drift",
      timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      task_id: id4,
      task_title: "Mindfulness and Deep Breathing",
      mins: 15,
      note: "Felt very relaxed and recharged.",
      energy: 2,
      mood: ["calm"],
    },
    {
      user_id: userId,
      type: "checkin",
      timestamp: now,
      energy: 4,
      mood: ["focused", "creative"],
    },
  ];

  return { tasks, events };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/seedData.js
git commit -m "feat: add demo seed data factory"
```

---

## Task 6: Create `src/components/AuthGate.jsx`

**Files:**
- Create: `src/components/AuthGate.jsx`

- [ ] **Step 1: Create the file**

`src/components/AuthGate.jsx`:
```jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAppData } from "../context/AppContext";

export default function AuthGate({ children }) {
  const { user, loading } = useAppData();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg, #fff)" }}>
        <p style={{ color: "var(--ink-2, #888)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (user) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: authError } = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setSubmitting(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg, #f8f8f8)" }}>
      <div style={{ width: 340, padding: 32, background: "var(--surface, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e5e5)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "var(--ink, #111)" }}>Mind Manager</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e5e5)", fontSize: 14, outline: "none", background: "var(--bg, #fff)", color: "var(--ink, #111)" }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e5e5)", fontSize: 14, outline: "none", background: "var(--bg, #fff)", color: "var(--ink, #111)" }}
          />
          {error && <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "11px 0", borderRadius: 8, background: "var(--accent, #c9633f)", color: "#fff", border: "none", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          onClick={() => { setMode(m => m === "signup" ? "signin" : "signup"); setError(null); }}
          style={{ marginTop: 16, background: "none", border: "none", fontSize: 13, color: "var(--ink-2, #888)", cursor: "pointer", width: "100%", textAlign: "center" }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AuthGate.jsx
git commit -m "feat: add AuthGate login/signup component"
```

---

## Task 7: Rewrite `src/context/AppContext.jsx`

**Files:**
- Modify: `src/context/AppContext.jsx`

This is a complete rewrite. Replace the entire file contents.

- [ ] **Step 1: Replace entire file**

`src/context/AppContext.jsx`:
```jsx
import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { createSeedData } from "../lib/seedData";

const AppDataContext = createContext(null);

// --- Date Helpers (unchanged, still exported) ---
export function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

// --- Row ↔ App Object Mappers ---

function rowToTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    kind: row.kind,
    quad: row.quad,
    energy: row.energy,
    moods: row.moods,
    cadence: row.cadence,
    done: row.done,
    createdAt: row.created_at,
    lastTouched: row.last_touched,
    template: row.template,
  };
  if (row.template && row.template_data) {
    task[row.template] = row.template_data;
  }
  return task;
}

function taskUpdatesToRow(updates) {
  const row = {};
  for (const [k, v] of Object.entries(updates)) {
    if (k === "createdAt") row.created_at = v;
    else if (k === "lastTouched") row.last_touched = v;
    else if (["project", "book", "skill", "idle"].includes(k)) row.template_data = v;
    else row[k] = v;
  }
  return row;
}

function rowToEvent(row) {
  return {
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    taskId: row.task_id,
    taskTitle: row.task_title,
    title: row.title,
    energy: row.energy,
    mood: row.mood,
    mins: row.mins,
    note: row.note,
    switchReason: row.switch_reason,
  };
}

// --- Provider ---

export function AppDataProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = initializing
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [lastCheckInAt, setLastCheckInAt] = useState(null);
  const [lastCheckInEnergy, setLastCheckInEnergy] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [customMoodTags, setCustomMoodTags] = useState(["productive", "mindful", "inspired"]);
  const [tweaks, setTweaksState] = useState({
    moodModel: "energy-tags",
    density: "comfortable",
    theme: "light",
    accent: "#c9633f",
    celebrations: true,
    sound: false,
  });
  const [dailyPlans, setDailyPlans] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadUserData(u.id);
      } else {
        setTasks([]);
        setEvents([]);
        setCurrentMood(null);
        setLastCheckInAt(null);
        setLastCheckInEnergy(null);
        setActiveTaskId(null);
        setCustomMoodTags(["productive", "mindful", "inspired"]);
        setDailyPlans({});
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(uid) {
    setLoading(true);
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (!existing) {
      const { tasks: seedTasks, events: seedEvents } = createSeedData(uid);
      await supabase.from("tasks").insert(seedTasks);
      await supabase.from("events").insert(seedEvents);
      await supabase.from("user_preferences").insert({
        user_id: uid,
        custom_mood_tags: ["productive", "mindful", "inspired"],
        tweaks: { moodModel: "energy-tags", density: "comfortable", theme: "light", accent: "#c9633f", celebrations: true, sound: false },
      });
    }

    const [tasksRes, eventsRes, plansRes, prefsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", uid).order("created_at"),
      supabase.from("events").select("*").eq("user_id", uid).order("timestamp", { ascending: false }),
      supabase.from("daily_plans").select("*").eq("user_id", uid),
      supabase.from("user_preferences").select("*").eq("user_id", uid).single(),
    ]);

    setTasks((tasksRes.data || []).map(rowToTask));
    setEvents((eventsRes.data || []).map(rowToEvent));

    const plansMap = {};
    for (const plan of (plansRes.data || [])) {
      plansMap[plan.date] = plan.task_ids;
    }
    setDailyPlans(plansMap);

    if (prefsRes.data) {
      const p = prefsRes.data;
      setActiveTaskId(p.active_task_id);
      setCurrentMood(p.current_mood);
      setLastCheckInAt(p.last_checkin_at);
      setLastCheckInEnergy(p.last_checkin_energy);
      setCustomMoodTags(p.custom_mood_tags);
      setTweaksState(p.tweaks);
      applyTweaksToDOM(p.tweaks);
    }

    setLoading(false);
  }

  function applyTweaksToDOM(t) {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.density = t.density;
    if (t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  }

  const setTweak = async (key, value) => {
    const newTweaks = { ...tweaks, [key]: value };
    setTweaksState(newTweaks);
    applyTweaksToDOM(newTweaks);
    if (user) {
      await supabase.from("user_preferences").update({ tweaks: newTweaks }).eq("user_id", user.id);
    }
  };

  const handleMoodCheckin = async (mood, energy, tags = []) => {
    const now = new Date().toISOString();
    const newTags = [...new Set([...customMoodTags, ...tags.filter(t => !customMoodTags.includes(t))])];
    setCurrentMood(mood);
    setLastCheckInAt(now);
    setLastCheckInEnergy(energy);
    setCustomMoodTags(newTags);

    if (!user) return;

    await supabase.from("user_preferences").update({
      current_mood: mood,
      last_checkin_at: now,
      last_checkin_energy: energy,
      custom_mood_tags: newTags,
    }).eq("user_id", user.id);

    const { data: newEvent } = await supabase.from("events").insert({
      user_id: user.id,
      type: "checkin",
      timestamp: now,
      energy,
      mood: [mood, ...tags],
    }).select().single();

    if (newEvent) setEvents(prev => [rowToEvent(newEvent), ...prev]);
  };

  const logEvent = async (eventData) => {
    if (!user) return;
    const { data: newEvent } = await supabase.from("events").insert({
      user_id: user.id,
      type: eventData.type,
      timestamp: new Date().toISOString(),
      task_id: eventData.taskId || null,
      task_title: eventData.taskTitle || null,
      title: eventData.title || null,
      energy: eventData.energy || null,
      mood: currentMood ? [currentMood] : [],
      mins: eventData.mins || null,
      note: eventData.note || null,
      switch_reason: eventData.switchReason || null,
    }).select().single();
    if (newEvent) setEvents(prev => [rowToEvent(newEvent), ...prev]);
  };

  const signIn = async (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => supabase.auth.signOut();

  const apiFetch = async (path, options = {}) => {
    if (path === "/timeline") return { events };
    if (path !== "/actions") throw new Error(`Unsupported endpoint: ${path}`);

    const { action } = options.body || {};
    if (!action) return null;

    let celebration = null;
    const uid = user?.id;

    switch (action.type) {
      case "add_mood_tag": {
        if (action.tag && !customMoodTags.includes(action.tag)) {
          const newTags = [...customMoodTags, action.tag];
          setCustomMoodTags(newTags);
          if (uid) await supabase.from("user_preferences").update({ custom_mood_tags: newTags }).eq("user_id", uid);
        }
        break;
      }

      case "remove_mood_tag": {
        const newTags = customMoodTags.filter(t => t !== action.tag);
        setCustomMoodTags(newTags);
        if (uid) await supabase.from("user_preferences").update({ custom_mood_tags: newTags }).eq("user_id", uid);
        break;
      }

      case "set_active": {
        const prevActiveId = activeTaskId;
        const nextActiveId = action.taskId;
        setActiveTaskId(nextActiveId);
        if (uid) await supabase.from("user_preferences").update({ active_task_id: nextActiveId }).eq("user_id", uid);

        if (nextActiveId) {
          const task = tasks.find(t => t.id === nextActiveId);
          if (task) {
            const now = new Date().toISOString();
            setTasks(prev => prev.map(t => t.id === nextActiveId ? { ...t, lastTouched: now } : t));
            if (uid) await supabase.from("tasks").update({ last_touched: now }).eq("id", nextActiveId);

            const eventData = prevActiveId && prevActiveId !== nextActiveId
              ? { type: "switch", taskId: nextActiveId, title: `Switched to: ${task.title}`, taskTitle: task.title, switchReason: action.switchReason || { kind: "switch", note: "Left previous task" } }
              : { type: "progress", taskId: nextActiveId, title: `Started working on: ${task.title}`, taskTitle: task.title };
            await logEvent(eventData);
          }
        }
        break;
      }

      case "complete": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task) break;
        const isDone = !task.done;
        const now = new Date().toISOString();
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, done: isDone, lastTouched: now } : t));
        if (uid) await supabase.from("tasks").update({ done: isDone, last_touched: now }).eq("id", action.taskId);
        await logEvent({ type: "progress", taskId: action.taskId, title: isDone ? `Completed task: ${task.title}` : `Reopened task: ${task.title}`, taskTitle: task.title });
        if (isDone) {
          celebration = { type: "task_complete", title: task.title, sound: tweaks.sound };
          if (activeTaskId === action.taskId) {
            setActiveTaskId(null);
            if (uid) await supabase.from("user_preferences").update({ active_task_id: null }).eq("user_id", uid);
          }
        }
        break;
      }

      case "delete_task": {
        const affectedDates = Object.entries(dailyPlans)
          .filter(([, ids]) => ids.includes(action.taskId))
          .map(([date]) => date);

        setTasks(prev => prev.filter(t => t.id !== action.taskId));
        if (activeTaskId === action.taskId) {
          setActiveTaskId(null);
          if (uid) await supabase.from("user_preferences").update({ active_task_id: null }).eq("user_id", uid);
        }
        setDailyPlans(prev => {
          const updated = { ...prev };
          for (const date of Object.keys(updated)) {
            updated[date] = updated[date].filter(id => id !== action.taskId);
          }
          return updated;
        });
        if (uid) {
          await supabase.from("tasks").delete().eq("id", action.taskId);
          for (const date of affectedDates) {
            const newIds = dailyPlans[date].filter(id => id !== action.taskId);
            await supabase.from("daily_plans").upsert({ user_id: uid, date, task_ids: newIds }, { onConflict: "user_id,date" });
          }
        }
        break;
      }

      case "update_task": {
        const now = new Date().toISOString();
        const merged = { ...action.task, lastTouched: now };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, ...merged } : t));
        if (uid) await supabase.from("tasks").update({ ...taskUpdatesToRow(merged) }).eq("id", action.taskId);
        break;
      }

      case "create_task": {
        if (!uid) break;
        const newRow = {
          user_id: uid,
          title: action.task.title,
          kind: action.task.kind,
          quad: action.task.quad,
          energy: action.task.energy,
          moods: action.task.moods || [],
          cadence: action.task.cadence,
          done: false,
          template: action.task.template || null,
          template_data: action.task.template ? (action.task[action.task.template] || null) : null,
        };
        const { data: created } = await supabase.from("tasks").insert(newRow).select().single();
        if (created) setTasks(prev => [...prev, rowToTask(created)]);
        break;
      }

      case "update_daily_plan": {
        setDailyPlans(prev => ({ ...prev, [action.date]: action.taskIds }));
        if (uid) await supabase.from("daily_plans").upsert({ user_id: uid, date: action.date, task_ids: action.taskIds }, { onConflict: "user_id,date" });
        break;
      }

      case "toggle_subtask": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.project) break;
        const phases = task.project.phases.map(p => {
          if (p.id !== action.phaseId) return p;
          return { ...p, subs: p.subs.map(s => s.id === action.subId ? { ...s, done: !s.done } : s) };
        });
        const newTemplateData = { ...task.project, phases };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, project: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        break;
      }

      case "advance_phase": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.project) break;
        let celebrationMsg = "";
        const phases = task.project.phases.map((p, idx) => {
          if (p.id === action.phaseId) { celebrationMsg = `Completed Phase: ${p.title}`; return { ...p, status: "done" }; }
          if (idx > 0 && task.project.phases[idx - 1].id === action.phaseId) return { ...p, status: "doing" };
          return p;
        });
        const newTemplateData = { ...task.project, phases };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, project: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        celebration = { type: "phase_complete", text: celebrationMsg, sound: tweaks.sound };
        await logEvent({ type: "milestone", taskId: action.taskId, title: celebrationMsg, taskTitle: task.title });
        break;
      }

      case "level_drill": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.skill) break;
        const drills = task.skill.drills.map(d => d.id === action.drillId ? { ...d, level: action.level } : d);
        const newTemplateData = { ...task.skill, drills };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, skill: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        if (action.level === 5) celebration = { type: "drill_max", title: "Drill Mastery Set!", sound: tweaks.sound };
        break;
      }

      case "log_skill_session": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.skill) break;
        const timestamp = new Date().toISOString();
        const recent = [{ when: timestamp, drill: action.drill, note: action.note }, ...(task.skill.recent || [])];
        const newTemplateData = { ...task.skill, recent };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, skill: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        celebration = { type: "session_logged", text: `Logged practice session for ${action.drill || "Skill"}`, sound: tweaks.sound };
        await logEvent({ type: "progress", taskId: action.taskId, title: `Logged Session: ${action.note}`, taskTitle: task.title });
        break;
      }

      case "end_drift": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.idle) break;
        const timestamp = new Date().toISOString();
        const lastDrifts = [{ when: timestamp, mins: action.mins, note: action.note, mood: currentMood ? [currentMood] : [] }, ...(task.idle.lastDrifts || [])];
        const newTemplateData = { ...task.idle, lastDrifts };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, idle: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        await logEvent({ type: "drift", taskId: action.taskId, taskTitle: task.title, mins: action.mins, note: action.note });
        setActiveTaskId(null);
        if (uid) await supabase.from("user_preferences").update({ active_task_id: null }).eq("user_id", uid);
        break;
      }

      case "mark_chapter": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.book) break;
        let chapterTitle = "";
        const chapters = task.book.chapters.map(c => {
          if (c.id === action.chapterId) { chapterTitle = c.title; return { ...c, status: action.status === "done" ? "done" : "unread" }; }
          return c;
        });
        const newTemplateData = { ...task.book, chapters };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, book: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        if (action.status === "done") {
          celebration = { type: "chapter_done", text: `Finished Chapter: ${chapterTitle}`, sound: tweaks.sound };
          await logEvent({ type: "progress", taskId: action.taskId, title: `Finished Chapter: ${chapterTitle}`, taskTitle: task.title });
        }
        break;
      }

      case "set_reading_chapter": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.book) break;
        const chapters = task.book.chapters.map(c => {
          if (c.id === action.chapterId) return { ...c, status: "reading" };
          if (c.status === "reading") return { ...c, status: "unread" };
          return c;
        });
        const newTemplateData = { ...task.book, chapters };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, book: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        break;
      }

      case "update_chapter_note": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.book) break;
        const chapters = task.book.chapters.map(c =>
          c.id === action.chapterId ? { ...c, note: action.note } : c
        );
        const newTemplateData = { ...task.book, chapters };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, book: newTemplateData } : t));
        if (uid) await supabase.from("tasks").update({ template_data: newTemplateData }).eq("id", action.taskId);
        break;
      }

      default:
        break;
    }

    return { celebration };
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      tasks,
      setTasks,
      events,
      currentMood,
      lastCheckInAt,
      lastCheckInEnergy,
      activeTaskId,
      customMoodTags,
      tweaks,
      setTweak,
      dailyPlans,
      apiFetch,
      handleMoodCheckin,
      logEvent,
      signIn,
      signOut,
    }),
    [user, loading, tasks, events, currentMood, lastCheckInAt, lastCheckInEnergy, activeTaskId, customMoodTags, tweaks, dailyPlans]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// --- Hooks ---

export function useAuth() {
  const { user, signIn, signOut } = useAppData();
  return { user, signIn, signOut, allowListError: false };
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within an AppDataProvider");
  return context;
}

export function useTasks() {
  const { tasks } = useAppData();
  return { tasks, loading: false, error: null };
}

export function useMood() {
  const { currentMood, lastCheckInAt, activeTaskId, customMoodTags } = useAppData();
  return { currentMood, lastCheckInAt, activeTaskId, customMoodTags, loading: false, error: null };
}

export function useDailyPlan(date) {
  const { dailyPlans } = useAppData();
  const plan = useMemo(() => ({ date, taskIds: dailyPlans[date] || [] }), [dailyPlans, date]);
  return { plan, loading: false, error: null };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: migrate AppContext from localStorage to Supabase"
```

---

## Task 8: Modify `src/App.jsx`

**Files:**
- Modify: `src/App.jsx`

Two changes: add `AuthGate` wrapper around `AppLayout`, remove `localStorage` usage for the active view.

- [ ] **Step 1: Add AuthGate import**

In `src/App.jsx`, add this import after the existing imports:
```jsx
import AuthGate from "./components/AuthGate";
```

- [ ] **Step 2: Wrap AppLayout with AuthGate**

Find this section near the bottom of `App.jsx`:
```jsx
    <AppDataProvider>
      <AppLayout />
    </AppDataProvider>
```

Replace it with:
```jsx
    <AppDataProvider>
      <AuthGate>
        <AppLayout />
      </AuthGate>
    </AppDataProvider>
```

- [ ] **Step 3: Remove localStorage usage for view**

Find:
```jsx
  const [view, setView] = useState(() => localStorage.getItem("mindView") || "now");
```

Replace with:
```jsx
  const [view, setView] = useState("now");
```

Find:
```jsx
  const handleViewChange = (v) => {
    setView(v);
    localStorage.setItem("mindView", v);
  };
```

Replace with:
```jsx
  const handleViewChange = (v) => {
    setView(v);
  };
```

- [ ] **Step 4: Verify app starts**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
npm run dev
```

Open `http://localhost:5173`. Expected: AuthGate login form appears (since no session exists).

- [ ] **Step 5: Test sign-up flow**

In the browser:
1. Click "Don't have an account? Sign up"
2. Enter an email and password (6+ characters)
3. Click "Create account"
4. Expected: app loads with demo tasks seeded (4 tasks visible)

- [ ] **Step 6: Test sign-out and sign-in**

Click the sign-out button in the app header. Expected: login form reappears.
Sign back in with the same credentials. Expected: same tasks appear (data persisted in Supabase).

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add AuthGate and remove localStorage for view state"
```

---

## Task 9: Modify `src/views/NowView.jsx` — Chat History to Supabase

**Files:**
- Modify: `src/views/NowView.jsx`

Replace the three `localStorage` usages (lines ~51, ~77, ~88) with Supabase reads/writes.

- [ ] **Step 1: Add supabase import**

At the top of `src/views/NowView.jsx`, add after the existing imports:
```jsx
import { supabase } from "../lib/supabase";
```

- [ ] **Step 2: Remove localStorage initial state**

Find:
```jsx
  const [chatLogs, setChatLogs] = useState(() => {
    if (!activeTaskId) return [COACH_GREETING];
    try {
      const saved = localStorage.getItem(`mindCoach-${activeTaskId}`);
      return saved ? JSON.parse(saved) : [COACH_GREETING];
    } catch {
      return [COACH_GREETING];
    }
  });
```

Replace with:
```jsx
  const [chatLogs, setChatLogs] = useState([COACH_GREETING]);
```

- [ ] **Step 3: Replace task-change effect**

Find:
```jsx
  // Reset and reload chat when the active task changes
  useEffect(() => {
    if (!activeTaskId) {
      setChatLogs([COACH_GREETING]);
      return;
    }
    try {
      const saved = localStorage.getItem(`mindCoach-${activeTaskId}`);
      setChatLogs(saved ? JSON.parse(saved) : [COACH_GREETING]);
    } catch {
      setChatLogs([COACH_GREETING]);
    }
  }, [activeTaskId]);
```

Replace with:
```jsx
  useEffect(() => {
    if (!activeTaskId) {
      setChatLogs([COACH_GREETING]);
      return;
    }
    supabase
      .from("chat_history")
      .select("messages")
      .eq("task_id", activeTaskId)
      .maybeSingle()
      .then(({ data }) => {
        setChatLogs(data?.messages?.length ? data.messages : [COACH_GREETING]);
      });
  }, [activeTaskId]);
```

- [ ] **Step 4: Replace persist effect**

Find:
```jsx
  // Persist chat logs whenever they update
  useEffect(() => {
    if (!activeTaskId || chatLogs.length <= 1) return; // Don't persist if only greeting
    try {
      localStorage.setItem(`mindCoach-${activeTaskId}`, JSON.stringify(chatLogs));
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [chatLogs, activeTaskId]);
```

Replace with:
```jsx
  useEffect(() => {
    if (!activeTaskId || chatLogs.length <= 1) return;
    supabase
      .from("chat_history")
      .upsert(
        { user_id: user?.id, task_id: activeTaskId, messages: chatLogs },
        { onConflict: "user_id,task_id" }
      )
      .then(() => {});
  }, [chatLogs, activeTaskId]);
```

- [ ] **Step 5: Verify chat works**

With the dev server running:
1. Set a task as active
2. Open the Mind Coach panel and send a message
3. Switch to a different task, then switch back
4. Expected: previous chat messages reload from Supabase

- [ ] **Step 6: Commit**

```bash
git add src/views/NowView.jsx
git commit -m "feat: migrate Mind Coach chat history to Supabase"
```

---

## Task 10: Add `vercel.json`

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create the file**

`vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add vercel.json SPA rewrite rule"
```

---

## Task 11: Vercel Deployment

- [ ] **Step 1: Push all commits to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Import project in Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Vercel auto-detects Vite: build command `npm run build`, output directory `dist`
4. Click through to Environment Variables before deploying

- [ ] **Step 3: Set environment variables in Vercel**

In the Vercel project → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `VITE_GEMINI_API_KEY` | your Gemini API key |

- [ ] **Step 4: Deploy**

Click Deploy. Wait for build to complete (~60 seconds).

Expected: green "Ready" status. Click the deployment URL — login form should appear.

- [ ] **Step 5: Smoke test on Vercel URL**

1. Sign up with a new email
2. Verify demo tasks appear
3. Create a new task
4. Sign out and sign back in
5. Verify the new task persists

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| 5 tables with RLS | Task 3 |
| Supabase Auth (email/password) | Tasks 7, 6 |
| New users seeded with demo data | Task 7 (`loadUserData` → `createSeedData`) |
| All localStorage replaced | Tasks 7, 8, 9 |
| Chat history in Supabase | Task 9 |
| `apiFetch` interface preserved | Task 7 |
| `useAuth()` returns real user | Task 7 |
| GitHub push | Tasks 1, 11 |
| Vercel deployment | Task 10, 11 |
| `vercel.json` SPA routing | Task 10 |
| `tweaks` saved to Supabase | Task 7 (`setTweak`) |
| `handleMoodCheckin` saves to Supabase | Task 7 |
| All 16 action types wired | Task 7 |
