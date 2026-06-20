import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userProgress } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db
      .select({
        name: users.name,
        image: users.image,
        score: sql<number>`coalesce(sum(${userProgress.score}), 0)`.as("score"),
        solved: sql<number>`count(*) filter (where ${userProgress.solvedAt} is not null)`.as(
          "solved"
        ),
      })
      .from(users)
      .leftJoin(userProgress, eq(userProgress.userId, users.id))
      .groupBy(users.id, users.name, users.image)
      .having(sql`coalesce(sum(${userProgress.score}), 0) > 0`)
      .orderBy(desc(sql`score`))
      .limit(50);

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("leaderboard error", err);
    return NextResponse.json({ rows: [] });
  }
}
