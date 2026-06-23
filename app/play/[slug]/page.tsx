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
  const num = String(level.id).padStart(2, "0");
  const title = `Day ${num}: ${level.title}`;
  const description = `Day ${num} of Break The Prompt, a prompt injection CTF. ${level.brief}`;
  return {
    title,
    description,
    alternates: { canonical: `/play/${slug}` },
    openGraph: {
      title: `${title} | Break The Prompt`,
      description,
      url: `/play/${slug}`,
    },
    twitter: { title: `${title} | Break The Prompt`, description },
  };
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
