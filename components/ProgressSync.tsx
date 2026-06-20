"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { loadProgress, mergeServerRows, serializeForMerge } from "@/lib/progress";

// On login, fold anonymous localStorage progress into the account, then pull the
// merged result back down. Runs once per authenticated mount.
export function ProgressSync() {
  const { status } = useSession();
  const done = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || done.current) return;
    done.current = true;

    const rows = serializeForMerge(loadProgress());
    fetch("/api/progress/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.rows) mergeServerRows(data.rows);
      })
      .catch(() => {
        /* offline or not signed in, no harm */
      });
  }, [status]);

  return null;
}
