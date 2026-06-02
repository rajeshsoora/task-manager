import React, { useState, useEffect, useRef } from "react";
import { useAppData, useDailyPlan } from "../context/AppContext";
import { sendMessage } from "../lib/gemini.js";
import SubtaskPreviewModal from "../components/SubtaskPreviewModal";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Score ranking algorithm based on user mood and energy
function rankTasks(tasks, activeTaskId, currentMood, customMoodTags, energyLevel) {
  const userTags = [currentMood, ...(customMoodTags || [])].filter(Boolean);
  const userEnergy = energyLevel ?? 3;
  
  return tasks
    .filter((t) => t.id !== activeTaskId && !t.done && t.template !== "idle")
    .map((t) => {
      const matchCount = (t.moods || []).filter((m) => userTags.includes(m)).length;
      const energyDiff = 5 - Math.abs((t.energy ?? 3) - userEnergy);
      return { task: t, score: matchCount * 3 + energyDiff };
    })
    .sort((a, b) => b.score - a.score);
}

// Mood icons map
const MOOD_ICONS = {
  focused: "🎯",
  creative: "🎨",
  calm: "🌊",
  social: "💬",
  curious: "🔍",
  restless: "⚡",
  tired: "💤",
  scattered: "🌀",
};

const COACH_GREETING = {
  sender: "assistant",
  text: "How is your focus going? Let me know if you are facing any friction.",
};

