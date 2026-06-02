import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not set. Mind Coach will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * Builds a system instruction string from current app state.
 * Optionally enriched with user profile data for personalized coaching.
 */
export function buildSystemPrompt({ activeTask, currentMood, energy, recentEvents, profile }) {
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

  let profileSection = "";
  if (profile?.traits && profile.traits.onboardingComplete) {
    const { traits, patterns, context } = profile;
    const keyTraits = [
      traits.selfEfficacy?.score < 45     ? `low self-efficacy (${traits.selfEfficacy.score}/100) — tends to doubt ability mid-task` : null,
      traits.perfectionism?.score > 65    ? `high perfectionism (${traits.perfectionism.score}/100) — risk of over-refinement, avoiding submission` : null,
      traits.emotionalRegulation?.score < 45 ? `low emotional regulation (${traits.emotionalRegulation.score}/100) — task friction triggers avoidance` : null,
      traits.impulsivity?.score > 65      ? `high impulsivity (${traits.impulsivity.score}/100) — susceptible to distraction` : null,
      traits.timePerspective?.score < 45  ? `time discounting (${traits.timePerspective.score}/100) — underestimates task duration` : null,
    ].filter(Boolean);

    const patternNote = patterns
      ? [
          patterns.avoidanceKind && activeTask?.kind === patterns.avoidanceKind
            ? `This task kind (${patterns.avoidanceKind}) is historically most-avoided.` : null,
          patterns.peakEnergyKind && activeTask?.kind === patterns.peakEnergyKind
            ? `This task kind (${patterns.peakEnergyKind}) is where the user is strongest.` : null,
        ].filter(Boolean).join(" ")
      : "";

    if (keyTraits.length > 0 || context?.narrative || patternNote) {
      profileSection = `\nUser profile context:
${keyTraits.map(t => `- ${t}`).join("\n")}${patternNote ? `\n- ${patternNote}` : ""}${context?.narrative ? `\nCoach note: ${context.narrative.slice(0, 200)}` : ""}`;
    }
  }

  return `You are Mind Coach, a calm and focused cognitive productivity assistant embedded in a personal task manager called Mind Manager.

Your role is to help the user stay focused, work through friction, and reflect on their work. You have access to their current context:

${taskSection}
${moodSection}
${eventsSection}${profileSection}

Guidelines:
- Keep responses short (2-4 sentences). This is a chat interface, not an essay.
- Be warm but direct. No filler phrases like "Certainly!" or "Of course!".
- If the user is stuck, help them find the smallest next action.
- If they're tired or distracted, validate and suggest a break or task switch.
- If they've made progress, acknowledge it briefly and keep momentum going.
- If profile data is present, use it to personalize your tone — high perfectionism users need permission to move on; low self-efficacy users need confidence and small wins.
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

/**
 * Builds the system prompt for the Insights coach (profile-level coach).
 * This is different from the task-focused NowView coach.
 */
function buildInsightsSystemPrompt({ traits, patterns, context, recentMemory }) {
  const traitLines = traits
    ? Object.entries(traits)
        .filter(([k]) => ["conscientiousness", "perfectionism", "emotionalRegulation", "timePerspective", "impulsivity", "selfEfficacy"].includes(k))
        .map(([k, v]) => `- ${k}: ${v.score}/100`)
        .join("\n")
    : "Profile not yet established.";

  const patternLines = patterns
    ? [
        `- Completion rate: ${Math.round((patterns.completionRate?.rate || 0) * 100)}% (${patterns.completionRate?.trend || "unknown"})`,
        `- Task switches: ${patterns.taskSwitchFrequency?.rate || 0}/week (${patterns.taskSwitchFrequency?.trend || "unknown"})`,
        `- Drift sessions: ${patterns.driftFrequency?.perDay || 0}/day (${patterns.driftFrequency?.trend || "unknown"})`,
        patterns.peakEnergyKind ? `- Strongest task kind: ${patterns.peakEnergyKind}` : "",
        patterns.avoidanceKind  ? `- Most-avoided task kind: ${patterns.avoidanceKind}` : "",
      ].filter(Boolean).join("\n")
    : "No behavioral patterns recorded yet.";

  const memorySection = recentMemory?.trim()
    ? `Recent history:\n${recentMemory}`
    : "No prior session history.";

  return `You are a personal growth coach embedded in a task manager app called Mind Manager. You are having a one-on-one session with the user about *who they are* — not about a specific task. Your role is to help them understand their patterns, reframe unhelpful beliefs, and make progress on becoming the person who finishes what they start.

User's psychological profile (trait scores 0-100, higher = stronger capacity):
${traitLines}

Behavioral patterns (last 30 days):
${patternLines}

Context about this user:
${context?.narrative || "No context established yet."}

${memorySection}

Guidelines:
- Keep responses 2-4 sentences unless the user asks for more depth.
- Open the session by referencing something specific from their profile or recent history — not a generic greeting.
- Use past-tense framing ("you've been..." not "you are...") — traits are changeable.
- Never use identity labels like "procrastinator", "perfectionist", "avoider". Use behavior descriptions.
- Pair any pattern observation with an actionable reframe or next step.
- If the user shares something new about themselves, incorporate it into the conversation naturally.
- Be warm but direct. This is a focused session, not therapy.`;
}

/**
 * Sends a message in the Insights coach session.
 */
export async function sendInsightsMessage(userMessage, chatHistory, profileContext) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildInsightsSystemPrompt(profileContext),
  });

  const history = chatHistory.map(msg => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

/**
 * Writes a session summary at the end of an Insights coach session.
 * @param {Array<{sender: string, text: string}>} messages - Full session messages
 * @param {string} currentNarrative - Current context narrative
 * @returns {Promise<string>} - Summary text to store
 */
export async function writeSessionSummary(messages, currentNarrative) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const transcript = messages
    .map(m => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`)
    .join("\n");

  const prompt = `You are summarizing a coaching session from a personal productivity app.

Current user context: "${currentNarrative || "No prior context."}"

Session transcript:
${transcript}

Write a concise summary (3-5 sentences) capturing:
1. What the user shared about themselves or their situation
2. Any new patterns or insights that emerged
3. What the coach observed or suggested
4. Any profile updates warranted (shifts in trait understanding)

Use second person ("The user shared...", "They expressed..."). Past tense. No identity labels.
Return only the summary text — no JSON, no headers.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Compresses multiple session summaries into a single month log.
 * @param {Array<{summary: string, createdAt: string}>} sessions
 * @returns {Promise<string>} - Month log text
 */
export async function compressToMonthLog(sessions) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const sessionTexts = sessions
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((s, i) => `Session ${i + 1} (${new Date(s.createdAt).toLocaleDateString()}): ${s.summary}`)
    .join("\n\n");

  const prompt = `You are compressing multiple coaching session summaries into a single monthly log for a user's productivity app.

