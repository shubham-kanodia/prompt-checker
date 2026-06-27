import { CommunityPlay } from "@/components/CommunityPlay";

export const metadata = {
  title: "Play community challenges",
  description:
    "Get a random player-made prompt injection challenge and solve it to climb the Break The Prompt leaderboard.",
  alternates: { canonical: "/community/play" },
};

export default function CommunityPlayPage() {
  return <CommunityPlay />;
}
