// Creates all tables against the Supabase Postgres. Idempotent.
// Run: node --env-file=.env.local scripts/migrate.mjs
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

const statements = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text,
    "email" text UNIQUE,
    "emailVerified" timestamp,
    "image" text
  )`,
  `CREATE TABLE IF NOT EXISTS "accounts" (
    "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "provider" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "refresh_token" text,
    "access_token" text,
    "expires_at" integer,
    "token_type" text,
    "scope" text,
    "id_token" text,
    "session_state" text,
    PRIMARY KEY ("provider", "providerAccountId")
  )`,
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "sessionToken" text PRIMARY KEY NOT NULL,
    "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expires" timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "verificationToken" (
    "identifier" text NOT NULL,
    "token" text NOT NULL,
    "expires" timestamp NOT NULL,
    PRIMARY KEY ("identifier", "token")
  )`,
  `CREATE TABLE IF NOT EXISTS "user_progress" (
    "id" text PRIMARY KEY NOT NULL,
    "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "level" integer NOT NULL,
    "solvedAt" timestamp,
    "attempts" integer NOT NULL DEFAULT 0,
    "hintsUsed" integer NOT NULL DEFAULT 0,
    "bestTimeMs" integer,
    "score" integer NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_level_unq" ON "user_progress" ("userId", "level")`,
  // Shared rate-limit / spend counters, so limits hold across serverless
  // instances and cold starts. One row per (scope, time-window) key.
  `CREATE TABLE IF NOT EXISTS "api_usage" (
    "key" text PRIMARY KEY NOT NULL,
    "count" integer NOT NULL DEFAULT 0,
    "expiresAt" timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "api_usage_expires" ON "api_usage" ("expiresAt")`,
  // Every player message + the bot reply. A dataset of real injection attempts.
  `CREATE TABLE IF NOT EXISTS "prompts" (
    "id" text PRIMARY KEY NOT NULL,
    "level" integer NOT NULL,
    "slug" text NOT NULL,
    "message" text NOT NULL,
    "reply" text,
    "blocked" boolean NOT NULL DEFAULT false,
    "solved" boolean NOT NULL DEFAULT false,
    "userId" text REFERENCES "users"("id") ON DELETE SET NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "prompts_created" ON "prompts" ("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "prompts_slug" ON "prompts" ("slug")`,
  // Player-chosen leaderboard handle. Added after launch, so use ADD COLUMN IF
  // NOT EXISTS; case-insensitive uniqueness via a lower(username) index.
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_username_lower_unq" ON "users" (lower("username"))`,
  // User-generated challenges. systemPrompt + secret are server-only.
  `CREATE TABLE IF NOT EXISTS "community_challenges" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "creatorId" text REFERENCES "users"("id") ON DELETE SET NULL,
    "title" text NOT NULL,
    "systemPrompt" text NOT NULL,
    "secret" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "rejectionReason" text,
    "basePoints" integer NOT NULL DEFAULT 0,
    "solverTries" integer,
    "inPool" boolean NOT NULL DEFAULT false,
    "playCount" integer NOT NULL DEFAULT 0,
    "solveCount" integer NOT NULL DEFAULT 0,
    "createdAt" timestamptz NOT NULL DEFAULT now()
  )`,
  // The attacker message that beat the challenge during validation (the round-k
  // winning injection). Server-only, like systemPrompt/secret. Added after the
  // community tables shipped, so ADD COLUMN IF NOT EXISTS.
  `ALTER TABLE "community_challenges" ADD COLUMN IF NOT EXISTS "solverSolution" text`,
  `CREATE INDEX IF NOT EXISTS "community_status" ON "community_challenges" ("status")`,
  `CREATE INDEX IF NOT EXISTS "community_pool" ON "community_challenges" ("inPool")`,
  // One row per (user, community challenge) solved. Unique guard = single award.
  `CREATE TABLE IF NOT EXISTS "community_progress" (
    "id" text PRIMARY KEY NOT NULL,
    "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "challengeId" text NOT NULL REFERENCES "community_challenges"("id") ON DELETE CASCADE,
    "solvedAt" timestamptz NOT NULL DEFAULT now(),
    "score" integer NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "community_user_challenge_unq" ON "community_progress" ("userId", "challengeId")`,
];

try {
  for (const stmt of statements) {
    await sql.unsafe(stmt);
    console.log("ok:", stmt.split("\n")[0]);
  }
  console.log("\nMigration complete.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
