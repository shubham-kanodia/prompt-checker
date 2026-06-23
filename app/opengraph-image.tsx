import { ImageResponse } from "next/og";

// Default social card for the site (homepage and any page without its own).
export const runtime = "nodejs";
export const alt = "Break The Prompt, a prompt injection CTF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginTop: 30,
            lineHeight: 1.05,
          }}
        >
          Break the AI intern.
        </div>
        <div style={{ fontSize: 36, color: "#ffd24d", marginTop: 36 }}>
          a prompt injection CTF
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#c9ffd9",
            marginTop: 24,
            maxWidth: 980,
          }}
        >
          16 levels of jailbreaking: leak secrets, beat the filters, fool the
          judge. learn AI security by hacking.
        </div>
      </div>
    ),
    { ...size }
  );
}
