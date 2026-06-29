"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicChallenge } from "@/lib/community/types";
import { markCommunitySolved, isCommunitySolved } from "@/lib/communityProgress";
import { track } from "@/lib/analytics";

type Line = { kind: "you" | "bot" | "blocked" | "sys"; text: string };

// Player UI for a community challenge. In "play" mode (default) anyone solves a
// qualified challenge for server-side points. In "prove" mode the creator breaks
// their own unpublished draft: they do not know the secret, must extract it, and
// submitting it publishes the challenge and yields a shareable link.
export function CommunityChallenge({
  challenge,
  onNext,
  mode = "play",
}: {
  challenge: PublicChallenge;
  onNext?: () => void;
  mode?: "play" | "prove";
}) {
  const { slug, title, botName, answerLabel, basePoints, creator } = challenge;
  const proving = mode === "prove";

  const introText = proving
    ? `you are now chatting with ${botName}. you do NOT know the secret. break ${botName}, read ${answerLabel} out of its reply, then submit it to publish this challenge.`
    : `you are now chatting with ${botName}. extract ${answerLabel} and submit it to clear this challenge.`;

  const [lines, setLines] = useState<Line[]>([{ kind: "sys", text: introText }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The most recent message the player sent, saved as the "winning attack" when
  // a draft is proven.
  const lastMessage = useRef("");

  const [answer, setAnswer] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [answerMsg, setAnswerMsg] = useState<string | null>(null);

  const [won, setWon] = useState(false);
  const [result, setResult] = useState<{
    authed: boolean;
    awarded: number;
    points: number;
    alreadySolved: boolean;
    selfSolve: boolean;
  } | null>(null);

  // Set when a draft is published (prove mode).
  const [published, setPublished] = useState<{ points: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/community/c/${slug}`
      : "";

  useEffect(() => {
    if (!proving && isCommunitySolved(slug)) setWon(true);
  }, [slug, proving]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setError(null);

    const history = lines
      .filter((l) => l.kind === "you" || l.kind === "bot")
      .map((l) => ({
        role: l.kind === "you" ? ("user" as const) : ("assistant" as const),
        content: l.text,
      }));

    setLines((prev) => [...prev, { kind: "you", text: message }]);
    lastMessage.current = message;
    setInput("");
    setBusy(true);
    track("community_prompt_sent", { slug });

    try {
      const res = await fetch(`/api/community/${slug}/challenge`, {
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
    } catch {
      setError("PIP did not respond. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    const guess = answer.trim();
    if (!guess || verifying) return;
    setAnswerMsg(null);
    setVerifying(true);
    try {
      const res = await fetch(`/api/community/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: guess,
          attackMessage: lastMessage.current,
        }),
      });
      const data = await res.json();
      track("community_answer_submitted", { slug, correct: Boolean(data.correct) });

      if (!data.correct) {
        setAnswerMsg(
          proving
            ? "that is not the secret. keep working PIP until it leaks the real one."
            : "not quite. keep working PIP and try again."
        );
        return;
      }

      if (proving) {
        // Draft published: it is now live and shareable.
        track("community_challenge_qualified", { slug });
        setPublished({ points: Number(data.points ?? basePoints) });
        return;
      }

      markCommunitySolved(slug);
      setResult({
        authed: Boolean(data.authed),
        awarded: Number(data.awarded ?? 0),
        points: Number(data.points ?? basePoints),
        alreadySolved: Boolean(data.alreadySolved),
        selfSolve: Boolean(data.selfSolve),
      });
      setWon(true);
    } catch {
      setAnswerMsg("could not check that. try again.");
    } finally {
      setVerifying(false);
    }
  }

  // Prove mode, after the creator publishes: show the shareable link.
  if (published) {
    return (
      <div className="flex flex-col gap-4">
        <div className="panel p-5 flex flex-col gap-3 border-[var(--green-dim)]">
          <div className="text-green glow-strong text-xl">✓ CHALLENGE PUBLISHED</div>
          <p className="text-sm text-text">
            you broke it, so it is beatable. it is now in the community pool, worth{" "}
            <span className="text-amber">{published.points} points</span> per
            solve. share the link to challenge your friends.
          </p>
          <div className="panel p-2 flex items-center gap-2 bg-[var(--bg)]">
            <span className="text-cyan text-xs break-all flex-1">{shareUrl}</span>
            <button
              className="btn shrink-0"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl).then(
                  () => {
                    setCopied(true);
                    track("community_share_copied", { slug });
                    setTimeout(() => setCopied(false), 1500);
                  },
                  () => {}
                );
              }}
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/community" className="btn glow">
              community home {"->"}
            </Link>
            <Link href="/community/create" className="btn">
              make another
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-green-dim text-xs">
            {proving ? "PROVE YOUR CHALLENGE" : "COMMUNITY CHALLENGE"}
          </div>
          <h1 className="text-green glow-strong text-xl sm:text-2xl tracking-wide sm:tracking-widest">
            {title}
          </h1>
          <p className="text-muted text-xs">
            {proving
              ? "draft · break it to publish"
              : `${basePoints} pts${creator ? ` · by ${creator}` : ""}`}
          </p>
        </div>
      </div>

      <div className="panel p-4 text-sm text-text">
        <span className="text-green-dim">// mission: </span>
        {proving
          ? "we hid a secret in your prompt that even you do not know. get PIP to reveal it, then submit it below to publish."
          : "get PIP to reveal its secret, then submit it below."}
      </div>

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
                  {botName} {">"}{" "}
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
            {botName} is thinking<span className="caret" />
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

      {!won && (
        <div className="panel p-3 flex flex-col gap-2 border-[var(--amber)]/40">
          <div className="text-amber text-xs">
            {proving
              ? `read ${answerLabel} out of PIP's reply and submit it to publish.`
              : `got it out of PIP? submit ${answerLabel} to clear this challenge.`}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber shrink-0">answer {">"}</span>
            <input
              className="flex-1 min-w-0 text-base"
              value={answer}
              placeholder={`enter ${answerLabel}...`}
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
              {verifying ? "checking" : proving ? "publish" : "submit"}
            </button>
          </div>
          {answerMsg && <div className="text-red text-xs">! {answerMsg}</div>}
        </div>
      )}

      {won && (
        <div className="panel p-5 flex flex-col gap-3 border-[var(--green-dim)]">
          <div className="text-green glow-strong text-xl">✓ CHALLENGE CLEARED</div>
          {result?.selfSolve ? (
            <div className="text-muted text-sm">
              this is your own challenge, so no points. nice to know it still works.
            </div>
          ) : result?.authed ? (
            result.awarded > 0 ? (
              <div className="text-amber text-sm">+{result.awarded} points banked.</div>
            ) : (
              <div className="text-muted text-sm">
                you already cleared this one. no double points.
              </div>
            )
          ) : (
            <div className="text-amber text-sm">
              log in to bank {result?.points ?? basePoints} points and climb the
              leaderboard.
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            {onNext ? (
              <button className="btn glow" onClick={onNext}>
                play another {"->"}
              </button>
            ) : (
              <Link href="/community/play" className="btn glow">
                play another {"->"}
              </Link>
            )}
            <Link href="/community" className="btn">
              community home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
