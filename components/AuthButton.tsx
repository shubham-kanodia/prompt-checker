"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { track } from "@/lib/analytics";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: Record<string, unknown>) => setHasGoogle(Boolean(p?.google)))
      .catch(() => setHasGoogle(false));
  }, []);

  const compact =
    "border border-[var(--green-dim)] text-green hover:bg-[var(--green)] hover:text-[#04140a] px-2.5 py-1.5 text-[11px] sm:text-xs uppercase tracking-wide transition whitespace-nowrap shrink-0";

  if (status === "authenticated") {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-muted text-xs hidden md:inline">
          {session.user?.name?.split(" ")[0] ?? "agent"}
        </span>
        <button className={compact} onClick={() => signOut()}>
          logout
        </button>
      </div>
    );
  }

  if (hasGoogle === false) {
    return (
      <span
        className="text-muted text-xs"
        title="Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to enable login"
      >
        login soon
      </span>
    );
  }

  return (
    <button
      className={compact}
      disabled={hasGoogle === null}
      onClick={() => {
        track("login_click");
        signIn("google");
      }}
    >
      <span className="sm:hidden">login</span>
      <span className="hidden sm:inline">login w/ google</span>
    </button>
  );
}
