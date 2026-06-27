import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { auth } from "@/auth";
import { answerMatches } from "@/lib/community/match";
import { getChallengeBySlug, recordCommunitySolve } from "@/lib/community/store";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const limit = rateLimit(`cc_verify:${clientKey(req)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  const row = await getChallengeBySlug(slug);
  if (!row) {
    return NextResponse.json({ error: "Unknown challenge" }, { status: 404 });
  }
  if (row.status !== "qualified") {
    return NextResponse.json(
      { error: "This challenge is not available." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";
  if (!answer.trim() || !answerMatches(answer, row.secret)) {
    return NextResponse.json({ correct: false });
  }

  // Correct. Points are awarded ENTIRELY server-side (the client never supplies
  // a score) and only to signed-in players, once per challenge.
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({
      correct: true,
      authed: false,
      points: row.basePoints,
      awarded: 0,
    });
  }

  let firstTime = false;
  try {
    firstTime = await recordCommunitySolve(userId, row.id, row.basePoints);
  } catch (err) {
    console.error("recordCommunitySolve failed", err);
  }
  return NextResponse.json({
    correct: true,
    authed: true,
    points: row.basePoints,
    awarded: firstTime ? row.basePoints : 0,
    alreadySolved: !firstTime,
  });
}
