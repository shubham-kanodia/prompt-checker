import { ImageResponse } from "next/og";
import { getLevel } from "@/lib/challenges/levels";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = getLevel(slug);
  const title = level?.title ?? "BREAK THE PROMPT";
  const num = level ? String(level.id).padStart(2, "0") : "??";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#050806",
          color: "#36ff7a",
          fontFamily: "monospace",
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.25) 4px, rgba(0,0,0,0) 5px)",
        }}
      >
        <div style={{ fontSize: 30, color: "#1f9b4a" }}>
          {">_BREAK·THE·PROMPT"}
        </div>
        <div style={{ fontSize: 28, color: "#5f8f6e", marginTop: 40 }}>
          {`DAY ${num}`}
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginTop: 8,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 40, color: "#ffd24d", marginTop: 30 }}>
          [ CLEARED ]
        </div>
        <div style={{ fontSize: 30, color: "#c9ffd9", marginTop: 50 }}>
          a prompt injection CTF. think you can out-talk the machine?
        </div>
      </div>
    ),
    { ...size }
  );
}
