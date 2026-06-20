import { notFound } from "next/navigation";
import { getLevel, toPublic, LEVELS } from "@/lib/challenges/levels";
import { Challenge } from "@/components/Challenge";

export function generateStaticParams() {
  return LEVELS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  if (!level) return { title: "Day not found" };
  return { title: `${level.title} // Break The Prompt` };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  if (!level) notFound();

  const idx = LEVELS.findIndex((l) => l.slug === slug);
  const nextSlug = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1].slug : null;

  return <Challenge level={toPublic(level)} nextSlug={nextSlug} />;
}
