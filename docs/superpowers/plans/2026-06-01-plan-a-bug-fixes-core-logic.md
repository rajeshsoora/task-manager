# Plan A — Bug Fixes & Core Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four broken behaviors that make the app unreliable — task creation via page reload, missing activeTaskId in TodayView, excessive drag saves, and non-reactive mobile layout.

**Architecture:** All fixes are localized — each touches one or two files with no cross-cutting changes. We extend `apiFetch` in `AppContext.jsx` to handle `create_task`, then update `NewTaskModal`, `TodayView`, and `App.jsx` to consume it correctly.

**Tech Stack:** React 19, Vite, localStorage (no new dependencies)

---

## Files Modified

| File | Change |
|---|---|
| `src/context/AppContext.jsx` | Add `create_task` action case to `apiFetch` |
| `src/components/NewTaskModal.jsx` | Replace `localStorage` write + `window.location.reload()` with `apiFetch` `create_task` call |
| `src/views/TodayView.jsx` | Add `activeTaskId` to context destructure; fix `isMobileGrid` reactivity; debounce drag saves |

---

## Task 1: Add `create_task` action to AppContext

**Files:**
- Modify: `src/context/AppContext.jsx` — add case in `apiFetch` switch

### Context

Currently `apiFetch("/actions")` handles: `set_active`, `complete`, `delete_task`, `update_task`, `update_daily_plan`, `toggle_subtask`, `advance_phase`, `level_drill`, `log_skill_session`, `end_drift`, `mark_chapter`, `set_reading_chapter`, `update_chapter_note`.

It does **not** handle `create_task`, so `NewTaskModal` bypasses the state engine entirely.

- [ ] **Step 1: Open `src/context/AppContext.jsx` and locate the switch block**

Find line ~291:
```js
switch (action.type) {
  case "add_mood_tag":
```

- [ ] **Step 2: Add the `create_task` case before the `default` case**

Insert this block just before `default:`:

```js
case "create_task": {
  const newTask = {
    id: `task-${Date.now()}`,
    done: false,
    createdAt: new Date().toISOString(),
    lastTouched: new Date().toISOString(),
    ...action.task,
  };
  setTasks((prev) => [...prev, newTask]);
  break;
}
```

- [ ] **Step 3: Verify the switch structure still has `default:` at the end**

The block should look like:
```js
      case "create_task": {
        const newTask = {
          id: `task-${Date.now()}`,
          done: false,
          createdAt: new Date().toISOString(),
          lastTouched: new Date().toISOString(),
          ...action.task,
        };
        setTasks((prev) => [...prev, newTask]);
        break;
      }

      default:
        break;
    }
```

- [ ] **Step 4: Start the dev server and confirm no console errors**

```bash
npm run dev
```

