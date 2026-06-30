"use client";

import { useState } from "react";

// Footer "contact us" entry point: a small link that opens a modal with a
// simple name / email / message form posting to /api/contact.
export function ContactWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="text-muted hover:text-green underline underline-offset-2 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        contact us
      </button>
      {open && <ContactModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ContactModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (sending) return;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and message are all required.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not send that. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send that. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Contact us"
    >
      <div
        className="panel p-5 w-full max-w-md flex flex-col gap-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-green glow text-sm">{"// contact us"}</div>
          <button
            className="text-muted text-xs hover:text-text shrink-0"
            onClick={onClose}
            aria-label="close"
          >
            close ✕
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="text-text text-sm">
              ✓ got it, thanks for reaching out. we&apos;ll get back to you soon!
            </p>
            <button className="btn self-start" onClick={onClose}>
              done
            </button>
          </div>
        ) : (
          <>
            <p className="text-muted text-xs">
              questions, bugs, or ideas? drop us a message.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-cyan text-xs" htmlFor="contact-name">
                name
              </label>
              <input
                id="contact-name"
                className="text-base"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-cyan text-xs" htmlFor="contact-email">
                email
              </label>
              <input
                id="contact-email"
                type="email"
                className="text-base"
                value={email}
                maxLength={200}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-cyan text-xs" htmlFor="contact-message">
                message
              </label>
              <textarea
                id="contact-message"
                className="text-base min-h-28 resize-y"
                value={message}
                maxLength={4000}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <div className="text-red text-xs">{error}</div>}
            <button
              className="btn btn-cta self-start"
              onClick={send}
              disabled={sending}
            >
              {sending ? "sending" : "send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
