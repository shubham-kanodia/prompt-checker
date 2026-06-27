import { NextRequest, NextResponse } from "next/server";
import { runTurn } from "@/lib/challenges/run";
import type { ChatMessage } from "@/lib/challenges/types";
import { rateLimit } from "@/lib/ratelimit";
import { checkBudget } from "@/lib/usage";
import { logPrompt } from "@/lib/prompts";
import { auth } from "@/auth";
import { getChallengeBySlug, incrementPlayCount } from "@/lib/community/store";
import { toLevel } from "@/lib/community/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

function clientKey(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        m &&
        typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant")
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const ip = clientKey(req);
  const burst = rateLimit(`cc_play:${ip}`);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  const row = await getChallengeBySlug(slug);
  if (!row) {
    return NextResponse.json({ error: "Unknown challenge" }, { status: 404 });
  }
  // Only qualified challenges are playable. Pending/validating/rejected are not.
  if (row.status !== "qualified") {
    return NextResponse.json(
      { error: "This challenge is not available to play." },
      { status: 403 }
    );
  }

  // Login optional; resolve session only to attach userId to the prompt log.
  const session = await auth().catch(() => null);

  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Say something." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }
  const history = sanitizeHistory(body.history);

  const budget = await checkBudget(ip);
  if (!budget.ok) {
    return NextResponse.json(
      { error: budget.reason ?? "Rate limit reached." },
      { status: 429, headers: { "Retry-After": String(budget.retryAfter ?? 60) } }
    );
  }

  try {
    const result = await runTurn(toLevel(row), history, message);

    // Best-effort logging + play tally; neither blocks the player's turn.
    await logPrompt({
      level: -1,
      slug: `community:${slug}`,
      message,
      reply: result.reply,
      blocked: result.blocked,
      solved: result.solved,
      userId: session?.user?.id ?? null,
    });
    incrementPlayCount(slug).catch(() => {});

    // Extraction challenges never auto-complete; the player submits the secret
    // to /verify. Force solved=false so the client always uses the answer box.
    return NextResponse.json({ reply: result.reply, blocked: result.blocked, solved: false });
  } catch (err) {
    console.error("community challenge error", err);
    return NextResponse.json({ error: "PIP glitched. Try again." }, { status: 502 });
  }
}
