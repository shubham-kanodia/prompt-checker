// Lightweight in-memory token bucket to cap OpenRouter spend. Good enough for a
// single instance / local dev. For multi-instance production, back this with a
// shared store (e.g. a Postgres counter or Redis).

type Bucket = { tokens: number; updated: number };

const buckets = new Map<string, Bucket>();

const CAPACITY = 20; // burst
const REFILL_PER_SEC = 20 / 60; // ~20 requests per minute sustained

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: CAPACITY, updated: now };
  const elapsed = (now - b.updated) / 1000;
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_SEC);
  b.updated = now;

  if (b.tokens < 1) {
    buckets.set(key, b);
    const retryAfter = Math.ceil((1 - b.tokens) / REFILL_PER_SEC);
    return { ok: false, retryAfter };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}
