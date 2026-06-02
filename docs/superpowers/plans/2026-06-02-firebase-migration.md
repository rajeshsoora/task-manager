# Firebase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Mind Manager from localStorage to Firebase Auth + Firestore for real multi-user cloud persistence, and deploy to Firebase Hosting.

**Architecture:** Firebase Auth handles email/password login; all app state moves to Firestore under `users/{uid}/` subcollections (tasks, events, daily_plans, chat_history, preferences); `AppContext.jsx` is fully rewritten to replace localStorage reads/writes with Firestore calls while keeping the same exported interface so zero view components change; an `AuthGate` component wraps `AppLayout` to show login/signup when no session exists.

**Tech Stack:** React 19, Vite, Firebase JS SDK v10, Firebase Hosting

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/lib/firebase.js` | Firebase app singleton + `auth` + `db` exports |
| Create | `src/lib/seedData.js` | Demo data factory for first-login seeding |
| Create | `src/components/AuthGate.jsx` | Login/signup form shown when no session |
| Rewrite | `src/context/AppContext.jsx` | Replace localStorage with Firestore; real Firebase Auth |
| Modify | `src/App.jsx` | Add `<AuthGate>`, remove localStorage for view state |
| Modify | `src/views/NowView.jsx` | Chat history read/write via Firestore |
| Create | `firebase.json` | Hosting config + SPA rewrite rule |
| Create | `.firebaserc` | Project binding (filled in after Firebase console setup) |

---

## Prerequisites (Manual — Do Before Any Coding)

These steps require the Firebase console. Complete them before Task 1.

- [ ] **Create Firebase project** at [console.firebase.google.com](https://console.firebase.google.com). Note the **Project ID**.

- [ ] **Enable Email/Password auth**: Firebase console → Authentication → Sign-in method → Email/Password → Enable. Disable "Email link" (passwordless). Click Save.

- [ ] **Create Firestore database**: Firebase console → Firestore Database → Create database → Start in **production mode** → choose a region → Done.

- [ ] **Set Firestore security rules**: Firestore → Rules tab → replace with:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
  Click Publish.

- [ ] **Get web app config**: Firebase console → Project settings (gear icon) → Your apps → Add app → Web → Register app (any nickname) → copy the `firebaseConfig` object values.

---

## Task 1: Install Firebase SDK

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
npm install firebase
```

Expected: output contains `added X packages`, no errors.

- [ ] **Step 2: Add Firebase env vars to `.env.local`**

Open `.env.local` and add the values from your Firebase console firebaseConfig:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GEMINI_API_KEY=existing-key-stays-here
```

- [ ] **Step 3: Commit dependency change**

```bash
git add package.json package-lock.json
git commit -m "chore: add firebase SDK"
```

---

## Task 2: Create `src/lib/firebase.js`

**Files:**
- Create: `src/lib/firebase.js`

- [ ] **Step 1: Create the file**

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase.js
git commit -m "feat: add Firebase client singleton"
```

---

## Task 3: Create `src/lib/seedData.js`

**Files:**
- Create: `src/lib/seedData.js`

Seed data inserts task and event documents for new users on first login. No user IDs needed — documents are written under the user's Firestore subcollection path.

- [ ] **Step 1: Create the file**

