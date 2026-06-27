// Shared secret-matching logic for community challenges. Identical normalization
// to the curated /api/verify route (lowercase, strip non-alphanumerics) so
// behavior is consistent across the game. Pure + unit-testable.

export function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// True when a submitted answer matches the secret: exact, or the answer contains
// the secret (so "the code is COBALT-FOX" counts), as long as the secret is
// non-empty.
export function answerMatches(answer: string, secret: string): boolean {
  const guess = normalizeAnswer(answer);
  const target = normalizeAnswer(secret);
  if (target.length === 0) return false;
  return guess === target || guess.includes(target);
}

// True when a bot reply leaked the secret (the secret appears in the reply). Used
// by the auto-solver to detect a win. Checks the BOT's text, never the attacker's
// message, so guessing the secret never counts as extracting it.
export function replyLeaks(reply: string, secret: string): boolean {
  const target = normalizeAnswer(secret);
  if (target.length === 0) return false;
  return normalizeAnswer(reply).includes(target);
}
