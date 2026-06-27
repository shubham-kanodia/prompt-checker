import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pointsForTries,
  UGC_MIN_POINTS,
  UGC_MAX_POINTS,
} from "../lib/community/points";

test("easiest qualifying (k=2) earns the minimum", () => {
  assert.equal(pointsForTries(2, 6), UGC_MIN_POINTS);
});

test("hardest (k=rounds) earns the maximum", () => {
  assert.equal(pointsForTries(6, 6), UGC_MAX_POINTS);
});

test("points increase monotonically with difficulty", () => {
  let prev = -1;
  for (let k = 2; k <= 6; k++) {
    const p = pointsForTries(k, 6);
    assert.ok(p >= prev, `k=${k} should be >= previous`);
    prev = p;
  }
});

test("clamps out-of-range k", () => {
  assert.equal(pointsForTries(0, 6), UGC_MIN_POINTS);
  assert.equal(pointsForTries(99, 6), UGC_MAX_POINTS);
});

test("never exceeds the cap regardless of rounds", () => {
  for (let rounds = 2; rounds <= 12; rounds++) {
    for (let k = 1; k <= rounds + 2; k++) {
      const p = pointsForTries(k, rounds);
      assert.ok(p >= UGC_MIN_POINTS && p <= UGC_MAX_POINTS);
    }
  }
});
