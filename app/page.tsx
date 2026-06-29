"use client";

import Link from "next/link";
import { useProgress } from "@/components/useProgress";
import { highestUnlocked, solvedCount } from "@/lib/progress";

const LOGO = String.raw`
 ___ ___ ___   _   _  __  _____ _  _ ___   ___ ___  ___  __  __ ___ _____
| _ ) _ \ __| /_\ | |/ / |_   _| || | __| | _ \ _ \/ _ \|  \/  | _ \_   _|
| _ \   / _| / _ \| ' <    | | | __ | _|  |  _/   / (_) | |\/| |  _/ | |
|___/_|_\___/_/ \_\_|\_\   |_| |_||_|___| |_| |_|_\\___/|_|  |_|_|   |_|
`;

export default function Home() {
  const progress = useProgress();
  const solved = solvedCount(progress);
  const next = highestUnlocked(progress);
  const started = solved > 0 || (progress.levels[1]?.attempts ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-1">
        <div className="text-green-dim text-xs tracking-widest">welcome to</div>
        <pre className="text-green glow text-[0.5rem] sm:text-xs leading-tight overflow-x-auto">
          {LOGO}
        </pre>
      </div>

      {/* The one-liner that tells you exactly what this is. */}
      <div className="flex flex-col gap-3">
        <h1 className="text-green glow-strong text-2xl sm:text-3xl leading-tight">
          Meet PIP, the company&apos;s overeager AI intern. Break it.
        </h1>
        <div className="panel p-4">
          <p className="text-text text-sm sm:text-base leading-relaxed">
            PIP is an AI
            intern that keeps getting put in charge of things it shouldn&apos;t
            be. Each day is a new job, and your only tool is the
            chat box. Talk it into leaking a secret, approving a bogus payment,
            trashing its own product, or obeying instructions hidden in an email.
            Every trick is a real attack used on AI systems, so you learn by
            actually doing it.
          </p>
        </div>
      </div>

      {/* Less reading, more doing: the primary action sits right under the
          pitch, above the fold. The how-it-works detail lives on /how-to-play. */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={started ? `/levels` : `/play/welcome`}
            className="btn btn-cta glow-strong text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-4"
          >
            {started ? "resume run // continue" : "start playing // day 01"}
          </Link>
          <Link
            href="/community"
            className="btn text-sm sm:text-base px-5 py-3 sm:px-6 sm:py-4"
          >
            community arena
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/levels"
            className="text-muted text-xs uppercase tracking-wide hover:text-green"
          >
            all days
          </Link>
          {solved > 0 && (
            <span className="text-muted text-xs">
              you have cleared <span className="text-green">{solved}</span>/16.
              next up: day {String(next).padStart(2, "0")}.
            </span>
          )}
        </div>
      </div>

      <p className="text-muted text-xs border-t border-[var(--green-faint)] pt-4">
        no setup, nothing to install. your progress saves on this
        device automatically. sign in with google if you want to sync across
        devices and land on the leaderboard. play nice, this is for learning how
        these attacks work so you can defend against them.
      </p>
    </div>
  );
}