```js
export function createSeedData() {
  const now = new Date().toISOString();
  const d1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const d4 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const tasks = [
    {
      title: "Launch Mind Manager Application",
      kind: "work", quad: "q1", energy: 5,
      moods: ["focused", "creative"], cadence: "once", done: false,
      createdAt: now, lastTouched: now,
      template: "project",
      templateData: {
        phases: [
          {
            id: "phase-1", title: "Local State Engine Scaffold", status: "done",
            subs: [
              { id: "sub-1", label: "Create AppContext.jsx store", done: true },
              { id: "sub-2", label: "Implement local storage caching", done: true },
            ],
          },
          {
            id: "phase-2", title: "Build Premium Views & Drag-and-Drop Planning", status: "doing",
            subs: [
              { id: "sub-3", label: "Integrate Eisenhower Priority Matrix Grid", done: true },
              { id: "sub-4", label: "Implement Drag and Drop in Today's Plan", done: false },
              { id: "sub-5", label: "Design SVG Timeline charts", done: false },
            ],
          },
          {
            id: "phase-3", title: "Verify Responsiveness & Sound Celebrations", status: "todo",
            subs: [
              { id: "sub-6", label: "Add soft completes chime audio", done: false },
              { id: "sub-7", label: "Verify Light/Dark theme density controls", done: false },
            ],
          },
        ],
      },
    },
    {
      title: "Read 'Atomic Habits' by James Clear",
      kind: "learning", quad: "q2", energy: 2,
      moods: ["calm", "curious"], cadence: "daily", done: false,
      createdAt: d1, lastTouched: now,
      template: "book",
      templateData: {
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
      title: "Master HSL & OKLCH Color Gradients",
      kind: "craft", quad: "q2", energy: 4,
      moods: ["creative", "focused"], cadence: "weekly", done: false,
      createdAt: d3, lastTouched: now,
      template: "skill",
      templateData: {
        drills: [
          { id: "drill-1", label: "Fluid Type Scales Layouts", level: 3 },
          { id: "drill-2", label: "OKLCH Lightness and Chroma Mapping", level: 4 },
          { id: "drill-3", label: "CSS Variables Animation Transitions", level: 2 },
        ],
        recent: [
          { when: now, drill: "OKLCH Lightness and Chroma Mapping", note: "Adjusted lightness curve from 20% to 95%." },
          { when: d4, drill: "Fluid Type Scales Layouts", note: "Configured CSS clamp() font rules." },
        ],
      },
    },
    {
      title: "Mindfulness and Deep Breathing",
      kind: "drift", quad: "q4", energy: 1,
      moods: ["calm", "restless", "tired"], cadence: "daily", done: false,
      createdAt: now, lastTouched: now,
      template: "idle",
      templateData: {
        lastDrifts: [
          { when: d4, mins: 15, note: "Felt very relaxed and recharged.", mood: ["calm"] },
        ],
      },
    },
  ];

  const events = [
    {
      type: "checkin", timestamp: d4, energy: 3, mood: ["calm", "focused"],
      taskId: null, taskTitle: null, title: null, mins: null, note: null, switchReason: null,
    },
    {
      type: "checkin", timestamp: now, energy: 4, mood: ["focused", "creative"],
      taskId: null, taskTitle: null, title: null, mins: null, note: null, switchReason: null,
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

## Task 4: Create `src/components/AuthGate.jsx`

**Files:**
- Create: `src/components/AuthGate.jsx`

`AuthGate` reads `user` and `loading` from `useAppData()`, shows a loading screen during auth init, renders children when signed in, and shows a login/signup form otherwise.

- [ ] **Step 1: Create the file**

```jsx
import { useState } from "react";
import { auth } from "../lib/supabase";
import { useAppData } from "../context/AppContext";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth as firebaseAuth } from "../lib/firebase";

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
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
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
            placeholder="Password (6+ characters)"
            required
            minLength={6}
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

**Note:** There is a stray `import { auth } from "../lib/supabase"` line in the template above — remove it. The correct imports are the Firebase ones. The final file should have no Supabase imports.

- [ ] **Step 2: Fix imports — the actual file should be:**

```jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
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
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
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
            placeholder="Password (6+ characters)"
            required
            minLength={6}
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

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthGate.jsx
git commit -m "feat: add AuthGate login/signup component"
```

---

## Task 5: Rewrite `src/context/AppContext.jsx`

**Files:**
- Rewrite: `src/context/AppContext.jsx`

This is a complete file replacement. The exported interface is preserved exactly — `useAppData`, `useAuth`, `useTasks`, `useMood`, `useDailyPlan`, `formatDate`, `getYesterdayDate`, `AppDataProvider` — so no view components need changes.

Key changes:
- `onAuthStateChanged` replaces localStorage init
- All state is loaded from Firestore on auth
- All mutations write to Firestore + update React state optimistically
- `user` and `loading` are now part of `AppDataContext`
- `useAuth()` delegates to `useAppData()`

- [ ] **Step 1: Replace entire file with the following**

