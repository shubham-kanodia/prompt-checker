// Every day is now free to play anonymously. Login is optional: it only saves
// progress across devices, puts you on the leaderboard, and lets you author
// community challenges. This module is kept (rather than deleted) so existing
// imports keep resolving; requiresLogin is now always false.
//
// FREE_DAYS is retained for any copy that references it; it covers all days.
export const FREE_DAYS = Infinity;

export function requiresLogin(_levelId: number): boolean {
  return false;
}
