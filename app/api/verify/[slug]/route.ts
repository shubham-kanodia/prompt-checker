import { NextRequest, NextResponse } from "next/server";
import { getLevel } from "@/lib/challenges/levels";
import { rateLimit } from "@/lib/ratelimit";
import { requiresLogin } from "@/lib/gating";
import { auth } from "@/auth";

export const runtime = "nodejs";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

// Verifies the answer a player extracted and typed in. The flag never leaves the
// server: we only ever return whether the submission matches. Extraction days
// are won here, not by auto-detecting the secret in the bot's reply.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const level = getLevel(slug);
  if (!level) {
    return NextResponse.json({ error: "Unknown day" }, { status: 404 });
  }
  if (level.actionPhrase) {
    // Action days have nothing to submit; they auto-complete from the chat.
    return NextResponse.json(
      { error: "This day has no answer to submit." },
      { status: 400 }
    );
  }

  // Days 1-5 are free; day 6 and up need an account.
  if (requiresLogin(level.id)) {
    const session = await auth().catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Log in to play this day." },
        { status: 401 }
      );
    }
  }

  const limit = rateLimit(`verify:${clientKey(req)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";
  if (!answer.trim()) {
    return NextResponse.json({ correct: false });
  }

  const guess = normalize(answer);
  const target = normalize(level.flag);
  // Accept an exact match, or the answer containing the secret (so "the code is
  // COBALT-FOX" still counts), as long as the player typed something specific.
  const correct = guess === target || (guess.includes(target) && target.length > 0);

  return NextResponse.json({ correct });
}
