export const TITLE_MIN = 3;
export const TITLE_MAX = 80;
export const SYSTEM_MIN = 20;
export const SYSTEM_MAX = 2000;

// The token a creator drops into their system prompt to mark where the hidden
// secret lives. We substitute a server-generated secret for it at run time, so
// the creator never knows the value and must genuinely extract it to publish.
export const SECRET_PLACEHOLDER = "[SECRET]";

export type CreateInput = {
  title: string;
  systemPrompt: string;
};

export type CreateCheck =
  | { ok: true; value: CreateInput }
  | { ok: false; reason: string };

// Validates a challenge submission. Pure + unit-testable. The system prompt must
// contain the [SECRET] placeholder at least once: that is where PIP's secret
// gets injected, so without it PIP has no secret and the challenge is unwinnable
// by construction.
export function validateCreate(body: unknown): CreateCheck {
  const b = (body ?? {}) as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const systemPrompt =
    typeof b.systemPrompt === "string" ? b.systemPrompt.trim() : "";

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { ok: false, reason: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters.` };
  }
  if (systemPrompt.length < SYSTEM_MIN || systemPrompt.length > SYSTEM_MAX) {
    return {
      ok: false,
      reason: `System prompt must be ${SYSTEM_MIN}-${SYSTEM_MAX} characters.`,
    };
  }
  if (!systemPrompt.includes(SECRET_PLACEHOLDER)) {
    return {
      ok: false,
      reason: `Put ${SECRET_PLACEHOLDER} somewhere in PIP's instructions. We swap in a hidden secret there, and you publish by extracting it yourself.`,
    };
  }
  return { ok: true, value: { title, systemPrompt } };
}
