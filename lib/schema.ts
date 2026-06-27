import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js tables (standard drizzle-adapter shape) ---

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Player-chosen handle for the leaderboard. Nullable: existing accounts and
  // brand-new logins have none until they pick one. Case-insensitive unique is
  // enforced by a `lower(username)` index (see scripts/migrate.mjs).
  username: text("username"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --- Game progress ---

export const userProgress = pgTable(
  "user_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    solvedAt: timestamp("solvedAt", { mode: "date" }),
    attempts: integer("attempts").notNull().default(0),
    hintsUsed: integer("hintsUsed").notNull().default(0),
    bestTimeMs: integer("bestTimeMs"),
    score: integer("score").notNull().default(0),
  },
  (p) => [uniqueIndex("user_level_unq").on(p.userId, p.level)]
);

// Shared rate-limit / spend counters. One row per (scope, time-window) key, so
// limits hold across serverless instances and cold starts.
export const apiUsage = pgTable("api_usage", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }).notNull(),
});

// --- Community (user-generated) challenges ---

// A challenge authored by a player: a system prompt for PIP plus a hidden
// secret to extract. systemPrompt and secret are SERVER-ONLY (never projected
// to the client). Lifecycle: pending -> qualified | rejected (| flagged).
export const communityChallenges = pgTable(
  "community_challenges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(), // short id for the shareable URL
    creatorId: text("creatorId").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    systemPrompt: text("systemPrompt").notNull(), // server-only
    secret: text("secret").notNull(), // server-only
    status: text("status").notNull().default("pending"),
    rejectionReason: text("rejectionReason"),
    basePoints: integer("basePoints").notNull().default(0),
    solverTries: integer("solverTries"), // rounds the auto-solver needed (k)
    inPool: boolean("inPool").notNull().default(false), // in the random pool
    playCount: integer("playCount").notNull().default(0),
    solveCount: integer("solveCount").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (c) => [
    uniqueIndex("community_slug_unq").on(c.slug),
    index("community_status").on(c.status),
    index("community_pool").on(c.inPool),
  ]
);

// One row per (user, community challenge) the user has solved. Each challenge
// awards a given user once; the unique index is the guard against double-award.
export const communityProgress = pgTable(
  "community_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challengeId")
      .notNull()
      .references(() => communityChallenges.id, { onDelete: "cascade" }),
    solvedAt: timestamp("solvedAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    score: integer("score").notNull().default(0),
  },
  (p) => [uniqueIndex("community_user_challenge_unq").on(p.userId, p.challengeId)]
);

// Every message a player sends to a day, with the bot's reply. A valuable
// dataset of real prompt-injection attempts. userId is set when signed in.
export const prompts = pgTable("prompts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  level: integer("level").notNull(),
  slug: text("slug").notNull(),
  message: text("message").notNull(),
  reply: text("reply"),
  blocked: boolean("blocked").notNull().default(false),
  solved: boolean("solved").notNull().default(false),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
