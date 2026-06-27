import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listByCreator, getCreatorUsername } from "@/lib/community/store";
import { toPublicChallenge } from "@/lib/community/engine";

export const runtime = "nodejs";

// The signed-in user's authored challenges, with status and stats. No secrets.
export async function GET() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ rows: [] }, { status: 401 });
  }
  try {
    const rows = await listByCreator(userId);
    const creator = await getCreatorUsername(userId);
    return NextResponse.json({
      rows: rows.map((r) => toPublicChallenge(r, creator)),
    });
  } catch (err) {
    console.error("mine error", err);
    return NextResponse.json({ rows: [] });
  }
}
