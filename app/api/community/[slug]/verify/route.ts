import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { auth } from "@/auth";
import { answerMatches } from "@/lib/community/match";
import {
  getChallengeBySlug,
  recordCommunitySolve,
  publishProvenDraft,
} from "@/lib/community/store";
import { UGC_POINTS } from "@/lib/community/points";

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
  if (row.status !== "qualified" && row.status !== "draft") {
    return NextResponse.json(
      { error: "This challenge is not available." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";
  const matched = answer.trim() && answerMatches(answer, row.secret);

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  // --- Draft proof: the creator extracting their own secret to publish. ---
  if (row.status === "draft") {
    // Only the owner can prove a draft.
    if (!userId || userId !== row.creatorId) {
      return NextResponse.json(
        { error: "This challenge is not available." },
        { status: 403 }
      );
    }
    if (!matched) {
      return NextResponse.json({ correct: false });
    }
    // The exact message that beat PIP, kept so the creator can see how it fell.
    const attack =
      typeof body?.attackMessage === "string"
        ? body.attackMessage.trim().slice(0, 4000) || null
        : null;
    let published = false;
    try {
      published = await publishProvenDraft(
        slug,
        userId,
        UGC_POINTS,
        row.playCount, // proof attempts during the draft phase
        attack
      );
    } catch (err) {
      console.error("publishProvenDraft failed", err);
      return NextResponse.json(
        { error: "Could not publish that. Try once more." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      correct: true,
      qualified: true,
      slug,
      points: UGC_POINTS,
    });
  }

  // --- Normal play of a qualified challenge. ---
  if (!matched) {
    return NextResponse.json({ correct: false });
  }

  // Anonymous solve: correct, but nothing to bank.
  if (!userId) {
    return NextResponse.json({
      correct: true,
      authed: false,
      points: row.basePoints,
      awarded: 0,
    });
  }

  // Creators do not earn points for solving their own challenge.
  if (userId === row.creatorId) {
    return NextResponse.json({
      correct: true,
      authed: true,
      selfSolve: true,
      points: row.basePoints,
      awarded: 0,
    });
  }

  // Points are awarded ENTIRELY server-side (the client never supplies a score)
  // and only once per challenge per player.
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
