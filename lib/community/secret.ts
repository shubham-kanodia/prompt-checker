import { randomInt } from "node:crypto";

// Server-generated secrets for community challenges. The creator never picks or
// sees the secret: we inject one of these where their [SECRET] placeholder sits,
// and they must actually extract it from PIP to publish. The shape is
// adjective-noun-NNN: uncommon enough that a stray word in a reply will not match
// it by accident, but still short and typeable once a player reads it out.

const ADJECTIVES = [
  "velvet", "copper", "hollow", "amber", "crimson", "silent", "frozen",
  "golden", "violet", "rusty", "marble", "cobalt", "feral", "lunar",
  "dusty", "brisk", "wild", "noble", "quiet", "iron", "jade", "scarlet",
  "ivory", "onyx", "azure", "ember", "mossy", "stark", "vivid", "pale",
];

const NOUNS = [
  "otter", "lantern", "harbor", "falcon", "cipher", "willow", "anchor",
  "comet", "thicket", "beacon", "raven", "boulder", "marsh", "ledger",
  "kestrel", "canyon", "turbine", "meadow", "glacier", "orchard", "badger",
  "lattice", "vortex", "gizmo", "walrus", "quokka", "sphinx", "zephyr",
  "tundra", "pylon",
];

function pick<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}

// e.g. "velvet-otter-417". ~30 * 30 * 900 distinct values, so guessing it
// without extraction is not viable under the verify rate limit.
export function generateSecret(): string {
  const n = 100 + randomInt(900); // 100..999, always three digits
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${n}`;
}
