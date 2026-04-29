import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export default function RenderCompleteEmail({ projectName = "Your project", url = "#" }: { projectName?: string; url?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Render complete. Bundle ready for download.</Preview>
      <Body style={{ background: "#0A0A0A", color: "#EAEAEA", fontFamily: "JetBrains Mono, monospace", margin: 0 }}>
        <Container style={{ maxWidth: 560, padding: "32px 24px" }}>
          <Text style={{ color: "#4AF626", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, margin: 0 }}>
            ◯ RENDER COMPLETE
          </Text>
          <Heading style={{ fontFamily: "Archivo Black, sans-serif", letterSpacing: "-0.04em", fontSize: 56, lineHeight: 0.85, margin: "8px 0 24px" }}>
            BUNDLE<br />READY.
          </Heading>
          <Text style={{ fontSize: 13, lineHeight: 1.7, color: "#9A9A9A" }}>
            Project <strong style={{ color: "#EAEAEA" }}>{projectName}</strong> finished rendering.
            Download the zip below or push directly to App Store Connect.
          </Text>
          <Link
            href={url}
            style={{ display: "inline-block", marginTop: 24, padding: "12px 18px", background: "#FF2A2A", color: "#FFFFFF", textDecoration: "none", letterSpacing: "0.1em", fontSize: 11, textTransform: "uppercase" }}
          >
            ▸ DOWNLOAD ZIP
          </Link>
          <Hr style={{ borderColor: "#2A2A2A", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            BUNDLE EXPIRES 24H · DOWNLOAD BEFORE THEN
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
