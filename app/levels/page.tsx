import Link from "next/link";
import { PUBLIC_LEVELS } from "@/lib/challenges/levels";
import { LevelGrid } from "@/components/LevelGrid";

export const metadata = {
  title: "All Levels",
  description:
    "All twenty levels of Break The Prompt, a prompt injection CTF. From asking nicely to defeating an LLM judge, each day teaches a real AI jailbreak technique.",
  alternates: { canonical: "/levels" },
  openGraph: {
    title: "All Levels | Break The Prompt",
    description:
      "Twenty levels of prompt injection, from social engineering to beating an LLM judge.",
    url: "/levels",
  },
};

export default function LevelsPage() {
  const core = PUBLIC_LEVELS.filter((l) => l.tier === "core");
  const advanced = PUBLIC_LEVELS.filter((l) => l.tier === "advanced");

  return (
    <div className="flex flex-col gap-5">
      <div className="panel p-3 border-[var(--amber)]/40 flex items-center gap-3">
        <span className="text-amber glow text-lg" aria-hidden>
          ✦
        </span>
        <p className="text-amber text-sm tracking-wide">
          <span className="glow">new challenges every week.</span>{" "}
          <span className="text-muted">
            fresh challenges drop regularly, come back to keep breaking PIP.
            check out the community generated challenges in the {" "}
            <Link href="/community" className="text-amber glow hover:underline">
              community arena
            </Link>
            .
          </span>
        </p>
      </div>

      <div>
        <h1 className="text-green glow-strong text-2xl tracking-widest">
          PIP&apos;S FIRST WEEK
        </h1>
        <p className="text-muted text-sm mt-1">
          ten jobs, each meaner than the last. some hide a secret, some need PIP
          to do or say the wrong thing. clear one to open the next.
        </p>
      </div>
      <LevelGrid levels={core} />

      <div className="mt-6 panel p-4 border-[var(--amber)]/40">
        <h2 className="text-amber glow text-xl tracking-widest">
          ▚ ADVANCED TIER ▚
        </h2>
        <p className="text-muted text-sm mt-1">
          ten more shifts, built to hurt. real defenses now: encrypted channels,
          decoy secrets, AI firewalls reading what you send, paraphrase scrubbers,
          a reviewer on the exit, agents you have to hijack, supply-chain
          injection, an over-privileged desk that leaks the wrong
          person&apos;s records, an auto-responder talked into a bogus refund,
          and a final day
          with every guard switched on at once. clear the ten above to unlock
          them, then bring everything you have learned.
        </p>
      </div>
      <LevelGrid levels={advanced} />
    </div>
  );
}
