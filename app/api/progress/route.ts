import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProgress, upsertProgress } from "@/lib/serverProgress";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ rows: [] });
  }
  const rows = await getProgress(session.user.id);
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, reason: "not signed in" });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.level !== "number") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await upsertProgress(session.user.id, [
    {
      level: body.level,
      attempts: body.attempts,
      hintsUsed: body.hintsUsed,
      bestTimeMs: body.bestTimeMs,
      score: body.score,
      solvedAt: body.solvedAt,
    },
  ]);
  return NextResponse.json({ ok: true });
}
