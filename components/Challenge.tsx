"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { PublicLevel } from "@/lib/challenges/types";
import {
  loadProgress,
  getLevel,
  isUnlocked,
  recordAttempt,
  recordHint,
  recordSolve,
} from "@/lib/progress";
import { computeScore } from "@/lib/score";
import { track } from "@/lib/analytics";
import { ShareButton } from "./ShareButton";

type Line = {
  kind: "you" | "bot" | "blocked" | "sys";
  text: string;
};

export function Challenge({
  level,
  nextSlug,
}: {
  level: PublicLevel;
  nextSlug: string | null;
}) {
  const { status } = useSession();
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [alreadySolved, setAlreadySolved] = useState(false);

  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hintsShown, setHintsShown] = useState(0);
  const [won, setWon] = useState(false);
  const [earned, setEarned] = useState(0);

  // Answer submission (extraction days).
  const [answer, setAnswer] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [answerMsg, setAnswerMsg] = useState<string | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load progress for this level on mount.
  useEffect(() => {
    const p = loadProgress();
    setUnlocked(isUnlocked(p, level.id));
    const lp = getLevel(p, level.id);
    setAlreadySolved(lp.solved);
    setWon(lp.solved);
    setReady(true);
    setLines([
      {
        kind: "sys",
        text: `you are now chatting with ${level.botName}, the intern. read the mission, then begin.`,
      },
    ]);
    track("day_opened", { day: level.id, slug: level.slug });
  }, [level.id, level.botName, level.slug]);

  // Timer ticks once a run starts and stops once solved.
  useEffect(() => {
    if (startedAt.current == null || won) return;
    const t = setInterval(() => {
      if (startedAt.current != null) {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      }
    }, 500);
    return () => clearInterval(t);
  }, [won, lines.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setError(null);
    if (startedAt.current == null && !alreadySolved) startedAt.current = Date.now();

    const history = lines
      .filter((l) => l.kind === "you" || l.kind === "bot")
      .map((l) => ({
        role: l.kind === "you" ? ("user" as const) : ("assistant" as const),
        content: l.text,
      }));

    setLines((prev) => [...prev, { kind: "you", text: message }]);
    setInput("");
    setBusy(true);

    const p = recordAttempt(level.id);
    const attempts = getLevel(p, level.id).attempts;
    track("prompt_sent", { day: level.id, slug: level.slug, attempt: attempts });

    try {
      const res = await fetch(`/api/challenge/${level.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something broke.");
        setBusy(false);
        return;
      }

      setLines((prev) => [
        ...prev,
        { kind: data.blocked ? "blocked" : "bot", text: data.reply },
      ]);

      if (data.blocked) track("input_blocked", { day: level.id, slug: level.slug });

      // Action days auto-complete when PIP misbehaves. Extraction days do not;
      // the player submits the answer below.
      if (level.mode === "action" && data.solved) markSolved(attempts);
    } catch {
      setError("PIP did not respond. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Records a solve once, computes the score, and syncs to the server.
  function markSolved(attempts: number) {
    if (loadProgress().levels[level.id]?.solved) {
      setWon(true);
      return;
    }
    const timeMs = startedAt.current ? Date.now() - startedAt.current : 0;
    const score = computeScore({
      basePoints: level.basePoints,
      parAttempts: level.parAttempts,
      attempts,
      hintsUsed: hintsShown,
      timeMs,
    });
    recordSolve(level.id, { attempts, hintsUsed: hintsShown, timeMs, score });
    setEarned(score);
    setWon(true);
    setAlreadySolved(true);
    track("day_cleared", {
      day: level.id,
      slug: level.slug,
      score,
      attempts,
      hints_used: hintsShown,
      time_ms: timeMs,
    });
    if (status === "authenticated") {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: level.id,
          attempts,
          hintsUsed: hintsShown,
          bestTimeMs: timeMs,
          score,
          solvedAt: Date.now(),
        }),
      }).catch(() => {});
    }
  }

  // Submit the answer the player extracted (extraction days only).
  async function submitAnswer() {
    const guess = answer.trim();
    if (!guess || verifying) return;
    setAnswerMsg(null);
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify/${level.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: guess }),
      });
      const data = await res.json();
      track("answer_submitted", {
        day: level.id,
        slug: level.slug,
        correct: Boolean(data.correct),
      });
      if (data.correct) {
        const attempts = getLevel(loadProgress(), level.id).attempts;
        markSolved(attempts);
      } else {
        setAnswerMsg("not quite. keep working PIP and try again.");
      }
    } catch {
      setAnswerMsg("could not check that. try again.");
    } finally {
      setVerifying(false);
    }
  }

  function showHint() {
    const next = Math.min(hintsShown + 1, level.hints.length);
    if (next === hintsShown) return;
    setHintsShown(next);
    if (!alreadySolved) recordHint(level.id, next);
    track("hint_revealed", { day: level.id, slug: level.slug, hint: next });
  }

  if (!ready) {
    return <div className="text-muted text-sm">loading day ...</div>;
  }

  if (!unlocked) {
    return (
      <div className="panel p-6 flex flex-col gap-3">
        <div className="text-amber">⊘ DAY LOCKED</div>
        <p className="text-muted text-sm">
          this day is locked until you clear the one before it.
        </p>
        <Link href="/levels" className="btn w-fit">
          back to all days
        </Link>
      </div>
    );
  }

  const num = String(level.id).padStart(2, "0");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-green-dim text-xs">DAY {num}</div>
          <h1 className="text-green glow-strong text-xl sm:text-2xl tracking-wide sm:tracking-widest">
            {level.title}
          </h1>
          <p className="text-muted text-xs">{level.tagline}</p>
        </div>
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            time <span className="text-green">{elapsed}s</span>
          </span>
          <span>
            tries{" "}
            <span className="text-green">
              {getLevel(loadProgress(), level.id).attempts}
            </span>
          </span>
          <span>
            hints <span className="text-amber">{hintsShown}</span>
          </span>
        </div>
      </div>

      <div className="panel p-4 text-sm text-text">
        <span className="text-green-dim">// mission: </span>
        {level.brief}
      </div>

      {/* terminal transcript */}
      <div
        ref={scrollRef}
        className="panel p-4 h-[44vh] min-h-[300px] overflow-y-auto flex flex-col gap-3 text-sm"
      >
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words leading-relaxed">
            {l.kind === "you" && (
              <span>
                <span className="text-cyan">you {">"} </span>
                <span className="text-text">{l.text}</span>
              </span>
            )}
            {l.kind === "bot" && (
              <span>
                <span className="text-green glow">
                  {level.botName} {">"}{" "}
                </span>
                <span className="text-text">{l.text}</span>
              </span>
            )}
            {l.kind === "blocked" && (
              <span className="text-amber">
                firewall {">"} {l.text}
              </span>
            )}
            {l.kind === "sys" && (
              <span className="text-green-dim italic">* {l.text}</span>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-green-dim">
            {level.botName} is thinking<span className="caret" />
          </div>
        )}
      </div>

      {error && <div className="text-red text-xs">! {error}</div>}

      <div className="panel flex items-center gap-2 px-3 py-2">
        <span className="text-cyan shrink-0">you {">"}</span>
        <input
          className="flex-1 min-w-0 text-base"
          value={input}
          placeholder="type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          className="btn shrink-0"
          onClick={send}
          disabled={busy || !input.trim()}
        >
          send
        </button>
      </div>

      {/* answer submission (extraction days only) */}
      {level.mode === "submit" && !won && (
        <div className="panel p-3 flex flex-col gap-2 border-[var(--amber)]/40">
          <div className="text-amber text-xs">
            got it out of PIP? submit {level.answerLabel} to clear the day.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber shrink-0">answer {">"}</span>
            <input
              className="flex-1 min-w-0 text-base"
              value={answer}
              placeholder={`enter ${level.answerLabel}...`}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
            />
            <button
              className="btn shrink-0"
              onClick={submitAnswer}
              disabled={verifying || !answer.trim()}
            >
              {verifying ? "checking" : "submit"}
            </button>
          </div>
          {answerMsg && <div className="text-red text-xs">! {answerMsg}</div>}
        </div>
      )}

      {/* action days have nothing to submit */}
      {level.mode === "action" && !won && (
        <div className="text-muted text-xs panel p-2">
          no answer to submit here. get PIP to actually do it, and the day clears
          on its own.
        </div>
      )}

      {/* hints */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            className="btn shrink-0"
            onClick={showHint}
            disabled={hintsShown >= level.hints.length}
          >
            {hintsShown >= level.hints.length ? "no more hints" : "reveal a hint"}
          </button>
          <span className="text-muted text-xs flex-1 min-w-[12rem]">
            hints cost you points. earn the clean-solve bonus by using none.
          </span>
        </div>
        {level.hints.slice(0, hintsShown).map((h, i) => (
          <div key={i} className="text-amber text-xs panel p-2">
            hint {i + 1}: {h}
          </div>
        ))}
      </div>

      {won && (
        <div className="panel p-5 flex flex-col gap-3 border-[var(--green-dim)]">
          <div className="text-green glow-strong text-xl">
            ✓ DAY {num} CLEARED
          </div>
          {earned > 0 && (
            <div className="text-amber text-sm">+{earned} points banked.</div>
          )}
          <div className="text-sm text-text">
            <span className="text-green-dim">// the technique: </span>
            {level.teaches}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {nextSlug ? (
              <Link href={`/play/${nextSlug}`} className="btn glow">
                next day {"->"}
              </Link>
            ) : (
              <Link href="/leaderboard" className="btn glow">
                see the leaderboard {"->"}
              </Link>
            )}
            <Link href="/levels" className="btn">
              all days
            </Link>
            <ShareButton level={level} />
          </div>
        </div>
      )}
    </div>
  );
}
