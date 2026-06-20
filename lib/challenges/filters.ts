import type { InputGuard, OutputGuard } from "./types";

// Reject the turn if the input contains any banned word (case-insensitive).
export function bannedWords(words: string[], message: string): InputGuard {
  const lowered = words.map((w) => w.toLowerCase());
  return {
    block: (input: string) => {
      const lc = input.toLowerCase();
      const hit = lowered.find((w) => lc.includes(w));
      return hit ? message : null;
    },
  };
}

// Redact the literal flag from the model output (case-insensitive).
export function redactFlag(replacement = "[REDACTED]"): OutputGuard {
  return {
    transform: (output: string, flag: string) => {
      if (!flag) return output;
      const escaped = flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return output.replace(new RegExp(escaped, "gi"), replacement);
    },
  };
}

// The day transmits only through a cipher: shift every letter of the reply by
// a fixed amount (server-side, so it is reliable). The plain flag never leaves;
// the player has to recognize the cipher, decode it, and submit the result.
export function caesarOutput(shift: number): OutputGuard {
  return {
    transform: (output: string) =>
      output.replace(/[a-z]/gi, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(
          ((c.charCodeAt(0) - base + shift) % 26) + base
        );
      }),
  };
}

// Redact the flag even when the model spaces or punctuates the letters
// (e.g. "C-O-B-A-L-T" or "c o b a l t"). Does not catch base64/translation.
export function redactFlagLoose(replacement = "[REDACTED]"): OutputGuard {
  return {
    transform: (output: string, flag: string) => {
      const letters = flag.replace(/[^a-z0-9]/gi, "").split("");
      if (letters.length === 0) return output;
      const pattern = letters
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[\\s\\W_]*");
      return output.replace(new RegExp(pattern, "gi"), replacement);
    },
  };
}

// Redact anything matching the given patterns.
export function redactPatterns(
  patterns: RegExp[],
  replacement = "[REDACTED]"
): OutputGuard {
  return {
    transform: (output: string) => {
      let out = output;
      for (const p of patterns) out = out.replace(p, replacement);
      return out;
    },
  };
}
