"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicLevel } from "@/lib/challenges/types";
import {
  buildShareUrl,
  copyShareLink,
  hasNativeShare,
  nativeShare,
  shareOnX,
} from "@/lib/share";

// A small share menu: post to X (the link unfurls into the day's image card via
// the Twitter Card meta on /share/[slug]), or copy the link. Native share is
// offered too where the device supports it (handy on mobile).
export function ShareButton({ level }: { level: PublicLevel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const num = String(level.id).padStart(2, "0");
  const url = buildShareUrl(level.slug);
  const text = `I cleared Day ${num}: ${level.title} in Break The Prompt. Can you out-talk the AI intern?`;

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onShareX() {
    shareOnX({ text, url, day: level.id, slug: level.slug });
    setOpen(false);
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
      setOpen(false);
    } catch {
      /* user cancelled */
    }
  }

  const hasNative = hasNativeShare();

  return (
    <div className="relative" ref={ref}>
      <button className="btn" onClick={() => setOpen((o) => !o)}>
        share this win
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 panel p-2 flex flex-col gap-1 min-w-[13rem]">
          <button className="btn !justify-start" onClick={onShareX}>
            {">"} post to X
          </button>
          <button className="btn !justify-start" onClick={onCopyLink}>
            {">"} {copied ? "link copied!" : "copy link"}
          </button>
          {hasNative && (
            <button className="btn !justify-start" onClick={onNativeShare}>
              {">"} more...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