Sessions from this month:
${sessionTexts}

Write a comprehensive monthly summary (4-7 sentences) that:
1. Captures the main themes and patterns that emerged this month
2. Notes any significant shifts or progress the user made
3. Preserves important context that should inform future coaching
4. Highlights any recurring obstacles or breakthroughs

Second person ("The user..."). Past tense. No identity labels. Return only the summary text.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generates subtasks for a task using Gemini.
 * @param {object} task - Full task object (title, kind, energy, moods, template)
 * @param {string} userContext - Optional free-text context from the user
 * @param {boolean} personalized - Whether to use profile snapshot for personalization
 * @param {object|null} profileSnapshot - { traits, patterns, context } from AppContext profile state
 * @returns {Promise<object>} - Structured subtask data ready for the preview modal
 */
export async function generateSubtasks(task, userContext, personalized, profileSnapshot) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const templateType = task.template || "none";

  const energyRule = task.energy >= 4
    ? "This task has high energy cost. Break it into smaller, lower-friction steps. The first step should take under 10 minutes."
    : "";

  const avoidanceMoods = ["anxious", "heavy", "dreading", "stressed", "overwhelmed"];
  const hasMoodFlag = (task.moods || []).some(m => avoidanceMoods.includes(m));
  const moodRule = hasMoodFlag
    ? "The user has flagged this task with resistance-related mood tags. Make the first action extremely concrete and small — something they can do in under 5 minutes."
    : "";

  let profileSection = "";
  if (personalized && profileSnapshot?.traits) {
    const { traits } = profileSnapshot;
    const flags = [
      traits.perfectionism?.score > 65 ? `- High perfectionism (${traits.perfectionism.score}/100): include a "done is better than perfect" or "ship it" milestone` : null,
      traits.selfEfficacy?.score < 45 ? `- Low self-efficacy (${traits.selfEfficacy.score}/100): start with the easiest possible first step to build momentum` : null,
      traits.emotionalRegulation?.score < 45 ? `- Low emotional regulation (${traits.emotionalRegulation.score}/100): keep steps short, reduce friction at every transition` : null,
      traits.timePerspective?.score < 45 ? `- Time discounting tendency: add estimated durations to each step where possible` : null,
    ].filter(Boolean);
    if (flags.length > 0) {
      profileSection = `\nUser profile signals (use these to shape step design):\n${flags.join("\n")}`;
    }
  }

  const formatByTemplate = {
    project: `{ "phases": [{ "title": "<phase title>", "subs": ["<subtask label>", ...] }] }`,
    none:    `{ "phases": [{ "title": "<phase title>", "subs": ["<subtask label>", ...] }] }`,
    book:    `{ "chapters": ["<chapter title>", ...] }`,
    skill:   `{ "drills": ["<drill label>", ...] }`,
  };
  const formatInstruction = formatByTemplate[templateType] || formatByTemplate.none;

  const prompt = `You are breaking down a task into concrete, actionable subtasks for a personal task manager.

Task: "${task.title}"
Kind: ${task.kind}
Energy required: ${task.energy}/5
Mood tags: ${(task.moods || []).join(", ") || "none"}
Template type: ${templateType}${userContext ? `\nUser context: "${userContext}"` : ""}${profileSection}

${energyRule}
${moodRule}

Rules:
- Generate 3–7 phases/chapters/drills maximum. Quality over quantity.
- Each step title must be an action verb (e.g. "Draft", "Review", "Set up", "Practice").
- For project template: 2–4 subtasks per phase.
- No vague steps like "Do research" — be specific to the task title.

Return JSON only — no markdown, no explanation:
${formatInstruction}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonText = text.startsWith("```") ? text.replace(/```json?\n?/g, "").replace(/```/g, "").trim() : text;
  const parsed = JSON.parse(jsonText);

  return { templateType: templateType === "none" ? "project" : templateType, data: parsed };
}

/**
 * Compresses multiple month logs into a quarterly summary.
 * @param {Array<{id: string, summary: string, createdAt: string}>} monthLogs
 * @returns {Promise<string>} - Quarter log text
 */
export async function compressToQuarterLog(monthLogs) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const logTexts = monthLogs
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(l => `${l.id}: ${l.summary}`)
    .join("\n\n");

  const prompt = `You are compressing three months of coaching logs into a quarterly summary for a user's productivity app.

Monthly logs:
${logTexts}

Write a concise quarterly summary (4-6 sentences) that:
1. Identifies the most significant long-term patterns and themes
2. Notes meaningful progress or persistent challenges over the quarter
3. Preserves the essential context needed to coach this person effectively going forward

Second person. Past tense. No identity labels. Return only the summary text.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
