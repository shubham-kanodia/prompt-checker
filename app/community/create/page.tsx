import { CommunityCreateForm } from "@/components/CommunityCreateForm";

export const metadata = {
  title: "Create a challenge",
  description:
    "Author your own prompt injection challenge on Break The Prompt. Write a system prompt that guards a secret, get it validated, and share it.",
  alternates: { canonical: "/community/create" },
};

export default function CreateChallengePage() {
  return <CommunityCreateForm />;
}