export default function NowView({ onSetActive, onEdit, onGoToToday }) {
  const { user, tasks, activeTaskId, currentMood, lastCheckInAt, customMoodTags, apiFetch, events, lastCheckInEnergy, profile } = useAppData();
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const { plan } = useDailyPlan(todayStr);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  
  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatLogs, setChatLogs] = useState([COACH_GREETING]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [showSubtaskPreview, setShowSubtaskPreview] = useState(false);

  // Switch Task Modal States
  const [pendingActiveId, setPendingActiveId] = useState(null);
  const [switchReasonKind, setSwitchReasonKind] = useState("break");
  const [switchReasonNote, setSwitchReasonNote] = useState("");

  // Scroll Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLogs]);

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

  useEffect(() => {
    if (!activeTaskId || !user || chatLogs.length <= 1) return;
    setDoc(
      doc(db, "users", user.uid, "chat_history", activeTaskId),
      { messages: chatLogs },
      { merge: true }
    );
  }, [chatLogs, activeTaskId, user]);

  // Handle cognitive coach chatbot responses
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
      const reply = await sendMessage(userMessage, chatLogs, {
        activeTask,
        currentMood,
        energy: lastCheckInEnergy,
        recentEvents,
        profile: profile?.traits?.onboardingComplete ? profile : null,
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

  // Perform mood matched suggestions
  const recommendations = React.useMemo(() => {
    return rankTasks(tasks, activeTaskId, currentMood, customMoodTags, 3);
  }, [tasks, activeTaskId, currentMood, customMoodTags]);

  const activePlannedTasks = React.useMemo(() => {
    if (!plan || plan.taskIds.length === 0) return [];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return plan.taskIds.map((id) => taskMap.get(id)).filter((t) => t && !t.done);
  }, [tasks, plan]);

  // Handle Switch Reason Confirm
  const handleConfirmSwitch = () => {
    onSetActive(pendingActiveId, { kind: switchReasonKind, note: switchReasonNote });
    setPendingActiveId(null);
    setSwitchReasonKind("break");
    setSwitchReasonNote("");
  };

  // Trigger switch modal or active state directly
  const triggerSetActive = (id) => {
    if (activeTaskId && activeTaskId !== id) {
      setPendingActiveId(id);
    } else {
      onSetActive(id);
    }
  };

  // Check if task touched today
  const isTouchedToday = (task) => {
    if (!task.lastTouched) return false;
    return task.lastTouched.slice(0, 10) === todayStr;
  };

  if (!activeTask) {
    return (
      <div className="now-empty">
        <div className="h-eyebrow">Nothing in flight</div>
        <h1 className="h-display serif">What feels right, right now?</h1>
        <p className="h-section" style={{ maxWidth: 480, color: "var(--muted)" }}>
          {activePlannedTasks.length > 0
            ? "Start with your plan below, or pick a mood-matched alternative."
            : recommendations.length === 0
            ? "No open tasks yet. Create one from the Tasks view to get started."
            : `${recommendations.length} task${recommendations.length === 1 ? "" : "s"} below, ranked by how well they fit your mood. Pick one.`}
        </p>

        {/* Today's plan shortcut checklist */}
        {activePlannedTasks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="h-eyebrow">Today's plan · {activePlannedTasks.length}</div>
              <button className="btn btn-sm btn-ghost" onClick={onGoToToday}>Edit plan →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {activePlannedTasks.map((t, idx) => {
                const touched = isTouchedToday(t);
                return (
                  <button
                    key={t.id}
                    onClick={() => triggerSetActive(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      background: touched ? "var(--panel-2)" : "var(--panel)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--faint)", width: 18 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1, fontSize: 14 }}>
                      {t.title}
                      {t.template && <span className="task-template-pill" style={{ marginLeft: 6 }}>{t.template}</span>}
                    </span>
                    <span className="btn btn-sm" style={{ pointerEvents: "none" }}>Start</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood recommendations list */}
        {recommendations.length > 0 && (
          <div>
            <div className="h-eyebrow" style={{ marginTop: 8, marginBottom: 12 }}>
              {activePlannedTasks.length > 0 ? "If not — mood-matched picks" : "Recommended for your mood"}
            </div>
            <div className="up-next-grid">
              {recommendations.slice(0, 4).map(({ task }, idx) => (
                <div
                  key={task.id}
                  className="up-next-card"
                  onClick={() => triggerSetActive(task.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="up-next-kind">{task.kind}</span>
                    {idx === 0 && activePlannedTasks.length === 0 && (
                      <span className="up-next-match">best match</span>
                    )}
                  </div>
                  <h3 className="up-next-title">{task.title}</h3>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {(task.moods || []).slice(0, 2).map((m) => (
                      <span key={m} className="up-next-tag">
                        {MOOD_ICONS[m] || "•"} {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Switch Reason Modal Popups */}
        {pendingActiveId && (
          <div className="modal-backdrop">
            <div className="modal-sheet" style={{ maxWidth: 360 }}>
              <div className="modal-header">
                <h3 className="modal-title serif">Why are you switching?</h3>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
                Mind logs task switches so you can review focus friction in your Timeline logs.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <select
                  className="field-input"
                  value={switchReasonKind}
                  onChange={(e) => setSwitchReasonKind(e.target.value)}
                >
                  <option value="break">Taking a break</option>
                  <option value="tired">Feeling exhausted / distracted</option>
                  <option value="blocked">Task is blocked / stuck</option>
                  <option value="drift">Just drifting</option>
                  <option value="other">Other reason</option>
                </select>

                <textarea
                  className="field-textarea"
                  placeholder="Quick note about what pulled you away... (optional)"
                  rows={2}
                  value={switchReasonNote}
                  onChange={(e) => setSwitchReasonNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmSwitch}>
                  Confirm Switch
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingActiveId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Active Header card */}
      <div className="active-task-card" style={{ borderLeft: "4px solid var(--accent)", paddingLeft: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="h-eyebrow" style={{ textTransform: "uppercase" }}>
            🎯 Focus Target · {activeTask.kind}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={() => onEdit(activeTask)}>Edit details</button>
        </div>
        <h1 className="h-display serif" style={{ margin: "4px 0 12px" }}>{activeTask.title}</h1>

        {/* Generate subtasks nudge — only when task has no subtasks */}
        {activeTask.template !== "idle" &&
          !(activeTask.template === "project" && (activeTask.project?.phases || []).length > 0) &&
          !(activeTask.template === "book"    && (activeTask.book?.chapters || []).length > 0) &&
          !(activeTask.template === "skill"   && (activeTask.skill?.drills || []).length > 0) && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ fontSize: 11, marginBottom: 8 }}
            onClick={() => setShowSubtaskPreview(true)}
          >
            ✦ Generate subtasks
          </button>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={() => apiFetch("/actions", { method: "POST", body: { action: { type: "complete", taskId: activeTask.id } } })}>
            ✓ Mark Complete
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => apiFetch("/actions", { method: "POST", body: { action: { type: "set_active", taskId: null } } })}>
            ⏸ Pause / Park
          </button>
        </div>
      </div>

      {/* Template Specific views */}
      {activeTask.template === "book" && <BookTemplate task={activeTask} apiFetch={apiFetch} />}
      {activeTask.template === "skill" && <SkillTemplate task={activeTask} apiFetch={apiFetch} />}
      {activeTask.template === "project" && <ProjectTemplate task={activeTask} apiFetch={apiFetch} />}
      {activeTask.template === "idle" && <DriftTemplate task={activeTask} apiFetch={apiFetch} />}

      {/* ChatGPT Cognitive coach chat logs */}
      {activeTask.template !== "idle" && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", overflow: "hidden", marginTop: 24 }}>
          <div style={{ background: "var(--panel-2)", padding: "10px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Mind Coach</span>
          </div>

          <div style={{ height: 180, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {chatLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: log.sender === "user" ? "flex-end" : "flex-start",
                  background: log.sender === "user" ? "var(--accent)" : "var(--panel-2)",
                  color: log.sender === "user" ? "white" : "var(--ink)",
                  padding: "6px 12px",
                  borderRadius: 12,
                  maxWidth: "80%",
                  fontSize: 13,
                }}
              >
                {log.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: "flex-start", background: "var(--panel-2)", padding: "6px 12px", borderRadius: 12, fontSize: 12, color: "var(--muted)" }}>
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} style={{ display: "flex", borderTop: "1px solid var(--line)", padding: 8, gap: 8, background: "var(--panel-2)" }}>
            <input
              type="text"
              className="field-input"
              style={{ flex: 1, border: "1px solid var(--line)", background: "var(--panel)" }}
              placeholder="Tell Mind what's on your mind..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={chatLoading || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      {showSubtaskPreview && activeTask && (
        <SubtaskPreviewModal
          task={activeTask}
          onClose={() => setShowSubtaskPreview(false)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Book Template subview
// -------------------------------------------------------------
function BookTemplate({ task, apiFetch }) {
  const [activeNoteCh, setActiveNoteCh] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const chapters = task.book?.chapters || [];
  
  const currentIdx = chapters.findIndex((c) => c.status === "reading");
  const readingCh = currentIdx >= 0 ? chapters[currentIdx] : null;
  const finishedCount = chapters.filter((c) => c.status === "done").length;
  const progressPercent = chapters.length ? (finishedCount / chapters.length) * 100 : 0;

  const handleToggleDone = (cId, isDone) => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "mark_chapter", chapterId: cId, status: isDone ? "done" : "unread", taskId: task.id } },
    });
  };

  const handleStartRead = (cId) => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "set_reading_chapter", chapterId: cId, taskId: task.id } },
    });
  };

  const handleOpenNote = (ch) => {
    setActiveNoteCh(ch.id);
    setNoteInput(ch.note || "");
  };

  const handleSaveNote = () => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "update_chapter_note", chapterId: activeNoteCh, note: noteInput, taskId: task.id } },
    });
    setActiveNoteCh(null);
  };

  return (
    <div className="tpl tpl-book" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
      <div className="tpl-summary" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="tpl-summary-label">Currently reading</div>
          <div className="tpl-summary-title serif" style={{ fontSize: 20, fontWeight: 600 }}>
            {readingCh ? `Ch ${currentIdx + 1} · ${readingCh.title}` : "Pick a chapter"}
          </div>
          {readingCh?.note && (
            <div className="tpl-summary-note serif" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginTop: 4 }}>
              "{readingCh.note}"
            </div>
          )}
        </div>

        <div className="tpl-progress" style={{ width: 140, textAlign: "right" }}>
          <div className="tpl-progress-meta">
            <span className="serif" style={{ fontSize: 28, fontWeight: 600 }}>{finishedCount}</span>
            <span style={{ fontSize: 14, color: "var(--muted)" }}> / {chapters.length} ch</span>
          </div>
          <div className="tpl-progress-bar" style={{ height: 6, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden", margin: "6px 0" }}>
            <span style={{ display: "block", height: "100%", background: "var(--accent)", width: `${progressPercent}%` }}></span>
          </div>
          <div className="tpl-progress-sub mono" style={{ fontSize: 11, color: "var(--faint)" }}>
            {progressPercent.toFixed(0)}% complete
          </div>
        </div>
      </div>

      <div className="tpl-list-label" style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
        CHAPTERS LIST
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {chapters.map((ch, idx) => (
          <div
            key={ch.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <input
                type="checkbox"
                checked={ch.status === "done"}
                onChange={(e) => handleToggleDone(ch.id, e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span
                style={{
                  fontSize: 13,
                  textDecoration: ch.status === "done" ? "line-through" : "none",
                  color: ch.status === "done" ? "var(--faint)" : ch.status === "reading" ? "var(--accent)" : "var(--ink)",
                  fontWeight: ch.status === "reading" ? "600" : "normal",
                }}
              >
                Ch {idx + 1} · {ch.title}
              </span>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {ch.status !== "done" && ch.status !== "reading" && (
                <button className="btn btn-sm btn-ghost" onClick={() => handleStartRead(ch.id)}>Read</button>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => handleOpenNote(ch)}>✍ Note</button>
            </div>
          </div>
        ))}
      </div>

      {activeNoteCh && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 360 }}>
            <h3 className="modal-title serif">Chapter Notes</h3>
            <textarea
              className="field-textarea"
              rows={4}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="What are the key takeaways from this chapter?"
              style={{ width: "100%", marginTop: 8, marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveNote}>Save Note</button>
              <button className="btn btn-ghost" onClick={() => setActiveNoteCh(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Skill Template subview
// -------------------------------------------------------------
function SkillTemplate({ task, apiFetch }) {
  const [logOpen, setLogOpen] = useState(false);
  const [logDrill, setLogDrill] = useState("");
  const [logNote, setLogNote] = useState("");
  
  const drills = task.skill?.drills || [];
  const recents = task.skill?.recent || [];
  const avgLevel = drills.length ? drills.reduce((sum, d) => sum + (d.level || 0), 0) / drills.length : 0;

  const handleSetMastery = (drillId, currentLevel, cellIdx) => {
    // If click current level dot, keep it or toggle
    const newLvl = cellIdx + 1;
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "level_drill", drillId, level: newLvl, taskId: task.id } },
    });
  };

  const handleSaveLog = () => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "log_skill_session", drill: logDrill, note: logNote, taskId: task.id } },
    });
    setLogDrill("");
    setLogNote("");
    setLogOpen(false);
  };

  return (
    <div className="tpl tpl-skill" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
      <div className="tpl-summary" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="tpl-summary-label">Streak</div>
          <div className="tpl-summary-title serif" style={{ fontSize: 24, fontWeight: 600 }}>
            {recents.length} <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: "normal" }}>sessions logged</span>
          </div>
          <div className="tpl-summary-note" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {recents.length > 0
              ? `Last practice — ${new Date(recents[0].when).toLocaleDateString()}.`
              : "No sessions recorded."}
          </div>
        </div>

        <div className="tpl-progress" style={{ width: 140, textAlign: "right" }}>
          <div className="tpl-progress-meta">
            <span className="serif" style={{ fontSize: 28, fontWeight: 600 }}>{avgLevel.toFixed(1)}</span>
            <span style={{ fontSize: 14, color: "var(--muted)" }}> / 5</span>
          </div>
          <span className="tpl-progress-label" style={{ fontSize: 11, color: "var(--faint)" }}>avg mastery</span>
        </div>
      </div>

      <div className="tpl-list-label" style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
        DRILLS · CLICK DOT TO SET MASTERY
      </div>

      <div className="drill-grid" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {drills.map((drill) => (
          <div
            key={drill.id}
            className="drill-row"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}
          >
            <span className="drill-label" style={{ fontSize: 13, flex: 1 }}>{drill.label}</span>
            <div className="drill-dots" style={{ display: "flex", gap: 6, marginRight: 16 }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => handleSetMastery(drill.id, drill.level, idx)}
                  className="drill-dot"
                  data-on={idx < (drill.level || 0) ? "true" : "false"}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: idx < (drill.level || 0) ? "var(--accent)" : "var(--line-soft)",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
            <span className="drill-level mono" style={{ fontSize: 12, color: "var(--muted)", width: 32, textAlign: "right" }}>
              {drill.level || 0}/5
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-soft)", paddingTop: 12, marginBottom: 8 }}>
        <span className="h-eyebrow">Recent Practice Sessions</span>
        <button className="btn btn-sm" onClick={() => setLogOpen(true)}>＋ Log session</button>
      </div>

      <div className="recent-list" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {recents.slice(0, 3).map((r, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <span style={{ color: "var(--faint)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {new Date(r.when).toLocaleDateString()}
            </span>
            <div style={{ flex: 1 }}>
              {r.drill && <strong style={{ color: "var(--accent)", marginRight: 6 }}>[{r.drill}]</strong>}
              <span>{r.note}</span>
            </div>
          </div>
        ))}
      </div>

      {logOpen && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 360 }}>
            <h3 className="modal-title serif">Log Practice Session</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "12px 0" }}>
              <select
                className="field-input"
                value={logDrill}
                onChange={(e) => setLogDrill(e.target.value)}
              >
                <option value="">— Pick a drill (optional) —</option>
                {drills.map((d) => (
                  <option key={d.id} value={d.label}>{d.label}</option>
                ))}
              </select>
              <textarea
                className="field-textarea"
                rows={3}
                placeholder="Notes: what felt strong? what needs focus next?"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveLog} disabled={!logNote.trim()}>
                Save Session
              </button>
              <button className="btn btn-ghost" onClick={() => setLogOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Project Template subview
// -------------------------------------------------------------
function ProjectTemplate({ task, apiFetch }) {
  const phases = task.project?.phases || [];
  const currentIdx = phases.findIndex((p) => p.status === "doing");
  const activePhase = currentIdx >= 0 ? phases[currentIdx] : null;
  const donePhasesCount = phases.filter((p) => p.status === "done").length;

  const handleToggleSub = (phaseId, subId) => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "toggle_subtask", phaseId, subId, taskId: task.id } },
    });
  };

  const handleAdvancePhase = (phaseId) => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "advance_phase", phaseId, taskId: task.id } },
    });
  };

  return (
    <div className="tpl tpl-project" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
      <div className="tpl-summary" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="tpl-summary-label">Current phase</div>
          <div className="tpl-summary-title serif" style={{ fontSize: 20, fontWeight: 600 }}>
            {activePhase ? activePhase.title : "All phases completed!"}
          </div>
          {activePhase && (
            <div className="tpl-summary-note" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {activePhase.subs.filter((s) => s.done).length} / {activePhase.subs.length} subtasks done
            </div>
          )}
        </div>

        <div className="tpl-progress" style={{ width: 140, textAlign: "right" }}>
          <div className="tpl-progress-meta">
            <span className="serif" style={{ fontSize: 28, fontWeight: 600 }}>{donePhasesCount}</span>
            <span style={{ fontSize: 14, color: "var(--muted)" }}> / {phases.length}</span>
          </div>
          <span className="tpl-progress-label" style={{ fontSize: 11, color: "var(--faint)" }}>phases done</span>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="phase-bar" style={{ display: "flex", gap: 4, margin: "16px 0" }}>
        {phases.map((p, idx) => (
          <div
            key={p.id}
            className="phase-pill"
            data-status={p.status}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 11,
              border: "1px solid var(--line)",
              background: p.status === "done" ? "var(--accent-soft)" : p.status === "doing" ? "var(--panel-2)" : "var(--panel)",
              color: p.status === "done" ? "var(--accent)" : "var(--ink)",
              fontWeight: p.status === "doing" ? "600" : "normal",
            }}
          >
            {idx + 1}
          </div>
        ))}
      </div>

      {activePhase && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--panel-2)" }}>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>{activePhase.title} — Checklist</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {activePhase.subs.map((s) => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => handleToggleSub(activePhase.id, s.id)}
                  style={{ width: 15, height: 15 }}
                />
                <span style={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--faint)" : "var(--ink)" }}>
                  {s.label}
                </span>
              </label>
            ))}
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => handleAdvancePhase(activePhase.id)}>
            Advance Phase →
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Drift / Idle Template subview
// -------------------------------------------------------------
function DriftTemplate({ task, apiFetch }) {
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const drifts = task.idle?.lastDrifts || [];

  useEffect(() => {
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [task.id]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const handleEndDrift = () => {
    apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "end_drift", taskId: task.id, mins: Math.max(1, mins), note } },
    });
  };

  return (
    <div className="tpl tpl-idle" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 24, background: "var(--panel)", textAlign: "center" }}>
      <div className="idle-pad">
        <div className="idle-label" style={{ textTransform: "uppercase", fontSize: 12, letterSpacing: 1, color: "var(--muted)", marginBottom: 8 }}>drifting</div>
        
        <div className="idle-timer serif" style={{ fontSize: 64, fontWeight: "300", lineHeight: 1, marginBottom: 16 }}>
          {mins}<span className="idle-timer-sep" style={{ margin: "0 4px", animation: "blink 1s step-end infinite" }}>:</span>{String(secs).padStart(2, "0")}
        </div>

        <div className="idle-sub" style={{ fontSize: 13, color: "var(--muted)", maxWidth: 360, margin: "0 auto 16px" }}>
          It's ok to be here. Mind is keeping the time so you don't have to.
        </div>

        <textarea
          className="field-textarea"
          rows={2}
          placeholder="Anything to note when you're back? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ maxWidth: 400, margin: "0 auto 16px", display: "block" }}
        />

        <button className="btn btn-primary" onClick={handleEndDrift}>
          Done drifting
        </button>
      </div>

      {drifts.length > 0 && (
        <div style={{ marginTop: 24, textAlign: "left" }}>
          <div className="tpl-list-label" style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
            RECENT DRIFTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {drifts.slice(0, 3).map((d, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderBottom: "1px solid var(--line-soft)", padding: "4px 0" }}>
                <span style={{ color: "var(--faint)" }}>{new Date(d.when).toLocaleDateString()}</span>
                <span style={{ flex: 1, marginLeft: 8 }}>{d.note || "No note recorded."}</span>
                <span className="mono" style={{ color: "var(--accent)" }}>{d.mins}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
