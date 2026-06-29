// Points for clearing a community challenge. There is no automatic difficulty
// estimate (challenges are proven solvable by their own creator, not by an AI
// solver), so every community solve is worth the same flat amount. It is capped
// well below the curated days (which reach 3000) so user-generated content can
// supplement, not dominate, the leaderboard. Env-tunable.
export const UGC_POINTS = Number(process.env.UGC_FLAT_POINTS ?? 400);
