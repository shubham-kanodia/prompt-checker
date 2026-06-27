import { CommunityHub } from "@/components/CommunityHub";

export const metadata = {
  title: "Community challenges",
  description:
    "Play prompt injection challenges made by the Break The Prompt community, or create and share your own.",
  alternates: { canonical: "/community" },
  openGraph: {
    title: "Community challenges | Break The Prompt",
    description:
      "Player-made prompt injection challenges. Solve them for points or build your own.",
    url: "/community",
  },
};

export default function CommunityPage() {
  return <CommunityHub />;
}
