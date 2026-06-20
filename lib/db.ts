import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Reuse the client across hot-reloads in dev.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

// `prepare: false` is required for the Supabase transaction pooler (port 6543).
export const sql =
  globalForDb.pgClient ??
  postgres(connectionString ?? "", { prepare: false, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = sql;

export const db = drizzle(sql, { schema });
