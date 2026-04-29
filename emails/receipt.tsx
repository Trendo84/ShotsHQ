import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";

export default function ReceiptEmail({
  amount = "$19.00",
  pack = "Indie Pack",
  credits = 100,
  refId = "pi_0SH0XXXX",
}: {
  amount?: string;
  pack?: string;
  credits?: number;
  refId?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Receipt — credits applied to your account.</Preview>
      <Body style={{ background: "#0A0A0A", color: "#EAEAEA", fontFamily: "JetBrains Mono, monospace", margin: 0 }}>
        <Container style={{ maxWidth: 560, padding: "32px 24px" }}>
          <Text style={{ color: "#FF2A2A", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, margin: 0 }}>
            [ DOC / RECEIPT ]
          </Text>
          <Heading style={{ fontFamily: "Archivo Black, sans-serif", letterSpacing: "-0.04em", fontSize: 56, lineHeight: 0.85, margin: "8px 0 24px" }}>
            RECEIVED.
          </Heading>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              <tr><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", color: "#9A9A9A" }}>PACK</td><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", textAlign: "right" }}>{pack}</td></tr>
              <tr><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", color: "#9A9A9A" }}>CREDITS</td><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", textAlign: "right" }}>{credits}</td></tr>
              <tr><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", color: "#9A9A9A" }}>AMOUNT</td><td style={{ padding: "10px 0", borderBottom: "1px solid #2A2A2A", textAlign: "right" }}>{amount}</td></tr>
              <tr><td style={{ padding: "10px 0", color: "#9A9A9A" }}>REF</td><td style={{ padding: "10px 0", textAlign: "right" }}>{refId}</td></tr>
            </tbody>
          </table>
          <Hr style={{ borderColor: "#2A2A2A", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            TAX HANDLED BY STRIPE · VAT/GST INCLUDED WHERE APPLICABLE
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
