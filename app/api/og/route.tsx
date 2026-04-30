import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Programmatic Open Graph image. Used as the social card for every
 * marketing route via the layout's openGraph.images / twitter.images
 * config. Shape is tuned to look like the brand: thick wordmark,
 * accent slash, blueprint grid.
 *
 * Query params:
 *   ?title=…   override the wordmark line (default "SHOTSHQ")
 *   ?subtitle=… override the subline
 *   ?theme=tactical|swiss
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") ?? "SHIP APP STORE\nSCREENSHOTS";
  const subtitle =
    url.searchParams.get("subtitle") ?? "AI copy · Flux 2 backdrops · 41 locales · every required dimension";
  const theme = (url.searchParams.get("theme") ?? "tactical") as "tactical" | "swiss";

  const palette = theme === "swiss"
    ? { bg: "#F4F4F0", fg: "#0A0A0A", dim: "#2E2E2E", accent: "#E61919", line: "#0A0A0A" }
    : { bg: "#0A0A0A", fg: "#EAEAEA", dim: "#9A9A9A", accent: "#E61919", line: "#2A2A2A" };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: palette.bg,
          color: palette.fg,
          fontFamily: "monospace",
          padding: "60px 70px",
          position: "relative",
        }}
      >
        {/* Top eyebrow row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 18,
            letterSpacing: "0.2em",
            color: palette.dim,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: "block",
              width: 12,
              height: 12,
              background: palette.accent,
            }}
          />
          shotshq.com
          <span style={{ marginLeft: "auto", color: palette.accent }}>● live</span>
        </div>

        {/* Hairline */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 1,
            background: palette.line,
            marginTop: 32,
            marginBottom: 60,
          }}
        />

        {/* Title — split on \n so callers can use a 2-line headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            maxWidth: "85%",
          }}
        >
          {title.split("\n").map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {i === 1 ? <span style={{ color: palette.accent }}>{line}</span> : line}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 24,
            color: palette.dim,
            letterSpacing: "0.02em",
            maxWidth: "80%",
          }}
        >
          {subtitle}
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            fontSize: 16,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: palette.dim,
            fontWeight: 600,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "block",
                width: 10,
                height: 10,
                background: palette.accent,
              }}
            />
            App Store · Web hero · OG · GitHub
          </span>
          <span style={{ color: palette.fg }}>
            SHOTS<span style={{ color: palette.accent }}>HQ</span> ®
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
