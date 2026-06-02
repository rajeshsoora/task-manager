const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/MatrixView-7Py4ZNGm.js",
      "assets/react-D2hoqftp.js",
      "assets/firebase-BGg7XZsp.js",
      "assets/TasksView-CtN6Jq2Y.js",
      "assets/TodayView-CcMPoC2Q.js",
      "assets/TimelineView-gsKO_pi4.js",
      "assets/NewTaskModal-Dyv8LU0-.js",
    ]),
) => i.map((i) => d[i]);
import { a as d, j as e, r as be, c as ze } from "./react-D2hoqftp.js";
import {
  i as Fe,
  g as Be,
  b as Ve,
  p as We,
  h as Ke,
  o as Ye,
  j as ae,
  G as qe,
  s as He,
  c as Q,
  q as X,
  e as P,
  d as ve,
  l as we,
  f as Ne,
  w as Ue,
} from "./firebase-BGg7XZsp.js";
(function () {
  const s = document.createElement("link").relList;
  if (s && s.supports && s.supports("modulepreload")) return;
  for (const i of document.querySelectorAll('link[rel="modulepreload"]')) l(i);
  new MutationObserver((i) => {
    for (const n of i)
      if (n.type === "childList")
        for (const o of n.addedNodes)
          o.tagName === "LINK" && o.rel === "modulepreload" && l(o);
  }).observe(document, { childList: !0, subtree: !0 });
  function a(i) {
    const n = {};
    return (
      i.integrity && (n.integrity = i.integrity),
      i.referrerPolicy && (n.referrerPolicy = i.referrerPolicy),
      i.crossOrigin === "use-credentials"
        ? (n.credentials = "include")
        : i.crossOrigin === "anonymous"
          ? (n.credentials = "omit")
          : (n.credentials = "same-origin"),
      n
    );
  }
  function l(i) {
    if (i.ep) return;
    i.ep = !0;
    const n = a(i);
    fetch(i.href, n);
  }
})();
const Ge = "modulepreload",
  Ze = function (t) {
    return "/" + t;
  },
  le = {},
  M = function (s, a, l) {
    let i = Promise.resolve();
    if (a && a.length > 0) {
      document.getElementsByTagName("link");
      const o = document.querySelector("meta[property=csp-nonce]"),
        r = o?.nonce || o?.getAttribute("nonce");
      i = Promise.allSettled(
        a.map((m) => {
          if (((m = Ze(m)), m in le)) return;
          le[m] = !0;
          const g = m.endsWith(".css"),
            u = g ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${m}"]${u}`)) return;
          const h = document.createElement("link");
          if (
            ((h.rel = g ? "stylesheet" : Ge),
            g || (h.as = "script"),
            (h.crossOrigin = ""),
            (h.href = m),
            r && h.setAttribute("nonce", r),
            document.head.appendChild(h),
            g)
          )
            return new Promise((j, x) => {
              (h.addEventListener("load", j),
                h.addEventListener("error", () =>
                  x(new Error(`Unable to preload CSS for ${m}`)),
                ));
            });
        }),
      );
    }
    function n(o) {
      const r = new Event("vite:preloadError", { cancelable: !0 });
      if (((r.payload = o), window.dispatchEvent(r), !r.defaultPrevented))
        throw o;
    }
    return i.then((o) => {
      for (const r of o || []) r.status === "rejected" && n(r.reason);
      return s().catch(n);
    });
  },
  Je = {
    apiKey: "AIzaSyAEic2Lh1Kxt7HJWNoTe0w4UvbhjMo4Cig",
    authDomain: "mind-manager-prod.firebaseapp.com",
    projectId: "mind-manager-prod",
    appId: "1:6176432606:web:8cf5784bebcb7575a6fd4f",
  },
  ke = Fe(Je),
  $ = Be(ke),
  R = Ve(ke, { localCache: We({ tabManager: Ke() }) }),
  Qe = "https://mind-manager-backend-hjmazjyvya-ue.a.run.app",
  Se = d.createContext(null);
function Xe({ children: t }) {
  const [s, a] = d.useState(void 0),
    [l, i] = d.useState(null),
    [n, o] = d.useState(!1);
  d.useEffect(
    () =>
      Ye($, async (u) => {
        if (u) {
          const h = await u.getIdToken();
          try {
            (
              await fetch(`${Qe}/me`, {
                headers: { Authorization: `Bearer ${h}` },
              })
            ).ok
              ? (a(u), i(h), o(!1))
              : (o(!0), a(null), i(null), await ae($));
          } catch {
            (a(u), i(h));
          }
        } else (a(null), i(null));
      }),
    [],
  );
  const r = async () => {
      const g = new qe();
      try {
        await He($, g);
      } catch {}
    },
    m = () => ae($);
  return e.jsx(Se.Provider, {
    value: { user: s, signIn: r, signOut: m, idToken: l, allowListError: n },
    children: t,
  });
}
function I() {
  const t = d.useContext(Se);
  if (!t) throw new Error("useAuth must be used within AuthProvider");
  return t;
}
function et() {
  const { user: t } = I(),
    [s, a] = d.useState([]),
    [l, i] = d.useState(!0),
    [n, o] = d.useState(null);
  return (
    d.useEffect(() => {
      if (!t) {
        (a([]), i(!1));
        return;
      }
      i(!0);
      const r = Q(R, "users", t.uid, "tasks"),
        m = X(r);
      return P(
        m,
        (u) => {
          (a(u.docs.map((h) => h.data())), i(!1), o(null));
        },
        (u) => {
          (console.error("useTasks subscription error:", u), o(u), i(!1));
        },
      );
    }, [t]),
    { tasks: s, loading: l, error: n }
  );
}
function tt() {
  const { user: t } = I(),
    [s, a] = d.useState(null),
    [l, i] = d.useState(void 0),
    [n, o] = d.useState(void 0),
    [r, m] = d.useState([]),
    [g, u] = d.useState(!0),
    [h, j] = d.useState(null);
  return (
    d.useEffect(() => {
      if (!t) {
        (a(null), i(void 0), o(null), m([]), u(!1));
        return;
      }
      u(!0);
      const x = ve(R, "users", t.uid);
      return P(
        x,
        (p) => {
          const f = p.exists() ? p.data() : {};
          (a(f.currentMood ?? null),
            i(f.lastCheckInAt ?? null),
            o(f.activeTaskId ?? null),
            m(Array.isArray(f.customMoodTags) ? f.customMoodTags : []),
            j(null),
            u(!1));
        },
        (p) => {
          (console.error("useMood subscription error:", p), j(p), u(!1));
        },
      );
    }, [t]),
    {
      currentMood: s,
      lastCheckInAt: l,
      activeTaskId: n,
      customMoodTags: r,
      loading: g,
      error: h,
    }
  );
}
function st(t) {
  if (!t) return !0;
  const s = t.toDate ? t.toDate() : new Date(t),
    a = new Date().toLocaleDateString(),
    l = s.toLocaleDateString();
  return a !== l;
}
const re = "https://mind-manager-backend-hjmazjyvya-ue.a.run.app".replace(
  /\/$/,
  "",
);
class nt extends Error {
  constructor(s, a) {
    (super(`API error ${s}`), (this.status = s), (this.body = a));
  }
}
async function at(t) {
  const s = t.headers?.get?.("content-type") || "";
  if (!s || s.includes("application/json"))
    try {
      return await t.json();
    } catch {}
  try {
    return await t.text();
  } catch {
    return null;
  }
}
const K = 2,
  ie = 300,
  oe = (t) => new Promise((s) => setTimeout(s, t));
