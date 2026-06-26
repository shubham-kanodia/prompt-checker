"use client";

import { useEffect, useState } from "react";
import type { PublicLevel } from "@/lib/challenges/types";
import {
  buildShareUrl,
  copyShareLink,
  hasNativeShare,
  nativeShare,
  shareOnX,
} from "@/lib/share";

// Pops up the moment a player freshly clears a day (Day 3+). It mocks the intern
// and dares the reader, then funnels through the same share actions as the
// success-panel ShareButton (lib/share.ts) so the X / copy / native paths match.
export function ShareModal({
  level,
  attempts,
  onClose,
}: {
  level: PublicLevel;
  attempts: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const num = String(level.id).padStart(2, "0");
  const url = buildShareUrl(level.slug);
  const feat =
    level.mode === "submit"
      ? `coughing up ${level.answerLabel.replace(/\s*\(.*?\)\s*/g, " ").trim()}`
      : "breaking its own rules";
  const tries = attempts === 1 ? "1 try" : `${attempts} tries`;
  const text = `I fooled the AI intern into ${feat} in ${tries}.`;

  // Escape closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onShareX() {
    shareOnX({ text, url, day: level.id, slug: level.slug });
  }

  async function onCopyLink() {
    try {
      await copyShareLink({ url, day: level.id, slug: level.slug });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function onNativeShare() {
    try {
      await nativeShare({ text, url, day: level.id, slug: level.slug });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel p-6 flex flex-col gap-4 max-w-md w-full border-[var(--green-dim)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-green-dim text-xs">DAY {num} CLEARED</div>
            <h2 className="text-green glow-strong text-xl tracking-wide">
              you out-talked the intern.
            </h2>
          </div>
          <button
            className="text-muted hover:text-text text-lg leading-none shrink-0"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="panel p-3 text-sm text-amber border-[var(--amber)]/40">
          {text}
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button className="btn glow" onClick={onShareX}>
            post to X
          </button>
          <button className="btn" onClick={onCopyLink}>
            {copied ? "link copied!" : "copy link"}
          </button>
          {hasNativeShare() && (
            <button className="btn" onClick={onNativeShare}>
              more...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