Open the browser. No red errors in the console.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add create_task action to apiFetch state engine"
```

---

## Task 2: Fix NewTaskModal to use state engine

**Files:**
- Modify: `src/components/NewTaskModal.jsx` — replace lines 219–222 with `apiFetch` call

### Context

Current broken code at line ~219:
```js
const allTasks = JSON.parse(localStorage.getItem("mindTasks") || "[]");
localStorage.setItem("mindTasks", JSON.stringify([...allTasks, newTask]));
window.location.reload();  // ← this causes full page reload, loses state
```

The `newTask` object is already built correctly above that block. We just need to route it through `apiFetch` instead.

- [ ] **Step 1: Open `src/components/NewTaskModal.jsx` and locate the `handleSave` function**

Find the `if (editTask)` block at line ~204:
```js
if (editTask) {
  await apiFetch("/actions", {
    method: "POST",
    body: { action: { type: "update_task", taskId: editTask.id, task: taskData } },
  });
} else {
  // Create new task
  const newTask = {
    id: `task-${Date.now()}`,
    done: false,
    createdAt: new Date().toISOString(),
    lastTouched: new Date().toISOString(),
    ...taskData,
  };
  const allTasks = JSON.parse(localStorage.getItem("mindTasks") || "[]");
  localStorage.setItem("mindTasks", JSON.stringify([...allTasks, newTask]));
  window.location.reload();
}
```

- [ ] **Step 2: Replace the entire `else` block**

```js
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
```

The `id`, `done`, `createdAt`, and `lastTouched` fields are now assigned inside the `create_task` case in AppContext — no duplication needed here.

- [ ] **Step 3: Verify in browser**

Run `npm run dev`. Open the app. Click **＋ New task**. Fill in a title, pick a kind, click **Create Focus Task**. The modal should close and the new task should appear in **All tasks** without any page reload.

- [ ] **Step 4: Verify the task persists on page refresh**

Reload the browser. The newly created task should still be present (AppContext persists `tasks` to localStorage via the `useEffect` on line ~221 of AppContext).

- [ ] **Step 5: Commit**

```bash
git add src/components/NewTaskModal.jsx
git commit -m "fix: route new task creation through apiFetch state engine, remove page reload"
```

---

## Task 3: Fix `activeTaskId` missing from TodayView

**Files:**
- Modify: `src/views/TodayView.jsx` — add `activeTaskId` to the context destructure at line 6

### Context

`TodayView` renders each planned task with `const active = t.id === activeTaskId` at line ~221. But `activeTaskId` is never pulled from context — it's `undefined` — so the active task border highlight never renders.

- [ ] **Step 1: Open `src/views/TodayView.jsx` and find line 6**

Current:
```js
const { tasks, events, tweaks, dailyPlans, apiFetch } = useAppData();
```

- [ ] **Step 2: Add `activeTaskId` to the destructure**

```js
const { tasks, events, tweaks, dailyPlans, apiFetch, activeTaskId } = useAppData();
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`. Set a task as active from the **Now** view. Navigate to **Today's plan** and add the active task to the plan. Confirm it has the accent-colored border (`1.5px solid var(--accent)`) instead of the normal `1px solid var(--line)`.

- [ ] **Step 4: Commit**

```bash
git add src/views/TodayView.jsx
git commit -m "fix: destructure activeTaskId from context in TodayView so active task highlights correctly"
```

---

## Task 4: Fix `handleDragOver` performance (too many plan saves)

**Files:**
- Modify: `src/views/TodayView.jsx` — replace live `savePlan` in `handleDragOver` with optimistic local state; only persist on `drop`/`dragEnd`

### Context

Current `handleDragOver` at line ~123 calls `savePlan(listCopy)` every time the mouse moves over a new element. `savePlan` writes to AppContext state and localStorage on every call — this fires dozens of times per second during drag.

The fix: track reorder in local state during drag, flush to persistent state only on `drop` or `dragEnd`.

- [ ] **Step 1: Add a `pendingOrder` local state at the top of TodayView**

After the existing `useState` declarations (around line 14), add:

```js
const [pendingOrder, setPendingOrder] = useState(null); // null = no drag in progress
```

- [ ] **Step 2: Replace `handleDragOver` to update only local pending state**

Replace the existing `handleDragOver` function:

```js
const handleDragOver = (e, targetIdx) => {
  e.preventDefault();
  if (draggedSource === "open") return;

  const sourceOrder = pendingOrder || plannedIds;
  const sourceIdx = sourceOrder.indexOf(draggedTaskId);
  if (sourceIdx !== -1 && targetIdx !== undefined && sourceIdx !== targetIdx) {
    const listCopy = [...sourceOrder];
    listCopy.splice(sourceIdx, 1);
    listCopy.splice(targetIdx, 0, draggedTaskId);
    setPendingOrder(listCopy);
  }
};
```

- [ ] **Step 3: Update `handleDrop` to flush pending order**

Replace the existing `handleDrop`:

```js
const handleDrop = (e) => {
  e.preventDefault();
  if (draggedTaskId && draggedSource === "open") {
    if (!plannedSet.has(draggedTaskId)) {
      savePlan([...(pendingOrder || plannedIds), draggedTaskId]);
    }
  } else if (pendingOrder) {
    savePlan(pendingOrder);
  }
  setPendingOrder(null);
  setDraggedTaskId(null);
  setDraggedSource(null);
};
```

- [ ] **Step 4: Update `handleDragEnd` to clear pending state without saving**

Replace the existing `handleDragEnd`:

```js
const handleDragEnd = () => {
  setPendingOrder(null);
  setDraggedTaskId(null);
  setDraggedSource(null);
};
```

- [ ] **Step 5: Update the planned tasks render to use `pendingOrder` during drag**

Find the `plannedTasks` useMemo (around line 27). The rendered list should reflect the live drag order. Replace the `plannedTasks` render source in JSX.

First, add a derived variable after the `pendingOrder` state declaration:

```js
const displayOrder = pendingOrder || plannedIds;

