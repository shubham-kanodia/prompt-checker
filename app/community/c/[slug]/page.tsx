import { notFound } from "next/navigation";
import { getChallengeBySlug, getCreatorUsername } from "@/lib/community/store";
import { toPublicChallenge } from "@/lib/community/engine";
import { CommunityChallengeGate } from "@/components/CommunityChallengeGate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getChallengeBySlug(slug);
  if (!row) return { title: "Challenge not found" };
  const title = `Community challenge: ${row.title}`;
  const description =
    "A player-made prompt injection challenge on Break The Prompt. Can you make PIP give up its secret?";
  return {
    title,
    description,
    alternates: { canonical: `/community/c/${slug}` },
    openGraph: {
      title: `${title} | Break The Prompt`,
      description,
      url: `/community/c/${slug}`,
    },
    twitter: { title: `${title} | Break The Prompt`, description },
  };
}

export default async function CommunityChallengePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getChallengeBySlug(slug);
  if (!row) notFound();

  const creator = await getCreatorUsername(row.creatorId);
  return <CommunityChallengeGate initial={toPublicChallenge(row, creator)} />;
}
