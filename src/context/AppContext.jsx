import React, { createContext, useState, useEffect, useContext, useMemo } from "react";

// Initialize Contexts
const AuthContext = createContext(null);
const AppDataContext = createContext(null);

// Date Helpers
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

// Initial Demo Data
const DEMO_TASKS = [
  {
    id: "task-1",
    title: "Launch Mind Manager Application",
    kind: "work",
    quad: "q1",
    energy: 5,
    moods: ["focused", "creative"],
    cadence: "once",
    done: false,
    createdAt: new Date().toISOString(),
    lastTouched: new Date().toISOString(),
    template: "project",
    project: {
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
    id: "task-2",
    title: "Read 'Atomic Habits' by James Clear",
    kind: "learning",
    quad: "q2",
    energy: 2,
    moods: ["calm", "curious"],
    cadence: "daily",
    done: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastTouched: new Date().toISOString(),
    template: "book",
    book: {
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
    id: "task-3",
    title: "Master HSL & OKLCH Color Gradients",
    kind: "craft",
    quad: "q2",
    energy: 4,
    moods: ["creative", "focused"],
    cadence: "weekly",
    done: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastTouched: new Date().toISOString(),
    template: "skill",
    skill: {
      drills: [
        { id: "drill-1", label: "Fluid Type Scales Layouts", level: 3 },
        { id: "drill-2", label: "OKLCH Lightness and Chroma Mapping", level: 4 },
        { id: "drill-3", label: "CSS Variables Animation Transitions", level: 2 },
      ],
      recent: [
        { when: new Date().toISOString(), drill: "OKLCH Lightness and Chroma Mapping", note: "Adjusted lightness curve from 20% to 95% on OKLCH." },
        { when: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), drill: "Fluid Type Scales Layouts", note: "Configured CSS clamp() font rules." },
      ],
    },
  },
  {
    id: "task-4",
    title: "Mindfulness and Deep Breathing",
    kind: "drift",
    quad: "q4",
    energy: 1,
    moods: ["calm", "restless", "tired"],
    cadence: "daily",
    done: false,
    createdAt: new Date().toISOString(),
    lastTouched: new Date().toISOString(),
    template: "idle",
    idle: {
      lastDrifts: [
        { when: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), mins: 15, note: "Felt very relaxed and recharged.", mood: ["calm"] },
      ],
    },
  },
];

const DEMO_EVENTS = [
  {
    type: "checkin",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    energy: 3,
    mood: ["calm", "focused"],
  },
  {
    type: "progress",
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    taskId: "task-2",
    taskTitle: "Read 'Atomic Habits' by James Clear",
    title: "Marked Chapter 1 as Done",
    energy: 3,
    mood: ["calm"],
  },
  {
    type: "drift",
    timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    taskId: "task-4",
    taskTitle: "Mindfulness and Deep Breathing",
    mins: 15,
    note: "Felt very relaxed and recharged.",
    energy: 2,
    mood: ["calm"],
  },
  {
    type: "checkin",
    timestamp: new Date().toISOString(),
    energy: 4,
    mood: ["focused", "creative"],
  },
];

