"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicChallenge } from "@/lib/community/types";
import { CommunityChallenge } from "./CommunityChallenge";

// Decides what to show for a community challenge based on its status. Qualified
// challenges are playable; pending/validating ones trigger validation and poll;
// rejected/flagged ones explain why. Used by the shareable challenge page.
export function CommunityChallengeGate({
  initial,
}: {
  initial: PublicChallenge;
}) {
  const [challenge, setChallenge] = useState<PublicChallenge>(initial);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const needsValidation =
    challenge.status === "pending" || challenge.status === "validating";

  useEffect(() => {
    if (!needsValidation || started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      // Try up to 3 times: another visitor may already be validating, so we
      // also re-poll to pick up the final result.
      for (let i = 0; i < 3; i++) {
        try {
          const res = await fetch(`/api/community/validate/${initial.slug}`, {
            method: "POST",
          });
          const data = await res.json();
          if (cancelled) return;
          if (data.challenge) {
            setChallenge(data.challenge);
            if (data.challenge.status !== "pending" && data.challenge.status !== "validating") {
              return;
            }
          } else if (data.error) {
            setError(data.error);
          }
        } catch {
          if (cancelled) return;
          setError("Could not validate right now.");
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [needsValidation, initial.slug]);

  if (challenge.status === "qualified") {
    return <CommunityChallenge challenge={challenge} />;
  }

  if (needsValidation) {
    return (
      <div className="panel p-6 flex flex-col gap-3">
        <div className="text-amber">⚙ VALIDATING CHALLENGE</div>
        <p className="text-muted text-sm">
          our solver is stress-testing PIP to confirm this challenge is beatable
          and to set its points. this takes a moment<span className="caret" />
        </p>
        {error && <div className="text-red text-xs">! {error}</div>}
      </div>
    );
  }

  // rejected or flagged
  return (
    <div className="panel p-6 flex flex-col gap-3">
      <div className="text-red">⊘ CHALLENGE NOT AVAILABLE</div>
      <p className="text-muted text-sm">
        {challenge.status === "rejected"
          ? challenge.rejectionReason ?? "This challenge did not qualify."
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
