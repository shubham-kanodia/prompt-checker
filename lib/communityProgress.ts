"use client";

// Tracks which community challenges this browser has solved. Used to dedupe the
// random pool for anonymous players and to show a solved state. Points for
// signed-in players live server-side (community_progress); this is local only.

const KEY = "btp:community:v1";

type Store = { solved: string[] };

function load(): Store {
  if (typeof window === "undefined") return { solved: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { solved: [] };
    const parsed = JSON.parse(raw) as Store;
    return Array.isArray(parsed.solved) ? parsed : { solved: [] };
  } catch {
    return { solved: [] };
  }
}

export function getSolvedSlugs(): string[] {
  return load().solved;
}

export function isCommunitySolved(slug: string): boolean {
  return load().solved.includes(slug);
}

export function markCommunitySolved(slug: string): void {
  if (typeof window === "undefined") return;
  const store = load();
  if (!store.solved.includes(slug)) {
    store.solved.push(slug);
    localStorage.setItem(KEY, JSON.stringify(store));
  }
}
