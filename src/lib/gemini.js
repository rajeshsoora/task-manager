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
