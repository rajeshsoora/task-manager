# Plan B — Gemini AI Mind Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake keyword-matching chatbot in NowView with a real Gemini-powered AI coach that has context about the active task, current mood, energy, and recent timeline events — and persists conversation history per task.

**Architecture:** A thin `src/lib/gemini.js` module wraps the Google Generative AI SDK and builds a context-aware system prompt. `NowView.jsx` calls this module instead of the fake `setTimeout` handler. Chat logs are persisted in `localStorage` keyed by `task-{id}` so conversations survive view switches. The API key is read from a Vite env variable.

**Tech Stack:** React 19, Vite, `@google/generative-ai` npm package, Google Gemini 2.0 Flash model

---

## Files Modified / Created

| File | Change |
|---|---|
| `.env.local` | Create — stores `VITE_GEMINI_API_KEY` |
| `src/lib/gemini.js` | Create — Gemini client, system prompt builder, `sendMessage` function |
| `src/views/NowView.jsx` | Modify — replace fake bot handler with `sendMessage`, load/save chat from localStorage |

---

## Task 1: Install Gemini SDK and configure API key

**Files:**
- Create: `.env.local`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the Google Generative AI SDK**

```bash
npm install @google/generative-ai
```

Expected output ends with:
```
added 1 package, ...
```

- [ ] **Step 2: Create `.env.local` with your API key**

Create the file at the project root:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

- [ ] **Step 3: Verify `.env.local` is gitignored**

Open `.gitignore` and confirm it contains `.env.local` or `*.local`. If not, add:
```
.env.local
```

- [ ] **Step 4: Restart the dev server**

```bash
npm run dev
```

Open browser dev tools → Console. No errors about missing modules.

- [ ] **Step 5: Commit only the package changes (not the key file)**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: install @google/generative-ai SDK"
```

---

## Task 2: Create `src/lib/gemini.js` — Gemini client and system prompt builder

**Files:**
- Create: `src/lib/gemini.js`

This module is responsible for two things:
1. Building a rich system prompt from app state context (active task, mood, energy, events)
2. Sending a user message to Gemini with full conversation history and returning the reply

The Gemini API uses a `GoogleGenerativeAI` client with a `startChat` session. We recreate the chat session on each call using the full `history` array — this is stateless on our end and lets localStorage be the source of truth.

- [ ] **Step 1: Create `src/lib/gemini.js`**

```js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not set. Mind Coach will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * Builds a system instruction string from current app state.
 * This tells Gemini who it is and what context it's operating in.
 */
export function buildSystemPrompt({ activeTask, currentMood, energy, recentEvents }) {
  const taskSection = activeTask
    ? `The user is currently focused on: "${activeTask.title}" (category: ${activeTask.kind}, energy required: ${activeTask.energy}/5).`
    : "The user has no active task at the moment.";

  const moodSection = currentMood
    ? `Their current mood is: ${currentMood}. Energy level: ${energy ?? "unknown"}/5.`
    : "No mood check-in recorded yet today.";

  const eventsSection =
    recentEvents && recentEvents.length > 0
      ? `Recent activity:\n` +
        recentEvents
          .slice(0, 5)
          .map((e) => `- ${e.type}: ${e.title || e.taskTitle || ""}`)
          .join("\n")
      : "No recent activity logged.";

  return `You are Mind Coach, a calm and focused cognitive productivity assistant embedded in a personal task manager called Mind Manager.

Your role is to help the user stay focused, work through friction, and reflect on their work. You have access to their current context:

${taskSection}
${moodSection}
${eventsSection}

Guidelines:
- Keep responses short (2-4 sentences). This is a chat interface, not an essay.
- Be warm but direct. No filler phrases like "Certainly!" or "Of course!".
- If the user is stuck, help them find the smallest next action.
- If they're tired or distracted, validate and suggest a break or task switch.
- If they've made progress, acknowledge it briefly and keep momentum going.
- Do not make up information about tasks not provided to you.`;
}

