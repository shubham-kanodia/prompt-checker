"use client";

import Link from "next/link";
import type { PublicLevel } from "@/lib/challenges/types";
import { useProgress } from "./useProgress";
import { getLevel, isUnlocked } from "@/lib/progress";

export function LevelGrid({ levels }: { levels: PublicLevel[] }) {
  const progress = useProgress();

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {levels.map((lvl) => {
        const lp = getLevel(progress, lvl.id);
        const unlocked = isUnlocked(progress, lvl.id);
        const solved = lp.solved;

        const num = String(lvl.id).padStart(2, "0");
        const status = solved
          ? "CLEARED"
          : !unlocked
            ? "LOCKED"
            : "OPEN";
        const statusColor = solved
          ? "text-green"
          : !unlocked
            ? "text-muted"
            : "text-amber";

        const inner = (
          <div
            className={`panel p-4 h-full flex flex-col gap-2 transition ${
              unlocked ? "hover:border-[var(--green-dim)]" : "opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-green-dim text-xs">DAY {num}</span>
              <span className={`text-xs ${statusColor}`}>
                {solved ? "✓ " : !unlocked ? "⊘ " : ""}
                {status}
              </span>
            </div>
            <div className="text-green glow text-lg tracking-wide">
              {unlocked ? lvl.title : "█████████"}
            </div>
            <div className="text-muted text-xs flex-1">
              {unlocked ? lvl.tagline : "clear the previous day to unlock"}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{lvl.basePoints} pts</span>
              {solved && (
                <span className="text-green">
                  +{lp.score} · {lp.attempts} tries
                </span>
              )}
            </div>
          </div>
        );

        return unlocked ? (
          <Link key={lvl.id} href={`/play/${lvl.slug}`}>
            {inner}
          </Link>
        ) : (
          <div key={lvl.id} className="cursor-not-allowed">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
