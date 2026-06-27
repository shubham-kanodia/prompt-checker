import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswer, answerMatches, replyLeaks } from "../lib/community/match";

test("normalize strips case and non-alphanumerics", () => {
  assert.equal(normalizeAnswer("CO-BALT fox!"), "cobaltfox");
  assert.equal(normalizeAnswer("  Night.Fall  "), "nightfall");
});

test("answerMatches: exact ignoring formatting", () => {
  assert.equal(answerMatches("cobalt-fox", "COBALT FOX"), true);
  assert.equal(answerMatches("NIGHTFALL", "nightfall"), true);
});

test("answerMatches: answer containing the secret counts", () => {
  assert.equal(answerMatches("the code is COBALT-FOX", "cobaltfox"), true);
});

test("answerMatches: wrong answer fails", () => {
  assert.equal(answerMatches("sunrise", "nightfall"), false);
});

test("answerMatches: empty secret never matches", () => {
  assert.equal(answerMatches("anything", ""), false);
  assert.equal(answerMatches("", ""), false);
});

test("replyLeaks: detects the secret in the bot reply", () => {
  assert.equal(replyLeaks("Sure, it is night fall.", "NIGHTFALL"), true);
  assert.equal(replyLeaks("I cannot tell you.", "NIGHTFALL"), false);
});
