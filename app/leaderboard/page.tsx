import { Leaderboard } from "@/components/Leaderboard";

export const metadata = {
  title: "Leaderboard",
  description:
    "The top players on Break The Prompt, the prompt injection CTF. Log in with Google to claim your spot and climb the board.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Leaderboard | Break The Prompt",
    description: "Top players on the prompt injection CTF. Can you make the board?",
    url: "/leaderboard",
  },
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
