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
    model: "gemini-2.5-flash",
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

/**
 * Takes the 7 onboarding question answers and returns initial trait scores + context narrative.
 * @param {Array<{question: string, trait: string, answer: string}>} answers
 * @returns {Promise<{traits: object, contextNarrative: string}>}
 */
export async function scoreOnboardingAnswers(answers) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a behavioral psychologist analyzing a user's self-assessment for a personal productivity app.

The user answered 7 questions. Each question maps to one of 6 psychological trait dimensions known to predict task completion:
- conscientiousness (follow-through, discipline)
- perfectionism (fear of not being good enough, avoidance of submission)
- emotionalRegulation (ability to tolerate discomfort that hard tasks create)
- timePerspective (discounting future deadlines, underestimating task duration)
- impulsivity (pulled toward immediate rewards over delayed ones)
- selfEfficacy (belief in ability to complete tasks)

User's answers:
${answers.map(a => `[${a.trait}] Q: "${a.question}" → A: "${a.answer}"`).join("\n")}

Return a JSON object with exactly this structure — no markdown, no explanation, just JSON:
{
  "traits": {
    "conscientiousness":   { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] },
    "perfectionism":       { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] },
    "emotionalRegulation": { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] },
    "timePerspective":     { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] },
    "impulsivity":         { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] },
    "selfEfficacy":        { "score": <0-100>, "history": [{ "date": "<today ISO>", "score": <0-100> }] }
  },
  "contextNarrative": "<2-3 sentences describing this person's relationship with task completion, in second person, past-tense framing. No identity labels. Behavior descriptions only.>"
}

For scores: 0 = extreme difficulty in this area, 100 = strong capacity. For example:
- High perfectionism (score 75+) = user tends to over-refine and avoid submitting
- Low selfEfficacy (score <40) = user doubts their ability to finish things they start
- Low emotionalRegulation (score <40) = task friction tends to trigger avoidance behavior`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonText = text.startsWith("```") ? text.replace(/```json?\n?/g, "").replace(/```/g, "").trim() : text;
  const parsed = JSON.parse(jsonText);

  return {
    traits: {
      ...parsed.traits,
      onboardingComplete: true,
      lastEvaluationAt: new Date().toISOString(),
      evaluationCount: 1,
    },
    contextNarrative: parsed.contextNarrative,
  };
}

/**
 * Generates 3-5 targeted follow-up questions based on current profile state.
 * @param {object} traits - Current trait scores
 * @param {object} patterns - Current behavioral patterns
 * @param {object} context - Current context narrative document
 * @returns {Promise<Array<{question: string, trait: string, options: string[]}>>}
 */
export async function generateTuneQuestions(traits, patterns, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const traitSummary = Object.entries(traits)
    .filter(([k]) => ["conscientiousness", "perfectionism", "emotionalRegulation", "timePerspective", "impulsivity", "selfEfficacy"].includes(k))
    .map(([k, v]) => `${k}: ${v.score}/100`)
    .join(", ");

  const prompt = `You are refining a user's behavioral profile in a personal productivity app.

Current trait scores: ${traitSummary}
Behavioral patterns: completion rate ${Math.round((patterns?.completionRate?.rate || 0) * 100)}%, switch frequency ${patterns?.taskSwitchFrequency?.rate || 0}/week, drift frequency ${patterns?.driftFrequency?.perDay || 0}/day
Context so far: "${context?.narrative || "No context yet."}"

Generate 3-5 targeted multiple-choice questions that would most improve understanding of this specific user. Focus on areas where the profile has gaps or contradictions. Do NOT repeat generic onboarding questions.

Return JSON only — no markdown, no explanation:
[
  {
    "question": "<plain language question>",
    "trait": "<one of: conscientiousness|perfectionism|emotionalRegulation|timePerspective|impulsivity|selfEfficacy|general>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"]
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonText = text.startsWith("```") ? text.replace(/```json?\n?/g, "").replace(/```/g, "").trim() : text;
  return JSON.parse(jsonText);
}

/**
 * Updates trait scores and context narrative based on tune answers.
 * @param {Array<{question: string, trait: string, answer: string}>} answers
 * @param {object} currentTraits - Existing trait scores
 * @param {object} patterns - Current patterns
 * @param {string} currentNarrative - Existing context narrative
 * @returns {Promise<{traits: object, contextNarrative: string}>}
 */
export async function updateProfileFromTune(answers, currentTraits, patterns, currentNarrative) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const traitSummary = Object.entries(currentTraits)
    .filter(([k]) => ["conscientiousness", "perfectionism", "emotionalRegulation", "timePerspective", "impulsivity", "selfEfficacy"].includes(k))
    .map(([k, v]) => `${k}: ${v.score}/100`)
    .join(", ");

  const today = new Date().toISOString();

  const prompt = `You are updating a user's behavioral profile based on new self-assessment answers.

Current trait scores: ${traitSummary}
Current context: "${currentNarrative}"
Behavioral patterns: completion rate ${Math.round((patterns?.completionRate?.rate || 0) * 100)}%, switch frequency ${patterns?.taskSwitchFrequency?.rate || 0}/week

New answers:
${answers.map(a => `[${a.trait}] Q: "${a.question}" → A: "${a.answer}"`).join("\n")}

Update the trait scores based on these new answers. Scores should shift modestly (5-15 points) — don't overhaul the whole profile from a few questions. Preserve history arrays and append new entries.

Return JSON only — no markdown:
{
  "traitUpdates": {
    "conscientiousness":   { "score": <updated 0-100> },
    "perfectionism":       { "score": <updated 0-100> },
    "emotionalRegulation": { "score": <updated 0-100> },
    "timePerspective":     { "score": <updated 0-100> },
    "impulsivity":         { "score": <updated 0-100> },
    "selfEfficacy":        { "score": <updated 0-100> }
  },
  "contextNarrative": "<updated 2-4 sentence narrative incorporating new information. Second person, past-tense framing, no identity labels.>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonText = text.startsWith("```") ? text.replace(/```json?\n?/g, "").replace(/```/g, "").trim() : text;
  const parsed = JSON.parse(jsonText);

  // Merge updates into existing traits, preserving history
  const updatedTraits = { ...currentTraits };
  for (const [key, val] of Object.entries(parsed.traitUpdates)) {
    if (updatedTraits[key]) {
      updatedTraits[key] = {
        score: val.score,
        history: [...(updatedTraits[key].history || []), { date: today, score: val.score }],
      };
    }
  }
  updatedTraits.lastEvaluationAt = today;
  updatedTraits.evaluationCount = (updatedTraits.evaluationCount || 0) + 1;

  return { traits: updatedTraits, contextNarrative: parsed.contextNarrative };
}
