// Reusable share actions. Both the success-panel ShareButton dropdown and the
// post-clear ShareModal funnel through these so the X intent, clipboard copy,
// and native share behave identically and emit the same share_clicked event.

import { track } from "@/lib/analytics";

type ShareTarget = { day: number; slug: string };

// The link unfurls into the day's card via the Twitter Card meta on /share/[slug].
export function buildShareUrl(slug: string): string {
  return typeof window !== "undefined"
    ? `${window.location.origin}/share/${slug}`
    : "";
}

export function shareOnX({
  text,
  url,
  day,
  slug,
}: ShareTarget & { text: string; url: string }) {
  track("share_clicked", { day, slug, method: "x" });
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
  window.open(intent, "_blank", "noopener,noreferrer");
}

export async function copyShareLink({
  url,
  day,
  slug,
}: ShareTarget & { url: string }) {
  track("share_clicked", { day, slug, method: "copy" });
  await navigator.clipboard.writeText(url);
}

export async function nativeShare({
  text,
  url,
  day,
  slug,
}: ShareTarget & { text: string; url: string }) {
  track("share_clicked", { day, slug, method: "native" });
  await navigator.share({ title: "Break The Prompt", text, url });
}

export const hasNativeShare = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
