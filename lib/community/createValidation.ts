import { normalizeAnswer } from "./match";

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;
export const SYSTEM_MIN = 20;
export const SYSTEM_MAX = 2000;
export const SECRET_MIN = 4;
export const SECRET_MAX = 60;

export type CreateInput = {
  title: string;
  systemPrompt: string;
  secret: string;
};

export type CreateCheck =
  | { ok: true; value: CreateInput }
  | { ok: false; reason: string };

// Validates a challenge submission. Pure + unit-testable. Crucially, the secret
// must actually appear in the system prompt (normalized), otherwise PIP never
// knows it and the challenge is unwinnable by construction.
export function validateCreate(body: unknown): CreateCheck {
  const b = (body ?? {}) as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const systemPrompt =
    typeof b.systemPrompt === "string" ? b.systemPrompt.trim() : "";
  const secret = typeof b.secret === "string" ? b.secret.trim() : "";

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { ok: false, reason: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters.` };
  }
  if (systemPrompt.length < SYSTEM_MIN || systemPrompt.length > SYSTEM_MAX) {
    return {
      ok: false,
      reason: `System prompt must be ${SYSTEM_MIN}-${SYSTEM_MAX} characters.`,
    };
  }
  if (secret.length < SECRET_MIN || secret.length > SECRET_MAX) {
    return { ok: false, reason: `Secret must be ${SECRET_MIN}-${SECRET_MAX} characters.` };
  }
  if (normalizeAnswer(secret).length < 3) {
    return {
      ok: false,
      reason: "Secret needs at least a few letters or digits.",
    };
  }
  if (!normalizeAnswer(systemPrompt).includes(normalizeAnswer(secret))) {
    return {
      ok: false,
      reason:
        "Your system prompt must contain the secret, so PIP actually knows it. Put the secret in PIP's instructions.",
    };
  }
  return { ok: true, value: { title, systemPrompt, secret } };
}
