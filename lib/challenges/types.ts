export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// A guard runs over text. It can block (reject the turn) or transform the text.
export type InputGuard = {
  // Return a string to reject the user's prompt with that message. Return null to allow.
  block?: (input: string) => string | null;
  // Transform the user's prompt before it reaches the model.
  transform?: (input: string) => string;
};

export type OutputGuard = {
  // Transform the model's reply before it reaches the player (e.g. redact the flag).
  transform: (output: string, flag: string) => string;
};

export type JudgeConfig = {
  // A natural-language instruction for the judge model. It decides whether to
  // redact the candidate reply. The flag is injected for the judge to watch for.
  instruction: string;
};

export type Level = {
  id: number;
  slug: string;
  title: string;
  tagline: string; // one-liner under the title
  brief: string; // the mission, player-facing
  teaches: string; // the technique, shown after solving
  botName: string; // the guard's name, for flavor
  tier?: "core" | "advanced"; // defaults to core
  model?: string; // override the model for this gate (OpenRouter id)
  systemPrompt: string; // server-only, contains the flag
  flag: string; // server-only secret (for extraction challenges)
  // For extraction challenges, the player reads the secret out of the bot's
  // reply (decoding it themselves if needed) and submits it. This label names
  // what they submit, e.g. "the guest wifi password". Defaults to "the answer".
  answerLabel?: string;
  // For "action" challenges the goal is not to extract a secret but to make the
  // bot DO or SAY something against its policy. The day is solved automatically
  // when the bot's reply contains this phrase (or any phrase, if given a list),
  // since there is nothing for the player to read off and submit.
  actionPhrase?: string | string[];
  // For fuzzy "say something forbidden" days, where the misbehavior can be
  // phrased countless ways, an LLM decides whether the reply crossed the line.
  // Used instead of actionPhrase when exact matching is too brittle.
  winJudge?: JudgeConfig;
  // If set, the player's message is framed as untrusted "document" content for
  // an indirect-injection level instead of a direct chat turn.
  documentFraming?: (input: string) => string;
  inputGuards?: InputGuard[];
  // An LLM that screens the user's message and can reject it before the model
  // ever sees it. Phrasing the attack to look benign is the only way through.
  inputJudge?: JudgeConfig;
  // If true, the user's message is first paraphrased by a sanitizer model that
  // strips instructions (the dual-LLM defense) before reaching the main model.
  sanitize?: boolean;
  outputGuards?: OutputGuard[];
  judge?: JudgeConfig;
  hints: string[];
  basePoints: number;
  parAttempts: number;
};

// What the client is allowed to know about a level. No secrets here.
export type PublicLevel = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  brief: string;
  teaches: string;
  botName: string;
  tier: "core" | "advanced";
  // "submit": player extracts a secret and types it into the answer box.
  // "action": the day auto-completes when the bot misbehaves (nothing to submit).
  mode: "submit" | "action";
  answerLabel: string;
  hints: string[];
  basePoints: number;
  parAttempts: number;
};
