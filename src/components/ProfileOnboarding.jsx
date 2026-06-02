import React, { useState } from "react";
import { scoreOnboardingAnswers } from "../lib/gemini";
import { useAppData } from "../context/AppContext";

const QUESTIONS = [
  {
    trait: "emotionalRegulation",
    question: "When you sit down to start a difficult task, what usually happens?",
    options: [
      "I feel a wave of dread and find something else to do",
      "I feel some resistance but push through after a few minutes",
      "I feel neutral — it's just a task",
      "I feel energized and dive straight in",
    ],
  },
  {
    trait: "conscientiousness",
    question: "How often do you finish tasks by the time you planned to?",
    options: [
      "Almost never — deadlines come and go",
      "Sometimes, when the stakes are high",
      "More often than not",
      "Almost always — I follow through on commitments",
    ],
  },
  {
    trait: "perfectionism",
    question: "When you've mostly finished something, what happens next?",
    options: [
      "I keep refining it — it never feels quite done",
      "I tweak it a bit, then submit when pressured",
      "I do a final check and submit",
      "I submit as soon as it meets the goal",
    ],
  },
  {
    trait: "selfEfficacy",
    question: "When you set a goal, how confident are you that you'll actually complete it?",
    options: [
      "Not very — I've let myself down before",
      "It depends on the task — some I trust myself on, others I don't",
      "Generally confident, with some doubt",
      "Very confident — I follow through on what I set",
    ],
  },
  {
    trait: "timePerspective",
    question: "A deadline is three weeks away. How does that feel?",
    options: [
      "Plenty of time — I'll start next week",
      "Somewhat distant, but I'll think about it soon",
      "I feel mild urgency and start planning",
      "I feel real urgency and start immediately",
    ],
  },
  {
    trait: "impulsivity",
    question: "When you have important work to do, how often do you get pulled toward easier or more fun things?",
    options: [
      "Very often — it's a constant battle",
      "Often, especially when the work feels hard",
      "Sometimes, but I can usually redirect",
      "Rarely — I stay on task until it's done",
    ],
  },
  {
    trait: "conscientiousness",
    question: "How do you handle tasks that have no external deadline?",
    options: [
      "They stay on my list indefinitely — I rarely finish them",
      "I work on them occasionally when I feel motivated",
      "I set my own deadlines and mostly follow them",
      "I treat them the same as external deadlines",
    ],
  },
];

export default function ProfileOnboarding({ onComplete }) {
  const { saveProfileTraits, saveProfileContext } = useAppData();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const handleAnswer = (option) => {
    const newAnswers = [...answers, { question: current.question, trait: current.trait, answer: option }];
    setAnswers(newAnswers);

    if (isLast) {
      handleSubmit(newAnswers);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setLoading(true);
    setError(null);
    try {
      const { traits, contextNarrative } = await scoreOnboardingAnswers(finalAnswers);
      await saveProfileTraits(traits);
      await saveProfileContext({
        narrative: contextNarrative,
        updatedAt: new Date().toISOString(),
        version: 1,
      });
      onComplete();
    } catch (err) {
      console.error("Onboarding scoring failed:", err);
      setError("Something went wrong scoring your answers. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title serif">Build Your Focus Profile</h2>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px" }}>
          7 quick questions to help your coach understand how you work. Takes 2 minutes.
          This profile improves over time as you use the app.
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-2)" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🧠</div>
            <p style={{ fontSize: 14 }}>Building your profile…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 16, background: "var(--panel-2)", borderRadius: 8, color: "var(--ink)" }}>
            <p style={{ fontSize: 13, marginBottom: 12 }}>{error}</p>
            <button className="btn btn-primary" onClick={() => handleSubmit(answers)}>Try Again</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Question {step + 1} of {QUESTIONS.length}
              </span>
              <div style={{ height: 4, background: "var(--line)", borderRadius: 2, marginTop: 6 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${((step) / QUESTIONS.length) * 100}%`,
                    background: "var(--accent)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: 16, fontWeight: 600, margin: "20px 0 16px", lineHeight: 1.4 }}>
              {current.question}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
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
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--panel)"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
