import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type DocEntry = {
  title: string;
  excerpt: string;
  body: React.ReactNode;
};

const DOCS: Record<string, DocEntry> = {
  quickstart: {
    title: "QUICKSTART",
    excerpt: "From signup to first export in five minutes.",
    body: (
      <>
        <h2>1. Sign up</h2>
        <p>
          Create an account with Google, Apple, or email. Email signups are sent
          a verification link via Loops.
        </p>
        <h2>2. Create a project</h2>
        <p>
          From the dashboard, click <kbd>NEW PROJECT</kbd>. Provide an app name,
          one-line description, and pick a category. The category seeds AI copy
          tone.
        </p>
        <h2>3. Upload screenshots</h2>
        <p>
          Drag in raw <samp>.png</samp> files captured from the simulator or a
          real device. Files are uploaded directly to Cloudflare R2 via
          pre-signed URLs — they never traverse our servers.
        </p>
        <h2>4. Generate</h2>
        <p>
          Open the <kbd>AI</kbd> panel. Tap <kbd>GENERATE COPY</kbd>. Tap
          <kbd>GENERATE BACKDROP</kbd>. Each call debits credits up front and
          refunds automatically on failure.
        </p>
        <h2>5. Export</h2>
        <p>
          Hit <kbd>EXPORT</kbd>. Choose dimensions and locales. The render
          pipeline is server-authoritative — client canvas exports are never
          used as final assets.
        </p>
      </>
    ),
  },
  concepts: {
    title: "CORE CONCEPTS",
    excerpt: "Projects, screenshots, credits, and how they relate.",
    body: (
      <>
        <h2>Project</h2>
        <p>
          A project owns app metadata (name, description, category), Polotno
          canvas state, and a list of generated screenshots.
        </p>
        <h2>Screenshot</h2>
        <p>
          A rendered output — one row per device + locale combination. Stored
          in R2; the database holds the key + dimensions only.
        </p>
        <h2>Credit ledger</h2>
        <p>
          Append-only. Every operation (purchase, debit, refund, monthly reset)
          adds a row. Balance is computed by summing the ledger — never
          mutated directly.
        </p>
        <h2>AI job</h2>
        <p>
          Trigger.dev task. Wraps debit + AI call + meter event in a single
          retryable unit. Status is observable via <samp>useRealtimeRun</samp>.
        </p>
      </>
    ),
  },
  billing: {
    title: "BILLING & CREDITS",
    excerpt: "How the ledger works, what triggers a meter event, and refunds.",
    body: (
      <>
        <h2>Credit purchases</h2>
        <p>
          Stripe Checkout creates a one-off payment. The
          <samp>checkout.session.completed</samp> webhook inserts a credit grant
          and a positive ledger row.
        </p>
        <h2>Studio subscription</h2>
        <p>
          Flat-rate $29/mo. AI calls bypass debits but still fire a Stripe meter
          event for analytics and abuse prevention.
        </p>
        <h2>Refunds</h2>
        <p>
          AI failure → automatic refund row in ledger with reason
          <samp>refund</samp>. Studio users receive an analytics-only entry
          (delta = 0).
        </p>
      </>
    ),
  },
  editor: {
    title: "POLOTNO CANVAS",
    excerpt: "Layers, frames, autosave, keyboard shortcuts.",
    body: (
      <>
        <h2>Auto-save</h2>
        <p>
          Polotno store changes are debounced 500ms and flushed to{" "}
          <samp>projects.polotno_json</samp>.
        </p>
        <h2>Server is authoritative</h2>
        <p>
          The browser never produces final exports. <samp>sharp</samp> on the
          server re-renders from the JSON state to guarantee pixel parity.
        </p>
        <h2>Shortcuts</h2>
        <ul>
          <li><kbd>⌘ S</kbd> — manual save</li>
          <li><kbd>⌘ E</kbd> — export</li>
          <li><kbd>⌘ Z / ⌘ ⇧ Z</kbd> — undo / redo</li>
          <li><kbd>⌘ /</kbd> — open AI panel</li>
        </ul>
      </>
    ),
  },
  "ai-copy": {
    title: "AI COPY GENERATION",
    excerpt: "GPT-5 with Zod-enforced output. No malformed JSON, ever.",
    body: (
      <>
        <h2>Schema</h2>
        <pre>{`const HeadlineSchema = z.object({
  headline: z.string().max(40),
  subheadline: z.string().max(80),
  emoji: z.string().optional(),
  ctaSuggestion: z.string().max(20),
});`}</pre>
        <h2>Cost</h2>
        <p>1 credit per generation. Refunded on failure.</p>
        <h2>Prompt source</h2>
        <p>
          All prompts live in <samp>lib/ai/prompts.ts</samp>. Never inline
          prompts in feature code — they need version control and A/B hooks.
        </p>
      </>
    ),
  },
  "ai-backdrop": {
    title: "AI BACKDROP",
    excerpt: "fal.ai Flux 2 + birefnet matte for clean composites.",
    body: (
      <>
        <h2>Pipeline</h2>
        <ol>
          <li>birefnet extracts a high-fidelity subject matte</li>
          <li>Flux 2 paints a backdrop matching app mood + palette</li>
          <li>sharp composites at full resolution</li>
        </ol>
        <h2>Cost</h2>
        <p>2 credits per generation.</p>
      </>
    ),
  },
  translate: {
    title: "TRANSLATION",
    excerpt: "41 locales fan out in parallel via Trigger.dev batch.",
    body: (
      <>
        <h2>Locales</h2>
        <p>
          Full list in <samp>lib/utils/locales.ts</samp>. Includes RTL (Arabic,
          Hebrew) and CJK (Japanese, Korean, Simplified + Traditional Chinese).
        </p>
        <h2>Auto-relayout</h2>
        <p>
          Long German compounds, Hebrew right-to-left flow, and Japanese
          vertical preference are all handled by the layout engine.
        </p>
      </>
    ),
  },
  api: {
    title: "PUBLIC API",
    excerpt: "Studio + Lifetime tiers. REST + webhooks. Idempotency-key required.",
    body: (
      <>
        <h2>Auth</h2>
        <p>
          API keys are issued from <Link href="/settings" className="link-tick">/settings</Link>. Send as <samp>Authorization: Bearer ...</samp>.
        </p>
        <h2>Idempotency</h2>
        <p>
          Every mutating request must send an <samp>Idempotency-Key</samp>{" "}
          header. We retain keys for 24 hours.
        </p>
      </>
    ),
  },
  status: {
    title: "SYSTEM STATUS",
    excerpt: "Real-time infrastructure metrics.",
    body: (
      <>
        <p>
          Live status board lives at <Link href="/dashboard" className="link-tick">/dashboard/status</Link> for authenticated operators.
          Public mirror coming Q2 2026.
        </p>
        <ul>
          <li>API: <samp>OK</samp></li>
          <li>fal.ai: <samp>OK · 142ms</samp></li>
          <li>OpenAI: <samp>OK · 380ms</samp></li>
          <li>R2: <samp>OK</samp></li>
          <li>Trigger.dev: <samp>OK · 3 queued</samp></li>
        </ul>
      </>
    ),
  },
  asc: {
    title: "APP STORE CONNECT",
    excerpt: "Direct upload of generated assets.",
    body: (
      <>
        <h2>Setup</h2>
        <p>
          Create an App Store Connect API key with the <samp>Marketing</samp>{" "}
          role. Paste the issuer ID + key into{" "}
          <Link href="/settings" className="link-tick">/settings</Link>.
        </p>
        <h2>Push</h2>
        <p>
          From any project, click <kbd>PUSH TO ASC</kbd>. We upload per-locale,
          per-device, with the App Store's required filename conventions
          handled.
        </p>
      </>
    ),
  },
  terms:    { title: "TERMS",    excerpt: "Legalese without traps.",   body: <p>Standard terms. Full PDF mirror coming.</p> },
  privacy:  { title: "PRIVACY",  excerpt: "What we keep, why.",        body: <p>Project assets in R2. AI prompts retained &lt; 24h.</p> },
  security: { title: "SECURITY", excerpt: "Data handling and retention.", body: <p>SOC 2 in progress. Disclosure policy: 24h ack.</p> },
  about:    { title: "ABOUT",    excerpt: "Who builds ShotsHQ.",       body: <p>Solo-dev studio. Built in public.</p> },
  contact:  { title: "CONTACT",  excerpt: "Support and escalation.",   body: <p>support@shotshq.app — reply within 12 hours.</p> },
  export:   { title: "EXPORT",   excerpt: "Server-side render pipeline.", body: <p>sharp + R2. Streaming to bypass route handler timeouts.</p> },
  "device-frames": { title: "DEVICE FRAMES", excerpt: "iPhone 6.9″, 6.7″, iPad 13″ M4.", body: <p>Static SVG/PNG masters in <samp>public/device-frames/</samp>.</p> },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const doc = DOCS[key];
  if (!doc) return { title: "Docs" };
  const ogUrl = `/api/og?title=${encodeURIComponent(doc.title)}&subtitle=${encodeURIComponent(doc.excerpt)}`;
  return {
    title: doc.title,
    description: doc.excerpt,
    alternates: { canonical: `/docs/${key}` },
    openGraph: {
      title: `${doc.title} · ShotsHQ docs`,
      description: doc.excerpt,
      url: `/docs/${key}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${doc.title} · ShotsHQ docs`,
      description: doc.excerpt,
      images: [ogUrl],
    },
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const doc = DOCS[key];
  if (!doc) notFound();

  const allKeys = Object.keys(DOCS);
  const idx = allKeys.indexOf(key);
  const prev = idx > 0 ? allKeys[idx - 1] : null;
  const next = idx < allKeys.length - 1 ? allKeys[idx + 1] : null;

  return (
    <>
      <section className="border-b-2 border-[var(--line-strong)]">
        <div className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-12">
            <Link href="/docs" className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)]">
              ← /docs
            </Link>
            <div className="t-mono-xs text-[var(--accent)] mt-3 mb-3">[ DOC / {key.toUpperCase()} ]</div>
            <h1 className="t-display text-[clamp(2.25rem,6vw,5rem)] leading-[0.95] text-balance break-words">{doc.title}</h1>
          </div>
          <div className="col-span-12 md:col-span-5 p-6 md:p-12 flex items-end">
            <p className="t-mono-md text-[var(--fg-dim)]">{doc.excerpt}</p>
          </div>
        </div>
      </section>

      <article className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <aside className="hidden md:block col-span-3 border-r border-[var(--line)] p-6 sticky top-[112px] self-start">
          <div className="t-mono-xs text-[var(--accent)] mb-4">[ ENTRIES ]</div>
          <ul className="space-y-1">
            {allKeys.map((k) => (
              <li key={k}>
                <Link
                  href={`/docs/${k}`}
                  className={`t-mono-xs block py-1 hover:text-[var(--accent)] ${
                    k === key ? "text-[var(--accent)]" : "text-[var(--fg-mute)]"
                  }`}
                >
                  &gt;&gt; {DOCS[k]?.title ?? k}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 doc-prose">
          {doc.body}
        </div>
      </article>

      <nav className="grid grid-cols-2">
        <div className="border-r border-[var(--line)]">
          {prev && (
            <Link href={`/docs/${prev}`} className="block p-6 hover:bg-[var(--bg-2)]">
              <div className="t-mono-xs text-[var(--fg-mute)]">← PREV</div>
              <div className="t-display text-[24px] mt-1">{DOCS[prev]?.title ?? prev}</div>
            </Link>
          )}
        </div>
        <div className="text-right">
          {next && (
            <Link href={`/docs/${next}`} className="block p-6 hover:bg-[var(--bg-2)]">
              <div className="t-mono-xs text-[var(--fg-mute)]">NEXT →</div>
              <div className="t-display text-[24px] mt-1">{DOCS[next]?.title ?? next}</div>
            </Link>
          )}
        </div>
      </nav>

      <style>{`
        .doc-prose h2 { font-family: var(--font-display); font-size: 22px; letter-spacing: -0.02em; text-transform: uppercase; margin: 28px 0 12px; }
        .doc-prose h2:first-child { margin-top: 0; }
        .doc-prose p { font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg-dim); margin-bottom: 16px; }
        .doc-prose p kbd { background: var(--bg-2); border: 1px solid var(--line-strong); padding: 1px 6px; }
        .doc-prose p samp, .doc-prose p code { color: var(--fg); }
        .doc-prose ul, .doc-prose ol { padding-left: 20px; margin-bottom: 16px; }
        .doc-prose li { font-family: var(--font-mono); font-size: 13px; color: var(--fg-dim); line-height: 1.7; }
        .doc-prose pre { background: var(--bg-2); border: 1px solid var(--line); padding: 16px; overflow-x: auto; margin-bottom: 16px; color: var(--fg); }
      `}</style>
    </>
  );
}
