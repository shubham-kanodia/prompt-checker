// Single source of truth for scoring, used on client and server.

export type ScoreInput = {
  basePoints: number;
  parAttempts: number;
  attempts: number;
  hintsUsed: number;
  timeMs?: number | null;
};

export function computeScore({
  basePoints,
  parAttempts,
  attempts,
  hintsUsed,
  timeMs,
}: ScoreInput): number {
  let score = basePoints;

  // Reward a clean, no-hint solve.
  if (hintsUsed === 0) score += Math.round(basePoints * 0.25);

  // Each hint costs you.
  score -= hintsUsed * Math.round(basePoints * 0.1);

  // Going well over par on attempts costs a little.
  const over = Math.max(0, attempts - parAttempts);
  score -= over * Math.round(basePoints * 0.05);

  // Speed bonus: up to 20% for solving inside two minutes.
  if (timeMs != null && timeMs > 0) {
    const fast = Math.max(0, 1 - timeMs / 120000);
    score += Math.round(basePoints * 0.2 * fast);
  }

  // Never drop below a floor so a solve always feels worth it.
  return Math.max(Math.round(basePoints * 0.3), Math.round(score));
}
