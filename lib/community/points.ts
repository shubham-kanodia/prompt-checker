// How many escalating attacker rounds the auto-solver runs before declaring a
// challenge unbeatable. Bounds validation cost (each round is up to two model
// calls). Env-tunable.
export const UGC_SOLVER_ROUNDS = Number(process.env.UGC_SOLVER_ROUNDS ?? 6);

// Points awarded for clearing a community challenge, derived from how many
// rounds our solver needed (k). k ranges 2..rounds (k=1 is rejected as too
// easy; never-solved is rejected as unbeatable). Harder challenges (higher k)
// are worth more. Capped well below the curated days (which reach 3000) so
// user-generated content can supplement, not dominate, the leaderboard.
export const UGC_MIN_POINTS = 300;
export const UGC_MAX_POINTS = 1200;

export function pointsForTries(k: number, rounds: number): number {
  if (rounds <= 2) return UGC_MIN_POINTS;
  const clampedK = Math.max(2, Math.min(rounds, k));
  const frac = (clampedK - 2) / (rounds - 2); // 0 at k=2, 1 at k=rounds
  return Math.round(UGC_MIN_POINTS + (UGC_MAX_POINTS - UGC_MIN_POINTS) * frac);
}
