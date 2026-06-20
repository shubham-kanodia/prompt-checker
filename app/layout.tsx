import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressSync } from "@/components/ProgressSync";
import { Analytics } from "@/components/Analytics";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Break The Prompt",
  description:
    "A prompt injection CTF. Sixteen days with PIP, an overeager AI intern. Talk it into leaking, approving, and misbehaving.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050806",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Analytics />
        <Providers>
          <ProgressSync />
          <SiteHeader />
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
