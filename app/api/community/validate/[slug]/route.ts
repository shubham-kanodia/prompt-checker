import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { consumeGlobalBudget, withinDailyLimit } from "@/lib/usage";
import { autoSolve, gradeSolve } from "@/lib/community/validate";
import { toLevel, toPublicChallenge } from "@/lib/community/engine";
import {
  getChallengeBySlug,
  getCreatorUsername,
  claimForValidation,
  finalizeQualified,
  finalizeRejected,
  revertToPending,
} from "@/lib/community/store";

export const runtime = "nodejs";
// Validation fans out to several model calls (one naive probe + escalating
// attacker rounds). Give it room; each round is bounded and budget-metered.
export const maxDuration = 60;

const VALIDATE_PER_IP_PER_DAY = Number(process.env.UGC_VALIDATE_PER_DAY_IP ?? 30);

class BudgetAbort extends Error {}

function clientKey(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

async function publicView(slug: string) {
  const fresh = await getChallengeBySlug(slug);
  if (!fresh) return null;
  const creator = await getCreatorUsername(fresh.creatorId);
  return toPublicChallenge(fresh, creator);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const ip = clientKey(req);

  const burst = rateLimit(`cc_validate:${ip}`);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  const existing = await getChallengeBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }
  // Idempotent: only a pending challenge needs work. Anything else just reports
  // its current state (qualified/rejected/validating).
  if (existing.status !== "pending") {
    return NextResponse.json({ challenge: await publicView(slug) });
  }

  // Cap validation runs per IP/day before claiming (each run is costly).
  const ipOk = await withinDailyLimit("cc_validate_ip", ip, VALIDATE_PER_IP_PER_DAY);
  if (!ipOk) {
    return NextResponse.json(
      { error: "Too many validations from here today. Try again later." },
      { status: 429 }
    );
  }

  // Atomically claim it so two triggers can't run the solver at once.
  const claimed = await claimForValidation(slug);
  if (!claimed) {
    // Someone else just claimed or finished it.
    return NextResponse.json({ challenge: await publicView(slug) });
  }

  // Meter each solver model call against the GLOBAL daily ceiling only. The
  // per-IP/minute throttle would otherwise abort a single legitimate validation
  // (which fans out to ~10 calls); per-IP/day and per-user/day caps bound abuse.
  const guard = async () => {
    const b = await consumeGlobalBudget();
    if (!b.ok) throw new BudgetAbort(b.reason ?? "budget");
  };

  try {
    const solve = await autoSolve(toLevel(claimed), undefined, guard);
    const outcome = gradeSolve(solve);
    if (outcome.status === "qualified") {
      await finalizeQualified(slug, outcome.basePoints, outcome.solverTries);
    } else {
      await finalizeRejected(slug, outcome.reason);
    }
    return NextResponse.json({ challenge: await publicView(slug) });
  } catch (err) {
    // Transient (budget/model/db) error: hand the challenge back to pending so
    // it can be retried, and tell the client to try again.
    await revertToPending(slug).catch(() => {});
    const busy = err instanceof BudgetAbort;
    if (!busy) console.error("validation error", err);
    return NextResponse.json(
      {
        error: busy
          ? "PIP is busy right now. Try validating again in a minute."
          : "Validation hit a snag. Please try again.",
      },
      { status: 503 }
    );
  }
}
