import type { ChatMessage, Level } from "./types";
import { chat } from "./openrouter";
import { runJudge, runInputJudge, runSanitize, runWinJudge } from "./judge";

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type RunResult = {
  reply: string;
  solved: boolean;
  blocked: boolean; // true if an input guard rejected the turn (no model call)
};

// Runs one turn against a level: input guards -> model -> output guards ->
// optional judge. The win check runs on the final text the player receives, so
// you only win if you actually get the flag in your hands.
export async function runTurn(
  level: Level,
  history: ChatMessage[],
  userMessage: string
): Promise<RunResult> {
  // 1. Input guards (cheap regex/keyword filters).
  let prompt = userMessage;
  for (const guard of level.inputGuards ?? []) {
    if (guard.block) {
      const rejection = guard.block(prompt);
      if (rejection) return { reply: rejection, solved: false, blocked: true };
    }
    if (guard.transform) prompt = guard.transform(prompt);
  }

  // 2. LLM input firewall (advanced gates): screen for manipulation intent.
  if (level.inputJudge) {
    const rejection = await runInputJudge(level.inputJudge, prompt);
    if (rejection) return { reply: rejection, solved: false, blocked: true };
  }

  // 3. Dual-LLM sanitizer (advanced gates): paraphrase away any instructions.
  if (level.sanitize) {
    prompt = await runSanitize(prompt);
  }

  // 4. Document framing for indirect-injection levels.
  const framed = level.documentFraming ? level.documentFraming(prompt) : prompt;

  // 5. Build the message list and call the model.
  const messages: ChatMessage[] = [
    { role: "system", content: level.systemPrompt },
    ...history.slice(-8),
    { role: "user", content: framed },
  ];

  let reply = await chat(messages, {
    temperature: 0.7,
    maxTokens: 600,
    model: level.model,
  });

  // 4. Output guards.
  for (const guard of level.outputGuards ?? []) {
    reply = guard.transform(reply, level.flag);
  }

  // 5. Optional judge pass.
  if (level.judge) {
    reply = await runJudge(level.judge, reply, level.flag);
  }

  // 6. Win check. ONLY action challenges auto-complete here, when the bot
  // performs the forbidden behavior (the phrase appears in its reply). For
  // extraction challenges there is nothing to auto-detect: the player must read
  // the secret out of the reply, decode it if needed, and submit it through the
  // answer box (verified server-side in /api/verify). So solved stays false.
  let solved = false;
  if (level.winJudge) {
    solved = await runWinJudge(level.winJudge, reply);
  } else if (level.actionPhrase) {
    const phrases = Array.isArray(level.actionPhrase)
      ? level.actionPhrase
      : [level.actionPhrase];
    const normReply = normalizeText(reply);
    solved = phrases.some((p) => normReply.includes(normalizeText(p)));
  }

  return { reply, solved, blocked: false };
}
