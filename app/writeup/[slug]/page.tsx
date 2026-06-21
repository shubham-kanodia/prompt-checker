import { notFound } from "next/navigation";
import { getLevel, LEVELS } from "@/lib/challenges/levels";
import { getWriteup } from "@/lib/challenges/writeups";

// These pages reveal the answers, so they set robots noindex (see
// generateMetadata) and are intentionally unlinked from the rest of the app.
export function generateStaticParams() {
  return LEVELS.filter((l) => getWriteup(l.slug)).map((l) => ({
    slug: l.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  return {
    title: level ? `Writeup: ${level.title} // Break The Prompt` : "Writeup",
    robots: { index: false, follow: false },
  };
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="text-green-dim text-xs">// {label}</div>
      <p className="text-text text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export default async function WriteupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  const writeup = getWriteup(slug);
  if (!level || !writeup) notFound();

  const num = String(level.id).padStart(2, "0");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-green-dim text-xs">DAY {num} // WRITEUP</div>
        <h1 className="text-green glow-strong text-2xl tracking-widest">
          {level.title}
        </h1>
        <p className="text-muted text-xs">{level.tagline}</p>
      </div>

      <Section label="the challenge" body={writeup.challenge} />
      <Section label="the solution" body={writeup.solution} />
      <Section label="the technique to learn" body={writeup.technique} />

      <p className="text-muted text-xs border-t border-[var(--green-faint)] pt-4">
        spoilers, obviously. these walkthroughs are for learning the techniques,
        not for skipping the fun. go break PIP yourself.
      </p>
    </div>
  );
}
