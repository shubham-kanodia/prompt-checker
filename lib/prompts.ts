import { db } from "./db";
import { prompts } from "./schema";

export type PromptLog = {
  level: number;
  slug: string;
  message: string;
  reply?: string | null;
  blocked?: boolean;
  solved?: boolean;
  userId?: string | null;
};

// Persists one player message + the bot reply. Best-effort: a logging failure
// must never break the player's turn, so callers should not let it throw.
export async function logPrompt(entry: PromptLog): Promise<void> {
  try {
    await db.insert(prompts).values({
      level: entry.level,
      slug: entry.slug,
      message: entry.message.slice(0, 8000),
      reply: entry.reply?.slice(0, 8000) ?? null,
      blocked: entry.blocked ?? false,
      solved: entry.solved ?? false,
      userId: entry.userId ?? null,
    });
  } catch (err) {
    console.error("logPrompt failed:", err);
  }
}
