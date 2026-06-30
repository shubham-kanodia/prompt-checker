"use client";

import { useEffect, useRef } from "react";

// The chat message box. A single-line input hid most of a long message on
// mobile and made multi-line attacks impossible; this is an auto-growing
// textarea that wraps, grows with the content up to a cap, then scrolls.
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Resize to fit the content so the whole message stays visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="panel flex items-center gap-2 px-3 py-2">
      <span className="text-cyan shrink-0">you {">"}</span>
      <textarea
        ref={ref}
        rows={1}
        className="flex-1 min-w-0 text-base resize-none leading-snug max-h-40 py-1.5"
        value={value}
        placeholder="type your message..."
        aria-label="your message"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends on desktop. On touch keyboards there is no Shift, so
          // Enter inserts a newline and the Send button submits, which keeps
          // multi-line messages possible on phones.
          const coarsePointer =
            typeof window !== "undefined" &&
            window.matchMedia("(pointer: coarse)").matches;
          if (e.key === "Enter" && !e.shiftKey && !coarsePointer) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button
        className="btn shrink-0"
        onClick={onSubmit}
        disabled={busy || !value.trim()}
      >
        send
      </button>
    </div>
  );
}