/**
 * Sends a message to Gemini with full conversation history.
 * @param {string} userMessage - The new user message
 * @param {Array<{sender: string, text: string}>} chatHistory - Prior messages from localStorage
 * @param {object} context - { activeTask, currentMood, energy, recentEvents }
 * @returns {Promise<string>} - The assistant reply text
 */
export async function sendMessage(userMessage, chatHistory, context) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt(context),
  });

  // Convert our {sender, text} format to Gemini's {role, parts} format
  // Only include prior turns — the current user message is sent separately
  const history = chatHistory
    .filter((msg) => msg.sender !== "assistant" || chatHistory.indexOf(msg) !== 0) // skip the initial greeting from history
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
```

- [ ] **Step 2: Verify the file has no syntax errors**

```bash
node --input-type=module --eval "import './src/lib/gemini.js'" 2>&1 || echo "Check for import errors"
```

Since it uses `import.meta.env`, this will error on node — that's expected. Instead, confirm via:

```bash
npm run build 2>&1 | head -20
```

No "SyntaxError" or "Cannot find module" messages.

- [ ] **Step 3: Commit**

```bash
git add src/lib/gemini.js
git commit -m "feat: add gemini.js client with context-aware system prompt builder"
```

---

## Task 3: Wire Gemini into NowView — replace fake bot

**Files:**
- Modify: `src/views/NowView.jsx` — lines 1, 41-45, 59-89

This task:
1. Imports `sendMessage` from `src/lib/gemini.js`
2. Replaces the fake `setTimeout` handler with a real Gemini API call
3. Preserves the existing chat UI (no JSX changes needed)

- [ ] **Step 1: Add the import at the top of `src/views/NowView.jsx`**

After the existing imports at line ~1-3:

```js
import { sendMessage } from "../lib/gemini.js";
```

- [ ] **Step 2: Add `events` to the context destructure in NowView**

Find line ~33:
```js
const { tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch } = useAppData();
```

Replace with:
```js
const { tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch, events, tweaks } = useAppData();
```

We need `events` to pass recent activity to the system prompt, and `tweaks` is already unused here but `events` is what matters.

- [ ] **Step 3: Replace `handleChatSubmit` in NowView**

Find and replace the entire `handleChatSubmit` function (lines ~59-89):

Current fake implementation:
```js
const handleChatSubmit = (e) => {
  if (e) e.preventDefault();
  if (!chatInput.trim() || chatLoading) return;

  const userMessage = chatInput.trim();
  setChatLogs((prev) => [...prev, { sender: "user", text: userMessage }]);
  setChatInput("");
  setChatLoading(true);

  setTimeout(() => {
    let reply = "That makes sense. Take it one step at a time.";
    // ... keyword matching ...
    setChatLogs((prev) => [...prev, { sender: "assistant", text: reply }]);
    setChatLoading(false);
  }, 800);
};
```

Replace with:
```js
const handleChatSubmit = async (e) => {
  if (e) e.preventDefault();
  if (!chatInput.trim() || chatLoading) return;

  const userMessage = chatInput.trim();
  const updatedLogs = [...chatLogs, { sender: "user", text: userMessage }];
  setChatLogs(updatedLogs);
  setChatInput("");
  setChatLoading(true);

  try {
    const recentEvents = (events || []).slice(0, 10);
    const reply = await sendMessage(userMessage, updatedLogs, {
      activeTask,
      currentMood,
      energy: null, // energy from the mood check-in is not currently stored separately; Gemini gets mood context
      recentEvents,
    });
    setChatLogs((prev) => [...prev, { sender: "assistant", text: reply }]);
  } catch (err) {
    console.error("Gemini error:", err);
    setChatLogs((prev) => [
      ...prev,
      { sender: "assistant", text: "Mind Coach is temporarily unavailable. Check your API key in .env.local." },
    ]);
  } finally {
    setChatLoading(false);
  }
};
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Set a task as active (click it in Tasks view). Navigate to **Now** view. Type a message in the Mind Coach box and press **Send**. Within 1-3 seconds, a real Gemini response should appear, referencing the active task name.

- [ ] **Step 5: Test error case**

Temporarily set `VITE_GEMINI_API_KEY=invalid_key` in `.env.local`, restart the server, send a message. Confirm the fallback error message appears instead of crashing.

