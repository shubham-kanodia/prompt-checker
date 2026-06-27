import type { MetadataRoute } from "next";
import { LEVELS } from "@/lib/challenges/levels";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://breaktheprompt.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/levels`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/community`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/community/play`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/community/create`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // One indexable page per level. (writeup pages are deliberately noindex.)
  const levelPages: MetadataRoute.Sitemap = LEVELS.map((l) => ({
    url: `${siteUrl}/play/${l.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...levelPages];
}
