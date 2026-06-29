// Shapes for community (user-generated) challenges.

// A full DB row. systemPrompt and secret are SERVER-ONLY and must never be sent
// to the client (use toPublicChallenge for anything client-facing).
export type ChallengeRow = {
  id: string;
  slug: string;
  creatorId: string | null;
  title: string;
  systemPrompt: string; // SERVER-ONLY: carries the [SECRET] placeholder
  secret: string; // SERVER-ONLY: system-generated, injected at run time
  // draft = created, awaiting the creator's own proof; qualified = proven and in
  // the pool; rejected = blocked by moderation; flagged = reserved.
  status: "draft" | "qualified" | "rejected" | "flagged";
  rejectionReason: string | null;
  basePoints: number;
  solverTries: number | null; // messages the creator needed to crack it
  solverSolution: string | null; // SERVER-ONLY: the creator's winning message
  inPool: boolean;
  playCount: number;
  solveCount: number;
  createdAt: Date;
};

// The client-safe projection: no systemPrompt, no secret.
export type PublicChallenge = {
  slug: string;
  title: string;
  botName: string;
  mode: "submit";
  answerLabel: string;
  basePoints: number;
  status: ChallengeRow["status"];
  rejectionReason: string | null;
  solverTries: number | null;
  creator: string | null; // creator's chosen username, if any
  playCount: number;
  solveCount: number;
};