```jsx
import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { createSeedData } from "../lib/seedData";

const AppDataContext = createContext(null);

const DEFAULT_TWEAKS = {
  moodModel: "energy-tags",
  density: "comfortable",
  theme: "light",
  accent: "#c9633f",
  celebrations: true,
  sound: false,
};

// --- Date Helpers (unchanged) ---
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

// --- Firestore ↔ App Object Mappers ---

function docToTask(id, data) {
  const task = {
    id,
    title: data.title,
    kind: data.kind,
    quad: data.quad,
    energy: data.energy,
    moods: data.moods,
    cadence: data.cadence,
    done: data.done,
    createdAt: data.createdAt,
    lastTouched: data.lastTouched,
    template: data.template || null,
  };
  if (data.template && data.templateData) {
    task[data.template] = data.templateData;
  }
  return task;
}

function taskToDoc(task) {
  return {
    title: task.title,
    kind: task.kind,
    quad: task.quad,
    energy: task.energy,
    moods: task.moods || [],
    cadence: task.cadence,
    done: task.done,
    createdAt: task.createdAt,
    lastTouched: task.lastTouched,
    template: task.template || null,
    templateData: task.template ? (task[task.template] || null) : null,
  };
}

function docToEvent(id, data) {
  return {
    id,
    type: data.type,
    timestamp: data.timestamp,
    taskId: data.taskId || null,
    taskTitle: data.taskTitle || null,
    title: data.title || null,
    energy: data.energy || null,
    mood: data.mood || [],
    mins: data.mins || null,
    note: data.note || null,
    switchReason: data.switchReason || null,
  };
}

// --- Provider ---

export function AppDataProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = auth initializing
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [lastCheckInAt, setLastCheckInAt] = useState(null);
  const [lastCheckInEnergy, setLastCheckInEnergy] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [customMoodTags, setCustomMoodTags] = useState(["productive", "mindful", "inspired"]);
  const [tweaks, setTweaksState] = useState(DEFAULT_TWEAKS);
  const [dailyPlans, setDailyPlans] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid);
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
    return () => unsub();
  }, []);

  async function loadUserData(uid) {
    setLoading(true);
    const prefsRef = doc(db, "users", uid, "preferences", "prefs");
    const prefsSnap = await getDoc(prefsRef);

    if (!prefsSnap.exists()) {
      await seedNewUser(uid);
    }

    const [tasksSnap, eventsSnap, plansSnap, freshPrefs] = await Promise.all([
      getDocs(collection(db, "users", uid, "tasks")),
      getDocs(query(collection(db, "users", uid, "events"), orderBy("timestamp", "desc"))),
      getDocs(collection(db, "users", uid, "daily_plans")),
      getDoc(prefsRef),
    ]);

    setTasks(tasksSnap.docs.map(d => docToTask(d.id, d.data())));
    setEvents(eventsSnap.docs.map(d => docToEvent(d.id, d.data())));

    const plansMap = {};
    plansSnap.docs.forEach(d => { plansMap[d.id] = d.data().taskIds || []; });
    setDailyPlans(plansMap);

    const p = freshPrefs.data() || {};
    setActiveTaskId(p.activeTaskId || null);
    setCurrentMood(p.currentMood || null);
    setLastCheckInAt(p.lastCheckinAt || null);
    setLastCheckInEnergy(p.lastCheckinEnergy || null);
    setCustomMoodTags(p.customMoodTags || ["productive", "mindful", "inspired"]);
    const t = p.tweaks || DEFAULT_TWEAKS;
    setTweaksState(t);
    applyTweaksToDOM(t);

    setLoading(false);
  }

  async function seedNewUser(uid) {
    const { tasks: seedTasks, events: seedEvents } = createSeedData();
    const batch = writeBatch(db);
    seedTasks.forEach(task => {
      batch.set(doc(collection(db, "users", uid, "tasks")), task);
    });
    seedEvents.forEach(event => {
      batch.set(doc(collection(db, "users", uid, "events")), event);
    });
    batch.set(doc(db, "users", uid, "preferences", "prefs"), {
      activeTaskId: null,
      currentMood: null,
      lastCheckinAt: null,
      lastCheckinEnergy: null,
      customMoodTags: ["productive", "mindful", "inspired"],
      tweaks: DEFAULT_TWEAKS,
    });
    await batch.commit();
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
      await updateDoc(doc(db, "users", user.uid, "preferences", "prefs"), { tweaks: newTweaks });
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
    await updateDoc(doc(db, "users", user.uid, "preferences", "prefs"), {
      currentMood: mood, lastCheckinAt: now, lastCheckinEnergy: energy, customMoodTags: newTags,
    });
    const eventData = {
      type: "checkin", timestamp: now, energy, mood: [mood, ...tags],
      taskId: null, taskTitle: null, title: null, mins: null, note: null, switchReason: null,
    };
    const ref = await addDoc(collection(db, "users", user.uid, "events"), eventData);
    setEvents(prev => [docToEvent(ref.id, eventData), ...prev]);
  };

  const logEvent = async (eventData) => {
    if (!user) return;
    const data = {
      type: eventData.type,
      timestamp: new Date().toISOString(),
      taskId: eventData.taskId || null,
      taskTitle: eventData.taskTitle || null,
      title: eventData.title || null,
      energy: eventData.energy || null,
      mood: currentMood ? [currentMood] : [],
      mins: eventData.mins || null,
      note: eventData.note || null,
      switchReason: eventData.switchReason || null,
    };
    const ref = await addDoc(collection(db, "users", user.uid, "events"), data);
    setEvents(prev => [docToEvent(ref.id, data), ...prev]);
  };

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const signOut = () => fbSignOut(auth);

  const apiFetch = async (path, options = {}) => {
    if (path === "/timeline") return { events };
    if (path !== "/actions") throw new Error(`Unsupported: ${path}`);

    const { action } = options.body || {};
    if (!action) return null;

    let celebration = null;
    const uid = user?.uid;

    switch (action.type) {
      case "add_mood_tag": {
        if (action.tag && !customMoodTags.includes(action.tag)) {
          const newTags = [...customMoodTags, action.tag];
          setCustomMoodTags(newTags);
          if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { customMoodTags: newTags });
        }
        break;
      }

      case "remove_mood_tag": {
        const newTags = customMoodTags.filter(t => t !== action.tag);
        setCustomMoodTags(newTags);
        if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { customMoodTags: newTags });
        break;
      }

      case "set_active": {
        const prevActiveId = activeTaskId;
        const nextActiveId = action.taskId;
        setActiveTaskId(nextActiveId);
        if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { activeTaskId: nextActiveId });
        if (nextActiveId) {
          const task = tasks.find(t => t.id === nextActiveId);
          if (task) {
            const now = new Date().toISOString();
            setTasks(prev => prev.map(t => t.id === nextActiveId ? { ...t, lastTouched: now } : t));
            if (uid) await updateDoc(doc(db, "users", uid, "tasks", nextActiveId), { lastTouched: now });
            if (prevActiveId && prevActiveId !== nextActiveId) {
              await logEvent({ type: "switch", taskId: nextActiveId, title: `Switched to: ${task.title}`, taskTitle: task.title, switchReason: action.switchReason || { kind: "switch", note: "Left previous task" } });
            } else {
              await logEvent({ type: "progress", taskId: nextActiveId, title: `Started working on: ${task.title}`, taskTitle: task.title });
            }
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { done: isDone, lastTouched: now });
        await logEvent({ type: "progress", taskId: action.taskId, title: isDone ? `Completed task: ${task.title}` : `Reopened task: ${task.title}`, taskTitle: task.title });
        if (isDone) {
          celebration = { type: "task_complete", title: task.title, sound: tweaks.sound };
          if (activeTaskId === action.taskId) {
            setActiveTaskId(null);
            if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { activeTaskId: null });
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
          if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { activeTaskId: null });
        }
        setDailyPlans(prev => {
          const updated = { ...prev };
          for (const date of Object.keys(updated)) {
            updated[date] = updated[date].filter(id => id !== action.taskId);
          }
          return updated;
        });
        if (uid) {
          await deleteDoc(doc(db, "users", uid, "tasks", action.taskId));
          for (const date of affectedDates) {
            const newIds = (dailyPlans[date] || []).filter(id => id !== action.taskId);
            await setDoc(doc(db, "users", uid, "daily_plans", date), { taskIds: newIds });
          }
        }
        break;
      }

      case "update_task": {
        const existing = tasks.find(t => t.id === action.taskId);
        if (!existing) break;
        const now = new Date().toISOString();
        const merged = { ...existing, ...action.task, lastTouched: now };
        setTasks(prev => prev.map(t => t.id === action.taskId ? merged : t));
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), taskToDoc(merged));
        break;
      }

      case "create_task": {
        if (!uid) break;
        const now = new Date().toISOString();
        const newDoc = {
          title: action.task.title,
          kind: action.task.kind,
          quad: action.task.quad,
          energy: action.task.energy,
          moods: action.task.moods || [],
          cadence: action.task.cadence,
          done: false,
          createdAt: now,
          lastTouched: now,
          template: action.task.template || null,
          templateData: action.task.template ? (action.task[action.task.template] || null) : null,
        };
        const ref = await addDoc(collection(db, "users", uid, "tasks"), newDoc);
        setTasks(prev => [...prev, docToTask(ref.id, newDoc)]);
        break;
      }

      case "update_daily_plan": {
        setDailyPlans(prev => ({ ...prev, [action.date]: action.taskIds }));
        if (uid) await setDoc(doc(db, "users", uid, "daily_plans", action.date), { taskIds: action.taskIds });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
        celebration = { type: "session_logged", text: `Logged practice session for ${action.drill || "Skill"}`, sound: tweaks.sound };
        await logEvent({ type: "progress", taskId: action.taskId, title: `Logged Session: ${action.note}`, taskTitle: task.title });
        break;
      }

      case "end_drift": {
        const task = tasks.find(t => t.id === action.taskId);
        if (!task?.idle) break;
        const timestamp = new Date().toISOString();
        const lastDrifts = [
          { when: timestamp, mins: action.mins, note: action.note, mood: currentMood ? [currentMood] : [] },
          ...(task.idle.lastDrifts || []),
        ];
        const newTemplateData = { ...task.idle, lastDrifts };
        setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, idle: newTemplateData } : t));
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
        await logEvent({ type: "drift", taskId: action.taskId, taskTitle: task.title, mins: action.mins, note: action.note });
        setActiveTaskId(null);
        if (uid) await updateDoc(doc(db, "users", uid, "preferences", "prefs"), { activeTaskId: null });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
        if (uid) await updateDoc(doc(db, "users", uid, "tasks", action.taskId), { templateData: newTemplateData });
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
      signUp,
      signOut,
    }),
    [user, loading, tasks, events, currentMood, lastCheckInAt, lastCheckInEnergy, activeTaskId, customMoodTags, tweaks, dailyPlans]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// --- Hooks ---

export function useAuth() {
  const { user, signIn, signUp, signOut } = useAppData();
  return { user, signIn, signUp, signOut, allowListError: false };
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

- [ ] **Step 2: Verify the build compiles**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
npm run build 2>&1 | tail -20
```

