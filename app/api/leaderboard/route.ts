import { NextResponse } from "next/server";
import { sql as pg } from "@/lib/db";

export const runtime = "nodejs";

type Row = {
  name: string | null;
  image: string | null;
  score: number;
  solved: number;
  community: number;
};

export async function GET() {
  try {
    // Total score = main-game score + community-challenge score. Both progress
    // tables are pre-aggregated in subqueries BEFORE joining, so joining two
    // one-row-per-user results can never fan out into a cartesian product.
    // Leaderboard label prefers the chosen username, falling back to the Google
    // name so accounts that never picked a handle still appear.
    const rows = await pg<Row[]>`
      SELECT
        coalesce(u."username", u."name") AS name,
        u."image" AS image,
        (coalesce(mp.score, 0) + coalesce(cp.score, 0))::int AS score,
        coalesce(mp.solved, 0)::int AS solved,
        coalesce(cp.solved, 0)::int AS community
      FROM "users" u
      LEFT JOIN (
        SELECT "userId",
               sum("score") AS score,
               count(*) FILTER (WHERE "solvedAt" IS NOT NULL) AS solved
        FROM "user_progress"
        GROUP BY "userId"
      ) mp ON mp."userId" = u."id"
      LEFT JOIN (
        SELECT "userId", sum("score") AS score, count(*) AS solved
        FROM "community_progress"
        GROUP BY "userId"
      ) cp ON cp."userId" = u."id"
      WHERE coalesce(mp.score, 0) + coalesce(cp.score, 0) > 0
      ORDER BY score DESC
      LIMIT 50
    `;

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("leaderboard error", err);
    return NextResponse.json({ rows: [] });
  }
}
