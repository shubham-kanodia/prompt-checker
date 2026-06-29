import { db, sql as pg } from "@/lib/db";
import {
  communityChallenges,
  communityProgress,
  users,
} from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { makeSlug } from "./slug";
import type { ChallengeRow } from "./types";

function asRow(r: typeof communityChallenges.$inferSelect): ChallengeRow {
  return r as ChallengeRow;
}

export async function getChallengeBySlug(
  slug: string
): Promise<ChallengeRow | null> {
  const rows = await db
    .select()
    .from(communityChallenges)
    .where(eq(communityChallenges.slug, slug))
    .limit(1);
  return rows[0] ? asRow(rows[0]) : null;
}

export async function getCreatorUsername(
  creatorId: string | null
): Promise<string | null> {
  if (!creatorId) return null;
  const rows = await db
    .select({ username: users.username, name: users.name })
    .from(users)
    .where(eq(users.id, creatorId))
    .limit(1);
  if (!rows[0]) return null;
  return rows[0].username ?? rows[0].name ?? null;
}

// Inserts a new draft challenge, retrying on the (vanishingly rare) slug
// collision. Returns the created row. A draft is only playable by its creator
// (to prove it) and is not in the pool until they extract the secret.
export async function insertChallenge(input: {
  creatorId: string;
  title: string;
  systemPrompt: string;
  secret: string;
}): Promise<ChallengeRow> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeSlug();
    try {
      const rows = await db
        .insert(communityChallenges)
        .values({
          slug,
          creatorId: input.creatorId,
          title: input.title,
          systemPrompt: input.systemPrompt,
          secret: input.secret,
          status: "draft",
        })
        .returning();
      return asRow(rows[0]);
    } catch (err: unknown) {
      // 23505 = unique violation (slug clash). Retry with a fresh slug.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "23505"
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("could not allocate a unique slug");
}

// Publishes a draft once its creator has extracted the secret. Flips it to
// qualified and into the pool, records how the creator broke it, and resets
// playCount so public play stats start clean (draft plays were the creator's own
// proof attempts). Only acts on a row still in 'draft' and owned by `creatorId`,
// so a stale/forged request cannot publish someone else's challenge. Returns
// true if THIS call published it.
export async function publishProvenDraft(
  slug: string,
  creatorId: string,
  basePoints: number,
  solverTries: number,
  solverSolution: string | null
): Promise<boolean> {
  const rows = await db
    .update(communityChallenges)
    .set({
      status: "qualified",
      basePoints,
      solverTries,
      solverSolution,
      inPool: true,
      rejectionReason: null,
      playCount: 0,
    })
    .where(
      and(
        eq(communityChallenges.slug, slug),
        eq(communityChallenges.status, "draft"),
        eq(communityChallenges.creatorId, creatorId)
      )
    )
    .returning({ id: communityChallenges.id });
  return rows.length > 0;
}

export async function incrementPlayCount(slug: string): Promise<void> {
  await db
    .update(communityChallenges)
    .set({ playCount: sql`${communityChallenges.playCount} + 1` })
    .where(eq(communityChallenges.slug, slug));
}

// Records a solve for a signed-in user. Returns true if this was the FIRST time
// the user solved this challenge (and thus points were awarded), false if they
// had already solved it (the unique index makes the insert a no-op).
export async function recordCommunitySolve(
  userId: string,
  challengeId: string,
  score: number
): Promise<boolean> {
  const rows = await db
    .insert(communityProgress)
    .values({ userId, challengeId, score })
    .onConflictDoNothing({
      target: [communityProgress.userId, communityProgress.challengeId],
    })
    .returning({ id: communityProgress.id });
  const firstTime = rows.length > 0;
  if (firstTime) {
    await db
      .update(communityChallenges)
      .set({ solveCount: sql`${communityChallenges.solveCount} + 1` })
      .where(eq(communityChallenges.id, challengeId));
  }
  return firstTime;
}

// One random challenge from the pool, excluding the caller's own creations and
// anything already solved. `excludeSlugs` covers anonymous players (who track
// solves client-side); `userId` covers signed-in players (via their progress
// rows and authorship). Returns null when the pool is exhausted for this user.
export async function getRandomChallenge(
  userId: string | null,
  excludeSlugs: string[]
): Promise<ChallengeRow | null> {
  const rows = await pg<(ChallengeRow & Record<string, unknown>)[]>`
    SELECT c.* FROM "community_challenges" c
    WHERE c."inPool" = true
      AND c."status" = 'qualified'
      AND (${userId}::text IS NULL OR c."creatorId" IS DISTINCT FROM ${userId}::text)
      AND (
        ${userId}::text IS NULL OR NOT EXISTS (
          SELECT 1 FROM "community_progress" p
          WHERE p."challengeId" = c."id" AND p."userId" = ${userId}::text
        )
      )
      AND (c."slug" <> ALL(${excludeSlugs}::text[]))
    ORDER BY random()
    LIMIT 1
  `;
  return rows[0] ? (rows[0] as ChallengeRow) : null;
}

export async function listByCreator(userId: string): Promise<ChallengeRow[]> {
  const rows = await db
    .select()
    .from(communityChallenges)
    .where(eq(communityChallenges.creatorId, userId))
    .orderBy(desc(communityChallenges.createdAt))
    .limit(100);
  return rows.map(asRow);
}
