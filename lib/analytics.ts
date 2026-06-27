// Thin wrapper over GA4's gtag. Safe to call anywhere on the client; if GA is
// not configured (no NEXT_PUBLIC_GA_ID) every call is a no-op.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type Params = Record<string, string | number | boolean | undefined>;

// Major game events. Keeping the names in one place avoids typos across files.
export type GameEvent =
  | "day_opened"
  | "prompt_sent"
  | "input_blocked"
  | "hint_revealed"
  | "answer_submitted"
  | "day_cleared"
  | "share_clicked"
  | "login_click"
  | "community_prompt_sent"
  | "community_answer_submitted"
  | "community_challenge_created"
  | "community_challenge_qualified"
  | "community_share_copied";

export function track(event: GameEvent, params: Params = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function pageview(url: string) {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("config", GA_ID, { page_path: url });
}