Expected: build succeeds (no TypeScript/import errors). If there are import errors, check that `src/lib/firebase.js` exists.

- [ ] **Step 3: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: migrate AppContext from localStorage to Firestore + Firebase Auth"
```

---

## Task 6: Modify `src/App.jsx`

**Files:**
- Modify: `src/App.jsx`

Two changes: add `<AuthGate>` wrapper, remove the two `localStorage` usages for the active view.

- [ ] **Step 1: Add AuthGate import**

After the existing imports at the top of `src/App.jsx`, add:

```jsx
import AuthGate from "./components/AuthGate";
```

- [ ] **Step 2: Wrap AppLayout with AuthGate**

Find:
```jsx
export default function App() {
  return (
    <AppDataProvider>
      <AppLayout />
    </AppDataProvider>
  );
}
```

Replace with:
```jsx
export default function App() {
  return (
    <AppDataProvider>
      <AuthGate>
        <AppLayout />
      </AuthGate>
    </AppDataProvider>
  );
}
```

- [ ] **Step 3: Remove localStorage for view state**

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

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add AuthGate wrapper and remove localStorage view state"
```

---

## Task 7: Modify `src/views/NowView.jsx` — Chat History to Firestore

**Files:**
- Modify: `src/views/NowView.jsx`

Replace three `localStorage` usages with Firestore reads/writes. Also add `user` to the `useAppData()` destructure (needed for chat history writes).

