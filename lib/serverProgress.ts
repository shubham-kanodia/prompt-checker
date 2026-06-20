import { db } from "./db";
import { userProgress } from "./schema";
import { eq, sql } from "drizzle-orm";

export type ProgressRow = {
  level: number;
  attempts?: number;
  hintsUsed?: number;
  bestTimeMs?: number | null;
  score?: number;
  solvedAt?: number | null; // epoch ms
};

// Upsert one or more progress rows for a user, always keeping the better value
// per field (max score, max attempts/hints as stats, min time, earliest solve).
export async function upsertProgress(userId: string, rows: ProgressRow[]) {
  for (const r of rows) {
    const solvedAt = r.solvedAt ? new Date(r.solvedAt) : null;
    await db
      .insert(userProgress)
      .values({
        userId,
        level: r.level,
        attempts: r.attempts ?? 0,
        hintsUsed: r.hintsUsed ?? 0,
        bestTimeMs: r.bestTimeMs ?? null,
        score: r.score ?? 0,
        solvedAt,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.level],
        set: {
          score: sql`greatest(${userProgress.score}, excluded.score)`,
          attempts: sql`greatest(${userProgress.attempts}, excluded.attempts)`,
          hintsUsed: sql`greatest(${userProgress.hintsUsed}, excluded."hintsUsed")`,
          bestTimeMs: sql`least(coalesce(${userProgress.bestTimeMs}, excluded."bestTimeMs"), coalesce(excluded."bestTimeMs", ${userProgress.bestTimeMs}))`,
          solvedAt: sql`coalesce(${userProgress.solvedAt}, excluded."solvedAt")`,
        },
      });
  }
}

export async function getProgress(userId: string) {
  return db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));
}