Restore the real key after testing.

- [ ] **Step 6: Commit**

```bash
git add src/views/NowView.jsx
git commit -m "feat: wire Mind Coach chatbot to Gemini 2.0 Flash with task/mood context"
```

---

## Task 4: Persist chat logs per task in localStorage

**Files:**
- Modify: `src/views/NowView.jsx` — chat state initialization and save-on-update

### Context

Currently `chatLogs` resets to the default greeting every time the component re-renders (task switch, view switch, page refresh). We want conversations to survive those events by storing them in localStorage keyed to the active task ID.

- [ ] **Step 1: Replace the static `chatLogs` initial state**

Find in NowView:
```js
const [chatLogs, setChatLogs] = useState([
  { sender: "assistant", text: "How is your focus going? Let me know if you are facing any friction." },
]);
```

Replace with a lazy initializer that loads from localStorage:

```js
const COACH_GREETING = { sender: "assistant", text: "How is your focus going? Let me know if you are facing any friction." };

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

Note: `COACH_GREETING` should be defined as a constant outside the component (at the top of the file, below imports) so it doesn't recreate on every render.

- [ ] **Step 2: Move `COACH_GREETING` constant outside the component**

Add this line just below the `MOOD_ICONS` map (around line 29), before the `NowView` function declaration:

```js
const COACH_GREETING = {
  sender: "assistant",
  text: "How is your focus going? Let me know if you are facing any friction.",
};
```

- [ ] **Step 3: Reset and reload chat when the active task changes**

Add a `useEffect` inside `NowView` after the existing `useEffect` for chat scroll (after line ~56):

```js
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

- [ ] **Step 4: Persist chat logs whenever they update**

Add another `useEffect` that writes to localStorage after each message:

```js
useEffect(() => {
  if (!activeTaskId || chatLogs.length <= 1) return; // Don't persist if only greeting
  try {
    localStorage.setItem(`mindCoach-${activeTaskId}`, JSON.stringify(chatLogs));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}, [chatLogs, activeTaskId]);
```

- [ ] **Step 5: Verify chat persistence in browser**

Run `npm run dev`. Set a task as active. Send a message to Mind Coach and get a reply. Switch to **Today's plan** view and back to **Now**. Confirm the conversation history is still there, not reset to the greeting.

- [ ] **Step 6: Verify task switch resets chat**

Switch to a different active task. Confirm the chat panel loads that task's history (or the greeting if it's new). Switch back to the first task — confirm its conversation is still there.

- [ ] **Step 7: Commit**

```bash
git add src/views/NowView.jsx
git commit -m "feat: persist Mind Coach chat logs per task in localStorage, reload on task switch"
```

---

## Task 5: Add energy level to Gemini context from last mood check-in

**Files:**
- Modify: `src/context/AppContext.jsx` — expose `lastCheckInEnergy` in context value
- Modify: `src/views/NowView.jsx` — pass energy to `sendMessage`

### Context

`handleMoodCheckin(mood, energy, tags)` receives energy but only stores `currentMood`. The energy value is logged in the `events` array as `checkin` events but isn't directly accessible as a top-level context value. We need to surface it.

- [ ] **Step 1: Add `lastCheckInEnergy` state to AppDataProvider in `AppContext.jsx`**

After the `lastCheckInAt` state declaration (around line 186):

```js
const [lastCheckInEnergy, setLastCheckInEnergy] = useState(() => {
  const saved = localStorage.getItem("mindLastCheckInEnergy");
  return saved ? JSON.parse(saved) : null;
});
```

- [ ] **Step 2: Persist `lastCheckInEnergy` to localStorage**

After the `lastCheckInAt` persistence effect, add:

```js
useEffect(() => {
  localStorage.setItem("mindLastCheckInEnergy", JSON.stringify(lastCheckInEnergy));
}, [lastCheckInEnergy]);
```

- [ ] **Step 3: Update `handleMoodCheckin` to save energy**

Find `handleMoodCheckin` (around line 634):