- [ ] **Step 1: Add Firestore imports**

At the top of `src/views/NowView.jsx`, after the existing imports, add:

```jsx
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
```

- [ ] **Step 2: Add `user` to useAppData destructure**

Find line:
```jsx
  const { tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch, events, lastCheckInEnergy } = useAppData();
```

Replace with:
```jsx
  const { user, tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch, events, lastCheckInEnergy } = useAppData();
```

- [ ] **Step 3: Remove lazy initializer from chatLogs useState**

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

- [ ] **Step 4: Replace task-change effect**

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
    if (!activeTaskId || !user) {
      setChatLogs([COACH_GREETING]);
      return;
    }
    getDoc(doc(db, "users", user.uid, "chat_history", activeTaskId)).then(snap => {
      const msgs = snap.data()?.messages;
      setChatLogs(msgs?.length ? msgs : [COACH_GREETING]);
    });
  }, [activeTaskId, user]);
```

- [ ] **Step 5: Replace persist effect**

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
    if (!activeTaskId || !user || chatLogs.length <= 1) return;
    setDoc(
      doc(db, "users", user.uid, "chat_history", activeTaskId),
      { messages: chatLogs },
      { merge: true }
    );
  }, [chatLogs, activeTaskId, user]);
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/views/NowView.jsx
git commit -m "feat: migrate Mind Coach chat history to Firestore"
```

