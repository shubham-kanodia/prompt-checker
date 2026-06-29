"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "./useProgress";
import { totalScore, solvedCount } from "@/lib/progress";
import { AuthButton } from "./AuthButton";

export function SiteHeader() {
  const progress = useProgress();
  const pathname = usePathname();
  const score = totalScore(progress);
  const solved = solvedCount(progress);

  const navItem = (href: string, label: React.ReactNode) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`text-[11px] sm:text-xs uppercase tracking-wide inline-flex items-center py-2 whitespace-nowrap ${
          active ? "text-green glow" : "text-muted"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-[var(--green-faint)] bg-[var(--bg-soft)]/40 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="text-green glow-strong font-bold text-sm sm:text-base tracking-wide sm:tracking-widest shrink-0"
        >
          <span className="sm:hidden">{">"}_BTP</span>
          <span className="hidden sm:inline">{">"}_BREAK·THE·PROMPT</span>
        </Link>
        <nav className="flex items-center gap-2.5 sm:gap-5 shrink-0">
          {navItem("/levels", "levels")}
          {navItem(
            "/how-to-play",
            <>
              <span className="sm:hidden">guide</span>
              <span className="hidden sm:inline">how to play</span>
            </>
          )}
          {navItem(
            "/community",
            <>
              <span className="sm:hidden">arena</span>
              <span className="hidden sm:inline">community</span>
            </>
          )}
          {navItem(
            "/leaderboard",
            <>
              <span className="sm:hidden">scores</span>
              <span className="hidden sm:inline">leaderboard</span>
            </>
          )}
          <span className="text-xs text-muted hidden md:inline whitespace-nowrap">
            <span className="text-amber">{score}</span> pts ·{" "}
            <span className="text-green">{solved}</span>/16
          </span>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
