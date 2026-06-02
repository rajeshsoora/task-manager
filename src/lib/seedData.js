export function createSeedData() {
  const now = new Date().toISOString();
  const d1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const d4 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const tasks = [
    {
      title: "Launch Mind Manager Application",
      kind: "work", quad: "q1", energy: 5,
      moods: ["focused", "creative"], cadence: "once", done: false,
      createdAt: now, lastTouched: now,
      template: "project",
      templateData: {
        phases: [
          {
            id: "phase-1", title: "Local State Engine Scaffold", status: "done",
            subs: [
              { id: "sub-1", label: "Create AppContext.jsx store", done: true },
              { id: "sub-2", label: "Implement local storage caching", done: true },
            ],
          },
          {
            id: "phase-2", title: "Build Premium Views & Drag-and-Drop Planning", status: "doing",
            subs: [
              { id: "sub-3", label: "Integrate Eisenhower Priority Matrix Grid", done: true },
              { id: "sub-4", label: "Implement Drag and Drop in Today's Plan", done: false },
              { id: "sub-5", label: "Design SVG Timeline charts", done: false },
            ],
          },
          {
            id: "phase-3", title: "Verify Responsiveness & Sound Celebrations", status: "todo",
            subs: [
              { id: "sub-6", label: "Add soft completes chime audio", done: false },
              { id: "sub-7", label: "Verify Light/Dark theme density controls", done: false },
            ],
          },
        ],
      },
    },
    {
      title: "Read 'Atomic Habits' by James Clear",
      kind: "learning", quad: "q2", energy: 2,
      moods: ["calm", "curious"], cadence: "daily", done: false,
      createdAt: d1, lastTouched: now,
      template: "book",
      templateData: {
        chapters: [
          { id: "ch-1", title: "The Fundamentals: Why Tiny Changes Make a Big Difference", status: "done", note: "1% better every day compounding effect." },
          { id: "ch-2", title: "The 1st Law: Make It Obvious", status: "reading", note: "Implementation intentions and habit stacking." },
          { id: "ch-3", title: "The 2nd Law: Make It Attractive", status: "unread", note: "" },
          { id: "ch-4", title: "The 3rd Law: Make It Easy", status: "unread", note: "" },
          { id: "ch-5", title: "The 4th Law: Make It Satisfying", status: "unread", note: "" },
        ],
      },
    },
    {
      title: "Master HSL & OKLCH Color Gradients",
      kind: "craft", quad: "q2", energy: 4,
      moods: ["creative", "focused"], cadence: "weekly", done: false,
      createdAt: d3, lastTouched: now,
      template: "skill",
      templateData: {
        drills: [
          { id: "drill-1", label: "Fluid Type Scales Layouts", level: 3 },
          { id: "drill-2", label: "OKLCH Lightness and Chroma Mapping", level: 4 },
          { id: "drill-3", label: "CSS Variables Animation Transitions", level: 2 },
        ],
        recent: [
          { when: now, drill: "OKLCH Lightness and Chroma Mapping", note: "Adjusted lightness curve from 20% to 95%." },
          { when: d4, drill: "Fluid Type Scales Layouts", note: "Configured CSS clamp() font rules." },
        ],
      },
    },
    {
      title: "Mindfulness and Deep Breathing",
      kind: "drift", quad: "q4", energy: 1,
      moods: ["calm", "restless", "tired"], cadence: "daily", done: false,
      createdAt: now, lastTouched: now,
      template: "idle",
      templateData: {
        lastDrifts: [
          { when: d4, mins: 15, note: "Felt very relaxed and recharged.", mood: ["calm"] },
        ],
      },
    },
  ];

  const events = [
    {
      type: "checkin", timestamp: d4, energy: 3, mood: ["calm", "focused"],
      taskId: null, taskTitle: null, title: null, mins: null, note: null, switchReason: null,
    },
    {
      type: "checkin", timestamp: now, energy: 4, mood: ["focused", "creative"],
      taskId: null, taskTitle: null, title: null, mins: null, note: null, switchReason: null,
    },
  ];

  return { tasks, events };
}
