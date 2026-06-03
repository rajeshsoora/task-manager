import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../context/AppContext";
import { computePatterns, isMonthOld, currentYearMonth, currentYearQuarter, LEVEL_THRESHOLDS, LEVEL_NAMES, computeFulfillmentScore } from "../lib/profileUtils";
import { generateTuneQuestions, updateProfileFromTune, compressToMonthLog, compressToQuarterLog } from "../lib/gemini";
import ProfileOnboarding from "../components/ProfileOnboarding";
import InsightsCoach from "../components/InsightsCoach";

const TRAIT_LABELS = {
  conscientiousness:   "Follow-through",
  perfectionism:       "Perfectionism",
  emotionalRegulation: "Emotional Regulation",
  timePerspective:     "Time Perspective",
  impulsivity:         "Impulsivity",
  selfEfficacy:        "Self-Belief",
};

const TRAIT_DESCRIPTIONS = {
  conscientiousness:   { high: "You tend to follow through on commitments.", low: "You've been finishing fewer tasks than you intended." },
  perfectionism:       { high: "You've been holding work longer than needed before submitting.", low: "You move on from work at a healthy pace." },
  emotionalRegulation: { high: "You manage task discomfort well.", low: "Task friction has been triggering avoidance." },
  timePerspective:     { high: "You take future deadlines seriously.", low: "Distant deadlines haven't felt urgent yet." },
  impulsivity:         { high: "You stay focused when work gets hard.", low: "Distractions have been pulling you away from priorities." },
  selfEfficacy:        { high: "You trust yourself to complete what you start.", low: "Self-doubt has been showing up around task completion." },
};

function TraitCard({ traitKey, data }) {
  const label = TRAIT_LABELS[traitKey];
  const desc = TRAIT_DESCRIPTIONS[traitKey];
  const score = data?.score ?? 50;
  const history = data?.history || [];
  const startScore = history.length > 1 ? history[0].score : score;
  const improved = score > startScore + 5;
  const worsened = score < startScore - 5;

  const descText = score >= 55 ? desc.high : desc.low;
  const trend = improved ? "improving" : worsened ? "worsening" : "stable";
  const trendColor = trend === "improving" ? "#1F8A5B" : trend === "worsening" ? "#c0392b" : "var(--ink-2)";
  const trendLabel = trend === "improving" ? "↑ improving" : trend === "worsening" ? "↓ needs attention" : "→ stable";

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      border: "1px solid var(--line)",
      background: "var(--panel)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: trendColor, fontWeight: 500 }}>{trendLabel}</span>
      </div>

      <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: score >= 55 ? "var(--accent)" : "var(--ink-2)",
          borderRadius: 3,
          transition: "width 0.5s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
        {history.length > 1 ? (
          <>
            <span>Started: {startScore}</span>
            <span>Now: {score}</span>
          </>
        ) : (
          <span>Score: {score}/100</span>
        )}
      </div>

      <p style={{ fontSize: 12, color: "var(--ink-2)", margin: 0, lineHeight: 1.4 }}>{descText}</p>
    </div>
  );
}

function PatternRow({ label, value, trend, format }) {
  const trendColor = trend === "improving" ? "#1F8A5B" : trend === "worsening" ? "#c0392b" : "var(--ink-2)";
  const trendArrow = trend === "improving" ? "↑" : trend === "worsening" ? "↓" : "→";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: trendColor }}>
        {format(value)} {trendArrow}
      </span>
    </div>
  );
}

const KIND_COLORS = {
  learning: ["#7c3aed", "#a78bfa"],
  craft:    ["#ea580c", "#fb923c"],
  body:     ["#059669", "#34d399"],
  work:     ["#0284c7", "#38bdf8"],
  music:    ["#be185d", "#f472b6"],
  social:   ["#d97706", "#fbbf24"],
  wealth:   ["#15803d", "#4ade80"],
  errand:   ["#6b7280", "#9ca3af"],
  drift:    ["#6b7280", "#9ca3af"],
};

