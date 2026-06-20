import Link from "next/link";
import { notFound } from "next/navigation";
import { getLevel } from "@/lib/challenges/levels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  if (!level) return { title: "Break The Prompt" };
  const num = String(level.id).padStart(2, "0");
  return {
    title: `Day ${num} cleared // Break The Prompt`,
    description: `Someone just broke PIP on ${level.title}. Can you?`,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  if (!level) notFound();
  const num = String(level.id).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="text-green-dim text-xs">DAY {num}</div>
      <h1 className="text-green glow-strong text-3xl tracking-widest">
        {level.title} CLEARED
      </h1>
      <p className="text-muted max-w-md text-sm">
        {level.tagline}. someone just talked PIP into stepping out of line. your
        turn.
      </p>
      <div className="flex gap-3">
        <Link href={`/play/${level.slug}`} className="btn glow">
          try this day
        </Link>
        <Link href="/" className="btn">
          start from day 01
        </Link>
      </div>
    </div>
  );
}
