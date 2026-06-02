# Firebase Migration Design — Mind Manager

**Date:** 2026-06-02
**Status:** Approved

## Goal

Migrate Mind Manager from localStorage to Firebase (multi-user, auth, cloud data) and deploy to Firebase Hosting. Replaces the Supabase plan.

---

## Architecture

**Auth:** Firebase Authentication — email/password. `onAuthStateChanged` is the single source of truth for session state. When a user signs in, their Firestore subtree loads; when they sign out, all state clears.

**Database:** Cloud Firestore — subcollection structure under `users/{uid}/`. Each user's data is fully isolated. Security rules enforce this with one rule.

**Hosting:** Firebase Hosting — SPA with rewrite rule so direct URLs don't 404. Deploy via `npm run build && firebase deploy`.

---

## Firestore Data Model

```
users/{uid}/
  tasks/{taskId}          — one doc per task
  events/{eventId}        — append-only event log
  daily_plans/{date}      — keyed by YYYY-MM-DD string
  chat_history/{taskId}   — one doc per task, messages array
  preferences             — single doc (fixed id: "prefs")
```

### Task document
```json
{
  "title": "string",
  "kind": "work|learning|body|social|wealth|music|craft|errand|drift",
  "quad": "q1|q2|q3|q4",
  "energy": 1-5,
  "moods": ["string"],
  "cadence": "daily|weekly|biweekly|loose|once",
  "done": false,
  "createdAt": Timestamp,
  "lastTouched": Timestamp,
  "template": "project|book|skill|idle|null",
  "templateData": { ...template-specific object }
}
```

### Event document
```json
{
  "type": "checkin|progress|switch|milestone|drift",
  "timestamp": Timestamp,
  "taskId": "string|null",
  "taskTitle": "string|null",
  "title": "string|null",
  "energy": "number|null",
  "mood": ["string"],
  "mins": "number|null",
  "note": "string|null",
  "switchReason": "object|null"
}
```

### Daily plan document (id = date string e.g. `2026-06-02`)
```json
{ "taskIds": ["uuid1", "uuid2"] }
```

### Chat history document (id = taskId)
```json
{ "messages": [{ "sender": "coach|user", "text": "string" }] }
```

### Preferences document (id = `"prefs"`)
```json
{
  "activeTaskId": "string|null",
  "currentMood": "string|null",
  "lastCheckinAt": "Timestamp|null",
  "lastCheckinEnergy": "number|null",
  "customMoodTags": ["string"],
  "tweaks": {
    "moodModel": "energy-tags",
    "density": "comfortable",
    "theme": "light",
    "accent": "#c9633f",
    "celebrations": true,
    "sound": false
  }
}
```

---

## Security Rules

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

All user data lives under `users/{uid}/` — one rule covers every collection. Users cannot access each other's data.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/lib/firebase.js` | Firebase app + Auth + Firestore singletons |
| Create | `src/lib/seedData.js` | Demo data factory for first-login seeding |
| Create | `src/components/AuthGate.jsx` | Login/signup form when no session |
| Rewrite | `src/context/AppContext.jsx` | Replace localStorage with Firestore; real auth |
| Modify | `src/App.jsx` | Add `<AuthGate>`, remove localStorage for view |
| Modify | `src/views/NowView.jsx` | Chat history read/write via Firestore |
| Create | `firebase.json` | Hosting config + SPA rewrite rule |
| Create | `.firebaserc` | Project binding (filled in after Firebase project created) |

---

## First-Login Seeding

On first sign-in, `loadUserData` checks for the `preferences` doc. If absent, it writes 4 demo tasks + 4 events + a default preferences doc via a Firestore batch write (atomic).

Demo tasks: "Launch Mind Manager" (project), "Atomic Habits" (book), "OKLCH Gradients" (skill), "Mindfulness" (drift idle).

---

## Env Vars

Add to `.env.local` (after creating Firebase project in console):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=  (existing)
```

---

## Deployment

1. `npm install -g firebase-tools` (or `npx firebase-tools`)
2. `firebase login` (browser OAuth)
3. `firebase init hosting` — select project, set public dir to `dist`, configure as SPA
4. `npm run build && firebase deploy`

`firebase.json` SPA rewrite:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

---

## Interface Preservation

`AppContext.jsx` exports the identical surface:
- `useAppData()` — all views use this, unchanged
- `useAuth()` — returns `{ user, signIn, signOut }`
- `useTasks()`, `useMood()`, `useDailyPlan(date)` — unchanged
- `apiFetch("/actions", { body: { action } })` — all 16 action types preserved
- `handleMoodCheckin`, `logEvent`, `setTweak` — unchanged signatures

Zero changes required in any view component (`NowView`, `TodayView`, `TasksView`, `MatrixView`, `TimelineView`). Only `NowView` gets a minor edit for chat history reads.
