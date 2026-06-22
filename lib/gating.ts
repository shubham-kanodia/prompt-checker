// Days 1 and 2 are free to play anonymously. Day 3 and up require a login, to
// convert the many drive-by players into accounts (and save their progress).
// Kept in a tiny standalone module so both client components and server routes
// can import it without pulling in the secret-bearing levels module.
export const FREE_DAYS = 2;

export function requiresLogin(levelId: number): boolean {
  return levelId > FREE_DAYS;
}
