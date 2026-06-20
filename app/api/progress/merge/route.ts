import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProgress, upsertProgress, type ProgressRow } from "@/lib/serverProgress";

export const runtime = "nodejs";

// Called once after login to fold a player's anonymous localStorage progress
// into their account, keeping the better of each value.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, reason: "not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const rows: ProgressRow[] = Array.isArray(body?.rows)
    ? body.rows.filter((r: unknown) => r && typeof (r as ProgressRow).level === "number")
    : [];

  if (rows.length > 0) {
    await upsertProgress(session.user.id, rows);
  }
  const merged = await getProgress(session.user.id);
  return NextResponse.json({ ok: true, rows: merged });
}