function LevelHeroCard({ xp, level, tasks, profile }) {
  const curLvlXP = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLvlXP = LEVEL_THRESHOLDS[level] === Infinity ? curLvlXP + 1 : LEVEL_THRESHOLDS[level] ?? curLvlXP + 1;
  const progress = nextLvlXP === curLvlXP ? 1 : Math.min(1, (xp - curLvlXP) / (nextLvlXP - curLvlXP));
  const levelName = LEVEL_NAMES[level - 1] ?? "Spark";
  const nextLevelName = LEVEL_NAMES[level] ?? "Max";
  const xpToNext = Math.max(0, nextLvlXP - xp);

  // Recent completed tasks (last 5, by lastTouched)
  const recentDone = useMemo(() => {
    return [...tasks]
      .filter(t => t.done)
      .sort((a, b) => new Date(b.lastTouched) - new Date(a.lastTouched))
      .slice(0, 5)
      .map(t => {
        const score = computeFulfillmentScore(t, profile?.patterns, profile?.traits);
        const baseXP = (t.energy || 1) * 20;
        const xpEarned = score >= 60 ? Math.round(baseXP * 1.5) : baseXP;
        return { ...t, xpEarned, isGoodDopamine: score >= 60 };
      });
  }, [tasks, profile]);

  // XP by kind
  const xpByKind = useMemo(() => {
    const map = {};
    tasks.filter(t => t.done).forEach(t => {
      const score = computeFulfillmentScore(t, profile?.patterns, profile?.traits);
      const baseXP = (t.energy || 1) * 20;
      const xp = score >= 60 ? Math.round(baseXP * 1.5) : baseXP;
      map[t.kind] = (map[t.kind] || 0) + xp;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [tasks, profile]);

  const maxKindXP = xpByKind[0]?.[1] || 1;
  const circumference = 2 * Math.PI * 27; // r=27

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Dark hero */}
      <div style={{ background: "#1c1917", borderRadius: 20, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,146,60,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ padding: "22px 22px 18px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                color: "#fb923c", marginBottom: 8,
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0.5L5 3H7.5L5.5 4.8L6.3 7.3L4 5.8L1.7 7.3L2.5 4.8L0.5 3H3L4 0.5Z" fill="#fb923c"/></svg>
                Level {level}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
                {levelName}
              </div>
              <div style={{ fontSize: 12, color: "#57534e" }}>{xp.toLocaleString()} XP earned total</div>
            </div>
            {/* SVG ring */}
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/>
              <circle cx="32" cy="32" r="27" fill="none"
                stroke="url(#rg)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${progress * circumference} ${circumference}`}
                transform="rotate(-90 32 32)"
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c"/>
                  <stop offset="100%" stopColor="#fbbf24"/>
                </linearGradient>
              </defs>
              <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fafaf9" fontFamily="inherit">{level}</text>
            </svg>
          </div>

          {/* XP bar */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.03em" }}>{xp.toLocaleString()}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#57534e", marginLeft: 4 }}>XP</span>
              </div>
              <div style={{ fontSize: 11, color: "#57534e" }}>next: <span style={{ color: "#a8a29e" }}>{nextLevelName}</span></div>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg,#ea580c,#fb923c,#fbbf24)",
                width: `${Math.round(progress * 100)}%`,
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#44403c", textAlign: "right" }}>
              <span style={{ color: "#fb923c", fontWeight: 700 }}>{xpToNext.toLocaleString()} XP</span> to level {level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Recent XP log */}
      {recentDone.length > 0 && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)" }}>Recent XP</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fb923c" }}>+{recentDone.reduce((s, t) => s + t.xpEarned, 0)} XP</span>
          </div>
          {recentDone.map((t, i) => (
            <div key={t.id} style={{
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              borderBottom: i < recentDone.length - 1 ? "1px solid var(--line-soft)" : "none",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: t.isGoodDopamine ? "#fb923c" : "var(--line)" }} />
              <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: t.isGoodDopamine ? "var(--ink)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.title}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.isGoodDopamine ? "#fb923c" : "var(--faint)", whiteSpace: "nowrap" }}>
                +{t.xpEarned}{t.isGoodDopamine ? " ⚡" : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* XP by kind */}
      {xpByKind.length > 0 && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>XP by kind</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {xpByKind.map(([kind, kindXP]) => {
              const [c1, c2] = KIND_COLORS[kind] || ["#6b7280", "#9ca3af"];
              return (
                <div key={kind} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-2)", width: 64, flexShrink: 0, textTransform: "capitalize" }}>{kind}</div>
                  <div style={{ flex: 1, height: 5, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: `linear-gradient(90deg,${c1},${c2})`,
                      width: `${Math.round((kindXP / maxKindXP) * 100)}%`,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", width: 40, textAlign: "right", flexShrink: 0 }}>{kindXP}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function YouView() {
  const { profile, tasks, events, xp, level, saveProfileTraits, saveProfilePatterns, saveProfileContext, loadCoachSessions, saveMonthLog, saveQuarterLog, loadMonthLogs, loadQuarterLogs, deleteCoachSessions } = useAppData();
  const [showCoach, setShowCoach] = useState(false);
  const [showTune, setShowTune] = useState(false);
  const [tuneQuestions, setTuneQuestions] = useState(null);
  const [tuneAnswers, setTuneAnswers] = useState([]);
  const [tuneStep, setTuneStep] = useState(0);
  const [tuneLoading, setTuneLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const runCompressionIfNeeded = async () => {
    try {
      setCompressing(true);
      const [sessions, monthLogs, quarterLogs] = await Promise.all([
        loadCoachSessions(),
        loadMonthLogs(),
        loadQuarterLogs(),
      ]);

      const oldSessions = sessions.filter(s => isMonthOld(s.createdAt));
      if (oldSessions.length >= 2) {
        const ym = currentYearMonth();
        const monthSummary = await compressToMonthLog(oldSessions);
        await saveMonthLog(ym, monthSummary);
        await deleteCoachSessions(oldSessions.map(s => s.id));
      }

      const sortedMonths = [...monthLogs].sort((a, b) => b.id.localeCompare(a.id));
      if (sortedMonths.length >= 3) {
        const yq = currentYearQuarter();
        const alreadyHasQuarter = quarterLogs.some(q => q.id === yq);
        if (!alreadyHasQuarter) {
          const quarterSummary = await compressToQuarterLog(sortedMonths.slice(0, 3));
          await saveQuarterLog(yq, quarterSummary);
        }
      }
    } catch (err) {
      console.error("Compression failed silently:", err);
    } finally {
      setCompressing(false);
    }
  };

  useEffect(() => {
    if (!profile.loaded || !profile.traits?.onboardingComplete) return;
    const freshPatterns = computePatterns(events, tasks);
    saveProfilePatterns(freshPatterns);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    runCompressionIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.loaded]);

  const handleTuneStart = async () => {
    setTuneLoading(true);
    try {
      const questions = await generateTuneQuestions(
        profile.traits,
        profile.patterns,
        profile.context
      );
      setTuneQuestions(questions);
      setTuneAnswers([]);
      setTuneStep(0);
      setShowTune(true);
    } catch (err) {
      console.error("Failed to generate tune questions:", err);
    } finally {
      setTuneLoading(false);
    }
  };

  const handleTuneAnswer = async (option) => {
    const q = tuneQuestions[tuneStep];
    const newAnswers = [...tuneAnswers, { question: q.question, trait: q.trait, answer: option }];
    setTuneAnswers(newAnswers);

    if (tuneStep < tuneQuestions.length - 1) {
      setTuneStep(prev => prev + 1);
    } else {
      setTuneLoading(true);
      setShowTune(false);
      try {
        const { traits, contextNarrative } = await updateProfileFromTune(
          newAnswers,
          profile.traits,
          profile.patterns,
          profile.context?.narrative
        );
        await saveProfileTraits(traits);
        await saveProfileContext({
          narrative: contextNarrative,
          updatedAt: new Date().toISOString(),
          version: (profile.context?.version || 1) + 1,
        });
      } catch (err) {
        console.error("Profile tune failed:", err);
      } finally {
        setTuneLoading(false);
        setTuneQuestions(null);
      }
    }
  };

  if (!profile.loaded) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--ink-2)" }}>
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (!profile.traits?.onboardingComplete && !onboardingDone) {
    return <ProfileOnboarding onComplete={() => setOnboardingDone(true)} />;
  }

  const traits = profile.traits;
  const patterns = profile.patterns;
  const traitKeys = ["conscientiousness", "perfectionism", "emotionalRegulation", "timePerspective", "impulsivity", "selfEfficacy"];

  const growthScore = Math.round(
    traitKeys.reduce((sum, k) => {
      const d = traits[k];
      if (!d) return sum + 50;
      return sum + d.score;
    }, 0) / traitKeys.length
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Level Hero Card */}
      <LevelHeroCard xp={xp} level={level} tasks={tasks} profile={profile} />

      {/* Journey Header */}
      <div style={{ padding: 20, borderRadius: 16, background: "var(--panel)", border: "1px solid var(--line)" }}>
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>Your Focus Journey</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)" }}>{growthScore}</span>
          <span style={{ fontSize: 14, color: "var(--ink-2)" }}>/ 100 overall capacity score</span>
        </div>
        <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>
          {profile.context?.narrative || "Complete a tuning session to deepen your profile."}
        </p>
        {traits.lastEvaluationAt && (
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Last evaluated: {new Date(traits.lastEvaluationAt).toLocaleDateString()} · {traits.evaluationCount} session{traits.evaluationCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Trait Cards */}
      <div>
        <div className="h-eyebrow" style={{ marginBottom: 12 }}>Trait Profile</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {traitKeys.map(k => (
            <TraitCard key={k} traitKey={k} data={traits[k]} />
          ))}
        </div>
      </div>

      {/* Behavioral Patterns */}
      {patterns && (
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>Behavioral Patterns (Last 30 Days)</div>
          <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "0 16px" }}>
            <PatternRow
              label="Task completion rate"
              value={patterns.completionRate?.rate}
              trend={patterns.completionRate?.trend}
              format={v => `${Math.round((v || 0) * 100)}%`}
            />
            <PatternRow
              label="Task switches per week"
              value={patterns.taskSwitchFrequency?.rate}
              trend={patterns.taskSwitchFrequency?.trend}
              format={v => `${(v || 0).toFixed(1)}`}
            />
            <PatternRow
              label="Drift sessions per day"
              value={patterns.driftFrequency?.perDay}
              trend={patterns.driftFrequency?.trend}
              format={v => `${(v || 0).toFixed(2)}`}
            />
            {patterns.peakEnergyKind && (
              <div style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Strongest task kind</span>
                <span style={{ float: "right", fontSize: 13, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>{patterns.peakEnergyKind}</span>
              </div>
            )}
            {patterns.avoidanceKind && (
              <div style={{ padding: "10px 0" }}>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Most-avoided task kind</span>
                <span style={{ float: "right", fontSize: 13, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>{patterns.avoidanceKind}</span>
              </div>
            )}
          </div>
          {patterns.updatedAt && (
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              Updated: {new Date(patterns.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, minWidth: 200, padding: 14 }}
          onClick={() => setShowCoach(true)}
        >
          Talk to your coach
        </button>
        <button
          style={{
            flex: 1,
            minWidth: 200,
            padding: 14,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            color: "var(--ink)",
            cursor: tuneLoading ? "not-allowed" : "pointer",
            borderRadius: 8,
            fontSize: 14,
          }}
          onClick={handleTuneStart}
          disabled={tuneLoading}
        >
          {tuneLoading ? "Generating questions…" : "Tune my profile"}
        </button>
      </div>

      {/* Tune Questions Modal */}
      {showTune && tuneQuestions && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title serif">Tune Your Profile</h2>
              <button className="modal-close" onClick={() => setShowTune(false)}>×</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              Question {tuneStep + 1} of {tuneQuestions.length}
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>
              {tuneQuestions[tuneStep].question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tuneQuestions[tuneStep].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleTuneAnswer(opt)}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "var(--panel)",
                    color: "var(--ink)",
                    fontSize: 14,
                    cursor: "pointer",
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--panel)"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights Coach Modal */}
      {showCoach && <InsightsCoach onClose={() => setShowCoach(false)} />}

      {compressing && (
        <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Updating memory…</p>
      )}
    </div>
  );
}
