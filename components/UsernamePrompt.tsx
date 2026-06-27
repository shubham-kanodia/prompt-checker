"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UsernameForm } from "./UsernameForm";

// Shown across the app to signed-in players who have not picked a leaderboard
// handle yet (most existing accounts). Dismissible for the current page load.
export function UsernamePrompt() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);

  if (status !== "authenticated") return null;
  if (session.user?.username) return null; // already has one
  if (dismissed || done) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-4">
      <div className="panel p-4 flex flex-col gap-3 border-[var(--amber)]/40">
        <div className="flex items-start justify-between gap-3">
          <div className="text-amber text-sm">pick your leaderboard handle</div>
          <button
            className="text-muted text-xs hover:text-text shrink-0"
            onClick={() => setDismissed(true)}
            aria-label="dismiss"
          >
            later ✕
          </button>
        </div>
        <p className="text-muted text-xs">
          choose how you show up on the board. you can change it later from the
          leaderboard.
        </p>
        <UsernameForm onSaved={() => setDone(true)} />
      </div>
    </div>
  );
}
