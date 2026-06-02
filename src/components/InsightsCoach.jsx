import React, { useState, useEffect, useRef } from "react";
import { sendInsightsMessage, writeSessionSummary } from "../lib/gemini";
import { useAppData } from "../context/AppContext";

export default function InsightsCoach({ onClose }) {
  const { profile, saveCoachSession, loadMonthLogs, loadQuarterLogs } = useAppData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);

  const buildProfileContext = (recentMemory) => ({
    traits: profile.traits,
    patterns: profile.patterns,
    context: profile.context,
    recentMemory,
  });

  useEffect(() => {
    async function init() {
      setInitializing(true);
      try {
        const [monthLogs, quarterLogs] = await Promise.all([
          loadMonthLogs(),
          loadQuarterLogs(),
        ]);
        const sortedQuarters = quarterLogs.sort((a, b) => b.id.localeCompare(a.id));
        const sortedMonths   = monthLogs.sort((a, b) => b.id.localeCompare(a.id));

        const recentMemory = [
          sortedQuarters[0] ? `[${sortedQuarters[0].id}] ${sortedQuarters[0].summary}` : null,
          sortedMonths[0]   ? `[${sortedMonths[0].id}] ${sortedMonths[0].summary}` : null,
          sortedMonths[1]   ? `[${sortedMonths[1].id}] ${sortedMonths[1].summary}` : null,
        ].filter(Boolean).join("\n\n");

        const profileContext = buildProfileContext(recentMemory);

        const opening = await sendInsightsMessage(
          "Start the session with a brief, specific opening based on my profile. One or two sentences.",
          [],
          profileContext
        );

        setMessages([{ sender: "coach", text: opening, recentMemory }]);
      } catch (err) {
        console.error("InsightsCoach init failed:", err);
        setMessages([{ sender: "coach", text: "Hey — I'm here. What's on your mind today?" }]);
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { sender: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const recentMemory = messages[0]?.recentMemory || "";
      const profileContext = buildProfileContext(recentMemory);
      const history = newMessages.filter(m => m.sender !== "coach" || newMessages.indexOf(m) > 0);
      const reply = await sendInsightsMessage(text, history.slice(0, -1), profileContext);
      setMessages(prev => [...prev, { sender: "coach", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "coach", text: "Sorry, I had trouble responding. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (messages.length > 1) {
      try {
        const summary = await writeSessionSummary(messages, profile.context?.narrative);
        await saveCoachSession({
          summary,
          createdAt: new Date().toISOString(),
          messageCount: messages.length,
        });
      } catch (err) {
        console.error("Failed to save session summary:", err);
      }
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxWidth: 520, height: "80vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title serif">Coach Session</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0, marginBottom: 12 }}>
          Talk about yourself — patterns, blocks, what you're working through. This is separate from task help.
        </p>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
          {initializing ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-2)" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🧠</div>
              <p style={{ fontSize: 13 }}>Reading your profile…</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.sender === "user" ? "var(--accent)" : "var(--panel-2)",
                  color: msg.sender === "user" ? "#fff" : "var(--ink)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {msg.text}
              </div>
            ))
          )}
          {loading && (
            <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "var(--panel-2)", fontSize: 14, color: "var(--ink-2)" }}>
              …
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ flexShrink: 0, display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          <input
            type="text"
            className="field-input"
            placeholder="Share what's on your mind…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={loading || initializing}
            style={{ flex: 1, fontSize: 14 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || initializing || !input.trim()}
            style={{ flexShrink: 0 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
