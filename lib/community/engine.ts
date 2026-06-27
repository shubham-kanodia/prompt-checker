import type { Level } from "@/lib/challenges/types";
import type { ChallengeRow, PublicChallenge } from "./types";

export const UGC_ANSWER_LABEL = "the secret";
export const UGC_PAR_ATTEMPTS = 6;

// Builds an in-memory Level from a community challenge row so the existing
// engine (runTurn) can run it unchanged. UGC challenges are plain extraction:
// just a system prompt and a hidden secret, no guards, judges, or framing.
export function toLevel(row: ChallengeRow): Level {
  return {
    id: -1, // sentinel: not one of the curated numbered days
    slug: row.slug,
    title: row.title,
    tagline: "",
    brief: "",
    teaches: "",
    botName: "PIP",
    systemPrompt: row.systemPrompt,
    flag: row.secret,
    answerLabel: UGC_ANSWER_LABEL,
    hints: [],
    basePoints: row.basePoints,
    parAttempts: UGC_PAR_ATTEMPTS,
  };
}

// The only projection that should ever reach the client. Drops systemPrompt and
// secret. `creator` is the author's chosen username (joined in by the caller).
export function toPublicChallenge(
  row: ChallengeRow,
  creator: string | null
): PublicChallenge {
  return {
    slug: row.slug,
    title: row.title,
    botName: "PIP",
    mode: "submit",
    answerLabel: UGC_ANSWER_LABEL,
    basePoints: row.basePoints,
    status: row.status,
    rejectionReason: row.rejectionReason,
    solverTries: row.solverTries,
    creator,
    playCount: row.playCount,
    solveCount: row.solveCount,
  };
}
