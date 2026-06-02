import { useState, useEffect } from "react";
import { useAppData } from "../context/AppContext";
import { computePatterns, isMonthOld, currentYearMonth, currentYearQuarter } from "../lib/profileUtils";
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

export default function YouView() {
  const { profile, tasks, events, saveProfileTraits, saveProfilePatterns, saveProfileContext, loadCoachSessions, saveMonthLog, saveQuarterLog, loadMonthLogs, loadQuarterLogs, deleteCoachSessions } = useAppData();
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