const displayPlannedTasks = useMemo(() => {
  return displayOrder.map((id) => taskMap.get(id)).filter(Boolean);
}, [displayOrder, taskMap]);
```

- [ ] **Step 6: Replace `plannedTasks` with `displayPlannedTasks` in the JSX**

In the JSX, find every reference to `plannedTasks` inside the left "Planned" column and replace with `displayPlannedTasks`. There are references at:
- The `{plannedTasks.length === 0 ?` condition
- The `.map((t, idx) =>` render loop
- The `completedTodayCount` stat (this can stay using `plannedTasks` since it's a count, not display order)

Specifically, in the left drop-zone column:

```jsx
{displayPlannedTasks.length === 0 ? (
  <div style={{ ... }}>
    Drag tasks from the right to plan your day.
  </div>
) : (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {displayPlannedTasks.map((t, idx) => {
      // ... rest of task row JSX unchanged
    })}
  </div>
)}
```

- [ ] **Step 7: Verify in browser**

Drag a task within the planned list. Confirm it reorders smoothly without page stutters. After dropping, refresh the page and confirm the order persisted.

- [ ] **Step 8: Commit**

```bash
git add src/views/TodayView.jsx
git commit -m "fix: debounce drag reorder — update local pending state during drag, persist to store on drop only"
```

---

## Task 5: Fix `isMobileGrid` reactivity in TodayView

**Files:**
- Modify: `src/views/TodayView.jsx` — replace `isMobileGrid()` call with reactive state

### Context

`isMobileGrid()` at line ~326 is a plain function that reads `window.innerWidth` at render time. It's called in the JSX at line ~205 as `isMobileGrid() ? "1fr" : "1fr 1fr"`. Since it's not inside a state or effect, it doesn't re-evaluate when the window resizes — the grid layout stays stuck at whatever it was on mount.

`App.jsx` already has the right pattern with `isMobile` state + resize listener. We'll use the same approach.

- [ ] **Step 1: Delete the `isMobileGrid` helper function at the bottom of TodayView**

Remove lines ~326-328:
```js
function isMobileGrid() {
  return window.innerWidth < 768;
}
```

- [ ] **Step 2: Add `isMobile` state to TodayView**

After the existing `useState` declarations at the top of `TodayView`, add:

```js
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

- [ ] **Step 3: Add a resize listener via `useEffect`**

After the `isMobile` state declaration:

```js
useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);
```

- [ ] **Step 4: Replace `isMobileGrid()` call in JSX with `isMobile`**

Find line ~205:
```jsx
<div className="today-grid" style={{ display: "grid", gridTemplateColumns: isMobileGrid() ? "1fr" : "1fr 1fr", ...}}>
```

Replace with:
```jsx
<div className="today-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", ...}}>
```

- [ ] **Step 5: Verify in browser**

Open the app in a desktop window. Slowly resize narrower than 768px. Confirm the two-column grid collapses to a single column without a page refresh.

- [ ] **Step 6: Commit**

```bash
git add src/views/TodayView.jsx
git commit -m "fix: make TodayView grid layout reactive to window resize using state+listener"
```

---

## Self-Review Checklist

- [x] **create_task added to AppContext** — Task 1 covers it
- [x] **NewTaskModal no longer reloads** — Task 2 covers it, `newTask` fields moved to AppContext, no duplication
- [x] **activeTaskId destructured in TodayView** — Task 3 covers it
- [x] **Drag saves debounced** — Task 4 covers it, `pendingOrder` tracks live drag, `savePlan` only on drop
- [x] **isMobileGrid is reactive** — Task 5 covers it
- [x] **No placeholders** — all steps have exact code
- [x] **Type consistency** — `pendingOrder` is `string[] | null` throughout, consistent with `plannedIds: string[]`
- [x] **displayPlannedTasks** is derived from `pendingOrder || plannedIds`, consistent with `taskMap` shape
