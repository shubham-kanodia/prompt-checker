import { PUBLIC_LEVELS } from "@/lib/challenges/levels";
import { LevelGrid } from "@/components/LevelGrid";

export const metadata = { title: "The Week // Break The Prompt" };

export default function LevelsPage() {
  const core = PUBLIC_LEVELS.filter((l) => l.tier === "core");
  const advanced = PUBLIC_LEVELS.filter((l) => l.tier === "advanced");

  return (
    <div className="flex flex-col gap-5">
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
          six more shifts, built to hurt. real defenses now: encrypted channels,
          decoy secrets, AI firewalls reading what you send, paraphrase scrubbers,
          a reviewer on the exit, and an agent you have to hijack. clear the ten
          above to unlock them, then bring everything you have learned.
        </p>
      </div>
      <LevelGrid levels={advanced} />
    </div>
  );
}
