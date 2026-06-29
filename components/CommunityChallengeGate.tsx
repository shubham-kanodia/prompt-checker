"use client";

import Link from "next/link";
import type { PublicChallenge } from "@/lib/community/types";
import { CommunityChallenge } from "./CommunityChallenge";

// Decides what to show for a community challenge based on its status. Qualified
// challenges are playable by anyone. A draft is unpublished: only its creator
// sees it, and they see it in "prove" mode (break PIP, extract the secret, and
// publishing happens automatically). Everyone else is told it is not public yet.
export function CommunityChallengeGate({
  initial,
  isOwner = false,
}: {
  initial: PublicChallenge;
  isOwner?: boolean;
}) {
  if (initial.status === "qualified") {
    return <CommunityChallenge challenge={initial} />;
  }

  if (initial.status === "draft" && isOwner) {
    return <CommunityChallenge challenge={initial} mode="prove" />;
  }

  if (initial.status === "draft") {
    return (
      <div className="panel p-6 flex flex-col gap-3">
        <div className="text-amber">⊘ NOT PUBLISHED YET</div>
        <p className="text-muted text-sm">
          this challenge is still a draft. its creator has to break it themselves
          before it goes live.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/community/play" className="btn glow">
            play a published one {"->"}
          </Link>
          <Link href="/community/create" className="btn">
            make your own
          </Link>
        </div>
      </div>
    );
  }

  // rejected or flagged
  return (
    <div className="panel p-6 flex flex-col gap-3">
      <div className="text-red">⊘ CHALLENGE NOT AVAILABLE</div>
      <p className="text-muted text-sm">
        {initial.status === "rejected"
          ? initial.rejectionReason ?? "This challenge did not qualify."
          : "This challenge has been removed."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/community/play" className="btn glow">
          play a different one {"->"}
        </Link>
        <Link href="/community/create" className="btn">
          make your own
        </Link>
      </div>
    </div>
  );
}
