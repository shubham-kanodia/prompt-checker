// Pure, dependency-free username rules. Shared by the client (inline feedback)
// and the server (the authority). Keep it side-effect free so it is trivially
// unit-testable with `node --test`.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

// Handles that would be confusing or impersonating on the leaderboard. Compared
// case-insensitively. Keep this short and obvious; it is not a profanity engine.
const RESERVED = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "anonymous",
  "anon",
  "system",
  "root",
  "pip",
  "breaktheprompt",
  "null",
  "undefined",
  "you",
  "me",
]);

export type UsernameCheck =
  | { ok: true; value: string }
  | { ok: false; reason: string };

// Validates and canonicalizes a raw username. The returned `value` is what we
// store (trimmed, original casing preserved); uniqueness is enforced
// case-insensitively at the database layer via a lower(username) index.
export function validateUsername(raw: unknown): UsernameCheck {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Enter a username." };
  }
  const value = raw.trim();
  if (value.length === 0) {
    return { ok: false, reason: "Enter a username." };
  }
  if (value.length < USERNAME_MIN) {
    return { ok: false, reason: `At least ${USERNAME_MIN} characters.` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, reason: `At most ${USERNAME_MAX} characters.` };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return { ok: false, reason: "Letters, numbers, and underscores only." };
  }
  if (!/[a-zA-Z]/.test(value)) {
    return { ok: false, reason: "Include at least one letter." };
  }
  if (RESERVED.has(value.toLowerCase())) {
    return { ok: false, reason: "That username is reserved." };
  }
  return { ok: true, value };
}