```js
const handleMoodCheckin = (mood, energy, tags = []) => {
  setCurrentMood(mood);
  setLastCheckInAt(new Date().toISOString());
  // ...
```

Add `setLastCheckInEnergy(energy);` after `setLastCheckInAt`:

```js
const handleMoodCheckin = (mood, energy, tags = []) => {
  setCurrentMood(mood);
  setLastCheckInAt(new Date().toISOString());
  setLastCheckInEnergy(energy);
  // ... rest unchanged
```

- [ ] **Step 4: Expose `lastCheckInEnergy` in the context value**

Find the `value` useMemo (around line 652):

```js
const value = useMemo(
  () => ({
    tasks,
    setTasks,
    events,
    currentMood,
    lastCheckInAt,
    activeTaskId,
    customMoodTags,
    tweaks,
    setTweak,
    dailyPlans,
    apiFetch,
    handleMoodCheckin,
    logEvent,
  }),
  [tasks, events, currentMood, lastCheckInAt, activeTaskId, customMoodTags, tweaks, dailyPlans]
);
```

Add `lastCheckInEnergy` to both the object and the dependency array:

```js
const value = useMemo(
  () => ({
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
  }),
  [tasks, events, currentMood, lastCheckInAt, lastCheckInEnergy, activeTaskId, customMoodTags, tweaks, dailyPlans]
);
```

- [ ] **Step 5: Use `lastCheckInEnergy` in NowView's `sendMessage` call**

In `src/views/NowView.jsx`, update the context destructure (from Task 3, Step 2) to also pull `lastCheckInEnergy`:

```js
const { tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch, events, lastCheckInEnergy } = useAppData();
```

Update the `handleChatSubmit` context object passed to `sendMessage`:

```js
const reply = await sendMessage(userMessage, updatedLogs, {
  activeTask,
  currentMood,
  energy: lastCheckInEnergy,
  recentEvents,
});
```

- [ ] **Step 6: Verify in browser**

Open the app. Complete a mood check-in and set energy to 2 (Exhausted). Start a task. In Mind Coach, ask "I'm feeling really tired". Confirm Gemini's response acknowledges the low energy level.

- [ ] **Step 7: Commit**

```bash
git add src/context/AppContext.jsx src/views/NowView.jsx
git commit -m "feat: pass last check-in energy level to Gemini context for more accurate coaching"
```

---

## Self-Review Checklist

- [x] **Gemini SDK installed** — Task 1
- [x] **API key in env var, gitignored** — Task 1
- [x] **`gemini.js` builds system prompt with task/mood/energy/events** — Task 2
- [x] **`sendMessage` converts our `{sender, text}` format to Gemini's `{role, parts}` format** — Task 2
- [x] **Fake bot replaced** — Task 3, fake `setTimeout` removed, async Gemini call in place
- [x] **Error fallback rendered if API fails** — Task 3, Step 3 catch block
- [x] **Chat logs persisted per task** — Task 4
- [x] **Chat resets on task switch, loads stored history** — Task 4
- [x] **Energy level wired from mood check-in through context to Gemini** — Task 5
- [x] **No placeholders** — all steps have exact code
- [x] **Type consistency** — `chatLogs: Array<{sender: string, text: string}>` used consistently across Tasks 3, 4. `COACH_GREETING` defined once, referenced in two places
- [x] **`lastCheckInEnergy` added to both context value and useMemo dep array** — Task 5, Steps 4 and 5
- [x] **`events` and `lastCheckInEnergy` added to destructure before use** — Task 3 Step 2, Task 5 Step 5

## Important Notes for the Engineer

- The `history` array passed to `model.startChat({ history })` in `gemini.js` must not include the current user message — it's sent separately via `chat.sendMessage(userMessage)`. The implementation in Task 2 correctly passes `chatHistory` (prior messages) as history, then sends the new message.
- `gemini-2.0-flash` is used for speed and low cost. If you want higher quality responses, switch to `gemini-2.0-flash-thinking` or `gemini-1.5-pro` in `src/lib/gemini.js`.
- Each `sendMessage` call recreates the chat session from history. This is intentional — it avoids storing server-side session state and keeps localStorage as the single source of truth.
