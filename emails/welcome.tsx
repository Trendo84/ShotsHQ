import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export default function WelcomeEmail({ firstName = "operator" }: { firstName?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ShotsHQ — your operator console is live.</Preview>
      <Body style={{ background: "#0A0A0A", color: "#EAEAEA", fontFamily: "JetBrains Mono, monospace", margin: 0 }}>
        <Container style={{ maxWidth: 560, padding: "32px 24px" }}>
          <Text style={{ color: "#FF2A2A", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, margin: 0 }}>
            [ DOC / SHQ-WELCOME ]
          </Text>
          <Heading style={{ fontFamily: "Archivo Black, sans-serif", letterSpacing: "-0.04em", fontSize: 56, lineHeight: 0.85, margin: "8px 0 24px", color: "#EAEAEA" }}>
            CONSOLE<br />ONLINE.
          </Heading>
          <Text style={{ fontSize: 13, lineHeight: 1.7, color: "#9A9A9A" }}>
            {firstName.toUpperCase()}, your ShotsHQ operator account is provisioned.
            You start with the Free tier — unlimited editor, 1080p watermarked
            exports, every device frame.
          </Text>
          <Hr style={{ borderColor: "#2A2A2A", margin: "24px 0" }} />
          <Text style={{ fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: "#FF2A2A" }}>NEXT STEPS</strong><br />
            <span style={{ color: "#9A9A9A" }}>
              1. Create a project<br />
              2. Drop in raw screenshots<br />
              3. Run AI copy + backdrop<br />
              4. Export at iPhone 6.9″, 6.7″, iPad 13″
            </span>
          </Text>
          <Link
            href="https://shotshq.app/dashboard"
            style={{ display: "inline-block", marginTop: 24, padding: "12px 18px", background: "#FF2A2A", color: "#FFFFFF", textDecoration: "none", letterSpacing: "0.1em", fontSize: 11, textTransform: "uppercase" }}
          >
            ▸ ENTER DASHBOARD
          </Link>
          <Hr style={{ borderColor: "#2A2A2A", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            © 2026 SHOTSHQ™ · UNIT D-01 · REV 2.6
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
