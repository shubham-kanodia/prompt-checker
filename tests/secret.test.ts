import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSecret } from "../lib/community/secret";

test("generates an adjective-noun-NNN secret", () => {
  const s = generateSecret();
  assert.match(s, /^[a-z]+-[a-z]+-\d{3}$/);
});

test("produces varied values", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) seen.add(generateSecret());
  // Should not collapse to a single value across many draws.
  assert.ok(seen.size > 5);
});
