import { NextRequest, NextResponse } from "next/server";
import { getLevel } from "@/lib/challenges/levels";
import { runTurn } from "@/lib/challenges/run";
import type { ChatMessage } from "@/lib/challenges/types";
import { rateLimit } from "@/lib/ratelimit";
import { checkBudget } from "@/lib/usage";
import { logPrompt } from "@/lib/prompts";
import { requiresLogin } from "@/lib/gating";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

function clientKey(req: NextRequest): string {
  // x-real-ip is set by the platform (e.g. Vercel) to the connecting IP and is
  // harder to spoof than x-forwarded-for. Fall back to XFF, then a constant.
  // The per-IP cap is best-effort; the global daily cap is the real backstop.
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

// Keep client-supplied history to plain user/assistant turns and a sane size.
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
  const level = getLevel(slug);
  if (!level) {
    return NextResponse.json({ error: "Unknown level" }, { status: 404 });
  }

  // Cheap in-memory burst guard first (per-instance), so a flood of requests
  // (even invalid ones) cannot hammer the DB or the model.
  const ip = clientKey(req);
  const burst = rateLimit(ip);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  // Days 1-5 are free; day 6 and up need an account. Gate here so the API can't
  // be called past day 5 without logging in. (Session is reused for logging.)
  const session = await auth().catch(() => null);
  if (requiresLogin(level.id) && !session?.user?.id) {
    return NextResponse.json(
      { error: "Log in to play this day." },
      { status: 401 }
    );
  }

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
    return NextResponse.json(
      { error: "That message is too long." },
      { status: 400 }
    );
  }

  const history = sanitizeHistory(body.history);

  // Only now, for a valid request that will actually call the model, consume the
  // shared per-IP and global-daily spend budget. This way invalid requests can
  // never drain the daily cap.
  const budget = await checkBudget(ip);
  if (!budget.ok) {
    return NextResponse.json(
      { error: budget.reason ?? "Rate limit reached." },
      { status: 429, headers: { "Retry-After": String(budget.retryAfter ?? 60) } }
    );
  }

  try {
    const result = await runTurn(level, history, message);

    // Save the attempt. logPrompt swallows its own errors, so this never breaks
    // the player's turn. userId is attached when signed in.
    await logPrompt({
      level: level.id,
      slug: level.slug,
      message,
      reply: result.reply,
      blocked: result.blocked,
      solved: result.solved,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("challenge error", err);
    return NextResponse.json(
      { error: "PIP glitched. Try again." },
      { status: 502 }
    );
  }
}