---

## Task 8: Create `firebase.json` and `.firebaserc`

**Files:**
- Create: `firebase.json`
- Create: `.firebaserc`

- [ ] **Step 1: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

- [ ] **Step 2: Create `.firebaserc`**

Replace `your-project-id` with the actual Firebase Project ID from the console (e.g., `mind-manager-abc12`):

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add firebase.json .firebaserc
git commit -m "chore: add Firebase hosting config"
```

---

## Task 9: Manual Smoke Test (Local Dev)

Complete this before deploying. Requires `.env.local` to have real Firebase credentials.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: AuthGate login form appears.

- [ ] **Step 2: Sign up**

1. Click "Don't have an account? Sign up"
2. Enter any email + password (6+ chars)
3. Click "Create account"
4. Expected: app loads with 4 demo tasks visible (seeded from Firestore)

- [ ] **Step 3: Test core flows**

- Create a new task → verify it appears in task list
- Set a task as active → verify NowView shows it
- Open Mind Coach, send a message → verify Gemini responds
- Switch to a different active task, then switch back → verify chat history reloads

- [ ] **Step 4: Sign out and sign back in**

Click "Sign out". Expected: login form reappears.
Sign back in. Expected: same tasks appear (persisted in Firestore, not localStorage).

- [ ] **Step 5: Test second user (multi-user)**

Open an incognito window at `http://localhost:5173`. Sign up with a different email.
Expected: completely separate set of 4 demo tasks — user data is isolated.

---

## Task 10: Deploy to Firebase Hosting

- [ ] **Step 1: Install Firebase CLI**

```bash
npm install -g firebase-tools
```

Expected: `firebase --version` prints a version number.

- [ ] **Step 2: Authenticate**

```bash
firebase login
```

A browser window opens → sign in with the Google account that owns the Firebase project.
Expected: `Success! Logged in as <your-email>`.

- [ ] **Step 3: Build**

```bash
cd "/Users/rajeshsoora/root/Projects/Task Manager"
npm run build
```

Expected: `dist/` directory is created with `index.html` and hashed JS/CSS assets.

- [ ] **Step 4: Deploy**

```bash
firebase deploy --only hosting
```

Expected output:
```
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

- [ ] **Step 5: Smoke test on live URL**

Open the Hosting URL in a browser.
1. Sign up with a new email
2. Verify 4 demo tasks appear
3. Create a task → sign out → sign back in → verify the task persists

- [ ] **Step 6: Push all to GitHub**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Firebase Auth (email/password) | Tasks 4, 5 |
| Firestore subcollection structure `users/{uid}/...` | Task 5 (`loadUserData`, all actions) |
| Multi-user isolation (security rules) | Prerequisites |
| New users seeded with demo data | Task 5 (`seedNewUser`) |
| All localStorage replaced | Tasks 5, 6, 7 |
| Chat history in Firestore | Task 7 |
| `apiFetch` interface preserved (16 action types) | Task 5 |
| `useAuth()` returns real Firebase user | Task 5 |
| `user` and `loading` in AppDataContext | Task 5 |
| `tweaks` saved to Firestore | Task 5 (`setTweak`) |
| `handleMoodCheckin` saves to Firestore | Task 5 |
| GitHub push | Task 10 |
| Firebase Hosting deployment | Tasks 8, 10 |
| SPA routing (`firebase.json` rewrites) | Task 8 |
