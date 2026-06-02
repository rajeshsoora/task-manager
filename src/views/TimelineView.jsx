import React, { useState, useMemo } from "react";
import { useAppData } from "../context/AppContext";

const EVENT_TYPE_LABELS = {
  checkin: "Check-in",
  milestone: "Milestone",
  drift: "Drift",
  switch: "Switch",
  progress: "Progress",
};

const EVENT_TYPE_COLORS = {
  checkin: "#4a90e2",
  milestone: "#7b6cf6",
  drift: "#aaa",
  switch: "#e2874a",
  progress: "#2e9e6b",
};

const MOOD_COLORS = {
  focused: "oklch(58% 0.13 38)",
  creative: "oklch(60% 0.13 290)",
  calm: "oklch(60% 0.10 200)",
  social: "oklch(65% 0.12 140)",
  curious: "oklch(65% 0.13 80)",
  restless: "oklch(60% 0.14 20)",
  tired: "oklch(55% 0.04 60)",
  scattered: "oklch(60% 0.06 280)",
};

const FILTER_OPTIONS = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "all", label: "All", days: null },
];

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(timestamp) {
  if (!timestamp) return "Unknown";
  const d = new Date(timestamp);
  const diffDays = Math.floor((new Date() - d) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TimelineView({ onSetActive, isMobile }) {
  const { events } = useAppData();
  const [filterRange, setFilterRange] = useState("7");

  const selectedDays = FILTER_OPTIONS.find((e) => e.id === filterRange)?.days ?? null;
  const cutOffDate = useMemo(() => {
    return selectedDays ? new Date(Date.now() - selectedDays * 24 * 60 * 60 * 1000) : null;
  }, [selectedDays]);

  // Filter events by date range
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!e.timestamp) return false;
      return cutOffDate ? new Date(e.timestamp) > cutOffDate : true;
    });
  }, [events, cutOffDate]);

  // Group events by day: YYYY-MM-DD
  const groupedEvents = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((ev) => {
      const dateStr = ev.timestamp ? ev.timestamp.slice(0, 10) : "unknown";
      if (!map.has(dateStr)) {
        map.set(dateStr, {
          key: dateStr,
          label: formatDateLabel(ev.timestamp),
          events: [],
        });
      }
      map.get(dateStr).events.push(ev);
    });
    return Array.from(map.values());
  }, [filteredEvents]);

  // Energy Line plotting list (last 30 events with energy rating, reversed chronologically)
  const energyPlotEvents = useMemo(() => {
    return [...filteredEvents]
      .filter((e) => e.energy != null)
      .reverse()
      .slice(-30);
  }, [filteredEvents]);

  // Audited Summaries
  const stats = useMemo(() => {
    let total = filteredEvents.length;
    let driftMins = filteredEvents.filter((e) => e.type === "drift").reduce((sum, e) => sum + (e.mins || 0), 0);
    const energyList = filteredEvents.filter((e) => e.energy != null).map((e) => e.energy);
    const avgEnergy = energyList.length ? (energyList.reduce((sum, e) => sum + e) / energyList.length).toFixed(1) : "—";
    const switchCount = filteredEvents.filter((e) => e.type === "switch").length;

    return { total, driftMins, avgEnergy, switchCount };
  }, [filteredEvents]);

  // Mood frequencies distributions
  const moodFreqs = useMemo(() => {
    const counts = {};
    filteredEvents.forEach((ev) => {
      (ev.mood || []).forEach((m) => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredEvents]);

  const maxMoodCount = Math.max(1, ...moodFreqs.map(([, count]) => count));

  // Focus switch reasons breakdown
  const switchReasons = useMemo(() => {
    const counts = {};
    filteredEvents
      .filter((e) => e.type === "switch" && e.switchReason?.kind)
      .forEach((ev) => {
        const k = ev.switchReason.kind;
        counts[k] = (counts[k] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredEvents]);

  const maxSwitchReasonCount = Math.max(1, ...switchReasons.map(([, count]) => count));

  // SVG Energy Graph Constants
  const svgWidth = 600;
  const svgHeight = 120;
  const padLeft = 32;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 22;

  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;
  
  const getX = (idx) => {
    const steps = energyPlotEvents.length > 1 ? energyPlotEvents.length - 1 : 1;
    return padLeft + (idx * innerWidth) / steps;
  };

  const getY = (val) => {
    // scale 1 to 5
    return padTop + innerHeight - ((val - 1) / 4) * innerHeight;
  };

  const pathD = useMemo(() => {
    if (energyPlotEvents.length === 0) return "";
    return energyPlotEvents
      .map((ev, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx).toFixed(1)} ${getY(ev.energy).toFixed(1)}`)
      .join(" ");
  }, [energyPlotEvents]);

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header and filters */}
      <div style={{ marginBottom: 24 }}>
        <div className="h-eyebrow">Timeline</div>
        <h2 className="h-display serif" style={{ fontSize: 32, margin: "4px 0 8px" }}>Audit your mind.</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Energy across sessions, the moods you spent your time in, and every switch with its reason.
        </p>

        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className="filter-pill"
              data-on={filterRange === opt.id ? "true" : "false"}
              onClick={() => setFilterRange(opt.id)}
              style={{
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 20,
                border: "1px solid var(--line)",
                background: filterRange === opt.id ? "var(--accent)" : "var(--panel)",
                color: filterRange === opt.id ? "white" : "var(--ink)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Energy Line graph */}
      {energyPlotEvents.length > 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, marginBottom: 20, background: "var(--panel)" }}>
          <div className="h-eyebrow" style={{ marginBottom: 4 }}>Energy line</div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 8 }}>
            Each dot is an event. Color = mood at the time.
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: svgHeight }}>
            {/* Grid Y Axis scales */}
            {[1, 2, 3, 4, 5].map((val) => (
              <g key={val}>
                <line
                  x1={padLeft}
                  x2={svgWidth - padRight}
                  y1={getY(val)}
                  y2={getY(val)}
                  stroke="var(--line-soft)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={getY(val) + 3}
                  fontSize="9"
                  fill="var(--faint)"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Line Path */}
            <path d={pathD} fill="none" stroke="var(--line)" strokeWidth="1.5" />

            {/* Circle dots */}
            {energyPlotEvents.map((ev, idx) => {
              const moodColor = (ev.mood?.[0] && MOOD_COLORS[ev.mood[0]]) || "var(--line)";
              return (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(ev.energy)}
                  r="4"
                  fill={moodColor}
                  stroke="var(--panel)"
                  strokeWidth="1.5"
                >
                  <title>
                    {`${ev.taskTitle || ev.type} · ${ev.mood?.join(", ") || "—"} · Energy ${ev.energy}`}
                  </title>
                </circle>
              );
            })}
          </svg>

          {/* Color legend pills */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            {Object.entries(MOOD_COLORS).map(([moodName, hexColor]) => (
              <span
                key={moodName}
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: hexColor, display: "inline-block" }} />
                {moodName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analytics widgets and event logs split */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 260px", gap: 16, alignItems: "start" }}>
        {/* Event Logs list left */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
          <div className="h-eyebrow" style={{ marginBottom: 12 }}>Event Log</div>
          
          {groupedEvents.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--faint)", fontStyle: "italic", padding: "10px 0" }}>No events yet.</div>
          )}

          {groupedEvents.map((dayGroup) => (
            <div key={dayGroup.key} style={{ marginBottom: 16 }}>
              <div className="h-eyebrow" style={{ marginBottom: 8, borderBottom: "1px solid var(--line-soft)", paddingBottom: 2 }}>
                {dayGroup.label}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayGroup.events.map((ev, evIdx) => (
                  <div
                    key={evIdx}
                    onClick={() => ev.taskId && onSetActive(ev.taskId)}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line-soft)",
                      cursor: ev.taskId ? "pointer" : "default",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Badge type tag */}
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: EVENT_TYPE_COLORS[ev.type] || "#888",
                      background: (EVENT_TYPE_COLORS[ev.type] || "#888") + "18",
                      borderRadius: 4,
                      padding: "2px 6px",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}>
                      {EVENT_TYPE_LABELS[ev.type] || ev.type}
                    </span>

                    {/* Text summary block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--ink)" }}>
                        {ev.title || ev.taskTitle || "—"}
                      </div>
                      
                      {ev.taskTitle && ev.type !== "checkin" && (
                        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
                          {ev.taskTitle}
                        </div>
                      )}

                      {ev.mood?.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                          {ev.mood.map((m) => (
                            <span key={m} style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 10,
                              background: (MOOD_COLORS[m] || "var(--muted)") + "20",
                              color: MOOD_COLORS[m] || "var(--muted)"
                            }}>
                              {m}
                            </span>
                          ))}
                          {ev.energy != null && (
                            <span style={{ fontSize: 10, color: "var(--faint)" }}>
                              · energy {ev.energy}/5
                            </span>
                          )}
                        </div>
                      )}

                      {ev.switchReason?.note && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, fontStyle: "italic" }}>
                          Reason: {ev.switchReason.note} ({ev.switchReason.kind})
                        </div>
                      )}

                      {ev.type === "drift" && ev.mins != null && (
                        <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2, fontWeight: 500 }}>
                          Drift time: {ev.mins}m
                        </div>
                      )}
                    </div>

                    <span style={{ fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>
                      {formatTime(ev.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Column Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Audit Metrics */}
          <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
            <div className="h-eyebrow" style={{ marginBottom: 12 }}>
              {selectedDays ? `Last ${selectedDays} days` : "All time"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { n: stats.total, label: "events" },
                { n: `${(stats.driftMins / 60).toFixed(1)}h`, label: "drift" },
                { n: stats.avgEnergy, label: "avg energy" },
                { n: stats.switchCount, label: "switches" },
              ].map(({ n, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 24, fontWeight: "600", color: "var(--ink)", lineHeight: 1 }}>{n}</div>
                  <div className="h-eyebrow" style={{ marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Frequencies */}
          {moodFreqs.length > 0 && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
              <div className="h-eyebrow" style={{ marginBottom: 12 }}>Mood frequency</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {moodFreqs.map(([moodName, count]) => (
                  <div key={moodName} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", width: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {moodName}
                    </span>
                    <div style={{ flex: 1, height: 6, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        background: MOOD_COLORS[moodName] || "var(--muted)",
                        width: `${(count / maxMoodCount) * 100}%`
                      }}></div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--faint)", width: 14, textAlign: "right" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Switch Reasons */}
          {stats.switchCount > 0 && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, background: "var(--panel)" }}>
              <div className="h-eyebrow" style={{ marginBottom: 12 }}>Why you switched</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {switchReasons.length === 0 && (
                  <div style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>No reasons recorded.</div>
                )}
                {switchReasons.map(([reasonKind, count]) => (
                  <div key={reasonKind} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", width: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {reasonKind}
                    </span>
                    <div style={{ flex: 1, height: 6, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        background: EVENT_TYPE_COLORS.switch,
                        width: `${(count / maxSwitchReasonCount) * 100}%`
                      }}></div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--faint)", width: 14, textAlign: "right" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
