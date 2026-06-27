import { NextRequest, NextResponse } from "next/server";
import { db, sql as pg } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/ratelimit";
import { validateUsername } from "@/lib/username";

export const runtime = "nodejs";

// Is a username free? Case-insensitive. The caller's own current handle counts
// as available so the edit form does not flag an unchanged value as taken.
async function isAvailable(value: string, selfId: string | null): Promise<boolean> {
  const rows = await pg<{ id: string }[]>`
    SELECT "id" FROM "users" WHERE lower("username") = lower(${value}) LIMIT 1
  `;
  if (rows.length === 0) return true;
  return selfId != null && rows[0].id === selfId;
}

// GET /api/username?u=foo -> { available: boolean, reason?: string }
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") ?? "";
  const check = validateUsername(u);
  if (!check.ok) {
    return NextResponse.json({ available: false, reason: check.reason });
  }
  const session = await auth().catch(() => null);
  try {
    const available = await isAvailable(check.value, session?.user?.id ?? null);
    return NextResponse.json({
      available,
      reason: available ? undefined : "That username is taken.",
    });
  } catch (err) {
    console.error("username availability check failed", err);
    // Don't claim availability we can't verify.
    return NextResponse.json({ available: false, reason: "Try again." });
  }
}

// POST /api/username { username } -> sets the signed-in user's handle.
export async function POST(req: NextRequest) {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Log in to set a username." },
      { status: 401 }
    );
  }

  // A signed-in user can't spam this; keyed per account.
  const limit = rateLimit(`username:${userId}`);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: `Slow down. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const check = validateUsername(body?.username);
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.reason }, { status: 400 });
  }

  try {
    if (!(await isAvailable(check.value, userId))) {
      return NextResponse.json(
        { ok: false, error: "That username is taken." },
        { status: 409 }
      );
    }
    await db
      .update(users)
      .set({ username: check.value })
      .where(eq(users.id, userId));
    return NextResponse.json({ ok: true, username: check.value });
  } catch (err: unknown) {
    // Unique-violation: someone claimed the same handle between our check and
    // the write. The lower(username) index is the real guard; surface as taken.
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "That username is taken." },
        { status: 409 }
      );
    }
    console.error("username update failed", err);
    return NextResponse.json(
      { ok: false, error: "Could not save that. Try again." },
      { status: 500 }
    );
  }
}
