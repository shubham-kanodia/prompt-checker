"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicLevel } from "@/lib/challenges/types";
import { track } from "@/lib/analytics";

// A small share menu: post to X (the link unfurls into the day's image card via
// the Twitter Card meta on /share/[slug]), or copy the link. Native share is
// offered too where the device supports it (handy on mobile).
export function ShareButton({ level }: { level: PublicLevel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const num = String(level.id).padStart(2, "0");
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${level.slug}`
      : "";
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

  function shareOnX() {
    track("share_clicked", { day: level.id, slug: level.slug, method: "x" });
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function copyLink() {
    track("share_clicked", { day: level.id, slug: level.slug, method: "copy" });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    track("share_clicked", { day: level.id, slug: level.slug, method: "native" });
    try {
      await navigator.share({ title: "Break The Prompt", text, url });
      setOpen(false);
    } catch {
      /* user cancelled */
    }
  }

  const hasNative =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="relative" ref={ref}>
      <button className="btn" onClick={() => setOpen((o) => !o)}>
        share this win
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 panel p-2 flex flex-col gap-1 min-w-[13rem]">
          <button className="btn !justify-start" onClick={shareOnX}>
            {">"} post to X
          </button>
          <button className="btn !justify-start" onClick={copyLink}>
            {">"} {copied ? "link copied!" : "copy link"}
          </button>
          {hasNative && (
            <button className="btn !justify-start" onClick={nativeShare}>
              {">"} more...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
