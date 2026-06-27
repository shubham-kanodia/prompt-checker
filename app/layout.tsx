import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressSync } from "@/components/ProgressSync";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { Analytics } from "@/components/Analytics";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Absolute base for og:image / twitter:image URLs. Set NEXT_PUBLIC_SITE_URL in
// production (e.g. https://breaktheprompt.xyz) so shared cards point at the live
// domain rather than localhost.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://breaktheprompt.xyz";

const DESCRIPTION =
  "Break The Prompt is a free prompt injection CTF. Sixteen levels of jailbreaking an AI intern: leak secrets, bypass input and output filters, beat an LLM judge, and pull off indirect injection. Learn AI and LLM security by actually hacking.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Break The Prompt: Prompt Injection CTF and AI Jailbreak Game",
    template: "%s | Break The Prompt",
  },
  description: DESCRIPTION,
  applicationName: "Break The Prompt",
  keywords: [
    "prompt injection",
    "prompt injection CTF",
    "prompt injection game",
    "prompt injection challenge",
    "AI jailbreak",
    "LLM jailbreak",
    "jailbreak game",
    "AI security",
    "LLM security",
    "AI red teaming",
    "learn prompt injection",
    "capture the flag",
    "Gandalf alternative",
  ],
  authors: [{ name: "Break The Prompt" }],
  creator: "Break The Prompt",
  category: "education",
  alternates: { canonical: "/" },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to verify ownership in Google
  // Search Console (then submit /sitemap.xml there).
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Break The Prompt",
    title: "Break The Prompt: Prompt Injection CTF and AI Jailbreak Game",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Break The Prompt: Prompt Injection CTF and AI Jailbreak Game",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050806",
};

// Structured data for rich results: the site itself plus the game as a free
// web application.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Break The Prompt",
      url: siteUrl,
      description: DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "Break The Prompt",
      url: siteUrl,
      description: DESCRIPTION,
      applicationCategory: "GameApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      genre: ["Capture the flag", "AI security", "prompt injection"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isAccessibleForFree: true,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Analytics />
        <Providers>
          <ProgressSync />
          <SiteHeader />
          <UsernamePrompt />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="text-muted text-xs text-center py-6 px-4 border-t border-[var(--green-faint)] break-words">
            break-the-prompt // learn to talk machines into talking. play nice
            out there.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
