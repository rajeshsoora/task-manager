export const LEVEL_THRESHOLDS = [0,100,250,500,900,1400,2000,2750,3650,4700,6000,7500,9200,11100,13200,15500,18000,20700,23600,26700,Infinity];
export const LEVEL_NAMES = ['Spark','Kindling','Tinkerer','Seeker','Builder','Maker','Focused','Grounded','Consistent','Practitioner','Deep Worker','Craftsman','Momentum','Sharpened','Flow State','Actualized','Architect','Deep Crafter','Master','Flow Architect'];

export function getLevelFromXP(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 2; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function computeFulfillmentScore(task, patterns, traits) {
  let score = (task.energy || 1) * 20;
  if (patterns?.peakEnergyKind && task.kind === patterns.peakEnergyKind) score += 20;
  if (patterns?.avoidanceKind && task.kind === patterns.avoidanceKind) score -= 20;
  const selfEfficacy = traits?.selfEfficacy?.score ?? 50;
  const conscientiousness = traits?.conscientiousness?.score ?? 50;
  if (selfEfficacy >= 60 && ['craft','learning','work','music'].includes(task.kind)) score += 15;
  if (conscientiousness >= 60) score += 10;
  return Math.max(0, Math.min(100, score));
}

/**
 * Computes behavioral patterns from event log and task list.
 * Pure JS — no AI. Returns a patterns object for profile/patterns in Firestore.
 */
export function computePatterns(events, tasks) {
  const now = Date.now();
  const MS_30D = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - MS_30D;
  const sixtyDaysAgo = now - 2 * MS_30D;

  const recent = events.filter(e => new Date(e.timestamp).getTime() > thirtyDaysAgo);
  const prev   = events.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t > sixtyDaysAgo && t <= thirtyDaysAgo;
  });

  const recentTasks = tasks.filter(t => new Date(t.createdAt).getTime() > thirtyDaysAgo);
  const prevTasks   = tasks.filter(t => {
    const ct = new Date(t.createdAt).getTime();
    return ct > sixtyDaysAgo && ct <= thirtyDaysAgo;
  });

  // Completion rate
  const completionRate     = recentTasks.length > 0 ? recentTasks.filter(t => t.done).length / recentTasks.length : 0;
  const prevCompletionRate = prevTasks.length > 0   ? prevTasks.filter(t => t.done).length / prevTasks.length : 0;

  // Switch frequency (per week)
  const switches     = recent.filter(e => e.type === "switch").length;
  const prevSwitches = prev.filter(e => e.type === "switch").length;
  const switchRate     = switches / (30 / 7);
  const prevSwitchRate = prevSwitches / (30 / 7);

  // Drift frequency (per day)
  const drifts     = recent.filter(e => e.type === "drift").length;
  const prevDrifts = prev.filter(e => e.type === "drift").length;
  const driftRate     = drifts / 30;
  const prevDriftRate = prevDrifts / 30;

  // Kind with most completions = peakEnergyKind
  const completionsByKind = {};
  tasks.filter(t => t.done && new Date(t.lastTouched).getTime() > thirtyDaysAgo).forEach(t => {
    completionsByKind[t.kind] = (completionsByKind[t.kind] || 0) + 1;
  });
  const peakEnergyKind = Object.entries(completionsByKind).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Kind with most switch-aways = avoidanceKind
  const avoidanceByKind = {};
  recent.filter(e => e.type === "switch" && e.taskId).forEach(e => {
    const t = tasks.find(tk => tk.id === e.taskId);
    if (t) avoidanceByKind[t.kind] = (avoidanceByKind[t.kind] || 0) + 1;
  });
  const avoidanceKind = Object.entries(avoidanceByKind).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const trend = (current, previous, lowerIsBetter = false) => {
    if (previous === 0 && current === 0) return "stable";
    if (previous === 0) return "improving";
    const delta = (current - previous) / previous;
    const improving = lowerIsBetter ? delta < -0.1 : delta > 0.1;
    const worsening = lowerIsBetter ? delta > 0.1  : delta < -0.1;
    if (improving) return "improving";
    if (worsening) return "worsening";
    return "stable";
  };

  return {
    completionRate:       { rate: Math.round(completionRate * 100) / 100, trend: trend(completionRate, prevCompletionRate) },
    taskSwitchFrequency:  { rate: Math.round(switchRate * 10) / 10,       trend: trend(switchRate, prevSwitchRate, true) },
    driftFrequency:       { perDay: Math.round(driftRate * 100) / 100,    trend: trend(driftRate, prevDriftRate, true) },
    peakEnergyKind,
    avoidanceKind,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns the current YYYY-MM string.
 */
export function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Returns the current quarter string, e.g. "2026-Q2".
 */
export function currentYearQuarter() {
  const d = new Date();
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `${d.getFullYear()}-Q${q}`;
}

/**
 * Returns the YYYY-MM string for N months ago.
 */
export function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Returns milliseconds since the given ISO timestamp.
 */
export function msSince(isoTimestamp) {
  return Date.now() - new Date(isoTimestamp).getTime();
}

/**
 * Returns true if 30+ days have passed since the given ISO timestamp.
 */
export function isMonthOld(isoTimestamp) {
  return msSince(isoTimestamp) >= 30 * 24 * 60 * 60 * 1000;
}
