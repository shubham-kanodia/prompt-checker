import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// Short, URL-safe, hard-to-guess id for the shareable challenge link. 8 chars of
// base36 is ~2.8e12 space, plenty against collision; the unique index on slug is
// the real guard, and the create route retries on the rare clash.
export function makeSlug(len = 8): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}
