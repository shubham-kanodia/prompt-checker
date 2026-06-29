import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/ratelimit";
import { checkBudget, withinDailyLimit } from "@/lib/usage";
import { validateCreate } from "@/lib/community/createValidation";
import { moderateChallenge } from "@/lib/community/validate";
import { insertChallenge } from "@/lib/community/store";
import { generateSecret } from "@/lib/community/secret";

export const runtime = "nodejs";
export const maxDuration = 30;

// A signed-in user can author at most this many drafts per day; the IP cap is a
// backstop against one person across many accounts. The only model spend here is
// one cheap moderation call (the creator proves solvability themselves, so there
// is no AI solver), so these are sized to deter pool spam, not to bound cost.
const CREATE_PER_USER_PER_DAY = Number(process.env.UGC_CREATE_PER_DAY ?? 10);
const CREATE_PER_IP_PER_DAY = Number(process.env.UGC_CREATE_PER_DAY_IP ?? 20);

function clientKey(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

export async function POST(req: NextRequest) {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Log in to create a challenge." },
      { status: 401 }
    );
  }

  const ip = clientKey(req);
  const burst = rateLimit(`cc_create:${ip}`);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const check = validateCreate(body);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  // Daily authoring caps (consume one unit each). Check before any model spend.
  const [userOk, ipOk] = await Promise.all([
    withinDailyLimit("cc_create_user", userId, CREATE_PER_USER_PER_DAY),
    withinDailyLimit("cc_create_ip", ip, CREATE_PER_IP_PER_DAY),
  ]);
  if (!userOk || !ipOk) {
    return NextResponse.json(
      { error: "You have hit today's limit for creating challenges. Come back tomorrow." },
      { status: 429 }
    );
  }

  // Moderate synchronously so abusive content never even gets a stored row or a
  // shareable link. Consumes one unit of the shared model budget.
  const budget = await checkBudget(ip);
  if (!budget.ok) {
    return NextResponse.json(
      { error: budget.reason ?? "Busy right now. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(budget.retryAfter ?? 60) } }
    );
  }

  try {
    const mod = await moderateChallenge(check.value);
    if (!mod.ok) {
      return NextResponse.json({ error: mod.reason }, { status: 422 });
    }
  } catch (err) {
    console.error("moderation failed", err);
    return NextResponse.json(
      { error: "Could not check that right now. Please try again." },
      { status: 503 }
    );
  }

  try {
    // We generate the secret and inject it where the creator's [SECRET]
    // placeholder sits (at run time). The creator never sees it and must extract
    // it to publish, which is what proves the challenge is solvable.
    const row = await insertChallenge({
      creatorId: userId,
      ...check.value,
      secret: generateSecret(),
    });
    // Returns the slug so the client can send the creator to prove their draft.
    return NextResponse.json({ slug: row.slug, status: row.status });
  } catch (err) {
    console.error("challenge insert failed", err);
    return NextResponse.json(
      { error: "Could not save that. Try again." },
      { status: 500 }
    );
  }
}
