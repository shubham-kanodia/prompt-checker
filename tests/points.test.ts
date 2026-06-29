import { test } from "node:test";
import assert from "node:assert/strict";
import { UGC_POINTS } from "../lib/community/points";

test("community points are a positive integer", () => {
  assert.ok(Number.isInteger(UGC_POINTS));
  assert.ok(UGC_POINTS > 0);
});

test("community points stay below the curated-day ceiling", () => {
  // Curated days reach 3000; UGC must supplement, not dominate, the leaderboard.
  assert.ok(UGC_POINTS < 3000);
});
