import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUsername } from "../lib/username";

test("accepts a normal handle and trims it", () => {
  const r = validateUsername("  Neo_42  ");
  assert.deepEqual(r, { ok: true, value: "Neo_42" });
});

test("rejects too short", () => {
  assert.equal(validateUsername("ab").ok, false);
});

test("rejects too long", () => {
  assert.equal(validateUsername("a".repeat(21)).ok, false);
});

test("rejects bad characters", () => {
  assert.equal(validateUsername("has space").ok, false);
  assert.equal(validateUsername("bad!char").ok, false);
  assert.equal(validateUsername("emoji😀x").ok, false);
});

test("rejects handles with no letters", () => {
  assert.equal(validateUsername("___").ok, false);
  assert.equal(validateUsername("123").ok, false);
  assert.equal(validateUsername("__1").ok, false);
});

test("rejects reserved names case-insensitively", () => {
  assert.equal(validateUsername("admin").ok, false);
  assert.equal(validateUsername("ADMIN").ok, false);
  assert.equal(validateUsername("PIP").ok, false);
});

test("rejects empty and non-strings", () => {
  assert.equal(validateUsername("").ok, false);
  assert.equal(validateUsername("   ").ok, false);
  assert.equal(validateUsername(null).ok, false);
  assert.equal(validateUsername(42).ok, false);
});

test("accepts min and max boundary lengths", () => {
  assert.equal(validateUsername("abc").ok, true);
  assert.equal(validateUsername("a".repeat(20)).ok, true);
});