// App Data Store Provider
export function AppDataProvider({ children }) {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("mindTasks");
    return saved ? JSON.parse(saved) : DEMO_TASKS;
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("mindEvents");
    return saved ? JSON.parse(saved) : DEMO_EVENTS;
  });

  const [currentMood, setCurrentMood] = useState(() => {
    const saved = localStorage.getItem("mindCurrentMood");
    return saved ? JSON.parse(saved) : null;
  });

  const [lastCheckInAt, setLastCheckInAt] = useState(() => {
    const saved = localStorage.getItem("mindLastCheckInAt");
    return saved ? JSON.parse(saved) : null;
  });

  const [lastCheckInEnergy, setLastCheckInEnergy] = useState(() => {
    const saved = localStorage.getItem("mindLastCheckInEnergy");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTaskId, setActiveTaskId] = useState(() => {
    const saved = localStorage.getItem("mindActiveTaskId");
    return saved ? JSON.parse(saved) : null;
  });

  const [customMoodTags, setCustomMoodTags] = useState(() => {
    const saved = localStorage.getItem("mindCustomMoodTags");
    return saved ? JSON.parse(saved) : ["productive", "mindful", "inspired"];
  });

  const [tweaks, setTweaks] = useState(() => {
    const saved = localStorage.getItem("mindTweaks");
    return saved
      ? JSON.parse(saved)
      : {
          moodModel: "energy-tags",
          density: "comfortable",
          theme: "light",
          accent: "#c9633f",
          celebrations: true,
          sound: false,
        };
  });

  const [dailyPlans, setDailyPlans] = useState(() => {
    const saved = localStorage.getItem("mindDailyPlans");
    return saved ? JSON.parse(saved) : {};
  });

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem("mindTasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("mindEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("mindCurrentMood", JSON.stringify(currentMood));
  }, [currentMood]);

  useEffect(() => {
    localStorage.setItem("mindLastCheckInAt", JSON.stringify(lastCheckInAt));
  }, [lastCheckInAt]);

  useEffect(() => {
    localStorage.setItem("mindLastCheckInEnergy", JSON.stringify(lastCheckInEnergy));
  }, [lastCheckInEnergy]);

  useEffect(() => {
    localStorage.setItem("mindActiveTaskId", JSON.stringify(activeTaskId));
  }, [activeTaskId]);

  useEffect(() => {
    localStorage.setItem("mindCustomMoodTags", JSON.stringify(customMoodTags));
  }, [customMoodTags]);

  useEffect(() => {
    localStorage.setItem("mindTweaks", JSON.stringify(tweaks));
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    if (tweaks.accent) {
      document.documentElement.style.setProperty("--accent", tweaks.accent);
    }
  }, [tweaks]);

  useEffect(() => {
    localStorage.setItem("mindDailyPlans", JSON.stringify(dailyPlans));
  }, [dailyPlans]);

  // Helper to update individual tweak
  const setTweak = (key, value) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to add timeline event
  const logEvent = (eventData) => {
    const newEvent = {
      timestamp: new Date().toISOString(),
      energy: tweaks.moodModel.includes("energy") ? 3 : null,
      mood: currentMood ? [currentMood] : [],
      ...eventData,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // Simulation API endpoint (/actions)
  const apiFetch = async (path, options = {}) => {
    if (path !== "/actions" && path !== "/timeline") {
      if (path === "/timeline") {
        return { events };
      }
      throw new Error(`Endpoint not mock-supported: ${path}`);
    }

    if (path === "/timeline") {
      return { events };
    }

    const { action } = options.body || {};
    if (!action) return null;

    let celebration = null;

    switch (action.type) {
      case "add_mood_tag":
        if (action.tag && !customMoodTags.includes(action.tag)) {
          setCustomMoodTags((prev) => [...prev, action.tag]);
        }
        break;

      case "remove_mood_tag":
        setCustomMoodTags((prev) => prev.filter((t) => t !== action.tag));
        break;

      case "set_active": {
        const prevActiveId = activeTaskId;
        const nextActiveId = action.taskId;
        setActiveTaskId(nextActiveId);

        if (nextActiveId) {
          const task = tasks.find((t) => t.id === nextActiveId);
          if (task) {
            // Update lastTouched date
            setTasks((prev) =>
              prev.map((t) =>
                t.id === nextActiveId ? { ...t, lastTouched: new Date().toISOString() } : t
              )
            );

            // Log timeline switch event
            if (prevActiveId && prevActiveId !== nextActiveId) {
              const prevTask = tasks.find((t) => t.id === prevActiveId);
              logEvent({
                type: "switch",
                taskId: nextActiveId,
                title: `Switched to: ${task.title}`,
                taskTitle: task.title,
                switchReason: action.switchReason || { kind: "switch", note: `Left ${prevTask ? prevTask.title : "previous task"}` },
              });
            } else {
              logEvent({
                type: "progress",
                taskId: nextActiveId,
                title: `Started working on: ${task.title}`,
                taskTitle: task.title,
              });
            }
          }
        }
        break;
      }

      case "complete": {
        const taskId = action.taskId;
        let isDone = false;
        let taskTitle = "";
        
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              isDone = !t.done;
              taskTitle = t.title;
              return {
                ...t,
                done: isDone,
                lastTouched: new Date().toISOString(),
              };
            }
            return t;
          })
        );

        if (isDone) {
          celebration = {
            type: "task_complete",
            title: taskTitle,
            sound: tweaks.sound,
          };
          logEvent({
            type: "progress",
            taskId,
            title: `Completed task: ${taskTitle}`,
            taskTitle,
          });
          // Deactivate if completed
          if (activeTaskId === taskId) {
            setActiveTaskId(null);
          }
        } else {
          logEvent({
            type: "progress",
            taskId,
            title: `Reopened task: ${taskTitle}`,
            taskTitle,
          });
        }
        break;
      }

      case "delete_task":
        setTasks((prev) => prev.filter((t) => t.id !== action.taskId));
        if (activeTaskId === action.taskId) {
          setActiveTaskId(null);
        }
        // Remove from daily plan
        setDailyPlans((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((date) => {
            updated[date] = updated[date].filter((id) => id !== action.taskId);
          });
          return updated;
        });
        break;

      case "update_task":
        setTasks((prev) =>
          prev.map((t) =>
            t.id === action.taskId
              ? { ...t, ...action.task, lastTouched: new Date().toISOString() }
              : t
          )
        );
        break;

      case "update_daily_plan":
        setDailyPlans((prev) => ({
          ...prev,
          [action.date]: action.taskIds,
        }));
        break;

      case "toggle_subtask":
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.project) {
              const phases = t.project.phases.map((p) => {
                if (p.id === action.phaseId) {
                  const subs = p.subs.map((s) =>
                    s.id === action.subId ? { ...s, done: !s.done } : s
                  );
                  return { ...p, subs };
                }
                return p;
              });
              return { ...t, project: { ...t.project, phases } };
            }
            return t;
          })
        );
        break;

      case "advance_phase": {
        let celebrationMsg = "";
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.project) {
              const phases = t.project.phases.map((p, idx) => {
                if (p.id === action.phaseId) {
                  celebrationMsg = `Completed Phase: ${p.title}`;
                  return { ...p, status: "done" };
                }
                // set next phase doing
                if (idx > 0 && t.project.phases[idx - 1].id === action.phaseId) {
                  return { ...p, status: "doing" };
                }
                return p;
              });
              return { ...t, project: { ...t.project, phases } };
            }
            return t;
          })
        );
        celebration = {
          type: "phase_complete",
          text: celebrationMsg,
          sound: tweaks.sound,
        };
        logEvent({
          type: "milestone",
          taskId: action.taskId,
          title: celebrationMsg,
          taskTitle: tasks.find((t) => t.id === action.taskId)?.title || "",
        });
        break;
      }

      case "level_drill":
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.skill) {
              const drills = t.skill.drills.map((d) =>
                d.id === action.drillId ? { ...d, level: action.level } : d
              );
              return { ...t, skill: { ...t.skill, drills } };
            }
            return t;
          })
        );
        if (action.level === 5) {
          celebration = {
            type: "drill_max",
            title: "Drill Mastery Set!",
            sound: tweaks.sound,
          };
        }
        break;

      case "log_skill_session": {
        const timestamp = new Date().toISOString();
        let taskTitle = "";
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.skill) {
              taskTitle = t.title;
              const recent = [
                { when: timestamp, drill: action.drill, note: action.note },
                ...(t.skill.recent || []),
              ];
              return { ...t, skill: { ...t.skill, recent } };
            }
            return t;
          })
        );
        celebration = {
          type: "session_logged",
          text: `Logged practice session for ${action.drill || "Skill"}`,
          sound: tweaks.sound,
        };
        logEvent({
          type: "progress",
          taskId: action.taskId,
          title: `Logged Session: ${action.note}`,
          taskTitle,
        });
        break;
      }

      case "end_drift": {
        const timestamp = new Date().toISOString();
        let taskTitle = "";
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.idle) {
              taskTitle = t.title;
              const lastDrifts = [
                { when: timestamp, mins: action.mins, note: action.note, mood: currentMood ? [currentMood] : [] },
                ...(t.idle.lastDrifts || []),
              ];
              return { ...t, idle: { ...t.idle, lastDrifts } };
            }
            return t;
          })
        );
        logEvent({
          type: "drift",
          taskId: action.taskId,
          taskTitle,
          mins: action.mins,
          note: action.note,
        });
        setActiveTaskId(null); // End drift active state
        break;
      }

      case "mark_chapter": {
        let chapterTitle = "";
        let isBookCompleted = false;
        let taskTitle = "";
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.book) {
              taskTitle = t.title;
              const chapters = t.book.chapters.map((c) => {
                if (c.id === action.chapterId) {
                  chapterTitle = c.title;
                  return { ...c, status: action.status === "done" ? "done" : "unread" };
                }
                return c;
              });
              const doneCount = chapters.filter((c) => c.status === "done").length;
              if (doneCount === chapters.length && action.status === "done") {
                isBookCompleted = true;
              }
              return { ...t, book: { ...t.book, chapters } };
            }
            return t;
          })
        );

        if (action.status === "done") {
          celebration = {
            type: "chapter_done",
            text: `Finished Chapter: ${chapterTitle}`,
            sound: tweaks.sound,
          };
          logEvent({
            type: "progress",
            taskId: action.taskId,
            title: `Finished Chapter: ${chapterTitle}`,
            taskTitle,
          });
        }
        break;
      }

      case "set_reading_chapter":
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.book) {
              const chapters = t.book.chapters.map((c) => {
                if (c.id === action.chapterId) {
                  return { ...c, status: "reading" };
                }
                if (c.status === "reading") {
                  return { ...c, status: "unread" };
                }
                return c;
              });
              return { ...t, book: { ...t.book, chapters } };
            }
            return t;
          })
        );
        break;

      case "update_chapter_note":
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === action.taskId && t.book) {
              const chapters = t.book.chapters.map((c) =>
                c.id === action.chapterId ? { ...c, note: action.note } : c
              );
              return { ...t, book: { ...t.book, chapters } };
            }
            return t;
          })
        );
        break;

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

    return { celebration };
  };

  const handleMoodCheckin = (mood, energy, tags = []) => {
    setCurrentMood(mood);
    setLastCheckInAt(new Date().toISOString());
    setLastCheckInEnergy(energy);
    tags.forEach((t) => {
      if (!customMoodTags.includes(t)) {
        setCustomMoodTags((prev) => [...prev, t]);
      }
    });
    // Log mood event in timeline
    const checkinEvent = {
      type: "checkin",
      timestamp: new Date().toISOString(),
      energy,
      mood: [mood, ...tags],
    };
    setEvents((prev) => [checkinEvent, ...prev]);
  };

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

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// Custom State Hooks
export function useAuth() {
  const [user, setUser] = useState({
    email: "guest@mindmanager.local",
    uid: "guest-user",
  });

  const signIn = async () => {
    setUser({ email: "guest@mindmanager.local", uid: "guest-user" });
  };

  const signOut = async () => {
    setUser(null);
  };

  return { user, signIn, signOut, allowListError: false };
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
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
  const plan = useMemo(() => {
    return {
      date,
      taskIds: dailyPlans[date] || [],
    };
  }, [dailyPlans, date]);

  return { plan, loading: false, error: null };
}
