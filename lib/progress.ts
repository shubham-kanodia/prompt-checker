"use client";

// Client-side progress, stored in localStorage and optionally synced to the
// server when the player is signed in.

export type LevelProgress = {
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  bestTimeMs: number | null;
  score: number;
  solvedAt: number | null;
};

export type Progress = {
  levels: Record<number, LevelProgress>;
};

const KEY = "btp:progress:v1";

function emptyLevel(): LevelProgress {
  return {
    solved: false,
    attempts: 0,
    hintsUsed: 0,
    bestTimeMs: null,
    score: 0,
    solvedAt: null,
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { levels: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { levels: {} };
    const parsed = JSON.parse(raw) as Progress;
    return parsed.levels ? parsed : { levels: {} };
  } catch {
    return { levels: {} };
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("btp:progress"));
}

export function getLevel(p: Progress, id: number): LevelProgress {
  return p.levels[id] ?? emptyLevel();
}

// A level is unlocked if it is level 1, or the previous level is solved.
export function isUnlocked(p: Progress, id: number): boolean {
  if (id <= 1) return true;
  return getLevel(p, id - 1).solved;
}

export function highestUnlocked(p: Progress): number {
  let n = 1;
  while (getLevel(p, n).solved) n += 1;
  return n;
}

export function totalScore(p: Progress): number {
  return Object.values(p.levels).reduce((sum, l) => sum + (l.score || 0), 0);
}

export function solvedCount(p: Progress): number {
  return Object.values(p.levels).filter((l) => l.solved).length;
}

// Consecutive solves from level 1 up.
export function streak(p: Progress): number {
  let n = 0;
  let id = 1;
  while (getLevel(p, id).solved) {
    n += 1;
    id += 1;
  }
  return n;
}

export function recordAttempt(id: number): Progress {
  const p = loadProgress();
  const lvl = { ...getLevel(p, id) };
  lvl.attempts += 1;
  p.levels[id] = lvl;
  saveProgress(p);
  return p;
}

export function recordHint(id: number, hintsUsed: number): Progress {
  const p = loadProgress();
  const lvl = { ...getLevel(p, id) };
  lvl.hintsUsed = Math.max(lvl.hintsUsed, hintsUsed);
  p.levels[id] = lvl;
  saveProgress(p);
  return p;
}

export function recordSolve(
  id: number,
  data: { attempts: number; hintsUsed: number; timeMs: number; score: number }
): Progress {
  const p = loadProgress();
  const prev = getLevel(p, id);
  const lvl: LevelProgress = {
    solved: true,
    attempts: data.attempts,
    hintsUsed: data.hintsUsed,
    bestTimeMs:
      prev.bestTimeMs != null
        ? Math.min(prev.bestTimeMs, data.timeMs)
        : data.timeMs,
    score: Math.max(prev.score, data.score),
    solvedAt: prev.solvedAt ?? Date.now(),
  };
  p.levels[id] = lvl;
  saveProgress(p);
  return p;
}

// Fold server rows back into localStorage after a login merge.
type ServerRow = {
  level: number;
  attempts?: number;
  hintsUsed?: number;
  bestTimeMs?: number | null;
  score?: number;
  solvedAt?: string | number | null;
};

export function mergeServerRows(rows: ServerRow[]): Progress {
  const p = loadProgress();
  for (const r of rows) {
    const prev = getLevel(p, r.level);
    const solvedAt = r.solvedAt ? new Date(r.solvedAt).getTime() : null;
    p.levels[r.level] = {
      solved: Boolean(solvedAt) || prev.solved,
      attempts: Math.max(prev.attempts, r.attempts ?? 0),
      hintsUsed: Math.max(prev.hintsUsed, r.hintsUsed ?? 0),
      bestTimeMs:
        prev.bestTimeMs != null && r.bestTimeMs != null
          ? Math.min(prev.bestTimeMs, r.bestTimeMs)
          : prev.bestTimeMs ?? r.bestTimeMs ?? null,
      score: Math.max(prev.score, r.score ?? 0),
      solvedAt: prev.solvedAt ?? solvedAt,
    };
  }
  saveProgress(p);
  return p;
}

// Serialize for server merge.
export function serializeForMerge(p: Progress) {
  return Object.entries(p.levels)
    .filter(([, l]) => l.solved || l.attempts > 0)
    .map(([id, l]) => ({
      level: Number(id),
      attempts: l.attempts,
      hintsUsed: l.hintsUsed,
      bestTimeMs: l.bestTimeMs,
      score: l.score,
      solvedAt: l.solvedAt,
    }));
}
