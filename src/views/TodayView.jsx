import { useState, useMemo, useEffect } from "react";
import { useAppData, useDailyPlan, formatDate, getYesterdayDate } from "../context/AppContext";

export default function TodayView({ onSetActive }) {
  const { tasks, dailyPlans, apiFetch, activeTaskId } = useAppData();
  
  const todayStr = formatDate(new Date());
  const { plan, loading } = useDailyPlan(todayStr);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Native Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [draggedSource, setDraggedSource] = useState(null); // 'planned' or 'open'
  const [pendingOrder, setPendingOrder] = useState(null); // null = no drag in progress

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [reschedulingId, setReschedulingId] = useState(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Pre-calculate Maps and Lists
  const taskMap = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasks]);

  const plannedIds = plan?.taskIds || [];
  const plannedSet = useMemo(() => new Set(plannedIds), [plannedIds]);

  const plannedTasks = useMemo(() => {
    return plannedIds.map((id) => taskMap.get(id)).filter(Boolean);
  }, [plannedIds, taskMap]);

  const displayOrder = pendingOrder || plannedIds;

  const displayPlannedTasks = useMemo(() => {
    return displayOrder.map((id) => taskMap.get(id)).filter(Boolean);
  }, [displayOrder, taskMap]);

  const openTasks = useMemo(() => {
    return tasks.filter((t) => !t.done && !plannedSet.has(t.id));
  }, [tasks, plannedSet]);

  const completedTodayCount = useMemo(() => {
    return plannedTasks.filter((t) => t.done || t.lastTouched?.slice(0, 10) === todayStr).length;
  }, [plannedTasks, todayStr]);

  const isMonday = new Date().getDay() === 1;
  const lastWeekStats = useMemo(() => {
    if (!isMonday) return null;
    const now = new Date();
    // Last Sunday = yesterday when today is Monday
    const lastSun = new Date(now);
    lastSun.setDate(now.getDate() - 1);
    lastSun.setHours(23, 59, 59, 999);
    // Last Monday = 6 days before last Sunday
    const lastMon = new Date(lastSun);
    lastMon.setDate(lastSun.getDate() - 6);
    lastMon.setHours(0, 0, 0, 0);
    const lastMonStr = lastMon.toISOString().slice(0, 10);
    const lastSunStr = lastSun.toISOString().slice(0, 10);
    const completed = tasks.filter(
      (t) =>
        t.done &&
        t.lastTouched &&
        t.lastTouched.slice(0, 10) >= lastMonStr &&
        t.lastTouched.slice(0, 10) <= lastSunStr
    ).length;
    const touched = tasks.filter(
      (t) =>
        t.lastTouched &&
        t.lastTouched.slice(0, 10) >= lastMonStr &&
        t.lastTouched.slice(0, 10) <= lastSunStr
    ).length;
    return { completed, touched };
  }, [tasks, isMonday]);

  // Statistics
  const stats = useMemo(() => {
    let sessions = 0;
    let completed = 0;
    let driftMins = 0;
    
    tasks.forEach((t) => {
      if (t.done) completed++;
      if (t.skill?.recent) sessions += t.skill.recent.length;
      if (t.idle?.lastDrifts) {
        t.idle.lastDrifts.forEach((d) => {
          driftMins += d.mins || 0;
        });
      }
    });
    return { completed, sessions, driftMins };
  }, [tasks]);

  // Action: Save Daily Plan Date Order
  const savePlan = async (newTaskIds) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await apiFetch("/actions", {
        method: "POST",
        body: {
          action: {
            type: "update_daily_plan",
            date: todayStr,
            taskIds: newTaskIds,
          },
        },
      });
    } catch (err) {
      setErrorMsg(err.message || "Failed to update daily plan.");
    } finally {
      setBusy(false);
    }
  };

  // Auto-inject tasks scheduled for today that aren't already in the plan
  useEffect(() => {
    if (!plan || loading) return;
    const scheduledToday = tasks.filter(
      (t) => t.scheduledDate === todayStr && !plan.taskIds.includes(t.id) && !t.done
    );
    if (scheduledToday.length === 0) return;
    const newIds = [...scheduledToday.map((t) => t.id), ...plan.taskIds];
    savePlan(newIds); // eslint-disable-line react-hooks/set-state-in-effect
  }, [plan?.taskIds?.join(","), loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTask = (id) => {
    if (!plannedSet.has(id)) {
      savePlan([...plannedIds, id]);
    }
  };

  const handleRemoveTask = (id) => {
    savePlan(plannedIds.filter((x) => x !== id));
  };

  const handleReschedule = async (taskId, newDate) => {
    if (!newDate) return;
    setReschedulingId(null);
    await apiFetch("/actions", {
      method: "POST",
      body: { action: { type: "update_task", taskId, task: { scheduledDate: newDate } } },
    });
    await savePlan(plannedIds.filter((id) => id !== taskId));
  };

  const handleCarryForward = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const yesterdayStr = getYesterdayDate();
      const yesterdayPlan = dailyPlans[yesterdayStr] || [];
      const carryIds = yesterdayPlan.filter((id) => {
        const t = taskMap.get(id);
        return t && !t.done && !plannedSet.has(id);
      });

      if (carryIds.length === 0) {
        setErrorMsg("Nothing to carry forward from yesterday.");
        setBusy(false);
        return;
      }

      await savePlan([...plannedIds, ...carryIds]);
    } catch (err) {
      setErrorMsg(err.message || "Carry-forward failed.");
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------
  // HTML5 Native Drag & Drop Handlers
  // -------------------------------------------------------------
  const handleDragStart = (e, taskId, source) => {
    setDraggedTaskId(taskId);
    setDraggedSource(source);
    e.dataTransfer.effectAllowed = "move";
  };

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

  const handleDragEnd = () => {
    setPendingOrder(null);
    setDraggedTaskId(null);
    setDraggedSource(null);
  };

  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Loading plan...</p>;
  }

  const todayDisplayDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div>
      <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="h-eyebrow">Today · {todayDisplayDate}</div>
          <h1 className="h-display serif" style={{ margin: "4px 0 8px" }}>Today's plan</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 520, marginTop: 4, margin: 0 }}>
            Drag tasks into the order you want to work on them. Items touched today are dimmed.
          </p>
          <div className="today-stats mono" style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
            {stats.completed} done all-time · {stats.sessions} sessions · {(stats.driftMins / 60).toFixed(1)}h drift
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {plannedTasks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                {completedTodayCount} / {plannedTasks.length} DONE
              </span>
              <div style={{ width: 100, height: 6, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--accent)", width: `${(completedTodayCount / plannedTasks.length) * 100}%` }}></div>
              </div>
            </div>
          )}
          
          {plannedTasks.length === 0 && (
            <button className="btn btn-sm" onClick={handleCarryForward} disabled={busy}>
              ↶ Carry forward from yesterday
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 12, marginBottom: 0 }}>
          {errorMsg}
        </p>
      )}

      <div className="today-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginTop: 24 }}>
        {/* Planned Columns Left drop target */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{ border: "1px dashed transparent", minHeight: 200 }}
        >
          {lastWeekStats && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#22221a', border: '1px solid #44440a',
              padding: '5px 12px', borderRadius: 20, marginBottom: 12
            }}>
              <span style={{ color: '#ffd700', fontSize: 12 }}>↩</span>
              <span style={{ color: 'rgba(255,215,0,0.6)', fontSize: 11 }}>
                Last week: <strong style={{ color: '#ffd700' }}>{lastWeekStats.completed}/{lastWeekStats.touched}</strong> completed
              </span>
            </div>
          )}
          <div className="h-eyebrow" style={{ marginBottom: 12 }}>Planned · {plannedTasks.length}</div>
          
          {displayPlannedTasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--faint)", fontStyle: "italic", padding: "40px 0", textAlign: "center", border: "1px dashed var(--line)", borderRadius: 8 }}>
              Drag tasks from the right to plan your day.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {displayPlannedTasks.map((t, idx) => {
                const completed = t.done;
                const active = t.id === activeTaskId;
                const touched = isTouchedToday(t);
                
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id, "planned")}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px 12px",
                      border: active ? "1.5px solid var(--accent)" : "1px solid var(--line)",
                      borderRadius: 8,
                      background: touched ? "var(--panel-2)" : "var(--panel)",
                      opacity: touched ? 0.6 : 1,
                      cursor: "grab",
                    }}
                  >
                    {/* Main row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Drag indicator handle */}
                      <span style={{ color: "var(--faint)", cursor: "grab", userSelect: "none" }}>⋮⋮</span>
                      <span style={{ fontSize: 11, color: "var(--faint)", width: 14 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          textDecoration: completed ? "line-through" : "none",
                          color: completed ? "var(--muted)" : "var(--ink)",
                        }}
                      >
                        {t.title}
                        {t.template && <span className="task-template-pill" style={{ marginLeft: 6 }}>{t.template}</span>}
                        {t.scheduledDate === todayStr && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.7, marginLeft: 4 }}>📅</span>
                        )}
                      </span>

                      {t.energy !== undefined && (
                        <span style={{ display: 'flex', gap: 2 }} title={`Energy: ${t.energy}/5`}>
                          {[1,2,3,4,5].map(i => (
                            <span key={i} style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: i <= t.energy ? 'var(--accent)' : 'var(--line-soft)'
                            }} />
                          ))}
                        </span>
                      )}

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {!completed && (
                          <button className="btn btn-sm btn-ghost" onClick={() => onSetActive(t.id)}>
                            Start
                          </button>
                        )}
                        {t.scheduledDate === todayStr && (
                          reschedulingId === t.id
                            ? (
                              <input
                                type="date"
                                autoFocus
                                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10)}
                                style={{ fontSize: 11, width: 120, padding: '2px 4px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--ink)' }}
                                onChange={(e) => handleReschedule(t.id, e.target.value)}
                                onBlur={() => setReschedulingId(null)}
                              />
                            )
                            : (
                              <button
                                className="btn btn-sm btn-ghost"
                                title="Give it a new day"
                                onClick={() => setReschedulingId(t.id)}
                                style={{ fontSize: 12 }}
                              >↻</button>
                            )
                        )}
                        <button
                          className="modal-close"
                          style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--faint)" }}
                          onClick={() => handleRemoveTask(t.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Subtask progress bar for project-template tasks */}
                    {t.template === 'project' && (() => {
                      const allSubs = (t.project?.phases ?? []).flatMap(p => p.subs ?? [])
                      const doneCount = allSubs.filter(s => s.done).length
                      const totalCount = allSubs.length
                      if (totalCount === 0) return null
                      return (
                        <div style={{ paddingLeft: 32, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 2, height: 3 }}>
                            <div style={{ background: 'var(--accent)', width: `${(doneCount/totalCount)*100}%`, height: 3, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: 'var(--ink-2)', fontSize: 9, whiteSpace: 'nowrap' }}>{doneCount}/{totalCount} subtasks</span>
                        </div>
                      )
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open Columns Right */}
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 12 }}>Open tasks · {openTasks.length}</div>
          
          {openTasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--faint)", fontStyle: "italic", padding: "40px 0", textAlign: "center", border: "1px dashed var(--line)", borderRadius: 8 }}>
              No tasks left to plan.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
              {openTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id, "open")}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    background: "var(--panel)",
                    cursor: "grab",
                  }}
                >
                  <span style={{ color: "var(--faint)", cursor: "grab", userSelect: "none" }}>⋮⋮</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--ink)" }}>{t.title}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleAddTask(t.id)}>
                    ＋ Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function isTouchedToday(task) {
  if (!task.lastTouched) return false;
  return task.lastTouched.slice(0, 10) === new Date().toISOString().slice(0, 10);
}
