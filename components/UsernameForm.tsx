"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { validateUsername } from "@/lib/username";

// Inline editor for the leaderboard handle. Validates locally for instant
// feedback, checks availability against the server (debounced), and saves.
export function UsernameForm({
  initial,
  onSaved,
}: {
  initial?: string | null;
  onSaved?: (username: string) => void;
}) {
  const { update } = useSession();
  const [value, setValue] = useState(initial ?? "");
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const seq = useRef(0);

  // Debounced availability check. Local format check first (cheap, no request).
  useEffect(() => {
    setSaved(false);
    const trimmed = value.trim();
    if (trimmed === (initial ?? "")) {
      setStatus("idle");
      setMsg(null);
      return;
    }
    const local = validateUsername(trimmed);
    if (!local.ok) {
      setStatus("invalid");
      setMsg(local.reason);
      return;
    }
    setStatus("checking");
    setMsg(null);
    const mine = ++seq.current;
    const t = setTimeout(() => {
      fetch(`/api/username?u=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((d: { available?: boolean; reason?: string }) => {
          if (mine !== seq.current) return; // a newer keystroke superseded this
          if (d.available) {
            setStatus("available");
            setMsg(null);
          } else {
            setStatus("taken");
            setMsg(d.reason ?? "That username is taken.");
          }
        })
        .catch(() => {
          if (mine !== seq.current) return;
          setStatus("idle");
        });
    }, 350);
    return () => clearTimeout(t);
  }, [value, initial]);

  async function save() {
    const local = validateUsername(value);
    if (!local.ok || saving) {
      if (!local.ok) {
        setStatus("invalid");
        setMsg(local.reason);
      }
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: local.value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus(res.status === 409 ? "taken" : "invalid");
        setMsg(data.error ?? "Could not save that.");
        return;
      }
      setSaved(true);
      setMsg(null);
      await update(); // refresh the session so the new handle is reflected
      onSaved?.(data.username);
    } catch {
      setMsg("Could not save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const color =
    status === "available" || saved
      ? "text-green"
      : status === "taken" || status === "invalid"
        ? "text-red"
        : "text-muted";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-cyan shrink-0">handle {">"}</span>
        <input
          className="flex-1 min-w-0 text-base"
          value={value}
          maxLength={20}
          placeholder="pick a username"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
        />
        <button
          className="btn shrink-0"
          onClick={save}
          disabled={saving || status === "taken" || status === "invalid" || value.trim() === (initial ?? "")}
        >
          {saving ? "saving" : "save"}
        </button>
      </div>
      <div className={`text-xs ${color}`}>
        {saved
          ? "✓ saved. you are on the board under this name."
          : status === "checking"
            ? "checking ..."
            : status === "available"
              ? "✓ available"
              : msg ?? "3-20 chars: letters, numbers, underscores."}
      </div>
    </div>
  );
}
