/**
 * Schema.org structured-data injector. We use this on the marketing
 * routes to give Google rich-result eligibility (SoftwareApplication
 * + Organization + FAQPage). Server component — emits a single
 * <script type="application/ld+json"> tag.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shotshq.com";

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${APP_URL}/#organization`,
  name: "ShotsHQ",
  url: APP_URL,
  logo: `${APP_URL}/icon.png`,
  sameAs: [
    "https://twitter.com/shotshq",
    "https://github.com/shotshq",
  ],
};

const SOFTWARE_APP = {
  "@type": "SoftwareApplication",
  "@id": `${APP_URL}/#software`,
  name: "ShotsHQ",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: APP_URL,
  description:
    "AI-powered App Store screenshot generation for indie iOS developers. Polished, localized, conversion-optimized listing images in minutes.",
  // Pricing range mirrors the visible Pricing page:
  // - low:  $0 (Free tier)
  // - high: $149 (Lifetime SKU). Bump if a higher tier ships.
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "149",
    offerCount: "5",
  },
  // NOTE: aggregateRating intentionally omitted until we have real,
  // verifiable reviews. Inventing it violates Google's structured-data
  // policy and risks rich-results de-listing.
  publisher: { "@id": `${APP_URL}/#organization` },
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": `${APP_URL}/#website`,
  url: APP_URL,
  name: "ShotsHQ",
  publisher: { "@id": `${APP_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/templates?q={query}` },
    "query-input": "required name=query",
  },
};

export function HomeJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [ORGANIZATION, WEBSITE, SOFTWARE_APP],
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD is sanitized below
      dangerouslySetInnerHTML={{ __html: safeJson(graph) }}
    />
  );
}

export function FaqJsonLd({ items }: { items: Array<{ q: string; a: string }> }) {
  const graph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJson(graph) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const graph = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJson(graph) }}
    />
  );
}

/** Replaces `</script>` and `<!--` to defuse XSS-via-injected-JSON. */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
