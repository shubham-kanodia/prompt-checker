"use client";

import { useState } from "react";
import type { PublicLevel } from "@/lib/challenges/types";
import { track } from "@/lib/analytics";

export function ShareButton({ level }: { level: PublicLevel }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    track("share_clicked", { day: level.id, slug: level.slug });
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/share/${level.slug}`
        : "";
    const text = `I just cleared DAY ${String(level.id).padStart(2, "0")}: ${
      level.title
    } in Break The Prompt. Think you can out-talk the intern?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Break The Prompt", text, url });
        return;
      } catch {
        /* user cancelled, fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="btn" onClick={share}>
      {copied ? "link copied!" : "share this win"}
    </button>
  );
}
