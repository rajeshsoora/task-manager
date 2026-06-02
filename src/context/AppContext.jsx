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

  const DEFAULT_TRAITS = {
    conscientiousness:   { score: 50, history: [] },
    perfectionism:       { score: 50, history: [] },
    emotionalRegulation: { score: 50, history: [] },
    timePerspective:     { score: 50, history: [] },
    impulsivity:         { score: 50, history: [] },
    selfEfficacy:        { score: 50, history: [] },
    onboardingComplete:  false,
    lastEvaluationAt:    null,
    evaluationCount:     0,
  };

  const [profile, setProfile] = useState({
    traits: null,
    patterns: null,
    context: null,
    loaded: false,
  });

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
        setProfile({ traits: null, patterns: null, context: null, loaded: false });
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

    const [tasksSnap, eventsSnap, plansSnap, freshPrefs, traitsSnap, patternsSnap, contextSnap] = await Promise.all([
      getDocs(collection(db, "users", uid, "tasks")),
      getDocs(query(collection(db, "users", uid, "events"), orderBy("timestamp", "desc"))),
      getDocs(collection(db, "users", uid, "daily_plans")),
      getDoc(prefsRef),
      getDoc(doc(db, "users", uid, "profile", "traits")),
      getDoc(doc(db, "users", uid, "profile", "patterns")),
      getDoc(doc(db, "users", uid, "profile", "context")),
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

    setProfile({
      traits: traitsSnap.exists() ? traitsSnap.data() : null,
      patterns: patternsSnap.exists() ? patternsSnap.data() : null,
      context: contextSnap.exists() ? contextSnap.data() : null,
      loaded: true,
    });

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

  const saveProfileTraits = async (newTraits) => {
    setProfile(prev => ({ ...prev, traits: newTraits }));
    if (user) await setDoc(doc(db, "users", user.uid, "profile", "traits"), newTraits);
  };

  const saveProfilePatterns = async (newPatterns) => {
    setProfile(prev => ({ ...prev, patterns: newPatterns }));
    if (user) await setDoc(doc(db, "users", user.uid, "profile", "patterns"), newPatterns);
  };

  const saveProfileContext = async (newContext) => {
    setProfile(prev => ({ ...prev, context: newContext }));
    if (user) await setDoc(doc(db, "users", user.uid, "profile", "context"), newContext);
  };

  const saveCoachSession = async (sessionData) => {
    if (!user) return;
    const ref = await addDoc(collection(db, "users", user.uid, "profile", "sessions"), sessionData);
    return ref.id;
  };

  const loadCoachSessions = async () => {
    if (!user) return [];
    const snap = await getDocs(collection(db, "users", user.uid, "profile", "sessions"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const saveMonthLog = async (yearMonth, logText) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "profile", "monthLogs", yearMonth), {
      summary: logText,
      createdAt: new Date().toISOString(),
    });
  };

  const saveQuarterLog = async (yearQuarter, logText) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "profile", "quarterLogs", yearQuarter), {
      summary: logText,
      createdAt: new Date().toISOString(),
    });
  };

  const loadMonthLogs = async () => {
    if (!user) return [];
    const snap = await getDocs(collection(db, "users", user.uid, "profile", "monthLogs"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const loadQuarterLogs = async () => {
    if (!user) return [];
    const snap = await getDocs(collection(db, "users", user.uid, "profile", "quarterLogs"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const deleteCoachSessions = async (sessionIds) => {
    if (!user) return;
    for (const id of sessionIds) {
      await deleteDoc(doc(db, "users", user.uid, "profile", "sessions", id));
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
      profile,
      saveProfileTraits,
      saveProfilePatterns,
      saveProfileContext,
      saveCoachSession,
      loadCoachSessions,
      saveMonthLog,
      saveQuarterLog,
      loadMonthLogs,
      loadQuarterLogs,
      deleteCoachSessions,
      DEFAULT_TRAITS,
    }),
    [user, loading, tasks, events, currentMood, lastCheckInAt, lastCheckInEnergy, activeTaskId, customMoodTags, tweaks, dailyPlans, profile]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

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
