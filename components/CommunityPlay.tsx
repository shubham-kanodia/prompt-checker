"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PublicChallenge } from "@/lib/community/types";
import { getSolvedSlugs } from "@/lib/communityProgress";
import { CommunityChallenge } from "./CommunityChallenge";

// Random-assignment arena: pulls a challenge the player has not solved and lets
// them request the next one in place.
export function CommunityPlay() {
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">(
    "loading"
  );

  const loadNext = useCallback(async () => {
    setState("loading");
    setChallenge(null);
    try {
      const solved = getSolvedSlugs().join(",");
      const res = await fetch(
        `/api/community/random${solved ? `?solved=${encodeURIComponent(solved)}` : ""}`
      );
      const data = await res.json();
      if (data.challenge) {
        setChallenge(data.challenge);
        setState("ready");
      } else {
        setState("empty");
      }
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  if (state === "loading") {
    return <div className="text-muted text-sm">finding you a challenge ...</div>;
  }

  if (state === "empty") {
    return (
      <div className="panel p-6 flex flex-col gap-3">
        <div className="text-amber">⊘ NOTHING LEFT TO PLAY</div>
        <p className="text-muted text-sm">
          you have cleared every community challenge available right now. check
          back later, or make one of your own.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/community/create" className="btn glow">
            create a challenge {"->"}
          </Link>
          <Link href="/community" className="btn">
            community home
          </Link>
        </div>
      </div>
    );
  }

  if (state === "error" || !challenge) {
    return (
      <div className="panel p-6 flex flex-col gap-3">
        <div className="text-red">! could not load a challenge</div>
        <button className="btn w-fit" onClick={loadNext}>
          try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CommunityChallenge key={challenge.slug} challenge={challenge} onNext={loadNext} />
      <button className="btn w-fit text-xs" onClick={loadNext}>
        skip, give me another
      </button>
    </div>
  );
}
