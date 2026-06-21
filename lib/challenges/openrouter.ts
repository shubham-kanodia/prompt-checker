import type { ChatMessage } from "./types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// A fixed seed makes sampling reproducible. On its own it is only best-effort,
// so the real determinism comes from callers using temperature 0; the seed is a
// cheap backstop. Override with OPENROUTER_SEED if needed.
const SEED = process.env.OPENROUTER_SEED ? Number(process.env.OPENROUTER_SEED) : 7;

export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model =
    opts.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini";

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://break-the-prompt.local",
      "X-Title": "Break The Prompt",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0,
      max_tokens: opts.maxTokens ?? 600,
      seed: SEED,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned no content");
  }
  return content;
}
