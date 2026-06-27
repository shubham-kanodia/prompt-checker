import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/schema";

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const loginEnabled = googleEnabled;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: googleEnabled ? [Google] : [],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // The adapter's `user` is the full users row, so the chosen handle is
        // available here without an extra query.
        session.user.username =
          (user as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },
});
