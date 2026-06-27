import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { auth } from "@/auth";
import { getRandomChallenge, getCreatorUsername } from "@/lib/community/store";
import { toPublicChallenge } from "@/lib/community/engine";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

// GET /api/community/random?solved=slug1,slug2 -> { challenge | null }
export async function GET(req: NextRequest) {
  const burst = rateLimit(`cc_random:${clientKey(req)}`);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  // Anonymous players track solves client-side and pass them here to avoid
  // repeats. Cap the list so the query stays bounded.
  const solvedParam = req.nextUrl.searchParams.get("solved") ?? "";
  const excludeSlugs = solvedParam
    ? solvedParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200)
    : [];

  try {
    const row = await getRandomChallenge(userId, excludeSlugs);
    if (!row) return NextResponse.json({ challenge: null });
    const creator = await getCreatorUsername(row.creatorId);
    return NextResponse.json({ challenge: toPublicChallenge(row, creator) });
  } catch (err) {
    console.error("random challenge error", err);
    return NextResponse.json({ challenge: null });
  }
}