async function T(t, s = {}) {
  const { body: a, headers: l, ...i } = s,
    n = await $.currentUser?.getIdToken(),
    o = {
      ...(a !== void 0 ? { "Content-Type": "application/json" } : {}),
      ...(n ? { Authorization: `Bearer ${n}` } : {}),
      ...l,
    },
    r = re ? re + t : t,
    m = {
      ...i,
      headers: o,
      ...(a !== void 0 ? { body: JSON.stringify(a) } : {}),
    };
  let g = null;
  for (let u = 0; u <= K; u++) {
    let h;
    try {
      h = await fetch(r, m);
    } catch (x) {
      if (((g = x), u < K)) {
        await oe(ie * 2 ** u);
        continue;
      }
      throw x;
    }
    if (h.status >= 500 && u < K) {
      await oe(ie * 2 ** u);
      continue;
    }
    const j = await at(h);
    if (!h.ok) throw new nt(h.status, j);
    return j;
  }
  throw g ?? new Error("apiFetch: exhausted retries");
}
function Te({
  open: t,
  onClose: s,
  eyebrow: a,
  title: l,
  footer: i,
  children: n,
  maxWidth: o = 560,
  titleClassName: r = "",
  ariaLabel: m,
}) {
  const g = d.useRef(null),
    u = d.useRef({ startY: 0, dy: 0, active: !1 });
  if (
    (d.useEffect(() => {
      if (!t) return;
      const x = (p) => {
        p.key === "Escape" && s?.();
      };
      document.addEventListener("keydown", x);
      const v = document.body.style.overflow;
      return (
        (document.body.style.overflow = "hidden"),
        () => {
          (document.removeEventListener("keydown", x),
            (document.body.style.overflow = v));
        }
      );
    }, [t, s]),
    !t)
  )
    return null;
  const h = !!(a || l || i),
    j = (x) => {
      const v = g.current;
      if (!v) return;
      ((u.current = { startY: x.clientY, dy: 0, active: !0 }),
        (v.style.transition = "none"));
      const p = (y) => {
          if (!u.current.active) return;
          const c = Math.max(0, y.clientY - u.current.startY);
          ((u.current.dy = c), (v.style.transform = `translateY(${c}px)`));
        },
        f = () => {
          ((u.current.active = !1),
            window.removeEventListener("pointermove", p),
            window.removeEventListener("pointerup", f),
            (v.style.transition = ""),
            u.current.dy > 90 ? s?.() : (v.style.transform = ""));
        };
      (window.addEventListener("pointermove", p),
        window.addEventListener("pointerup", f));
    };
  return be.createPortal(
    e.jsx("div", {
      className: "modal-scrim",
      onClick: s,
      children: e.jsxs("div", {
        ref: g,
        className: `modal sheet${h ? " sheet--managed" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": m || (typeof l == "string" ? l : void 0),
        style: { maxWidth: o },
        onClick: (x) => x.stopPropagation(),
        children: [
          e.jsx("div", {
            className: "sheet-handle",
            "aria-hidden": "true",
            onPointerDown: j,
          }),
          h
            ? e.jsxs(e.Fragment, {
                children: [
                  (a || l) &&
                    e.jsxs("div", {
                      className: "modal-head",
                      children: [
                        a &&
                          e.jsx("div", {
                            className: "modal-eyebrow",
                            children: a,
                          }),
                        l &&
                          e.jsx("div", {
                            className: `modal-title ${r}`,
                            children: l,
                          }),
                      ],
                    }),
                  e.jsx("div", { className: "modal-body", children: n }),
                  i && e.jsx("div", { className: "modal-foot", children: i }),
                ],
              })
            : n,
        ],
      }),
    }),
    document.body,
  );
}
const ce = [
    "focused",
    "creative",
    "calm",
    "social",
    "curious",
    "restless",
    "tired",
    "scattered",
  ],
  Ce = 24;
function lt(t) {
  if (typeof t != "string") return "";
  const s = t.trim().toLowerCase().replace(/\s+/g, " ");
  return !s || s.length > Ce || !/^[a-z0-9 _-]+$/.test(s) ? "" : s;
}
function de({ value: t, onChange: s }) {
  return e.jsx("div", {
    className: "energy-dots energy-dots--pick",
    style: { gap: 6 },
    children: Array.from({ length: 5 }).map((a, l) =>
      e.jsx(
        "button",
        {
          type: "button",
          className: "energy-dot",
          "data-on": l < t ? "true" : "false",
          "aria-label": `Energy ${l + 1}`,
          onClick: () => s(l + 1),
          style: { width: 18, height: 18, border: 0 },
        },
        l,
      ),
    ),
  });
}
function ue({
  tags: t,
  customTags: s = [],
  onToggle: a,
  allowAdd: l = !0,
  allowRemoveCustom: i = !0,
}) {
  const [n, o] = d.useState(""),
    [r, m] = d.useState(!1),
    [g, u] = d.useState(null),
    h = new Set(),
    j = [...ce, ...s].filter((p) => (h.has(p) ? !1 : (h.add(p), !0))),
    x = async () => {
      const p = lt(n);
      if (!p) {
        u("1–24 letters, numbers, spaces, - or _");
        return;
      }
      (m(!0), u(null));
      try {
        (await T("/actions", {
          method: "POST",
          body: { action: { type: "add_mood_tag", tag: p } },
        }),
          o(""),
          t.includes(p) || a(p));
      } catch (f) {
        u(f?.body?.detail || f?.message || "Couldn’t add tag");
      } finally {
        m(!1);
      }
    },
    v = async (p) => {
      try {
        (await T("/actions", {
          method: "POST",
          body: { action: { type: "remove_mood_tag", tag: p } },
        }),
          t.includes(p) && a(p));
      } catch (f) {
        u(f?.body?.detail || f?.message || "Couldn’t remove tag");
      }
    };
  return e.jsxs("div", {
    style: { display: "flex", flexDirection: "column", gap: 8 },
    children: [
      e.jsx("div", {
        style: { display: "flex", flexWrap: "wrap", gap: 8 },
        children: j.map((p) => {
          const f = !ce.includes(p);
          return e.jsxs(
            "span",
            {
              style: { display: "inline-flex", alignItems: "center", gap: 2 },
              children: [
                e.jsx("button", {
                  type: "button",
                  className: "mood-tag-chip",
                  "data-on": t.includes(p) ? "true" : "false",
                  onClick: () => a(p),
                  children: p,
                }),
                f &&
                  i &&
                  e.jsx("button", {
                    type: "button",
                    onClick: () => v(p),
                    title: `Remove "${p}"`,
                    "aria-label": `Remove ${p}`,
                    style: {
                      border: "none",
                      background: "transparent",
                      color: "var(--faint)",
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1,
                      padding: "0 2px",
                    },
                    children: "×",
                  }),
              ],
            },
            p,
          );
        }),
      }),
      l &&
        e.jsxs("div", {
          style: { display: "flex", gap: 6, alignItems: "center" },
          children: [
            e.jsx("input", {
              type: "text",
              value: n,
              onChange: (p) => {
                (o(p.target.value), g && u(null));
              },
              onKeyDown: (p) => {
                p.key === "Enter" && (p.preventDefault(), x());
              },
              placeholder: "add mood…",
              maxLength: Ce,
              style: {
                flex: "0 1 160px",
                padding: "4px 10px",
                border: "1px solid var(--line)",
                borderRadius: 16,
                background: "var(--panel)",
                color: "var(--ink)",
                fontSize: 12,
                outline: "none",
              },
            }),
            e.jsx("button", {
              type: "button",
              className: "btn btn-sm btn-ghost",
              onClick: x,
              disabled: r || !n.trim(),
              children: r ? "…" : "+",
            }),
            g &&
              e.jsx("span", {
                style: { fontSize: 11, color: "var(--accent)" },
                children: g,
              }),
          ],
        }),
    ],
  });
}
function Y({ label: t, value: s, onChange: a }) {
  return e.jsxs("div", {
    children: [
      e.jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        },
        children: [
          e.jsx("span", { className: "h-eyebrow", children: t }),
          e.jsxs("span", {
            style: {
              fontSize: 12,
              color: "var(--muted)",
              fontVariantNumeric: "tabular-nums",
            },
            children: [s, " / 5"],
          }),
        ],
      }),
      e.jsx("input", {
        type: "range",
        min: 1,
        max: 5,
        step: 1,
        value: s,
        onChange: (l) => a(Number(l.target.value)),
        style: {
          width: "100%",
          cursor: "pointer",
          accentColor: "var(--accent)",
        },
      }),
    ],
  });
}
function F({ children: t }) {
  return e.jsx("div", {
    className: "h-eyebrow",
    style: { marginBottom: 8 },
    children: t,
  });
}
function rt({ currentMood: t, onClick: s }) {
  const a = t?.energy ?? 0,
    l = (t?.tags || []).slice(0, 2);
  return e.jsxs("button", {
    onClick: s,
    "aria-label": "Open check-in",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 12px",
      borderRadius: 20,
      border: "1px solid var(--line)",
      background: "var(--panel)",
      color: "var(--ink-2)",
      cursor: "pointer",
      fontSize: 13,
    },
    children: [
      e.jsx("span", { children: "Check in" }),
      a > 0 &&
        e.jsx("span", {
          style: { display: "flex", gap: 3 },
          children: Array.from({ length: 5 }).map((i, n) =>
            e.jsx(
              "span",
              {
                style: {
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  border: "1.5px solid currentColor",
                  background: n < a ? "currentColor" : "transparent",
                  display: "inline-block",
                },
              },
              n,
            ),
          ),
        }),
      l.length > 0 &&
        e.jsx("span", {
          style: { color: "var(--muted)" },
          children: l.join(", "),
        }),
    ],
  });
}
function it({
  open: t,
  firstTime: s,
  currentMood: a,
  customMoodTags: l = [],
  moodModel: i = "energy-tags",
  onClose: n,
  onSave: o,
}) {
  const [r, m] = d.useState(a?.energy ?? 3),
    [g, u] = d.useState(a?.tags ?? []),
    [h, j] = d.useState(a?.focus ?? 3),
    [x, v] = d.useState(a?.patience ?? 3),
    [p, f] = d.useState(!1),
    [y, c] = d.useState(null);
  if (!t) return null;
  const w = (N) => {
      u((k) => (k.includes(N) ? k.filter((L) => L !== N) : [...k, N]));
    },
    S = async () => {
      (f(!0), c(null));
      try {
        let N;
        switch (i) {
          case "tags-only":
            N = { tags: g, energy: a?.energy ?? 3 };
            break;
          case "energy-only":
            N = { tags: [], energy: r };
            break;
          case "focus-energy-patience":
            N = { tags: [], energy: r, focus: h, patience: x };
            break;
          default:
            N = { tags: g, energy: r };
        }
        (await T("/check-in", { method: "POST", body: N }),
          o?.({ tags: g, energy: r, focus: h, patience: x }),
          n());
      } catch (N) {
        console.error("Check-in failed:", N);
        const k = N?.body?.detail || N?.body || N?.message || "Check-in failed";
        c(typeof k == "string" ? k : JSON.stringify(k));
      } finally {
        f(!1);
      }
    },
    b = () => {
      switch (i) {
        case "tags-only":
          return e.jsxs("div", {
            children: [
              e.jsx(F, { children: "Mood — pick any that fit" }),
              e.jsx(ue, { tags: g, customTags: l, onToggle: w }),
            ],
          });
        case "energy-only":
          return e.jsxs("div", {
            children: [
              e.jsx(F, { children: "Energy now" }),
              e.jsx(de, { value: r, onChange: m }),
            ],
          });
        case "focus-energy-patience":
          return e.jsxs("div", {
            style: { display: "flex", flexDirection: "column", gap: 16 },
            children: [
              e.jsx(Y, { label: "Focus", value: h, onChange: j }),
              e.jsx(Y, { label: "Energy", value: r, onChange: m }),
              e.jsx(Y, { label: "Patience", value: x, onChange: v }),
            ],
          });
        default:
          return e.jsxs(e.Fragment, {
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx(F, { children: "Energy now" }),
                  e.jsx(de, { value: r, onChange: m }),
                ],
              }),
              e.jsxs("div", {
                children: [
                  e.jsx(F, { children: "Mood — pick any that fit" }),
                  e.jsx(ue, { tags: g, customTags: l, onToggle: w }),
                ],
              }),
            ],
          });
      }
    };
  return e.jsxs(Te, {
    open: t,
    onClose: n,
    maxWidth: 480,
    eyebrow: s ? "Welcome back" : "Check in",
    title: s
      ? "How are you arriving today?"
      : "Update where you are right now.",
    footer: e.jsxs(e.Fragment, {
      children: [
        e.jsx("button", {
          type: "button",
          className: "btn",
          onClick: n,
          children: "Skip",
        }),
        e.jsx("button", {
          type: "button",
          className: "btn btn-primary",
          onClick: S,
          disabled: p,
          children: p ? "Saving…" : "Continue",
        }),
      ],
    }),
    children: [
      b(),
      e.jsx("p", {
        style: { fontSize: 12, color: "var(--muted)", margin: 0 },
        children:
          "This shapes which tasks Mind surfaces. You can change it anytime from the pill.",
      }),
      y &&
        e.jsx("p", {
          style: {
            fontSize: 12,
            color: "var(--accent)",
            margin: 0,
            padding: "8px 10px",
            background: "var(--accent-soft)",
            borderRadius: 6,
          },
          children: y,
        }),
    ],
  });
}
const G = {
    work: "work",
    learning: "learning",
    body: "body",
    social: "social",
    wealth: "wealth",
    music: "listen",
    craft: "craft",
    errand: "errand",
    drift: "drift",
  },
  ot = {
    q1: "Do now",
    q2: "Schedule",
    q3: "Delegate / quick",
    q4: "Drop or drift",
  };
function ct(t) {
  if (t.template === "book" && t.book?.chapters?.length) {
    const s = t.book.chapters.length,
      a = t.book.chapters.filter((l) => l.status === "done").length;
    return { done: a, total: s, label: `${a}/${s} ch` };
  }
  if (t.template === "project" && t.project?.phases?.length) {
    const s = t.project.phases.length,
      a = t.project.phases.filter((l) => l.status === "done").length;
    return { done: a, total: s, label: `${a}/${s} ph` };
  }
  if (t.template === "skill" && t.skill?.drills?.length) {
    const s = t.skill.drills,
      a = s.reduce((i, n) => i + (n.level || 0), 0),
      l = s.length * 5;
    return { done: a, total: l, label: `${(a / s.length).toFixed(1)}/5 avg` };
  }
  return null;
}
function Ee({ onEdit: t, onDelete: s }) {
  const [a, l] = d.useState(!1),
    i = d.useRef(null);
  return (
    d.useEffect(() => {
      if (!a) return;
      const n = (o) => {
        i.current && !i.current.contains(o.target) && l(!1);
      };
      return (
        document.addEventListener("mousedown", n),
        () => document.removeEventListener("mousedown", n)
      );
    }, [a]),
    e.jsxs("span", {
      ref: i,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      },
      children: [
        e.jsx("button", {
          type: "button",
          className: "btn btn-ghost row-menu-btn",
          onClick: (n) => {
            (n.stopPropagation(), l((o) => !o));
          },
          "aria-label": "More actions",
          children: "⋯",
        }),
        a &&
          e.jsxs("div", {
            onClick: (n) => n.stopPropagation(),
            style: {
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              boxShadow: "var(--shadow)",
              zIndex: 1e3,
              minWidth: 140,
              padding: 4,
            },
            children: [
              t &&
                e.jsx("button", {
                  type: "button",
                  onClick: () => {
                    (l(!1), t());
                  },
                  style: {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    border: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontSize: 13,
                    borderRadius: 6,
                  },
                  children: "Edit",
                }),
              s &&
                e.jsx("button", {
                  type: "button",
                  onClick: () => {
                    (l(!1), s());
                  },
                  style: {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    border: "none",
                    background: "transparent",
                    color: "var(--accent)",
                    cursor: "pointer",
                    fontSize: 13,
                    borderRadius: 6,
                  },
                  children: "Delete",
                }),
            ],
          }),
      ],
    })
  );
}
function ks({
  task: t,
  active: s,
  onClick: a,
  onToggleDone: l,
  onEdit: i,
  showKind: n = !0,
  showQuad: o = !0,
  exiting: r = !1,
}) {
  const m = !!t.done,
    g = ct(t);
  return e.jsxs("div", {
    className: `task-row${r ? " task-row--exiting" : ""}`,
    "data-active": s ? "true" : "false",
    onClick: a,
    children: [
      e.jsx("span", {
        className: "task-check",
        "data-done": m ? "true" : "false",
        onClick: (u) => {
          (u.stopPropagation(), l?.(t.id));
        },
        "aria-label": "Toggle done",
      }),
      e.jsxs("span", {
        className: "task-title-wrap",
        children: [
          e.jsxs("span", {
            className: "task-title",
            "data-done": m ? "true" : "false",
            children: [
              t.title,
              t.template &&
                e.jsx("span", {
                  className: "task-template-pill",
                  children: t.template,
                }),
            ],
          }),
          g &&
            e.jsxs("span", {
              className: "task-progress",
              children: [
                e.jsx("span", {
                  className: "task-progress-bar",
                  children: e.jsx("span", {
                    style: { width: `${(g.done / g.total) * 100}%` },
                  }),
                }),
                e.jsx("span", {
                  className: "task-progress-label",
                  children: g.label,
                }),
              ],
            }),
        ],
      }),
      e.jsxs("span", {
        className: "task-meta",
        children: [
          n &&
            t.kind &&
            e.jsx("span", {
              className: "task-kind",
              children: G[t.kind] || t.kind,
            }),
          t.energy != null &&
            e.jsx("span", {
              className: "task-energy",
              "aria-label": `Energy ${t.energy}`,
              children: Array.from({ length: 5 }).map((u, h) =>
                e.jsx(
                  "span",
                  {
                    className: "task-energy-dot",
                    "data-on": h < t.energy ? "true" : "false",
                  },
                  h,
                ),
              ),
            }),
          o &&
            t.quad &&
            e.jsx("span", {
              className: "task-quad",
              "data-q": t.quad,
              title: ot[t.quad],
            }),
          i && e.jsx(Ee, { onEdit: () => i(t) }),
        ],
      }),
    ],
  });
}
const dt = { daily: 1, weekly: 7, biweekly: 14, loose: 14, once: null };
function he(t) {
  if (!t) return null;
  if (typeof t.toMillis == "function") return t.toMillis();
  if (t.seconds != null) return t.seconds * 1e3;
  const s = Date.parse(t);
  return Number.isFinite(s) ? s : null;
}
function De(t) {
  const s = he(t.lastTouched) ?? he(t.createdAt);
  return s ? Math.floor((Date.now() - s) / 864e5) : 0;
}
function me(t) {
  const s = dt[t.cadence];
  return s ? De(t) >= s : !1;
}
function ut(t) {
  if (t.template === "book" && t.book)
    return `${(t.book.chapters || []).filter((a) => a.status === "done").length}/${(t.book.chapters || []).length} chapters`;
  if (t.template === "skill" && t.skill) {
    const s = (t.skill.drills || []).length;
    return `${s} drill${s === 1 ? "" : "s"}`;
  }
  if (t.template === "project" && t.project) {
    const s = (t.project.phases || []).filter(
        (l) => l.status === "done",
      ).length,
      a = (t.project.phases || []).find((l) => l.status === "doing");
    return `${s}/${(t.project.phases || []).length} phases${a ? ` · ${a.title}` : ""}`;
  }
  return "";
}
const ht = [
  { id: "now", label: "Now" },
  { id: "today", label: "Today" },
  { id: "tasks", label: "All tasks" },
  { id: "matrix", label: "Priority matrix" },
  { id: "timeline", label: "Timeline" },
];
function mt({
  view: t,
  setView: s,
  tasks: a = [],
  activeTaskId: l,
  onSetActive: i,
  onNew: n,
  drawerOpen: o,
  onClose: r,
  onKindFilter: m,
}) {
  const g = a.filter((c) => !c.done),
    u = g.filter((c) => c.template && c.template !== "idle"),
    h = g.filter((c) => c.template === "idle"),
    j = g.filter((c) => me(c)),
    x = a.find((c) => c.id === l && !c.done),
    v = d.useMemo(() => {
      const c = {};
      return (
        g.forEach((w) => {
          w.kind && (c[w.kind] = (c[w.kind] || 0) + 1);
        }),
        Object.entries(c).sort((w, S) => S[1] - w[1])
      );
    }, [g]),
    p = (c) => {
      (s(c), r?.());
    },
    f = (c) => {
      (i?.(c), r?.());
    },
    y = { tasks: g.length };
  return e.jsxs("nav", {
    className: "sidebar",
    "data-open": o ? "true" : "false",
    children: [
      e.jsxs("div", {
        className: "brand",
        children: [
          e.jsx("span", { className: "brand-mark" }),
          e.jsxs("div", {
            children: [
              e.jsx("div", { className: "brand-name serif", children: "Mind" }),
              e.jsx("div", {
                className: "brand-sub",
                children: "tasks · context · mood",
              }),
            ],
          }),
        ],
      }),
      n &&
        e.jsxs("button", {
          className: "new-btn",
          onClick: () => {
            (n(), r?.());
          },
          children: [
            e.jsx("span", { className: "new-btn-plus", children: "＋" }),
            e.jsx("span", { children: "New task or thread" }),
          ],
        }),
      e.jsxs("div", {
        className: "nav-group",
        children: [
          e.jsx("div", { className: "nav-label", children: "Views" }),
          ht.map((c) =>
            e.jsxs(
              "button",
              {
                className: "nav-item",
                "data-active": t === c.id,
                onClick: () => p(c.id),
                children: [
                  e.jsx("span", { className: "nav-dot" }),
                  e.jsx("span", { children: c.label }),
                  c.id === "tasks" &&
                    y.tasks > 0 &&
                    e.jsx("span", { className: "count", children: y.tasks }),
                ],
              },
              c.id,
            ),
          ),
        ],
      }),
      j.length > 0 &&
        e.jsxs("div", {
          className: "nav-group",
          children: [
            e.jsxs("div", {
              className: "nav-label nav-label-accent",
              children: ["Ready to revisit · ", j.length],
            }),
            j.map((c) =>
              e.jsxs(
                "button",
                {
                  className: "thread-item thread-item-ready",
                  "data-active": c.id === l,
                  onClick: () => f(c.id),
                  children: [
                    e.jsx("span", { className: "thread-marker" }),
                    e.jsxs("div", {
                      className: "thread-body",
                      children: [
                        e.jsx("div", {
                          className: "thread-title-row",
                          children: e.jsx("span", {
                            className: "thread-title",
                            children: c.title,
                          }),
                        }),
                        e.jsxs("div", {
                          className: "thread-detail",
                          children: [
                            c.cadence &&
                              e.jsx("span", {
                                className: "thread-cadence",
                                children: c.cadence,
                              }),
                            c.cadence && e.jsx("span", { children: "·" }),
                            e.jsxs("span", { children: [De(c), "d since"] }),
                          ],
                        }),
                      ],
                    }),
                  ],
                },
                c.id,
              ),
            ),
          ],
        }),
      u.length > 0 &&
        e.jsxs("div", {
          className: "nav-group",
          children: [
            e.jsxs("div", {
              className: "nav-label",
              children: ["Long threads · ", u.length],
            }),
            u.map((c) =>
              e.jsxs(
                "button",
                {
                  className: "thread-item",
                  "data-active": c.id === l,
                  "data-template": c.template,
                  onClick: () => f(c.id),
                  children: [
                    e.jsx("span", {
                      className: "thread-template-tag",
                      children: c.template[0],
                    }),
                    e.jsxs("div", {
                      className: "thread-body",
                      children: [
                        e.jsxs("div", {
                          className: "thread-title-row",
                          children: [
                            e.jsx("span", {
                              className: "thread-title",
                              children: c.title,
                            }),
                            me(c) &&
                              e.jsx("span", {
                                className: "thread-ready-pulse",
                              }),
                          ],
                        }),
                        e.jsx("div", {
                          className: "thread-detail",
                          children: ut(c),
                        }),
                      ],
                    }),
                  ],
                },
                c.id,
              ),
            ),
          ],
        }),
      v.length > 0 &&
        e.jsxs("div", {
          className: "nav-group",
          children: [
            e.jsx("div", { className: "nav-label", children: "By kind" }),
            v.map(([c, w]) =>
              e.jsxs(
                "button",
                {
                  className: "nav-item",
                  onClick: () => {
                    (m?.(c), r?.());
                  },
                  children: [
                    e.jsx("span", { className: "nav-dot" }),
                    e.jsx("span", { children: G[c] || c }),
                    e.jsx("span", { className: "count", children: w }),
                  ],
                },
                c,
              ),
            ),
          ],
        }),
      h.length > 0 &&
        e.jsxs("div", {
          className: "nav-group",
          children: [
            e.jsx("div", {
              className: "nav-label",
              children: "Drift · no goals, just time",
            }),
            h.map((c) =>
              e.jsxs(
                "button",
                {
                  className: "thread-item thread-item-drift",
                  "data-active": c.id === l,
                  onClick: () => f(c.id),
                  children: [
                    e.jsx("span", { className: "drift-glyph", children: "∿" }),
                    e.jsxs("div", {
                      className: "thread-body",
                      children: [
                        e.jsx("div", {
                          className: "thread-title-row",
                          children: e.jsx("span", {
                            className: "thread-title",
                            children: c.title,
                          }),
                        }),
                        e.jsxs("div", {
                          className: "thread-detail",
                          children: [
                            c.minutesTotal || 0,
                            "m total · ",
                            c.sessions || 0,
                            " drift",
                            c.sessions === 1 ? "" : "s",
                          ],
                        }),
                      ],
                    }),
                  ],
                },
                c.id,
              ),
            ),
          ],
        }),
      e.jsxs("div", {
        className: "sidebar-foot",
        children: [
          x
            ? e.jsxs("div", {
                className: "now-pill",
                children: [
                  e.jsx("div", {
                    className: "now-pill-label",
                    children: "In flight",
                  }),
                  e.jsx("div", {
                    className: "now-pill-title",
                    children: x.title,
                  }),
                  e.jsxs("div", {
                    className: "now-pill-meta",
                    children: [
                      x.energy != null &&
                        e.jsx("span", {
                          className: "energy-dots",
                          style: { gap: 2 },
                          children: Array.from({ length: 5 }).map((c, w) =>
                            e.jsx(
                              "span",
                              {
                                className: "energy-dot",
                                "data-on": w < x.energy ? "true" : "false",
                                style: { width: 5, height: 5, border: 0 },
                              },
                              w,
                            ),
                          ),
                        }),
                      x.kind &&
                        e.jsxs("span", {
                          children: ["· ", G[x.kind] || x.kind],
                        }),
                    ],
                  }),
                ],
              })
            : e.jsxs("div", {
                className: "now-pill",
                children: [
                  e.jsx("div", {
                    className: "now-pill-label",
                    children: "Nothing in flight",
                  }),
                  e.jsx("div", {
                    className: "now-pill-title",
                    style: { color: "var(--muted)" },
                    children: "Pick a task to begin.",
                  }),
                ],
              }),
          e.jsxs("div", {
            className: "version-tag",
            title: "build 51 · f43a129",
            children: ["v", "51", " · ", "f43a129"],
          }),
        ],
      }),
    ],
  });
}
function pt() {
  if (typeof window > "u" || !window.matchMedia) return !1;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return !1;
  }
}
let q = null;
function gt() {
  return (
    q ||
      (q = M(() => import("./confetti.module-wUsLuJ1J.js"), []).then(
        (t) => t.default,
      )),
    q
  );
}
const ft = {
  milestone: [
    {
      particleCount: 60,
      spread: 55,
      startVelocity: 35,
      scalar: 0.85,
      origin: { y: 0.7 },
    },
  ],
  epic: [
    { particleCount: 130, spread: 70, startVelocity: 45, origin: { y: 0.6 } },
    {
      particleCount: 70,
      spread: 110,
      decay: 0.92,
      scalar: 1.1,
      origin: { y: 0.55 },
    },
  ],
};
async function pe(t) {
  if (pt()) return;
  const s = ft[t];
  if (!s) return;
  let a;
  try {
    a = await gt();
  } catch {
    return;
  }
  s.forEach((l, i) => {
    setTimeout(() => a({ disableForReducedMotion: !0, ...l }), i * 180);
  });
}
function ge(t) {
  if (typeof window > "u") return;
  const s = window.AudioContext || window.webkitAudioContext;
  if (s)
    try {
      const a = new s(),
        l = a.currentTime;
      ((t === "epic"
        ? [523.25, 659.25, 783.99, 1046.5]
        : [659.25, 880]
      ).forEach((n, o) => {
        const r = a.createOscillator(),
          m = a.createGain();
        ((r.type = "sine"), (r.frequency.value = n));
        const g = l + o * 0.08;
        (m.gain.setValueAtTime(0, g),
          m.gain.linearRampToValueAtTime(0.11, g + 0.02),
          m.gain.exponentialRampToValueAtTime(1e-4, g + 0.5),
          r.connect(m).connect(a.destination),
          r.start(g),
          r.stop(g + 0.55));
      }),
        setTimeout(() => a.close().catch(() => {}), 1200));
    } catch {}
}
const Ae = d.createContext(() => {});
function O() {
  return d.useContext(Ae);
}
const xt = {
  task_complete: "Done — one off the list.",
  chapter_done: "Chapter done.",
  phase_done: "Phase complete.",
  milestone_logged: "Milestone logged.",
};
function yt(t) {
  return t.energy == null
    ? ""
    : t.energy <= 2
      ? " You pushed through on low energy — that counts double."
      : t.energy >= 4
        ? " Rode the high energy."
        : "";
}
function jt(t) {
  switch (t.reason) {
    case "drill_mastered":
      return t.label ? `Mastered ${t.label} — 5/5.` : "Drill mastered — 5/5.";
    case "sessions_milestone":
      return `${t.count} sessions in. That adds up.`;
    default:
      return (xt[t.reason] || "Done.") + yt(t);
  }
}
const bt = {
    book_complete: { emoji: "📚", headline: "Book finished" },
    project_complete: { emoji: "🚀", headline: "Project shipped" },
  },
  vt = { emoji: "🎉", headline: "Done" };
let wt = 0;
function Nt({ enabled: t = !0, sound: s = !1, children: a }) {
  const [l, i] = d.useState([]),
    [n, o] = d.useState(null),
    r = d.useRef({ enabled: t, sound: s });
  d.useEffect(() => {
    r.current = { enabled: t, sound: s };
  }, [t, s]);
  const m = d.useCallback((u) => {
      i((h) => h.filter((j) => j.id !== u));
    }, []),
    g = d.useCallback(
      (u, h = {}) => {
        if (!u || !r.current.enabled) return;
        const { tier: j, reason: x } = u;
        if (j === "epic") {
          const f = bt[x] || vt;
          (o({ ...f, reason: x, title: h.title, recap: h.recap }),
            pe("epic"),
            r.current.sound && ge("epic"));
          return;
        }
        const v = ++wt,
          p = h.message || jt(u);
        (i((f) => [...f.slice(-2), { id: v, msg: p, onUndo: h.onUndo }]),
          setTimeout(() => m(v), h.onUndo ? 5e3 : 2600),
          j === "milestone" &&
            (pe("milestone"), r.current.sound && ge("milestone")));
      },
      [m],
    );
  return e.jsxs(Ae.Provider, {
    value: g,
    children: [
      a,
      e.jsx("div", {
        className: "celebrate-toasts",
        "aria-live": "polite",
        children: l.map((u) =>
          e.jsxs(
            "div",
            {
              className: "celebrate-toast",
              role: "status",
              children: [
                e.jsx("span", {
                  className: "celebrate-toast-check",
                  "aria-hidden": "true",
                  children: "✓",
                }),
                e.jsx("span", { children: u.msg }),
                u.onUndo
                  ? e.jsx("button", {
                      type: "button",
                      className: "celebrate-toast-undo",
                      onClick: () => {
                        (m(u.id), u.onUndo());
                      },
                      children: "Undo",
                    })
                  : e.jsx("button", {
                      type: "button",
                      className: "celebrate-toast-undo",
                      "aria-label": "Dismiss",
                      onClick: () => m(u.id),
                      children: "✕",
                    }),
              ],
            },
            u.id,
          ),
        ),
      }),
      n && e.jsx(kt, { ...n, onClose: () => o(null) }),
    ],
  });
}
function kt({ emoji: t, headline: s, title: a, recap: l, onClose: i }) {
  return (
    d.useEffect(() => {
      const n = (r) => {
        r.key === "Escape" && i();
      };
      window.addEventListener("keydown", n);
      const o = setTimeout(i, 9e3);
      return () => {
        (window.removeEventListener("keydown", n), clearTimeout(o));
      };
    }, [i]),
    e.jsx("div", {
      className: "celebrate-scrim",
      onClick: i,
      children: e.jsxs("div", {
        className: "celebrate-card",
        onClick: (n) => n.stopPropagation(),
        role: "dialog",
        "aria-label": s,
        children: [
          e.jsx("div", {
            className: "celebrate-emoji",
            "aria-hidden": "true",
            children: t,
          }),
          e.jsx("div", { className: "celebrate-headline serif", children: s }),
          a && e.jsx("div", { className: "celebrate-card-title", children: a }),
          l && e.jsx("div", { className: "celebrate-recap mono", children: l }),
          e.jsx("button", {
            className: "btn btn-primary",
            onClick: i,
            style: { marginTop: 18 },
            children: "Onwards",
          }),
        ],
      }),
    })
  );
}
const St = 50;
function Tt(t) {
  const { user: s } = I(),
    [a, l] = d.useState([]),
    [i, n] = d.useState(!0),
    [o, r] = d.useState(null);
  return (
    d.useEffect(() => {
      if (!s || !t) {
        (l([]), n(!1));
        return;
      }
      n(!0);
      const m = Q(R, "users", s.uid, "tasks", t, "milestones"),
        g = X(m, Ne("capturedAt", "desc"), we(St));
      return P(
        g,
        (h) => {
          const j = h.docs.map((x) => ({ id: x.id, ...x.data() }));
          (l(j), n(!1), r(null));
        },
        (h) => {
          (console.error("useMilestones subscription error:", h), r(h), n(!1));
        },
      );
    }, [s, t]),
    { milestones: a, loading: i, error: o }
  );
}
function Ct(t) {
  if (!t) return "";
  const s = t?.toMillis?.() ?? new Date(t).getTime();
  if (!s) return "";
  const a = Date.now(),
    l = Math.floor((a - s) / 6e4);
  if (l < 1) return "just now";
  if (l < 60) return `${l}m ago`;
  const i = Math.floor(l / 60);
  if (i < 24) return `${i}h ago`;
  const n = Math.floor(i / 24);
  return n === 1
    ? "yesterday"
    : n < 7
      ? `${n}d ago`
      : new Date(s).toLocaleDateString(void 0, {
          month: "short",
          day: "numeric",
        });
}
function Et(t) {
  const s = (t.tags || []).join(", "),
    a = t.energy;
  return !s && a == null
    ? ""
    : s
      ? a == null
        ? s
        : `${s}, energy ${a}`
      : `energy ${a}`;
}
function Dt({ taskId: t }) {
  const { milestones: s, loading: a } = Tt(t),
    [l, i] = d.useState(!1),
    [n, o] = d.useState({ title: "", progress: "", where: "", insight: "" }),
    [r, m] = d.useState(!1),
    [g, u] = d.useState(null),
    h = O(),
    j = () => o({ title: "", progress: "", where: "", insight: "" }),
    x = async () => {
      if (!(!n.title.trim() || r)) {
        (m(!0), u(null));
        try {
          const p = await T("/actions", {
            method: "POST",
            body: {
              action: {
                type: "log_milestone",
                taskId: t,
                title: n.title.trim(),
                progress: n.progress.trim(),
                where: n.where.trim(),
                insight: n.insight.trim(),
              },
            },
          });
          (h(p?.celebration), j(), i(!1));
        } catch (p) {
          u(p?.body?.detail || p?.message || "Failed to log milestone");
        } finally {
          m(!1);
        }
      }
    },
    v = () => {
      (j(), i(!1), u(null));
    };
  return a && s.length === 0
    ? null
    : s.length === 0 && !l
      ? e.jsxs("div", {
          className: "thread-empty",
          children: [
            e.jsxs("div", {
              children: [
                e.jsx("div", {
                  className: "thread-empty-title serif",
                  children: "No milestones yet for this thread.",
                }),
                e.jsx("div", {
                  className: "thread-empty-sub",
                  children:
                    "Log one when you stop — even a single line keeps the thread warm.",
                }),
              ],
            }),
            e.jsx("button", {
              className: "btn btn-sm",
              onClick: () => i(!0),
              children: "Log first milestone",
            }),
          ],
        })
      : e.jsxs("div", {
          className: "thread",
          children: [
            e.jsxs("div", {
              className: "thread-head",
              children: [
                e.jsxs("div", {
                  children: [
                    e.jsxs("div", {
                      className: "h-eyebrow",
                      children: [
                        "Progress thread · ",
                        s.length,
                        " milestone",
                        s.length !== 1 ? "s" : "",
                      ],
                    }),
                    e.jsx("div", {
                      className: "thread-title serif",
                      children: "Where this topic has been.",
                    }),
                  ],
                }),
                e.jsx("button", {
                  className: "btn btn-sm",
                  onClick: () => i(!0),
                  disabled: l,
                  children: "＋ Log milestone",
                }),
              ],
            }),
            l &&
              e.jsxs("div", {
                className: "milestone milestone-draft",
                children: [
                  e.jsx("div", {
                    className: "milestone-marker",
                    "data-draft": "true",
                  }),
                  e.jsxs("div", {
                    className: "milestone-body",
                    children: [
                      e.jsx("input", {
                        className: "field-input",
                        placeholder: "Title — e.g. 'Bathtub model clicked'",
                        value: n.title,
                        onChange: (p) => o({ ...n, title: p.target.value }),
                        autoFocus: !0,
                      }),
                      e.jsxs("div", {
                        className: "milestone-grid",
                        children: [
                          e.jsx("textarea", {
                            className: "field-textarea",
                            rows: 2,
                            placeholder: "What advanced? (the progress)",
                            value: n.progress,
                            onChange: (p) =>
                              o({ ...n, progress: p.target.value }),
                          }),
                          e.jsx("input", {
                            className: "field-input",
                            placeholder:
                              "Where exactly? (page, file, line, bar…)",
                            value: n.where,
                            onChange: (p) => o({ ...n, where: p.target.value }),
                          }),
                        ],
                      }),
                      e.jsx("textarea", {
                        className: "field-textarea",
                        rows: 2,
                        placeholder:
                          "Why this turn / what clicked? (the insight that earned this milestone)",
                        value: n.insight,
                        onChange: (p) => o({ ...n, insight: p.target.value }),
                      }),
                      g &&
                        e.jsx("div", {
                          style: { fontSize: 12, color: "var(--accent)" },
                          children: g,
                        }),
                      e.jsxs("div", {
                        style: { display: "flex", gap: 8, marginTop: 4 },
                        children: [
                          e.jsx("button", {
                            className: "btn btn-primary btn-sm",
                            onClick: x,
                            disabled: !n.title.trim() || r,
                            children: r ? "Saving…" : "Save milestone",
                          }),
                          e.jsx("button", {
                            className: "btn btn-ghost btn-sm",
                            onClick: v,
                            children: "Cancel",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            e.jsx("div", {
              className: "thread-list",
              children: s.map((p, f) =>
                e.jsxs(
                  "div",
                  {
                    className: "milestone",
                    children: [
                      e.jsx("div", {
                        className: "milestone-marker",
                        "data-latest": f === 0 ? "true" : "false",
                      }),
                      e.jsxs("div", {
                        className: "milestone-body",
                        children: [
                          e.jsxs("div", {
                            className: "milestone-head",
                            children: [
                              e.jsx("span", {
                                className: "milestone-title serif",
                                children: p.title,
                              }),
                              e.jsx("span", {
                                className: "milestone-when mono",
                                children: Ct(p.capturedAt),
                              }),
                            ],
                          }),
                          p.progress &&
                            e.jsx("div", {
                              className: "milestone-progress",
                              children: p.progress,
                            }),
                          (p.where || p.tags?.length || p.energy != null) &&
                            e.jsxs("div", {
                              className: "milestone-meta",
                              children: [
                                p.where &&
                                  e.jsxs("span", {
                                    children: [
                                      e.jsx("strong", { children: "where" }),
                                      " ",
                                      p.where,
                                    ],
                                  }),
                                (p.tags?.length || p.energy != null) &&
                                  e.jsxs("span", {
                                    children: [
                                      e.jsx("strong", { children: "state" }),
                                      " ",
                                      Et(p),
                                    ],
                                  }),
                              ],
                            }),
                          p.insight &&
                            e.jsx("div", {
                              className: "milestone-insight",
                              children: p.insight,
                            }),
                        ],
                      }),
                    ],
                  },
                  p.id,
                ),
              ),
            }),
          ],
        });
}
const At = 50;
function Mt(t) {
  return t
    ? typeof t.toDate == "function"
      ? t.toDate()
      : typeof t == "string" || t instanceof Date
        ? new Date(t)
        : null
    : null;
}
function It(t) {
  const { user: s } = I(),
    [a, l] = d.useState([]),
    [i, n] = d.useState(!0),
    [o, r] = d.useState(null);
  return (
    d.useEffect(() => {
      if (!s || !t) {
        (l([]), n(!1));
        return;
      }
      n(!0);
      const m = X(
        Q(R, "users", s.uid, "events"),
        Ue("taskId", "==", t),
        Ne("capturedAt", "desc"),
        we(At),
      );
      return P(
        m,
        (u) => {
          (l(
            u.docs.map((h) => {
              const j = h.data();
              return { ...j, capturedAt: Mt(j.capturedAt) };
            }),
          ),
            n(!1),
            r(null));
        },
        (u) => {
          (console.error("useTaskEvents subscription error:", u), r(u), n(!1));
        },
      );
    }, [s, t]),
    { events: a, loading: i, error: o }
  );
}
const Lt = {
  milestone: "milestone",
  drift: "drift",
  switch: "switch",
  checkin: "check-in",
};
function Z(t) {
  if (!t) return null;
  const s = new Date(t);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
}
function _t(t) {
  const s = Z(new Date()),
    a = Z(t);
  return a === s
    ? "Today"
    : s - a === 864e5
      ? "Yesterday"
      : new Date(a).toLocaleDateString(void 0, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
}
function $t({ event: t }) {
  const s = t.capturedAt
    ? new Date(t.capturedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  return e.jsxs("div", {
    style: {
      display: "flex",
      gap: 12,
      padding: "8px 0",
      borderTop: "1px solid var(--line-soft)",
    },
    children: [
      e.jsx("span", {
        style: {
          fontSize: 11,
          color: "var(--faint)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 56,
        },
        children: s,
      }),
      e.jsxs("div", {
        style: { flex: 1, minWidth: 0 },
        children: [
          e.jsxs("div", {
            style: {
              display: "flex",
              gap: 8,
              alignItems: "baseline",
              flexWrap: "wrap",
            },
            children: [
              e.jsx("span", {
                style: {
                  fontSize: 11,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                },
                children: Lt[t.type] || t.type,
              }),
              e.jsx("span", {
                style: { fontSize: 13, color: "var(--ink)" },
                children: t.title,
              }),
              t.mins != null &&
                e.jsxs("span", {
                  style: { fontSize: 11, color: "var(--faint)" },
                  children: ["· ", t.mins, "m"],
                }),
            ],
          }),
          (t.progress || t.where || t.insight) &&
            e.jsxs("div", {
              style: {
                fontSize: 12,
                color: "var(--muted)",
                marginTop: 2,
                lineHeight: 1.4,
              },
              children: [
                t.progress &&
                  e.jsxs("div", { children: ["progress · ", t.progress] }),
                t.where && e.jsxs("div", { children: ["where · ", t.where] }),
                t.insight &&
                  e.jsxs("div", { children: ["insight · ", t.insight] }),
              ],
            }),
          t.mood?.length > 0 || t.energy != null
            ? e.jsxs("div", {
                style: { fontSize: 11, color: "var(--faint)", marginTop: 2 },
                children: [
                  t.mood?.length > 0 && t.mood.join(", "),
                  t.energy != null &&
                    (t.mood?.length > 0 ? " · " : "") + `e${t.energy}`,
                ],
              })
            : null,
        ],
      }),
    ],
  });
}
function Pt({ taskId: t }) {
  const { events: s, loading: a, error: l } = It(t),
    i = d.useMemo(() => {
      const n = new Map();
      for (const o of s) {
        const r = Z(o.capturedAt);
        r != null && (n.has(r) || n.set(r, []), n.get(r).push(o));
      }
      return [...n.entries()].sort((o, r) => r[0] - o[0]);
    }, [s]);
  return a
    ? null
    : l
      ? e.jsx("p", {
          style: { fontSize: 12, color: "var(--accent)", marginTop: 16 },
          children: "Couldn't load activity history.",
        })
      : s.length === 0
        ? null
        : e.jsxs("div", {
            style: { marginTop: 28 },
            children: [
              e.jsx("div", {
                className: "h-eyebrow",
                style: { marginBottom: 8 },
                children: "Activity",
              }),
              e.jsx("div", {
                style: { display: "flex", flexDirection: "column", gap: 12 },
                children: i.map(([n, o]) =>
                  e.jsxs(
                    "div",
                    {
                      children: [
                        e.jsx("div", {
                          style: {
                            fontSize: 11,
                            color: "var(--muted)",
                            marginBottom: 2,
                          },
                          children: _t(n),
                        }),
                        e.jsx("div", {
                          children: o.map((r, m) =>
                            e.jsx($t, { event: r }, `${n}-${m}`),
                          ),
                        }),
                      ],
                    },
                    n,
                  ),
                ),
              }),
            ],
          });
}
function J(t = new Date()) {
  const s = t.getFullYear(),
    a = String(t.getMonth() + 1).padStart(2, "0"),
    l = String(t.getDate()).padStart(2, "0");
  return `${s}-${a}-${l}`;
}
function Ss() {
  const t = new Date();
  return (t.setDate(t.getDate() - 1), J(t));
}
function Rt() {
  const [t, s] = d.useState(() => J());
  return (
    d.useEffect(() => {
      let a;
      const l = () => {
        const i = new Date(),
          n = new Date(i.getFullYear(), i.getMonth(), i.getDate() + 1, 0, 0, 1);
        a = setTimeout(() => {
          (s(J()), l());
        }, n - i);
      };
      return (l(), () => clearTimeout(a));
    }, []),
    t
  );
}
function Ot(t) {
  const { user: s } = I(),
    [a, l] = d.useState(null),
    [i, n] = d.useState(!0),
    [o, r] = d.useState(null);
  return (
    d.useEffect(() => {
      if (!s || !t) {
        (l(null), n(!1));
        return;
      }
      n(!0);
      const m = ve(R, "users", s.uid, "dailyPlans", t);
      return P(
        m,
        (u) => {
          if (u.exists()) {
            const h = u.data();
            l({ date: t, taskIds: Array.isArray(h.taskIds) ? h.taskIds : [] });
          } else l({ date: t, taskIds: [] });
          (n(!1), r(null));
        },
        (u) => {
          (console.error("useDailyPlan subscription error:", u), r(u), n(!1));
        },
      );
    }, [s, t]),
    { plan: a, loading: i, error: o }
  );
}
const zt = 24 * 60 * 60,
  fe = {
    daily: "daily",
    weekly: "weekly",
    biweekly: "biweekly",
    loose: "loose",
    once: "once",
  };
function xe(t) {
  const s = new Date(t);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
}
function Me(t) {
  if (!t || !t.length) return 0;
  const s = xe(Date.now()),
    a = 864e5,
    l = [
      ...new Set(t.map((n) => xe(n.when)).filter((n) => Number.isFinite(n))),
    ].sort((n, o) => o - n);
  if (!l.length || s - l[0] > a) return 0;
  let i = 1;
  for (let n = 1; n < l.length && l[n - 1] - l[n] === a; n++) i++;
  return i;
}
const ee = { book: "Book", skill: "Skill", project: "Project", idle: "Idle" },
  te = {
    work: "work",
    learning: "learning",
    body: "body",
    social: "social",
    wealth: "wealth",
    music: "listen",
    craft: "craft",
    errand: "errand",
    drift: "drift",
  };
function V({ value: t, size: s = 5 }) {
  return t == null
    ? null
    : e.jsx("span", {
        className: "energy-dots",
        style: { gap: 2 },
        children: Array.from({ length: 5 }).map((a, l) =>
          e.jsx(
            "span",
            {
              className: "energy-dot",
              "data-on": l < t ? "true" : "false",
              style: { width: s, height: s, border: 0 },
            },
            l,
          ),
        ),
      });
}
function Ie(t, s, a) {
  const l = a?.tags || [],
    i = a?.energy ?? 3;
  return t
    .filter((n) => n.id !== s && !n.done && n.template !== "idle")
    .map((n) => {
      const o = (n.moods || []).filter((m) => l.includes(m)).length,
        r = 5 - Math.abs((n.energy ?? 3) - i);
      return { task: n, score: o * 3 + r };
    })
    .sort((n, o) => o.score - n.score);
}
function Le({ task: t, isBest: s, onPick: a }) {
  const l = te[t.kind] || ee[t.template] || "Task",
    i = t.moods?.slice(0, 2) || [];
  return e.jsxs("div", {
    className: "up-next-card",
    onClick: () => a(t.id),
    children: [
      e.jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        children: [
          e.jsx("span", { className: "up-next-kind", children: l }),
          s &&
            e.jsx("span", {
              className: "up-next-match",
              children: "best match",
            }),
        ],
      }),
      e.jsx("div", { className: "up-next-title", children: t.title }),
      (t.energy != null || i.length > 0) &&
        e.jsxs("div", {
          className: "up-next-foot",
          children: [
            e.jsx(V, { value: t.energy }),
            i.length > 0 && e.jsxs("span", { children: ["· ", i.join(", ")] }),
          ],
        }),
    ],
  });
}
function Ft(t, s) {
  const a = t.lastMoodAtSwitch || (t.moods ? t.moods.slice(0, 1) : []),
    l = t.lastEnergyAtSwitch ?? t.energy ?? null,
    i = s?.tags || [],
    n = s?.energy ?? null;
  if (l == null || n == null) return null;
  const o = i.filter((m) => a.includes(m)).length,
    r = n - l;
  return o > 0 && Math.abs(r) <= 1
    ? {
        kind: "match",
        text: "Your mental state matches where you left off. Easy re-entry.",
        leftMoods: a,
        leftEnergy: l,
        currentTags: i,
        currentEnergy: n,
      }
    : r >= 2
      ? {
          kind: "warmer",
          text: "You're more energized than when you left. Good — push the hard part.",
          leftMoods: a,
          leftEnergy: l,
          currentTags: i,
          currentEnergy: n,
        }
      : r <= -2
        ? {
            kind: "cooler",
            text: "You're lower-energy than when you left. Re-enter gently, re-read your note first.",
            leftMoods: a,
            leftEnergy: l,
            currentTags: i,
            currentEnergy: n,
          }
        : o === 0
          ? {
              kind: "shift",
              text: "Different headspace than when you left. Spend a minute on the breadcrumb before diving in.",
              leftMoods: a,
              leftEnergy: l,
              currentTags: i,
              currentEnergy: n,
            }
          : {
              kind: "ok",
              text: "Close enough. Open the breadcrumb and step in.",
              leftMoods: a,
              leftEnergy: l,
              currentTags: i,
              currentEnergy: n,
            };
}
function Bt({ task: t }) {
  if (!t.template) return null;
  const s = ee[t.template] || t.template;
  let a = "";
  if (t.template === "book" && t.book)
    a = `${t.book.chapters?.filter((i) => i.status === "done").length || 0}/${t.book.chapters?.length || 0} ch`;
  else if (t.template === "skill" && t.skill) {
    const l = Me(t.skill.recent || []);
    a = `${l} ${l === 1 ? "day" : "days"}`;
  } else
    t.template === "project" &&
      t.project &&
      (a = `${t.project.phases?.filter((i) => i.status === "done").length || 0}/${t.project.phases?.length || 0} phases`);
  return e.jsxs("span", {
    className: "template-badge",
    children: [
      e.jsx("span", { className: "template-badge-label", children: s }),
      a &&
        e.jsx("span", { className: "template-badge-detail mono", children: a }),
    ],
  });
}
function Vt({ task: t }) {
  return t.cadence
    ? e.jsxs("span", {
        className: "cadence-badge",
        title: `${fe[t.cadence] || t.cadence} cadence`,
        children: [
          e.jsx("span", { className: "cadence-dot" }),
          e.jsx("span", {
            className: "cadence-label",
            children: fe[t.cadence] || t.cadence,
          }),
        ],
      })
    : null;
}
function Wt({ verdict: t }) {
  return t
    ? e.jsxs(e.Fragment, {
        children: [
          e.jsxs("div", {
            className: `match-row match-row-${t.kind}`,
            children: [
              e.jsxs("div", {
                className: "match-side",
                children: [
                  e.jsx("span", {
                    className: "match-side-label",
                    children: "When you left",
                  }),
                  e.jsxs("div", {
                    className: "match-side-content",
                    children: [
                      e.jsx(V, { value: t.leftEnergy, size: 6 }),
                      e.jsxs("span", {
                        children: ["· ", t.leftMoods.join(", ") || "—"],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsx("div", { className: "match-arrow", children: "→" }),
              e.jsxs("div", {
                className: "match-side",
                children: [
                  e.jsx("span", {
                    className: "match-side-label",
                    children: "Now",
                  }),
                  e.jsxs("div", {
                    className: "match-side-content",
                    children: [
                      e.jsx(V, { value: t.currentEnergy, size: 6 }),
                      e.jsxs("span", {
                        children: ["· ", t.currentTags.join(", ") || "—"],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx("div", {
            className: `match-verdict match-verdict-${t.kind}`,
            children: t.text,
          }),
        ],
      })
    : null;
}
function Kt(t) {
  if (!t) return null;
  if (typeof t.toMillis == "function") return t.toMillis();
  if (t.seconds != null) return t.seconds * 1e3;
  const s = Date.parse(t);
  return Number.isFinite(s) ? s : null;
}
function Yt() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}
function qt(t) {
  const s = Kt(t.lastTouched);
  return s != null && s >= Yt();
}
function Ht({ tasks: t, plan: s, onSetActive: a, onGoToToday: l }) {
  if (!s || s.taskIds.length === 0) return null;
  const i = new Map(t.map((o) => [o.id, o])),
    n = s.taskIds.map((o) => i.get(o)).filter((o) => o && !o.done);
  return n.length === 0
    ? null
    : e.jsxs("div", {
        style: { marginBottom: 28 },
        children: [
          e.jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            },
            children: [
              e.jsxs("div", {
                className: "h-eyebrow",
                children: ["Today's plan · ", n.length],
              }),
              l &&
                e.jsx("button", {
                  className: "btn btn-sm btn-ghost",
                  onClick: l,
                  children: "Edit plan →",
                }),
            ],
          }),
          e.jsx("div", {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 8,
            },
            children: n.map((o, r) => {
              const m = qt(o);
              return e.jsxs(
                "button",
                {
                  onClick: () => a(o.id),
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    background: m ? "var(--panel-2)" : "var(--panel)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    textAlign: "left",
                  },
                  children: [
                    e.jsx("span", {
                      style: {
                        fontSize: 11,
                        color: "var(--faint)",
                        fontVariantNumeric: "tabular-nums",
                        width: 18,
                      },
                      children: String(r + 1).padStart(2, "0"),
                    }),
                    e.jsxs("span", {
                      style: {
                        flex: 1,
                        fontSize: 14,
                        textDecoration: m ? "line-through" : "none",
                        color: m ? "var(--muted)" : "var(--ink)",
                      },
                      children: [
                        m &&
                          e.jsx("span", {
                            style: { marginRight: 6, fontSize: 12 },
                            children: "✓",
                          }),
                        o.title,
                        o.template &&
                          e.jsx("span", {
                            className: "task-template-pill",
                            style: { marginLeft: 6 },
                            children: o.template,
                          }),
                      ],
                    }),
                    e.jsx("span", {
                      className: "btn btn-sm",
                      style: { pointerEvents: "none" },
                      children: "Start",
                    }),
                  ],
                },
                o.id,
              );
            }),
          }),
        ],
      });
}
function Ut({ tasks: t, currentMood: s, onSetActive: a, onGoToToday: l }) {
  const i = Rt(),
    { plan: n } = Ot(i),
    o = d.useMemo(() => {
      const m = new Set(n?.taskIds || []);
      return Ie(t, null, s)
        .filter(({ task: g }) => !m.has(g.id))
        .slice(0, 6);
    }, [t, s, n]),
    r = (n?.taskIds || []).some((m) => t.find((g) => g.id === m && !g.done));
  return e.jsxs("div", {
    className: "now-empty",
    children: [
      e.jsx("div", { className: "h-eyebrow", children: "Nothing in flight" }),
      e.jsx("h1", {
        className: "h-display serif",
        children: "What feels right, right now?",
      }),
      e.jsx("p", {
        className: "h-section",
        style: { maxWidth: 480, color: "var(--muted)" },
        children: r
          ? "Start with your plan below, or pick a mood-matched alternative."
          : o.length === 0
            ? "No open tasks yet. Create one from the Tasks view to get started."
            : `${o.length} task${o.length === 1 ? "" : "s"} below, ranked by how well they fit your mood and energy. Pick one. The rest will wait.`,
      }),
      e.jsx(Ht, { tasks: t, plan: n, onSetActive: a, onGoToToday: l }),
      o.length > 0 &&
        e.jsxs(e.Fragment, {
          children: [
            r &&
              e.jsx("div", {
                className: "h-eyebrow",
                style: { marginTop: 8 },
                children: "If not — mood-matched picks",
              }),
            e.jsx("div", {
              className: "up-next-grid",
              style: { marginTop: r ? 12 : 28 },
              children: o.map(({ task: m }, g) =>
                e.jsx(Le, { task: m, isBest: g === 0 && !r, onPick: a }, m.id),
              ),
            }),
          ],
        }),
    ],
  });
}
function Gt({ task: t }) {
  const [s, a] = d.useState(0),
    [l, i] = d.useState(""),
    [n, o] = d.useState(!1),
    [r, m] = d.useState(null),
    g = t.idle?.lastDrifts || [];
  d.useEffect(() => {
    a(0);
    const x = setInterval(() => a((v) => (v >= zt ? v : v + 1)), 1e3);
    return () => clearInterval(x);
  }, [t.id]);
  const u = Math.floor(s / 60),
    h = s % 60,
    j = async () => {
      if (!n) {
        (o(!0), m(null));
        try {
          (await T("/actions", {
            method: "POST",
            body: {
              action: {
                type: "end_drift",
                taskId: t.id,
                mins: Math.max(1, u),
                note: l,
              },
            },
          }),
            i(""),
            a(0));
        } catch (x) {
          m(x?.body?.detail || x?.message || "Failed to log drift");
        } finally {
          o(!1);
        }
      }
    };
  return e.jsxs("div", {
    className: "tpl tpl-idle",
    children: [
      e.jsxs("div", {
        className: "idle-pad",
        children: [
          e.jsx("div", { className: "idle-label", children: "drifting" }),
          e.jsxs("div", {
            className: "idle-timer serif",
            children: [
              u,
              e.jsx("span", { className: "idle-timer-sep", children: ":" }),
              h.toString().padStart(2, "0"),
            ],
          }),
          e.jsx("div", {
            className: "idle-sub",
            children:
              "It's ok to be here. Mind is keeping the time so you don't have to.",
          }),
          e.jsx("textarea", {
            className: "field-textarea",
            rows: 2,
            placeholder: "Anything to note when you're back? (optional)",
            value: l,
            onChange: (x) => i(x.target.value),
            style: { maxWidth: 420, margin: "20px auto 0", display: "block" },
          }),
          e.jsx("div", {
            style: {
              marginTop: 16,
              display: "flex",
              gap: 8,
              justifyContent: "center",
            },
            children: e.jsx("button", {
              className: "btn btn-primary",
              onClick: j,
              disabled: n,
              children: n ? "Logging…" : "Done drifting",
            }),
          }),
          r &&
            e.jsx("p", {
              style: {
                fontSize: 12,
                color: "var(--accent)",
                textAlign: "center",
                marginTop: 8,
              },
              children: r,
            }),
        ],
      }),
      g.length > 0 &&
        e.jsxs(e.Fragment, {
          children: [
            e.jsx("div", {
              className: "tpl-list-label",
              style: { marginTop: 24 },
              children: "Recent drifts",
            }),
            e.jsx("div", {
              className: "recent-list",
              children: g.map((x, v) =>
                e.jsxs(
                  "div",
                  {
                    className: "recent-row",
                    children: [
                      e.jsx("span", {
                        className: "recent-when mono",
                        children: x.when
                          ? new Date(x.when).toLocaleDateString()
                          : "—",
                      }),
                      e.jsxs("div", {
                        className: "recent-body",
                        children: [
                          x.mood?.length > 0 &&
                            e.jsx("span", {
                              className: "recent-drill",
                              children: x.mood.join(", "),
                            }),
                          e.jsxs("span", {
                            className: "recent-note",
                            children: [
                              x.mins,
                              "m",
                              x.note ? ` · ${x.note}` : "",
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  v,
                ),
              ),
            }),
          ],
        }),
    ],
  });
}
function Zt({ task: t }) {
  const [s, a] = d.useState(!1),
    [l, i] = d.useState({ drill: "", note: "" }),
    [n, o] = d.useState(null),
    [r, m] = d.useState(!1),
    g = O(),
    u = t.skill?.drills || [],
    h = t.skill?.recent || [],
    j = Me(h),
    x = u.length ? u.reduce((y, c) => y + (c.level || 0), 0) / u.length : 0,
    v = (y) =>
      T("/actions", {
        method: "POST",
        body: { action: { ...y, taskId: t.id } },
      }),
    p = (y, c) =>
      v({ type: "level_drill", drillId: y, level: c })
        .then((w) => g(w?.celebration))
        .catch((w) => o(w?.body?.detail || w?.message)),
    f = async () => {
      if (!(!l.note.trim() || s)) {
        (a(!0), o(null));
        try {
          const y = await v({
            type: "log_skill_session",
            drill: l.drill,
            note: l.note,
          });
          (g(y?.celebration), i({ drill: "", note: "" }), m(!1));
        } catch (y) {
          o(y?.body?.detail || y?.message || "Failed to log session");
        } finally {
          a(!1);
        }
      }
    };
  return e.jsxs("div", {
    className: "tpl tpl-skill",
    children: [
      e.jsxs("div", {
        className: "tpl-summary",
        children: [
          e.jsxs("div", {
            children: [
              e.jsx("div", {
                className: "tpl-summary-label",
                children: "Streak",
              }),
              e.jsxs("div", {
                className: "tpl-summary-title serif",
                children: [
                  j,
                  " ",
                  e.jsx("span", {
                    style: { fontSize: 18, color: "var(--muted)" },
                    children: j === 1 ? "day" : "days",
                  }),
                ],
              }),
              e.jsx("div", {
                className: "tpl-summary-note",
                children: h[0]?.when
                  ? `Last session — ${new Date(h[0].when).toLocaleDateString()}.`
                  : "No sessions logged yet.",
              }),
            ],
          }),
          e.jsx("div", {
            className: "tpl-progress",
            children: e.jsxs("div", {
              className: "tpl-progress-meta",
              children: [
                e.jsxs("span", {
                  className: "serif",
                  style: { fontSize: 32, lineHeight: 1 },
                  children: [
                    x.toFixed(1),
                    e.jsx("span", {
                      style: { fontSize: 18, color: "var(--muted)" },
                      children: " / 5",
                    }),
                  ],
                }),
                e.jsx("span", {
                  className: "tpl-progress-label",
                  children: "avg mastery",
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx("div", {
        className: "tpl-list-label",
        children: "Drills · click any dot to set mastery",
      }),
      e.jsxs("div", {
        className: "drill-grid",
        children: [
          u.map((y) =>
            e.jsxs(
              "div",
              {
                className: "drill-row",
                "data-maxed": y.level === 5 ? "true" : "false",
                children: [
                  e.jsx("span", {
                    className: "drill-label",
                    children: y.label,
                  }),
                  e.jsx("span", {
                    className: "drill-dots",
                    children: Array.from({ length: 5 }).map((c, w) =>
                      e.jsx(
                        "span",
                        {
                          className: "drill-dot",
                          "data-on": w < y.level ? "true" : "false",
                          onClick: () => p(y.id, w + 1 === y.level ? w : w + 1),
                        },
                        w,
                      ),
                    ),
                  }),
                  e.jsxs(
                    "span",
                    {
                      className: "drill-level mono",
                      children: [y.level, "/5"],
                    },
                    y.level,
                  ),
                ],
              },
              y.id,
            ),
          ),
          u.length === 0 &&
            e.jsx("div", {
              style: {
                padding: "10px 0",
                color: "var(--faint)",
                fontSize: 13,
                fontStyle: "italic",
              },
              children: "No drills added.",
            }),
        ],
      }),
      e.jsxs("div", {
        className: "tpl-list-label",
        style: { marginTop: 18 },
        children: [
          e.jsx("span", { children: "Recent sessions" }),
          e.jsx("button", {
            className: "btn btn-sm",
            onClick: () => m(!0),
            disabled: r,
            children: "＋ Log session",
          }),
        ],
      }),
      r &&
        e.jsxs("div", {
          className: "session-draft",
          children: [
            e.jsxs("select", {
              className: "field-input",
              value: l.drill,
              onChange: (y) => i({ ...l, drill: y.target.value }),
              style: { maxWidth: 220 },
              children: [
                e.jsx("option", {
                  value: "",
                  children: "— pick a drill (optional) —",
                }),
                u.map((y) =>
                  e.jsx("option", { value: y.label, children: y.label }, y.id),
                ),
              ],
            }),
            e.jsx("textarea", {
              className: "field-textarea",
              rows: 2,
              placeholder:
                "What you did — distance, reps, what felt off, what felt strong.",
              value: l.note,
              onChange: (y) => i({ ...l, note: y.target.value }),
              autoFocus: !0,
            }),
            n &&
              e.jsx("div", {
                style: { fontSize: 12, color: "var(--accent)" },
                children: n,
              }),
            e.jsxs("div", {
              style: { display: "flex", gap: 8 },
              children: [
                e.jsx("button", {
                  className: "btn btn-primary btn-sm",
                  onClick: f,
                  disabled: !l.note.trim() || s,
                  children: s ? "Saving…" : "Save session",
                }),
                e.jsx("button", {
                  className: "btn btn-ghost btn-sm",
                  onClick: () => {
                    (m(!1), o(null));
                  },
                  children: "Cancel",
                }),
              ],
            }),
          ],
        }),
      !r &&
        n &&
        e.jsx("p", {
          style: { fontSize: 12, color: "var(--accent)" },
          children: n,
        }),
      e.jsx("div", {
        className: "recent-list",
        children: h.map((y, c) =>
          e.jsxs(
            "div",
            {
              className: "recent-row",
              children: [
                e.jsx("span", {
                  className: "recent-when mono",
                  children: y.when
                    ? new Date(y.when).toLocaleDateString()
                    : "—",
                }),
                e.jsxs("div", {
                  className: "recent-body",
                  children: [
                    y.drill &&
                      e.jsx("span", {
                        className: "recent-drill",
                        children: y.drill,
                      }),
                    y.note &&
                      e.jsx("span", {
                        className: "recent-note",
                        children: y.note,
                      }),
                  ],
                }),
              ],
            },
            c,
          ),
        ),
      }),
    ],
  });
}
function Jt({ task: t }) {
  const s = t.project?.phases || [],
    a = s.find((h) => h.status === "doing"),
    l = s.filter((h) => h.status === "done").length,
    [i, n] = d.useState(null),
    o = O(),
    r = (h) =>
      T("/actions", {
        method: "POST",
        body: { action: { ...h, taskId: t.id } },
      }),
    m = (h, j) =>
      r({ type: "toggle_subtask", phaseId: h, subId: j }).catch((x) =>
        n(x?.body?.detail || x?.message),
      ),
    g = async (h) => {
      try {
        const j = await r({ type: "advance_phase", phaseId: h });
        o(j?.celebration, {
          title: t.title,
          recap: `${s.length} phase${s.length === 1 ? "" : "s"} done`,
        });
      } catch (j) {
        n(j?.body?.detail || j?.message);
      }
    },
    u = s.findIndex((h) => h.status === "doing");
  return e.jsxs("div", {
    className: "tpl tpl-project",
    children: [
      e.jsxs("div", {
        className: "tpl-summary",
        children: [
          e.jsxs("div", {
            children: [
              e.jsx("div", {
                className: "tpl-summary-label",
                children:
                  u >= 0
                    ? `Current phase · ${u + 1} of ${s.length}`
                    : "Current phase",
              }),
              e.jsx("div", {
                className: "tpl-summary-title serif",
                children: a?.title || "—",
              }),
              e.jsx("div", {
                className: "tpl-summary-note",
                children: a
                  ? `${a.subs.filter((h) => h.done).length} / ${a.subs.length} subtasks done`
                  : "",
              }),
            ],
          }),
          e.jsx("div", {
            className: "tpl-progress",
            children: e.jsxs("div", {
              className: "tpl-progress-meta",
              children: [
                e.jsxs("span", {
                  className: "serif",
                  style: { fontSize: 32, lineHeight: 1 },
                  children: [
                    l,
                    e.jsxs("span", {
                      style: { fontSize: 18, color: "var(--muted)" },
                      children: [" / ", s.length],
                    }),
                  ],
                }),
                e.jsx("span", {
                  className: "tpl-progress-label",
                  children: "phases",
                }),
              ],
            }),
          }),
        ],
      }),
      s.length > 0 &&
        e.jsx(
          "div",
          {
            className: "phase-bar",
            children: s.map((h, j) =>
              e.jsxs(
                "div",
                {
                  className: "phase-pill",
                  "data-status": h.status,
                  children: [
                    e.jsx("span", {
                      className: "phase-pill-num mono",
                      children: j + 1,
                    }),
                    e.jsx("span", {
                      className: "phase-pill-title",
                      children: h.title,
                    }),
                    e.jsxs("span", {
                      className: "phase-pill-count mono",
                      children: [
                        h.subs.filter((x) => x.done).length,
                        "/",
                        h.subs.length,
                      ],
                    }),
                  ],
                },
                h.id,
              ),
            ),
          },
          `phases-${l}`,
        ),
      a &&
        e.jsxs("div", {
          className: "context-card",
          style: { marginTop: 16, marginBottom: 20 },
          children: [
            e.jsxs("div", {
              className: "context-card-label",
              children: [a.title, " — subtasks"],
            }),
            e.jsxs("div", {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 12,
              },
              children: [
                a.subs.map((h) =>
                  e.jsxs(
                    "label",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--ink)",
                      },
                      children: [
                        e.jsx("input", {
                          type: "checkbox",
                          checked: h.done,
                          onChange: () => m(a.id, h.id),
                          style: { width: 16, height: 16 },
                        }),
                        e.jsx("span", {
                          style: {
                            textDecoration: h.done ? "line-through" : "none",
                            color: h.done ? "var(--faint)" : "var(--ink)",
                          },
                          children: h.label,
                        }),
                      ],
                    },
                    h.id,
                  ),
                ),
                a.subs.length === 0 &&
                  e.jsx("div", {
                    style: {
                      fontSize: 13,
                      color: "var(--faint)",
                      fontStyle: "italic",
                    },
                    children: "No subtasks.",
                  }),
              ],
            }),
            e.jsx("button", {
              className: "btn btn-primary",
              onClick: () => g(a.id),
              children: "Advance phase →",
            }),
          ],
        }),
      s.length === 0 &&
        e.jsx("div", {
          style: {
            padding: "12px 0",
            color: "var(--faint)",
            fontSize: 13,
            fontStyle: "italic",
          },
          children: "No phases added.",
        }),
      i &&
        e.jsx("p", {
          style: { fontSize: 12, color: "var(--accent)", marginTop: 12 },
          children: i,
        }),
    ],
  });
}
function Qt({ task: t }) {
  const [s, a] = d.useState(null),
    [l, i] = d.useState(""),
    [n, o] = d.useState(null),
    r = O(),
    m = t.book?.chapters || [],
    g = m.findIndex((b) => b.status === "reading"),
    u = g >= 0 ? m[g] : null,
    h = m.filter((b) => b.status === "done").length,
    j = m.reduce((b, N) => b + (N.progress || 0), 0) / Math.max(1, m.length),
    x = (b) =>
      T("/actions", {
        method: "POST",
        body: { action: { ...b, taskId: t.id } },
      }),
    v = (b) => b.catch((N) => o(N?.body?.detail || N?.message)),
    p = (b) => v(x({ type: "set_reading_chapter", chapterId: b })),
    f = async (b) => {
      try {
        const N = await x({
          type: "mark_chapter",
          chapterId: b,
          status: "done",
        });
        r(N?.celebration, {
          title: t.title,
          recap: `${m.length} chapter${m.length === 1 ? "" : "s"}`,
        });
      } catch (N) {
        o(N?.body?.detail || N?.message);
      }
    },
    y = (b) => v(x({ type: "mark_chapter", chapterId: b, status: "unread" })),
    c = (b) => {
      (a(b.id), i(b.note || ""));
    },
    w = async () => {
      try {
        (await x({ type: "update_chapter_note", chapterId: s, note: l }),
          a(null),
          i(""));
      } catch (b) {
        o(b?.body?.detail || b?.message);
      }
    },
    S = () => {
      const b = m.filter((k) => k.status !== "done");
      if (!b.length) return;
      const N = b[Math.floor(Math.random() * b.length)];
      p(N.id);
    };
  return e.jsxs("div", {
    className: "tpl tpl-book",
    children: [
      e.jsxs("div", {
        className: "tpl-summary",
        children: [
          e.jsxs("div", {
            children: [
              e.jsx("div", {
                className: "tpl-summary-label",
                children: u ? "Currently reading" : "Pick a chapter",
              }),
              e.jsx("div", {
                className: "tpl-summary-title serif",
                children: u
                  ? e.jsxs(e.Fragment, {
                      children: ["Ch", g + 1, " · ", u.title],
                    })
                  : "—",
              }),
              u?.note &&
                e.jsxs("div", {
                  className: "tpl-summary-note serif",
                  style: { fontStyle: "italic" },
                  children: ['"', u.note, '"'],
                }),
            ],
          }),
          e.jsxs("div", {
            className: "tpl-progress",
            children: [
              e.jsxs("div", {
                className: "tpl-progress-meta",
                children: [
                  e.jsxs("span", {
                    className: "serif",
                    style: { fontSize: 32, lineHeight: 1 },
                    children: [
                      h,
                      e.jsxs("span", {
                        style: { fontSize: 18, color: "var(--muted)" },
                        children: [" / ", m.length],
                      }),
                    ],
                  }),
                  e.jsx("span", {
                    className: "tpl-progress-label",
                    children: "chapters",
                  }),
                ],
              }),
              e.jsx("div", {
                className: "tpl-progress-bar",
                children: e.jsx(
                  "span",
                  { style: { width: `${j}%` } },
                  `bookprog-${h}`,
                ),
              }),
              e.jsxs("div", {
                className: "tpl-progress-sub mono",
                children: [j.toFixed(0), "% complete"],
              }),
            ],
          }),
        ],
      }),
      e.jsxs("div", {
        className: "tpl-list-label",
        children: [
          e.jsx("span", {
            children: "Chapters — click any to read in any order",
          }),
          m.some((b) => b.status !== "done") &&
            e.jsx("button", {
              className: "btn btn-sm btn-ghost",
              onClick: S,
              children: "↻ Random chapter",
            }),
        ],
      }),
      e.jsx("div", {
        className: "chapter-list",
        children: m.map((b, N) =>
          e.jsxs(
            "div",
            {
              className: "chapter-row",
              "data-status": b.status,
              children: [
                e.jsxs("div", {
                  className: "chapter-main",
                  onClick: () => p(b.id),
                  children: [
                    e.jsx("span", {
                      className: "chapter-num mono",
                      children: (N + 1).toString().padStart(2, "0"),
                    }),
                    e.jsxs("div", {
                      className: "chapter-body",
                      children: [
                        e.jsx("span", {
                          className: "chapter-title",
                          children: b.title,
                        }),
                        b.note &&
                          b.status !== "unread" &&
                          s !== b.id &&
                          e.jsx("span", {
                            className: "chapter-note",
                            children: b.note,
                          }),
                      ],
                    }),
                    e.jsx("span", {
                      className: "chapter-bar",
                      children: e.jsx("span", {
                        style: {
                          width: `${b.progress || 0}%`,
                          background:
                            b.status === "done"
                              ? "var(--ink-2)"
                              : "var(--accent)",
                        },
                      }),
                    }),
                    e.jsx("span", {
                      className: "chapter-status-icon",
                      "data-status": b.status,
                      title: b.status,
                      children:
                        b.status === "done"
                          ? "✓"
                          : b.status === "reading"
                            ? "◐"
                            : "○",
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className: "chapter-actions",
                  children: [
                    e.jsx("button", {
                      className: "btn btn-sm btn-ghost",
                      onClick: (k) => {
                        (k.stopPropagation(), c(b));
                      },
                      children: "note",
                    }),
                    b.status !== "done" &&
                      e.jsx("button", {
                        className: "btn btn-sm btn-ghost",
                        onClick: (k) => {
                          (k.stopPropagation(), f(b.id));
                        },
                        children: "✓ done",
                      }),
                    b.status === "done" &&
                      e.jsx("button", {
                        className: "btn btn-sm btn-ghost",
                        onClick: (k) => {
                          (k.stopPropagation(), y(b.id));
                        },
                        children: "↶ undo",
                      }),
                  ],
                }),
                s === b.id &&
                  e.jsxs("div", {
                    className: "chapter-edit",
                    children: [
                      e.jsx("textarea", {
                        className: "field-textarea",
                        autoFocus: !0,
                        rows: 2,
                        value: l,
                        onChange: (k) => i(k.target.value),
                        placeholder:
                          "What clicked in this chapter? Page numbers, margin notes…",
                      }),
                      e.jsxs("div", {
                        style: { display: "flex", gap: 8 },
                        children: [
                          e.jsx("button", {
                            className: "btn btn-primary btn-sm",
                            onClick: w,
                            children: "Save note",
                          }),
                          e.jsx("button", {
                            className: "btn btn-ghost btn-sm",
                            onClick: () => a(null),
                            children: "Cancel",
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            },
            b.id,
          ),
        ),
      }),
      n &&
        e.jsx("p", {
          style: { fontSize: 12, color: "var(--accent)", marginTop: 12 },
          children: n,
        }),
    ],
  });
}
function Xt({
  tasks: t,
  activeTaskId: s,
  currentMood: a,
  isMobile: l,
  onSetActive: i,
  onEdit: n,
  onGoToToday: o,
}) {
  const r = t.find((c) => c.id === s && !c.done),
    [m, g] = d.useState(!1),
    [u, h] = d.useState(!1),
    [j, x] = d.useState(null),
    v = O(),
    p = d.useMemo(() => (r ? Ie(t, r.id, a).slice(0, 3) : []), [t, r?.id, a]),
    f = async () => {
      if (!(!r || m)) {
        (g(!0), x(null));
        try {
          const c = await T("/actions", {
              method: "POST",
              body: { action: { type: "complete", taskId: r.id } },
            }),
            w = r.id;
          v(c?.celebration, {
            title: r.title,
            onUndo: () =>
              T("/actions", {
                method: "POST",
                body: { action: { type: "complete", taskId: w } },
              }).catch(() => {}),
          });
        } catch (c) {
          x(c?.body?.detail || c?.message || "Failed to complete");
        } finally {
          g(!1);
        }
      }
    };
  if (!r)
    return e.jsx(Ut, {
      tasks: t,
      currentMood: a,
      onSetActive: i,
      onGoToToday: o,
    });
  const y = r.template === "idle" ? null : Ft(r, a);
  return e.jsxs("div", {
    children: [
      e.jsxs(
        "div",
        {
          className: "resume-card",
          children: [
            e.jsxs("div", {
              className: "h-eyebrow",
              children: [
                "In flight",
                r.kind ? ` · ${te[r.kind] || r.kind}` : "",
              ],
            }),
            e.jsx("h1", { className: "resume-title serif", children: r.title }),
            (r.template || r.cadence || r.energy != null) &&
              e.jsxs("div", {
                className: "resume-meta",
                children: [
                  r.energy != null &&
                    e.jsxs(e.Fragment, {
                      children: [
                        e.jsx(V, { value: r.energy, size: 7 }),
                        e.jsx("span", {
                          style: { marginLeft: -4 },
                          children: "energy needed",
                        }),
                      ],
                    }),
                  r.moods?.length > 0 &&
                    e.jsxs(e.Fragment, {
                      children: [
                        e.jsx("span", { className: "meta-dot" }),
                        e.jsx("span", { children: r.moods.join(" · ") }),
                      ],
                    }),
                  r.template &&
                    e.jsxs(e.Fragment, {
                      children: [
                        e.jsx("span", { className: "meta-dot" }),
                        e.jsx(Bt, { task: r }),
                      ],
                    }),
                  r.cadence &&
                    e.jsxs(e.Fragment, {
                      children: [
                        e.jsx("span", { className: "meta-dot" }),
                        e.jsx(Vt, { task: r }),
                      ],
                    }),
                ],
              }),
            e.jsx(Wt, { verdict: y }),
            r.template === "idle"
              ? e.jsx(Gt, { task: r })
              : r.template === "project"
                ? e.jsx(Jt, { task: r })
                : r.template === "skill"
                  ? e.jsx(Zt, { task: r })
                  : r.template === "book"
                    ? e.jsx(Qt, { task: r })
                    : e.jsxs("div", {
                        className: "context-grid",
                        style: { gridTemplateColumns: l ? "1fr" : "1fr 1fr" },
                        children: [
                          e.jsxs("div", {
                            className: "context-card",
                            children: [
                              e.jsx("div", {
                                className: "context-card-label",
                                children: "Where you left off",
                              }),
                              e.jsx("div", {
                                className: "context-card-body serif",
                                style: {
                                  color: r.leftOff
                                    ? "var(--ink)"
                                    : "var(--faint)",
                                  fontStyle: r.leftOff ? "normal" : "italic",
                                },
                                children: r.leftOff || "—",
                              }),
                            ],
                          }),
                          e.jsxs("div", {
                            className: "context-card context-card-next",
                            children: [
                              e.jsx("div", {
                                className: "context-card-label",
                                children: "One next move",
                              }),
                              e.jsx("div", {
                                className: "context-card-body",
                                style: {
                                  color: r.nextStep
                                    ? "var(--ink)"
                                    : "var(--faint)",
                                  fontStyle: r.nextStep ? "normal" : "italic",
                                },
                                children: r.nextStep || "—",
                              }),
                            ],
                          }),
                        ],
                      }),
            e.jsxs("div", {
              className: "resume-actions",
              style: {
                display: "flex",
                gap: 8,
                marginTop: 24,
                flexWrap: "wrap",
                alignItems: "center",
              },
              children: [
                e.jsx("button", {
                  className: "btn",
                  onClick: () => h(!0),
                  children: "Switch task",
                }),
                e.jsx("button", {
                  className: "btn btn-ghost",
                  onClick: f,
                  disabled: m,
                  children: m ? "Marking done…" : "Mark done",
                }),
                n && e.jsx(Ee, { onEdit: () => n(r) }),
              ],
            }),
            j &&
              e.jsx("p", {
                style: { fontSize: 12, color: "var(--accent)", marginTop: 12 },
                children: j,
              }),
          ],
        },
        r.id,
      ),
      r.template !== "idle" &&
        e.jsx("div", {
          className: "progress-section",
          style: { marginTop: 32 },
          children: e.jsx(Dt, { taskId: r.id }),
        }),
      e.jsx(Pt, { taskId: r.id }),
      p.length > 0 &&
        e.jsxs("div", {
          className: "up-next",
          children: [
            e.jsx("div", {
              className: "h-eyebrow",
              children: "If not this — matched to your mood now",
            }),
            e.jsx("div", {
              className: "up-next-grid",
              children: p.map(({ task: c }, w) =>
                e.jsx(Le, { task: c, isBest: w === 0, onPick: i }, c.id),
              ),
            }),
          ],
        }),
      u &&
        e.jsx(ss, { task: r, tasks: t, currentMood: a, onClose: () => h(!1) }),
    ],
  });
}
const es = [
  {
    id: "blocker",
    title: "Hit a blocker",
    sub: "Can't move forward — waiting on someone or stuck.",
  },
  {
    id: "mood",
    title: "Mood changed",
    sub: "Not in the right headspace for this anymore.",
  },
  {
    id: "urgency",
    title: "Something more urgent",
    sub: "Something else just got more important.",
  },
  {
    id: "done-for-now",
    title: "Done for now",
    sub: "Made progress, leaving on a good cut point.",
  },
];
function ts(t, s, a) {
  const l = a?.tags || [],
    i = a?.energy ?? 3,
    o = Math.max(1, l.length) * 3 + 5;
  return t
    .filter((r) => r.id !== s && !r.done && r.template !== "idle")
    .map((r) => {
      const m = (r.moods || []).filter((h) => l.includes(h)).length,
        g = 5 - Math.abs((r.energy ?? 3) - i),
        u = m * 3 + g;
      return { task: r, score: Math.max(0, Math.round((u / o) * 100)) };
    })
    .sort((r, m) => m.score - r.score);
}
function ss({ task: t, tasks: s, currentMood: a, onClose: l }) {
  const [i, n] = d.useState(null),
    [o, r] = d.useState(t.leftOff || ""),
    [m, g] = d.useState(t.nextStep || ""),
    [u, h] = d.useState(null),
    [j, x] = d.useState(!1),
    [v, p] = d.useState(null),
    f = d.useMemo(() => ts(s || [], t.id, a).slice(0, 8), [s, t.id, a]),
    y = async () => {
      if (!j) {
        (x(!0), p(null));
        try {
          (await T("/actions", {
            method: "POST",
            body: {
              action: {
                type: "park",
                taskId: t.id,
                switchReason: i || "done-for-now",
                leftOff: o,
                nextStep: m,
                note: o.slice(0, 80),
                nextTaskId: u || void 0,
              },
            },
          }),
            l());
        } catch (c) {
          p(c?.body?.detail || c?.message || "Failed to park");
        } finally {
          x(!1);
        }
      }
    };
  return e.jsxs(Te, {
    open: !0,
    onClose: l,
    maxWidth: 620,
    ariaLabel: "Switching away",
    children: [
      e.jsxs("div", {
        className: "modal-head",
        children: [
          e.jsx("div", {
            className: "modal-eyebrow",
            children: "Switching away",
          }),
          e.jsx("div", {
            className: "modal-title serif",
            children: "Leave a breadcrumb for future you.",
          }),
          e.jsx("div", {
            style: { fontSize: 13, color: "var(--muted)", marginTop: 4 },
            children: t.title,
          }),
        ],
      }),
      e.jsxs("div", {
        className: "modal-body",
        children: [
          e.jsxs("div", {
            children: [
              e.jsx("label", {
                className: "field-label",
                children: "Why are you switching?",
              }),
              e.jsx("div", {
                className: "reason-grid",
                children: es.map((c) =>
                  e.jsxs(
                    "button",
                    {
                      className: "reason-card",
                      "data-on": i === c.id,
                      onClick: () => n(c.id),
                      children: [
                        e.jsx("span", {
                          className: "reason-title",
                          children: c.title,
                        }),
                        e.jsx("span", {
                          className: "reason-sub",
                          children: c.sub,
                        }),
                      ],
                    },
                    c.id,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs("div", {
            children: [
              e.jsx("label", {
                className: "field-label",
                children: "Where you're leaving off",
              }),
              e.jsx("textarea", {
                className: "field-textarea",
                rows: 3,
                placeholder:
                  "What's in your head right now? The thread you'd lose by morning.",
                value: o,
                onChange: (c) => r(c.target.value),
              }),
            ],
          }),
          e.jsxs("div", {
            children: [
              e.jsx("label", {
                className: "field-label",
                children: "The one next move when you return",
              }),
              e.jsx("input", {
                className: "field-input",
                placeholder: "A small concrete action — not a goal.",
                value: m,
                onChange: (c) => g(c.target.value),
              }),
            ],
          }),
          f.length > 0 &&
            e.jsxs("div", {
              children: [
                e.jsx("label", {
                  className: "field-label",
                  children: "Pick up next — sorted by mood + energy match",
                }),
                e.jsx("div", {
                  className: "match-list",
                  children: f.map(({ task: c, score: w }) =>
                    e.jsxs(
                      "button",
                      {
                        className: "match-row-pick",
                        "data-on": u === c.id,
                        onClick: () => h(u === c.id ? null : c.id),
                        children: [
                          e.jsx("span", {
                            className: "match-row-quad",
                            "data-q": c.quad || "q2",
                          }),
                          e.jsxs("div", {
                            className: "match-row-body",
                            children: [
                              e.jsx("span", {
                                className: "match-row-title",
                                children: c.title,
                              }),
                              e.jsxs("span", {
                                className: "match-row-meta",
                                children: [
                                  e.jsx("span", {
                                    children:
                                      te[c.kind] || ee[c.template] || "task",
                                  }),
                                  c.energy != null &&
                                    e.jsxs("span", {
                                      children: ["· e", c.energy],
                                    }),
                                  c.moods?.length > 0 &&
                                    e.jsxs("span", {
                                      children: [
                                        "· ",
                                        c.moods.slice(0, 2).join(", "),
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs("span", {
                            className: "match-row-score",
                            "data-strength":
                              w >= 75 ? "high" : w >= 50 ? "med" : "low",
                            children: [
                              e.jsx("span", {
                                className: "match-row-score-bar",
                                children: e.jsx("span", {
                                  style: { width: `${w}%` },
                                }),
                              }),
                              e.jsx("span", {
                                className: "match-row-score-num mono",
                                children: w,
                              }),
                            ],
                          }),
                        ],
                      },
                      c.id,
                    ),
                  ),
                }),
              ],
            }),
          v &&
            e.jsx("p", {
              style: { fontSize: 12, color: "var(--accent)", margin: 0 },
              children: v,
            }),
        ],
      }),
      e.jsxs("div", {
        className: "modal-foot",
        children: [
          e.jsx("span", {
            style: {
              fontSize: 11.5,
              color: "var(--muted)",
              marginRight: "auto",
            },
            children: "Your current mood gets saved with this breadcrumb.",
          }),
          e.jsx("button", {
            className: "btn btn-ghost",
            onClick: l,
            children: "Cancel",
          }),
          e.jsx("button", {
            className: "btn btn-primary",
            onClick: y,
            disabled: j,
            children: j ? "Parking…" : u ? "Park & switch" : "Park task",
          }),
        ],
      }),
    ],
  });
}
const ns = [
  "What should I do now?",
  "I'm tired.",
  "Park this — finance hasn't replied.",
];
function ye(t, s) {
  const l =
    (t.taskId ? s.find((i) => i.id === t.taskId) : null)?.title ||
    t.taskId ||
    "task";
  switch (t.type) {
    case "set_active":
      return `→ open "${l}"`;
    case "set_mood": {
      const i = [];
      return (
        t.tags?.length && i.push(t.tags.join(", ")),
        t.energy != null && i.push(`energy ${t.energy}`),
        `mood: ${i.join(" · ") || "(no change)"}`
      );
    }
    case "navigate":
      return `view: ${t.view}`;
    case "complete":
      return `completed "${l}"`;
    case "park": {
      const i = t.nextTaskId
        ? s.find((n) => n.id === t.nextTaskId)?.title || t.nextTaskId
        : null;
      return i ? `parked "${l}" → "${i}"` : `parked "${l}"`;
    }
    case "log_milestone":
      return `milestone on "${l}": ${t.title || "(untitled)"}`;
    case "mark_chapter":
      return `chapter ${t.status || "updated"} on "${l}"`;
    case "set_reading_chapter":
      return `now reading a chapter in "${l}"`;
    case "update_chapter_note":
      return `chapter note saved in "${l}"`;
    case "level_drill":
      return t.level != null
        ? `drill set to ${t.level}/5 in "${l}"`
        : `drill ${t.delta > 0 ? "+" : ""}${t.delta} in "${l}"`;
    case "log_skill_session":
      return `session logged on "${l}"${t.drill ? ` · ${t.drill}` : ""}`;
    case "toggle_subtask":
      return `subtask toggled in "${l}"`;
    case "advance_phase":
      return `advanced phase in "${l}"`;
    case "end_drift":
      return `drift ended: ${t.mins ?? 0}m on "${l}"`;
    default:
      return t.type;
  }
}
function as({
  tasks: t,
  activeTaskId: s,
  currentMood: a,
  onNavigate: l,
  isMobile: i,
}) {
  const [n, o] = d.useState(!1),
    [r, m] = d.useState(""),
    [g, u] = d.useState(!1),
    [h, j] = d.useState([
      {
        who: "mind",
        text: "I'm here. Tell me what's on your mind — I can switch tasks, set your mood, or suggest what fits.",
        actions: [],
        failedActions: [],
      },
    ]),
    x = d.useRef(null),
    v = d.useRef(null);
  (d.useEffect(() => {
    const f = (y) => {
      (y.metaKey || y.ctrlKey) && y.key.toLowerCase() === "k"
        ? (y.preventDefault(), o((c) => !c))
        : y.key === "Escape" && n && o(!1);
    };
    return (
      window.addEventListener("keydown", f),
      () => window.removeEventListener("keydown", f)
    );
  }, [n]),
    d.useEffect(() => {
      n && setTimeout(() => x.current?.focus(), 60);
    }, [n]),
    d.useEffect(() => {
      v.current && (v.current.scrollTop = v.current.scrollHeight);
    }, [h, g]));
  const p = async (f) => {
    if (((f = (f ?? r).trim()), !f || g)) return;
    (m(""), j((S) => [...S, { who: "user", text: f, actions: [] }]), u(!0));
    let y = "",
      c = [],
      w = [];
    try {
      const S = await T("/chat", { method: "POST", body: { text: f } });
      ((y = S.reply ?? "ok."),
        (c = S.actions ?? []),
        (w = S.failedActions ?? []));
    } catch {
      y = "I couldn't reach my thinking right now. Try again in a moment.";
    }
    (j((S) => [...S, { who: "mind", text: y, actions: c, failedActions: w }]),
      u(!1));
    for (const S of c) S.type === "navigate" && l && l(S.view);
  };
  return e.jsxs(e.Fragment, {
    children: [
      !n &&
        e.jsxs("button", {
          onClick: () => o(!0),
          "aria-label": "Talk to Mind (⌘K)",
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            color: "var(--ink-2)",
            cursor: "pointer",
            fontSize: 13,
          },
          children: [
            e.jsx("span", {
              style: {
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
              },
            }),
            e.jsx("span", { children: "Talk to Mind" }),
            !i &&
              e.jsx("kbd", {
                style: {
                  marginLeft: 4,
                  fontSize: 11,
                  padding: "1px 4px",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  background: "var(--panel-2)",
                  color: "var(--muted)",
                },
                children: "⌘K",
              }),
          ],
        }),
      n &&
        be.createPortal(
          e.jsxs("div", {
            role: "dialog",
            "aria-label": "Talk to Mind",
            style: {
              position: "fixed",
              bottom: i
                ? "calc(64px + env(safe-area-inset-bottom, 0px) + 12px)"
                : 24,
              right: 24,
              width: 400,
              maxWidth: "calc(100vw - 48px)",
              background: "var(--panel)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              zIndex: 2e3,
              maxHeight: "70vh",
            },
            children: [
              e.jsxs("div", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 16px 12px",
                  borderBottom: "1px solid var(--line-soft)",
                },
                children: [
                  e.jsx("span", {
                    style: {
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    },
                  }),
                  e.jsx("span", {
                    style: { fontWeight: 600, fontSize: 14 },
                    children: "Mind",
                  }),
                  e.jsx("span", {
                    style: {
                      fontSize: 11,
                      color: "var(--muted)",
                      marginLeft: 2,
                    },
                    children: "natural language · acts on your tasks",
                  }),
                  e.jsx("button", {
                    onClick: () => o(!1),
                    className: "btn btn-sm btn-ghost",
                    style: { marginLeft: "auto" },
                    children: "Close",
                  }),
                ],
              }),
              e.jsxs("div", {
                ref: v,
                style: {
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                },
                children: [
                  h.map((f, y) =>
                    e.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          alignItems:
                            f.who === "user" ? "flex-end" : "flex-start",
                          gap: 4,
                        },
                        children: [
                          e.jsx("div", {
                            style: {
                              maxWidth: "85%",
                              padding: "8px 12px",
                              borderRadius: 10,
                              fontSize: 13,
                              lineHeight: 1.5,
                              background:
                                f.who === "user"
                                  ? "var(--ink)"
                                  : "var(--panel-2)",
                              color:
                                f.who === "user"
                                  ? "var(--panel)"
                                  : "var(--ink)",
                            },
                            children: f.text,
                          }),
                          (f.actions?.length > 0 ||
                            f.failedActions?.length > 0) &&
                            e.jsxs("div", {
                              style: {
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                              },
                              children: [
                                f.actions?.map((c, w) =>
                                  e.jsx(
                                    "span",
                                    {
                                      className: "chat-chip chat-chip-applied",
                                      style: {
                                        fontSize: 11,
                                        padding: "2px 8px",
                                        borderRadius: 4,
                                        background: "var(--accent-soft)",
                                        color: "var(--accent)",
                                        border: "1px solid var(--line-soft)",
                                        animationDelay: `${w * 60}ms`,
                                      },
                                      children: ye(c, t),
                                    },
                                    `a${w}`,
                                  ),
                                ),
                                f.failedActions?.map((c, w) =>
                                  e.jsxs(
                                    "span",
                                    {
                                      title: c.detail,
                                      className: "chat-chip chat-chip-failed",
                                      style: {
                                        fontSize: 11,
                                        padding: "2px 8px",
                                        borderRadius: 4,
                                        background: "transparent",
                                        color: "var(--muted)",
                                        border: "1px dashed var(--line)",
                                        textDecoration: "line-through",
                                        animationDelay: `${((f.actions?.length || 0) + w) * 60}ms`,
                                      },
                                      children: ["couldn't: ", ye(c.action, t)],
                                    },
                                    `f${w}`,
                                  ),
                                ),
                              ],
                            }),
                        ],
                      },
                      y,
                    ),
                  ),
                  g &&
                    e.jsx("div", {
                      style: {
                        display: "flex",
                        gap: 4,
                        padding: "8px 12px",
                        background: "var(--panel-2)",
                        borderRadius: 10,
                        alignSelf: "flex-start",
                      },
                      children: [0, 1, 2].map((f) =>
                        e.jsx(
                          "span",
                          {
                            style: {
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: "var(--muted)",
                              animation: `pulse 1.2s ease-in-out ${f * 0.2}s infinite`,
                            },
                          },
                          f,
                        ),
                      ),
                    }),
                ],
              }),
              h.length <= 1 &&
                e.jsx("div", {
                  style: {
                    padding: "0 16px 10px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  },
                  children: ns.map((f) =>
                    e.jsx(
                      "button",
                      {
                        onClick: () => p(f),
                        style: {
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 20,
                          border: "1px solid var(--line)",
                          background: "transparent",
                          color: "var(--ink-2)",
                          cursor: "pointer",
                        },
                        children: f,
                      },
                      f,
                    ),
                  ),
                }),
              e.jsxs("div", {
                style: {
                  display: "flex",
                  gap: 8,
                  padding: "10px 16px 14px",
                  borderTop: "1px solid var(--line-soft)",
                },
                children: [
                  e.jsx("input", {
                    ref: x,
                    value: r,
                    onChange: (f) => m(f.target.value),
                    onKeyDown: (f) => {
                      f.key === "Enter" &&
                        !f.shiftKey &&
                        (f.preventDefault(), p());
                    },
                    placeholder: "Tell Mind what's on your mind…",
                    disabled: g,
                    style: {
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      background: "var(--panel)",
                      color: "var(--ink)",
                      fontSize: 13,
                      outline: "none",
                    },
                  }),
                  e.jsx("button", {
                    className: "btn btn-primary",
                    onClick: () => p(),
                    disabled: g || !r.trim(),
                    children: "Send",
                  }),
                ],
              }),
            ],
          }),
          document.body,
        ),
    ],
  });
}
const ls = [
  { id: "now", label: "Now" },
  { id: "today", label: "Today" },
  { id: "tasks", label: "Tasks" },
  { id: "matrix", label: "Matrix" },
  { id: "timeline", label: "Timeline" },
];
function rs({ id: t }) {
  const s = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": !0,
  };
  switch (t) {
    case "now":
      return e.jsxs("svg", {
        ...s,
        children: [
          e.jsx("circle", { cx: "10", cy: "10", r: "6.5" }),
          e.jsx("circle", {
            cx: "10",
            cy: "10",
            r: "2",
            fill: "currentColor",
            stroke: "none",
          }),
        ],
      });
    case "today":
      return e.jsxs("svg", {
        ...s,
        children: [
          e.jsx("rect", {
            x: "3.5",
            y: "4.5",
            width: "13",
            height: "12",
            rx: "2",
          }),
          e.jsx("path", { d: "M3.5 8h13M7 3v3M13 3v3" }),
        ],
      });
    case "tasks":
      return e.jsxs("svg", {
        ...s,
        children: [
          e.jsx("path", { d: "M7 6h9M7 10h9M7 14h9" }),
          e.jsx("path", { d: "M3.5 6h.01M3.5 10h.01M3.5 14h.01" }),
        ],
      });
    case "matrix":
      return e.jsxs("svg", {
        ...s,
        children: [
          e.jsx("rect", {
            x: "3.5",
            y: "3.5",
            width: "13",
            height: "13",
            rx: "1.5",
          }),
          e.jsx("path", { d: "M10 3.5v13M3.5 10h13" }),
        ],
      });
    case "timeline":
      return e.jsxs("svg", {
        ...s,
        children: [
          e.jsx("path", { d: "M3.5 10h13" }),
          e.jsx("circle", {
            cx: "6.5",
            cy: "10",
            r: "1.6",
            fill: "currentColor",
            stroke: "none",
          }),
          e.jsx("circle", {
            cx: "13.5",
            cy: "10",
            r: "1.6",
            fill: "currentColor",
            stroke: "none",
          }),
        ],
      });
    default:
      return null;
  }
}
function is({ view: t, onSelect: s }) {
  return e.jsx("nav", {
    className: "bottom-nav",
    "aria-label": "Primary views",
    children: ls.map((a) =>
      e.jsxs(
        "button",
        {
          className: "bottom-nav-item",
          "data-active": t === a.id,
          "aria-current": t === a.id ? "page" : void 0,
          "aria-label": a.label,
          onClick: () => s(a.id),
          children: [
            e.jsx(rs, { id: a.id }),
            e.jsx("span", { className: "bottom-nav-label", children: a.label }),
          ],
        },
        a.id,
      ),
    ),
  });
}
const os = [
    { color: "#c9633f", label: "Terracotta" },
    { color: "#2A6FDB", label: "Blue" },
    { color: "#1F8A5B", label: "Green" },
    { color: "#7A5AE0", label: "Purple" },
    { color: "#C0962A", label: "Amber" },
  ],
  cs = [
    { value: "energy-tags", label: "Energy + tags" },
    { value: "tags-only", label: "Tags only" },
    { value: "energy-only", label: "Energy only" },
    { value: "focus-energy-patience", label: "Focus / energy / patience" },
  ];
function A({ children: t }) {
  return e.jsx("div", {
    className: "h-eyebrow",
    style: { paddingTop: 4 },
    children: t,
  });
}
function B({ options: t, value: s, onChange: a }) {
  return e.jsx("div", {
    style: { display: "flex", gap: 4 },
    children: t.map((l) => {
      const i = l.value ?? l,
        n = i === s;
      return e.jsx(
        "button",
        {
          type: "button",
          onClick: () => a(i),
          style: {
            flex: 1,
            padding: "5px 0",
            borderRadius: 7,
            border: n ? "1.5px solid var(--ink)" : "1px solid var(--line)",
            background: n ? "var(--ink)" : "var(--panel)",
            color: n ? "var(--panel)" : "var(--ink-2)",
            cursor: "pointer",
            fontSize: 12,
          },
          children: l.label ?? l,
        },
        i,
      );
    }),
  });
}
function ds({ tweaks: t, setTweak: s }) {
  const [a, l] = d.useState(!1),
    i = d.useRef(null);
  return (
    d.useEffect(() => {
      if (!a) return;
      const n = (o) => {
        i.current && !i.current.contains(o.target) && l(!1);
      };
      return (
        document.addEventListener("mousedown", n),
        () => document.removeEventListener("mousedown", n)
      );
    }, [a]),
    e.jsxs("div", {
      ref: i,
      style: { position: "relative" },
      children: [
        e.jsx("button", {
          onClick: () => l((n) => !n),
          "aria-label": "Open tweaks",
          title: "Tweaks",
          style: {
            padding: "4px 10px",
            borderRadius: 8,
            border: a ? "1px solid var(--ink-2)" : "1px solid var(--line)",
            background: a ? "var(--panel-2)" : "var(--panel)",
            color: "var(--ink-2)",
            cursor: "pointer",
            fontSize: 15,
            lineHeight: 1,
          },
          children: "⚙",
        }),
        a &&
          e.jsxs("div", {
            style: {
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "var(--panel)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "16px",
              width: 256,
              zIndex: 1e3,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "var(--shadow)",
            },
            children: [
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Theme" }),
                  e.jsx(B, {
                    options: [
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ],
                    value: t.theme,
                    onChange: (n) => s("theme", n),
                  }),
                ],
              }),
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Density" }),
                  e.jsx(B, {
                    options: [
                      { value: "comfortable", label: "Comfy" },
                      { value: "compact", label: "Compact" },
                    ],
                    value: t.density,
                    onChange: (n) => s("density", n),
                  }),
                ],
              }),
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Accent" }),
                  e.jsx("div", {
                    style: { display: "flex", gap: 8 },
                    children: os.map(({ color: n, label: o }) =>
                      e.jsx(
                        "button",
                        {
                          type: "button",
                          title: o,
                          onClick: () => s("accent", n),
                          style: {
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: n,
                            border: "none",
                            outline:
                              t.accent === n
                                ? "2.5px solid #333"
                                : "2px solid transparent",
                            outlineOffset: 2,
                            cursor: "pointer",
                            padding: 0,
                          },
                        },
                        n,
                      ),
                    ),
                  }),
                ],
              }),
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Celebrations" }),
                  e.jsx(B, {
                    options: [
                      { value: !0, label: "On" },
                      { value: !1, label: "Off" },
                    ],
                    value: t.celebrations,
                    onChange: (n) => s("celebrations", n),
                  }),
                ],
              }),
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Celebration sound" }),
                  e.jsx(B, {
                    options: [
                      { value: !1, label: "Off" },
                      { value: !0, label: "On" },
                    ],
                    value: t.sound,
                    onChange: (n) => s("sound", n),
                  }),
                ],
              }),
              e.jsxs("div", {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  e.jsx(A, { children: "Mood model" }),
                  e.jsx("div", {
                    style: { display: "flex", flexDirection: "column", gap: 4 },
                    children: cs.map((n) =>
                      e.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => s("moodModel", n.value),
                          style: {
                            textAlign: "left",
                            padding: "6px 10px",
                            borderRadius: 7,
                            border:
                              t.moodModel === n.value
                                ? "1.5px solid var(--ink)"
                                : "1px solid var(--line)",
                            background:
                              t.moodModel === n.value
                                ? "var(--panel-2)"
                                : "var(--panel)",
                            cursor: "pointer",
                            fontSize: 12,
                            color:
                              t.moodModel === n.value
                                ? "var(--ink)"
                                : "var(--ink-2)",
                          },
                          children: [
                            t.moodModel === n.value ? "● " : "○ ",
                            n.label,
                          ],
                        },
                        n.value,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
      ],
    })
  );
}
const _e = "mindTweaks",
  H = {
    moodModel: "energy-tags",
    density: "comfortable",
    theme: "light",
    accent: "#c9633f",
    celebrations: !0,
    sound: !1,
  };
function us() {
  try {
    const t = localStorage.getItem(_e);
    return t ? { ...H, ...JSON.parse(t) } : H;
  } catch {
    return H;
  }
}
function hs() {
  const [t, s] = d.useState(us),
    a = (l, i) => {
      s((n) => {
        const o = { ...n, [l]: i };
        try {
          localStorage.setItem(_e, JSON.stringify(o));
        } catch {}
        return o;
      });
    };
  return (
    d.useEffect(() => {
      document.documentElement.dataset.theme = t.theme;
    }, [t.theme]),
    d.useEffect(() => {
      document.documentElement.dataset.density = t.density;
    }, [t.density]),
    d.useEffect(() => {
      t.accent &&
        document.documentElement.style.setProperty("--accent", t.accent);
    }, [t.accent]),
    [t, a]
  );
}
function ms(t = 720) {
  const [s, a] = d.useState(() => window.innerWidth < t);
  return (
    d.useEffect(() => {
      const l = () => a(window.innerWidth < t);
      return (
        window.addEventListener("resize", l),
        () => window.removeEventListener("resize", l)
      );
    }, [t]),
    s
  );
}
const ps = d.lazy(() =>
    M(
      () => import("./MatrixView-7Py4ZNGm.js"),
      __vite__mapDeps([0, 1, 2]),
    ).then((t) => ({ default: t.MatrixView })),
  ),
  gs = d.lazy(() =>
    M(() => import("./TasksView-CtN6Jq2Y.js"), __vite__mapDeps([3, 1, 2])).then(
      (t) => ({ default: t.TasksView }),
    ),
  ),
  fs = d.lazy(() =>
    M(() => import("./TodayView-CcMPoC2Q.js"), __vite__mapDeps([4, 1, 2])).then(
      (t) => ({ default: t.TodayView }),
    ),
  ),
  xs = d.lazy(() =>
    M(
      () => import("./TimelineView-gsKO_pi4.js"),
      __vite__mapDeps([5, 1, 2]),
    ).then((t) => ({ default: t.TimelineView })),
  ),
  je = d.lazy(() =>
    M(
      () => import("./NewTaskModal-Dyv8LU0-.js"),
      __vite__mapDeps([6, 1, 2]),
    ).then((t) => ({ default: t.NewTaskModal })),
  ),
  $e = () =>
    e.jsxs("div", {
      className: "skeleton-stack",
      "aria-label": "Loading",
      role: "status",
      children: [
        e.jsx("div", {
          className: "skeleton skeleton-line",
          style: { width: "32%", height: 12 },
        }),
        e.jsx("div", {
          className: "skeleton skeleton-line",
          style: { width: "60%", height: 30, marginTop: 6 },
        }),
        e.jsx("div", {
          className: "skeleton skeleton-block",
          style: { marginTop: 18 },
        }),
        e.jsx("div", { className: "skeleton skeleton-block" }),
      ],
    }),
  ys = () => e.jsx($e, {});
function js() {
  return e.jsxs("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
    children: [
      e.jsx("path", {
        d: "M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z",
        fill: "#4285F4",
      }),
      e.jsx("path", {
        d: "M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z",
        fill: "#34A853",
      }),
      e.jsx("path", {
        d: "M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z",
        fill: "#FBBC05",
      }),
      e.jsx("path", {
        d: "M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z",
        fill: "#EA4335",
      }),
    ],
  });
}
function U({ loading: t, allowListError: s, onSignIn: a }) {
  return e.jsx("div", {
    className: "login-screen",
    children: e.jsxs("div", {
      className: "login-card",
      children: [
        e.jsxs("div", {
          className: "login-brand",
          children: [
            e.jsx("span", { className: "brand-mark" }),
            e.jsx("span", {
              className: "login-brand-name",
              children: "Mind Manager",
            }),
          ],
        }),
        e.jsx("p", {
          className: "login-tagline",
          children: s
            ? "Your account isn't on the invite list."
            : "A mood-aware task manager for focused work.",
        }),
        t
          ? e.jsxs("div", {
              className: "login-loading",
              children: [
                e.jsx("span", { className: "login-spinner" }),
                e.jsx("span", {
                  style: { color: "var(--muted)", fontSize: 14 },
                  children: "Checking session…",
                }),
              ],
            })
          : e.jsxs("button", {
              className: "login-btn-google",
              onClick: a,
              disabled: t,
              children: [
                e.jsx(js, {}),
                s ? "Try a different account" : "Sign in with Google",
              ],
            }),
        s &&
          e.jsx("p", {
            className: "login-hint",
            children: "Ask the owner to add your email to the allow-list.",
          }),
      ],
    }),
  });
}
function bs() {
  const { user: t, signIn: s, signOut: a, allowListError: l } = I(),
    {
      currentMood: i,
      lastCheckInAt: n,
      activeTaskId: o,
      customMoodTags: r,
      loading: m,
      error: g,
    } = tt(),
    { tasks: u, loading: h, error: j } = et(),
    x = j || g,
    [v, p] = hs(),
    f = ms(),
    [y, c] = d.useState(() => localStorage.getItem("mindView") || "now"),
    [w, S] = d.useState("open"),
    [b, N] = d.useState(!1),
    [k, L] = d.useState(!1),
    [se, Pe] = d.useState(!1),
    [ne, z] = d.useState(!1),
    [W, _] = d.useState(null),
    C = (D) => {
      (c(D), localStorage.setItem("mindView", D));
    },
    Re = (D) => {
      (S(D), C("tasks"));
    };
  d.useEffect(() => {
    se || m || !t || (st(n) && N(!0), Pe(!0));
  }, [m, t, n, se]);
  const E = async (D) => {
    (await T("/actions", {
      method: "POST",
      body: { action: { type: "set_active", taskId: D } },
    }),
      C("now"));
  };
  if (t === void 0) return e.jsx(U, { loading: !0 });
  if (l) return e.jsx(U, { allowListError: !0, onSignIn: s });
  if (!t) return e.jsx(U, { onSignIn: s });
  const Oe = {
    now: "Now",
    today: "Today",
    tasks: "All tasks",
    matrix: "Matrix",
    timeline: "Timeline",
  };
  return e.jsx(Nt, {
    enabled: v.celebrations,
    sound: v.sound,
    children: e.jsxs("div", {
      className: "app",
      children: [
        e.jsx(mt, {
          view: y,
          setView: C,
          tasks: u,
          activeTaskId: o,
          onSetActive: E,
          onKindFilter: Re,
          onNew: () => z(!0),
          drawerOpen: k,
          onClose: () => L(!1),
        }),
        k &&
          f &&
          e.jsx("div", { className: "sidebar-scrim", onClick: () => L(!1) }),
        e.jsxs("main", {
          className: "main",
          children: [
            e.jsxs("div", {
              className: "topbar",
              children: [
                e.jsx("button", {
                  className: "menu-btn",
                  "aria-label": "Open navigation menu",
                  onClick: () => L(!0),
                }),
                e.jsx("span", {
                  className: "topbar-title",
                  children: Oe[y] || "Mind",
                }),
                e.jsx(rt, { currentMood: i, onClick: () => N(!0) }),
                e.jsx(as, {
                  tasks: u,
                  activeTaskId: o,
                  currentMood: i,
                  onNavigate: C,
                  isMobile: f,
                }),
                e.jsx(ds, { tweaks: v, setTweak: p }),
                e.jsx("span", { className: "topbar-spacer" }),
                e.jsxs("span", {
                  style: { fontSize: 13, color: "var(--muted)" },
                  children: [
                    !f && t.email,
                    e.jsx("button", {
                      onClick: a,
                      className: "btn-ghost btn btn-sm",
                      style: { marginLeft: f ? 0 : 8 },
                      children: f ? "Out" : "Sign out",
                    }),
                  ],
                }),
              ],
            }),
            e.jsx("div", {
              className: "content",
              children:
                h || m
                  ? e.jsx($e, {})
                  : x
                    ? e.jsxs("p", {
                        style: { color: "var(--accent)" },
                        children: [
                          "Error loading your data: ",
                          String(x.message || x),
                        ],
                      })
                    : y === "now"
                      ? e.jsx(Xt, {
                          tasks: u,
                          activeTaskId: o,
                          currentMood: i,
                          isMobile: f,
                          onSetActive: E,
                          onEdit: _,
                          onGoToToday: () => C("today"),
                        })
                      : e.jsx(d.Suspense, {
                          fallback: e.jsx(ys, {}),
                          children:
                            y === "matrix"
                              ? e.jsx(ps, {
                                  tasks: u,
                                  activeTaskId: o,
                                  onSetActive: E,
                                })
                              : y === "timeline"
                                ? e.jsx(xs, { onSetActive: E, isMobile: f })
                                : y === "today"
                                  ? e.jsx(fs, { tasks: u, onSetActive: E })
                                  : e.jsx(gs, {
                                      tasks: u,
                                      activeTaskId: o,
                                      onSetActive: E,
                                      onNew: () => z(!0),
                                      onEdit: _,
                                      filter: w,
                                      onFilterChange: S,
                                    }),
                        }),
            }),
            f && e.jsx(is, { view: y, onSelect: C }),
          ],
        }),
        e.jsx(it, {
          open: b,
          firstTime: !i,
          currentMood: i,
          customMoodTags: r,
          moodModel: v.moodModel,
          onClose: () => N(!1),
          onSave: () => N(!1),
        }),
        ne &&
          e.jsx(d.Suspense, {
            fallback: null,
            children: e.jsx(je, {
              open: ne,
              customMoodTags: r,
              onClose: () => z(!1),
              onCreate: () => z(!1),
            }),
          }),
        W &&
          e.jsx(d.Suspense, {
            fallback: null,
            children: e.jsx(je, {
              open: !!W,
              editTask: W,
              customMoodTags: r,
              onClose: () => _(null),
              onCreate: () => _(null),
              onDeleted: () => _(null),
            }),
          }),
      ],
    }),
  });
}
function vs() {
  return e.jsx(Xe, { children: e.jsx(bs, {}) });
}
ze(document.getElementById("root")).render(
  e.jsx(d.StrictMode, { children: e.jsx(vs, {}) }),
);
export {
  Te as B,
  G as K,
  ue as M,
  ot as Q,
  ks as T,
  T as a,
  O as b,
  Ot as c,
  R as d,
  Rt as e,
  I as u,
  Ss as y,
};
