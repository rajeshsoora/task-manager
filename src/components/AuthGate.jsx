import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAppData } from "../context/AppContext";

export default function AuthGate({ children }) {
  const { user, loading } = useAppData();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg, #fff)" }}>
        <p style={{ color: "var(--ink-2, #888)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (user) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg, #f8f8f8)" }}>
      <div style={{ width: 340, padding: 32, background: "var(--surface, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e5e5)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "var(--ink, #111)" }}>Mind Manager</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e5e5)", fontSize: 14, outline: "none", background: "var(--bg, #fff)", color: "var(--ink, #111)" }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            required
            minLength={6}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e5e5)", fontSize: 14, outline: "none", background: "var(--bg, #fff)", color: "var(--ink, #111)" }}
          />
          {error && <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "11px 0", borderRadius: 8, background: "var(--accent, #c9633f)", color: "#fff", border: "none", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          onClick={() => { setMode(m => m === "signup" ? "signin" : "signup"); setError(null); }}
          style={{ marginTop: 16, background: "none", border: "none", fontSize: 13, color: "var(--ink-2, #888)", cursor: "pointer", width: "100%", textAlign: "center" }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
