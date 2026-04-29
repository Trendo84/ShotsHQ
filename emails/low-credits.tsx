import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export default function LowCreditsEmail({ balance = 4 }: { balance?: number }) {
  return (
    <Html>
      <Head />
      <Preview>Credit balance below threshold — top up before your next render.</Preview>
      <Body style={{ background: "#0A0A0A", color: "#EAEAEA", fontFamily: "JetBrains Mono, monospace", margin: 0 }}>
        <Container style={{ maxWidth: 560, padding: "32px 24px" }}>
          <Text style={{ color: "#FF2A2A", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, margin: 0 }}>
            [ ALERT / LOW CREDITS ]
          </Text>
          <Heading style={{ fontFamily: "Archivo Black, sans-serif", letterSpacing: "-0.04em", fontSize: 56, lineHeight: 0.85, margin: "8px 0 24px" }}>
            BALANCE<br />
            <span style={{ color: "#FF2A2A" }}>LOW.</span>
          </Heading>
          <Text style={{ fontSize: 13, lineHeight: 1.7, color: "#9A9A9A" }}>
            CURRENT BALANCE: <strong style={{ color: "#EAEAEA" }}>{balance} CR</strong>
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.7, color: "#9A9A9A" }}>
            One AI copy gen costs 1 cr. One AI backdrop gen costs 2 cr.
            Top up before the next launch cycle to avoid interrupts.
          </Text>
          <Link
            href="https://shotshq.app/billing"
            style={{ display: "inline-block", marginTop: 24, padding: "12px 18px", background: "#FF2A2A", color: "#FFFFFF", textDecoration: "none", letterSpacing: "0.1em", fontSize: 11, textTransform: "uppercase" }}
          >
            ▸ TOP-UP NOW
          </Link>
          <Hr style={{ borderColor: "#2A2A2A", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            UNSUBSCRIBE FROM ALERTS · /settings
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
