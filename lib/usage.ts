import { sql } from "./db";

// Postgres-backed spend protection for the OpenRouter-calling route. Unlike an
// in-memory limiter, these counters are shared across serverless instances and
// survive cold starts, so the caps actually hold in production.
//
// Two independent caps, both env-tunable:
//   - per IP per minute: stops one client hammering the model.
//   - global per day: a hard ceiling on total spend, the real backstop against
//     IP spoofing or a swarm of clients. Set this to whatever daily cost you can
//     tolerate. (Remember one request can fan out to ~3 model calls.)
//
// The ultimate guarantee is still a hard credit/spend limit on the OpenRouter
// key itself; this layer keeps you from burning through that limit.

const PER_IP_PER_MIN = Number(process.env.RL_PER_IP_PER_MIN ?? 12);
const GLOBAL_PER_DAY = Number(process.env.RL_GLOBAL_PER_DAY ?? 2000);

type Decision = { ok: boolean; reason?: string; retryAfter?: number };

// Atomically increment the counter for a window key and return the new total.
async function bump(key: string, ttlSeconds: number): Promise<number> {
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const rows = await sql<{ count: number }[]>`
    INSERT INTO api_usage (key, count, "expiresAt")
    VALUES (${key}, 1, ${expires}::timestamptz)
    ON CONFLICT (key) DO UPDATE SET count = api_usage.count + 1
    RETURNING count
  `;
  return Number(rows[0]?.count ?? 1);
}

// Checks (and consumes) one unit of budget. Call once per OpenRouter-backed
// request. Fails OPEN on a DB error so a transient outage does not break the
// game; the OpenRouter account cap remains the hard stop in that case.
export async function checkBudget(ip: string): Promise<Decision> {
  try {
    // Per-IP, per-minute. Window is baked into the key so old windows expire.
    const minute = Math.floor(Date.now() / 60000);
    const ipCount = await bump(`ip:${ip}:${minute}`, 90);
    if (ipCount > PER_IP_PER_MIN) {
      return { ok: false, reason: "Slow down a moment.", retryAfter: 60 };
    }

    // Global, per-day hard ceiling.
    const day = new Date().toISOString().slice(0, 10);
    const globalCount = await bump(`global:${day}`, 90000);
    if (globalCount > GLOBAL_PER_DAY) {
      return {
        ok: false,
        reason: "PIP is overloaded for today. Please come back tomorrow.",
        retryAfter: 3600,
      };
    }

    // Occasionally sweep expired rows so the table stays small.
    if (Math.random() < 0.02) {
      await sql`DELETE FROM api_usage WHERE "expiresAt" < now()`;
    }

    return { ok: true };
  } catch (err) {
    console.error("usage check failed (failing open):", err);
    return { ok: true };
  }
}
