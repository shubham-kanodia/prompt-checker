import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { rateLimit } from "@/lib/ratelimit";
import { withinDailyLimit } from "@/lib/usage";

export const runtime = "nodejs";

// Anyone can reach the contact form, so the only guards are spam controls: a
// short burst limit plus a daily cap per IP.
const CONTACT_PER_IP_PER_DAY = Number(process.env.CONTACT_PER_DAY_IP ?? 20);

const NAME_MAX = 100;
const EMAIL_MAX = 200;
const MESSAGE_MAX = 4000;

// Deliberately loose: just enough to catch typos, not to police valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientKey(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}

export async function POST(req: NextRequest) {
  const ip = clientKey(req);
  const burst = rateLimit(`contact:${ip}`);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${burst.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are all required." },
      { status: 400 }
    );
  }
  if (name.length > NAME_MAX || email.length > EMAIL_MAX || message.length > MESSAGE_MAX) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That email doesn't look right." },
      { status: 400 }
    );
  }

  const ipOk = await withinDailyLimit("contact_ip", ip, CONTACT_PER_IP_PER_DAY);
  if (!ipOk) {
    return NextResponse.json(
      { error: "You've sent a lot today. Please try again tomorrow." },
      { status: 429 }
    );
  }

  // Attach the user when signed in; the form works fine without a session.
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  try {
    await db.insert(contactMessages).values({ name, email, message, userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact insert failed", err);
    return NextResponse.json(
      { error: "Could not send that. Please try again." },
      { status: 500 }
    );
  }
}
