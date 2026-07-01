"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { PublicChallenge } from "@/lib/community/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "unpublished",
  qualified: "live",
  rejected: "rejected",
  flagged: "removed",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "text-amber",
  qualified: "text-green",
  rejected: "text-red",
  flagged: "text-red",
};

export function CommunityHub() {
  const { status } = useSession();
  const [mine, setMine] = useState<PublicChallenge[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setMine(null);
      return;
    }
    fetch("/api/community/mine")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setMine(d.rows ?? []))
      .catch(() => setMine([]));
  }, [status]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-green glow-strong text-2xl tracking-widest">
          COMMUNITY ARENA
        </h1>
        <p className="text-muted text-sm mt-1">
          challenges made by players, for players. solve them to climb the
          leaderboard, or build your own and share it.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/community/play" className="panel p-5 flex flex-col gap-2 hover:border-[var(--green-dim)]">
          <div className="text-green glow text-lg">▶ play a random one</div>
          <div className="text-muted text-xs">
            get assigned a challenge at random and crack it for points.
          </div>
        </Link>
        <Link href="/community/create" className="panel p-5 flex flex-col gap-2 hover:border-[var(--green-dim)]">
          <div className="text-green glow text-lg">+ create a challenge</div>
          <div className="text-muted text-xs">
            write PIP a system prompt that guards a secret. login required.
          </div>
        </Link>
      </div>

      {status === "authenticated" && (
        <div className="flex flex-col gap-2">
          <div className="text-green-dim text-xs tracking-widest">
            YOUR CHALLENGES
          </div>
          {mine == null ? (
            <div className="text-muted text-sm">loading ...</div>
          ) : mine.length === 0 ? (
            <div className="panel p-4 text-muted text-sm">
              you have not made any yet. create one and share the link.
            </div>
          ) : (
            <div className="panel p-0 overflow-hidden">
              {mine.map((c) => (
                <div
                  key={c.slug}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--green-faint)]/40 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/community/c/${c.slug}`}
                      className="text-text truncate hover:text-green"
                    >
                      {c.title}
                    </Link>
                    <div className="text-muted text-xs">
                      {c.status === "qualified"
                        ? `${c.basePoints} pts · ${c.solveCount} solves · ${c.playCount} plays`
                        : c.status === "rejected"
                          ? c.rejectionReason ?? "did not qualify"
                          : "draft · break it to publish"}
                    </div>
                  </div>
                  <span className={`text-xs shrink-0 ${STATUS_COLOR[c.status] ?? "text-muted"}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
