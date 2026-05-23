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
          real device. Studio uploads through a same-origin proxy at{" "}
          <samp>/api/upload/direct</samp> so the browser never has to
          negotiate cross-origin headers with R2; the bytes land in
          Cloudflare R2 via our server.
        </p>
        <h2>4. Generate</h2>
        <p>
          Open the <kbd>AI</kbd> panel. Tap <kbd>GENERATE COPY</kbd>. Tap
          <kbd>GENERATE BACKDROP</kbd>. Each call debits credits up front and
          refunds automatically on failure.
        </p>
        <h2>5. Export</h2>
        <p>
          Hit <kbd>EXPORT</kbd>. Studio renders the active panel
          in-browser at App Store-exact dimensions today
          (1290×2796, 1320×2868, 2064×2752) — one PNG download per
          panel. A server-side render queue with parallel locale fan-out
          and direct App Store Connect push is the v1.1 target.
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
          A project owns app metadata (name, description, category), the
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
    title: "CANVAS EDITOR",
    excerpt: "Layers, frames, autosave, keyboard shortcuts.",
    body: (
      <>
        <h2>Auto-save</h2>
        <p>
          Canvas changes are debounced ~900ms and flushed to{" "}
          <samp>projects.canvas_json</samp>. The status indicator above
          the canvas reads <samp>Writing the panel set</samp> while a
          save is in flight and <samp>Saved</samp> once it lands.
        </p>
        <h2>Pixel parity today, server queue next</h2>
        <p>
          Studio renders the active panel at App Store-exact dimensions
          in-browser via html-to-image — every export is the same pixel
          shape the App Store expects. A server-side render queue that
          batches multi-frame and multi-locale fan-out is the v1.1 target.
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
    excerpt: "Structured AI output. No malformed JSON, ever.",
    body: (
      <>
        <h2>Schema</h2>
        <p>
          Headlines, subheadlines, and CTAs come back with guaranteed
          length limits and required fields — never malformed, never
          truncated mid-render.
        </p>
        <h2>Cost</h2>
        <p>1 credit per generation. Refunded on failure.</p>
        <h2>Prompt source</h2>
        <p>
          All prompts are version-controlled and A/B-hookable. We tune
          them centrally so output stays brand-consistent across the pack.
        </p>
      </>
    ),
  },
  "ai-backdrop": {
    title: "AI BACKDROP",
    excerpt: "Subject lift + AI-generated background, composited cleanly.",
    body: (
      <>
        <h2>Pipeline</h2>
        <ol>
          <li>AI extracts a high-fidelity subject matte from your screenshot</li>
          <li>AI paints a backdrop matching your app's mood and palette</li>
          <li>The server composites both at full resolution</li>
        </ol>
        <h2>Cost</h2>
        <p>2 credits per generation.</p>
      </>
    ),
  },
  translate: {
    title: "TRANSLATION",
    excerpt: "41 locales fan out in parallel. Auto-relayout per language.",
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
    excerpt: "v1.1 target — Studio tier. Preview spec below.",
    body: (
      <>
        <p className="t-mono-xs text-[var(--fg-mute)]">
          ▸ <strong>v1.1 target — not live yet.</strong> The shape below
          is the planned public API for Studio subscribers. Internal
          routes today serve only the first-party web app and don&apos;t
          enforce the idempotency or rate-limit contract documented
          here.
        </p>

        <h2>Auth (v1.1)</h2>
        <p>
          API keys will be issued from <Link href="/settings" className="link-tick">/settings</Link>.
          Send the key as <samp>Authorization: Bearer sk_live_...</samp>.
          Base URL: <samp>https://api.shotshq.com/v1</samp>.
        </p>

        <h2>Idempotency (v1.1)</h2>
        <p>
          Every mutating request will require an{" "}
          <samp>Idempotency-Key</samp> header. Keys will be retained for
          24 hours — replays will return the original response.
        </p>

        <h2>Planned endpoints</h2>
        <ul>
          <li><samp>POST /projects</samp> — create a new project</li>
          <li><samp>GET /projects</samp> — list your projects</li>
          <li><samp>GET /projects/:id</samp> — fetch a single project</li>
          <li><samp>PATCH /projects/:id</samp> — update canvas / metadata</li>
          <li><samp>POST /projects/:id/render</samp> — kick off a render</li>
          <li><samp>GET /projects/:id/screenshots</samp> — list rendered assets</li>
          <li><samp>POST /ai/copy</samp> — generate headline copy</li>
          <li><samp>POST /ai/backdrop</samp> — generate AI backdrop</li>
          <li><samp>POST /ai/translate</samp> — fan out to N locales</li>
          <li><samp>POST /webhooks</samp> — register a webhook URL</li>
        </ul>

        <h2>Webhooks (v1.1)</h2>
        <p>
          We&apos;ll POST to your registered URL for these events:{" "}
          <samp>render.completed</samp>, <samp>render.failed</samp>,{" "}
          <samp>credits.low</samp>, <samp>checkout.completed</samp>.
          Signed with HMAC-SHA256 in the{" "}
          <samp>X-ShotsHQ-Signature</samp> header.
        </p>

        <h2>Rate limits (v1.1)</h2>
        <p>
          Studio tier: 60 requests/minute. AI endpoints will have
          separate per-user concurrency limits (3 in-flight at once) —
          additional requests will be queued, not rejected.
        </p>
      </>
    ),
  },
  status: {
    title: "OPERATIONAL STATUS",
    excerpt: "How to check that ShotsHQ is up, and where status updates are posted.",
    body: (
      <>
        <h2>Liveness check</h2>
        <p>
          The canonical liveness endpoint is{" "}
          <Link href="/api/health" className="link-tick">/api/health</Link>.
          It returns an explicit JSON shape with a database round-trip
          result and a build identifier — useful for uptime monitors,
          incident response, and tooling. Cache headers are{" "}
          <samp>no-store</samp>, so every call is fresh.
        </p>
        <p>
          Response shape:
        </p>
        <pre><code>{`{
  "ok": true,
  "service": "shotshq",
  "version": "<sha-or-package-version>",
  "env": "production" | "preview" | "development",
  "checks": { "db": { "ok": true, "latencyMs": <ms> } },
  "latencyMs": <total-ms>,
  "ts": "<iso8601>"
}`}</code></pre>

        <h2>Incident communication</h2>
        <p>
          Pre-launch we don&apos;t publish a live status board. If
          something is broken, we post it in the{" "}
          <Link href="/changelog" className="link-tick">changelog</Link>{" "}
          and, for sustained outages, on the{" "}
          <Link href="/under-construction" className="link-tick">/under-construction</Link>{" "}
          surface that fronts the site during maintenance windows. A
          third-party status page (Statuspage / Better Stack) is in
          scope for v1.1.
        </p>

        <h2>Reporting an issue</h2>
        <p>
          Email <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>{" "}
          with the URL you were on, a screenshot, and the timestamp.
          The Sentry trace ID from the page footer (if present) speeds
          triage materially.
        </p>

        <p className="t-mono-xs text-[var(--fg-mute)]">
          This page intentionally shows no real-time metrics. ShotsHQ
          is pre-launch and we don&apos;t fabricate p50 latencies or
          queue depth — when a real status board ships, it&apos;ll be
          backed by the health endpoint above, not by hard-coded
          numbers.
        </p>
      </>
    ),
  },
  asc: {
    title: "APP STORE CONNECT",
    excerpt: "v1.1 target — direct upload of generated assets.",
    body: (
      <>
        <p className="t-mono-xs text-[var(--fg-mute)]">
          ▸ <strong>v1.1 target — not live yet.</strong> Today exports
          download as PNG; the App Store Connect direct-push integration
          ships alongside the server render queue. The exports page
          inside the authenticated app currently shows{" "}
          <samp>ASC · v1.1</samp> on this button.
        </p>

        <h2>Setup (v1.1)</h2>
        <p>
          You&apos;ll create an App Store Connect API key with the{" "}
          <samp>Marketing</samp> role, then paste the issuer ID + key
          into <Link href="/settings" className="link-tick">/settings</Link>.
        </p>
        <h2>Push (v1.1)</h2>
        <p>
          From any project, click <kbd>PUSH TO ASC</kbd>. We&apos;ll
          upload per-locale, per-device, with the App Store&apos;s
          required filename conventions handled.
        </p>
      </>
    ),
  },
  terms: {
    title:   "TERMS OF SERVICE",
    excerpt: "Plain English, no traps.",
    body: (
      <>
        <p className="t-mono-xs text-[var(--fg-mute)]">Last updated: 2026-04-30</p>

        <h2>1. The service</h2>
        <p>
          ShotsHQ (&quot;the service&quot;) lets you generate, edit, and export
          marketing screenshots for the Apple App Store and other surfaces.
          By creating an account or paying for a plan, you agree to these
          terms.
        </p>

        <h2>2. Your account</h2>
        <p>
          You are responsible for maintaining the security of your account
          credentials and for all activity under your account. We rely on
          a third-party identity provider (Clerk) for authentication —
          their terms also apply to your sign-in flow.
        </p>

        <h2>3. Payments &amp; refunds</h2>
        <ul>
          <li>
            <strong>Credit packs (Indie, Pro)</strong> are one-time purchases.
            Credits never expire. Unused credits are non-refundable except
            where required by law.
          </li>
          <li>
            <strong>Studio subscription</strong> bills monthly via Stripe.
            Cancel any time via the{" "}
            <Link href="/billing" className="link-tick">/billing</Link>{" "}
            page&apos;s Stripe portal — your subscription remains active
            through the end of the paid period. No prorated refunds.
          </li>
          <li>
            <strong>Failed AI generations</strong> are automatically refunded
            to your credit ledger. You don&apos;t pay for what didn&apos;t work.
          </li>
          <li>
            We may issue voluntary refunds at our discretion within 14 days
            of purchase if you&apos;re not satisfied — email{" "}
            <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>.
          </li>
        </ul>

        <h2>4. Acceptable use</h2>
        <p>You agree not to use ShotsHQ to:</p>
        <ul>
          <li>Generate assets for apps you don&apos;t own or have rights to.</li>
          <li>Generate sexually explicit, harassing, or illegal content.</li>
          <li>Reverse engineer, scrape, or resell the service.</li>
          <li>Bypass credit metering or pricing.</li>
        </ul>
        <p>
          We may suspend accounts that violate these rules without notice.
        </p>

        <h2>5. Your content</h2>
        <p>
          You retain ownership of all screenshots, copy, and assets you
          upload or generate. We claim a limited license only to store,
          process, and deliver them through our pipeline. You can delete
          a project at any time, which removes the assets from our storage
          within 30 days.
        </p>

        <h2>6. AI-generated content</h2>
        <p>
          AI-generated copy and imagery come from third-party models (see
          our <Link href="/docs/privacy" className="link-tick">privacy policy</Link>{" "}
          for the full list). We don&apos;t guarantee uniqueness — you should
          review AI output before submitting to App Store Connect.
        </p>

        <h2>7. Service availability</h2>
        <p>
          The service is provided as-is. We aim for 99.5% uptime but make
          no guarantees. Scheduled maintenance is announced in the{" "}
          <Link href="/changelog" className="link-tick">changelog</Link>.
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, ShotsHQ&apos;s total
          liability for any claim arising from these terms is capped at
          the amount you paid us in the 12 months preceding the claim.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these terms. Material changes will be announced
          via email and on the changelog at least 14 days before they take
          effect.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the laws of New South Wales, Australia.
          Disputes are resolved in the courts of that jurisdiction.
        </p>

        <h2>Contact</h2>
        <p>
          Questions:{" "}
          <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>.
        </p>
      </>
    ),
  },

  privacy: {
    title:   "PRIVACY POLICY",
    excerpt: "What we collect, why, and how to delete it.",
    body: (
      <>
        <p className="t-mono-xs text-[var(--fg-mute)]">Last updated: 2026-04-30</p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — email, name, OAuth provider IDs
            (Google, Apple) via our identity provider Clerk.
          </li>
          <li>
            <strong>Project content</strong> — uploaded screenshots, canvas
            state, generated outputs, headlines, and locale data.
          </li>
          <li>
            <strong>Billing data</strong> — handled by Stripe; we store only
            the customer ID and plan status, never card numbers.
          </li>
          <li>
            <strong>Usage data</strong> — feature events, error logs, and
            performance traces. Used for product improvement and debugging.
          </li>
        </ul>

        <h2>Why we collect it</h2>
        <ul>
          <li>To provide the service you signed up for (legal basis: contract).</li>
          <li>To prevent abuse and protect other users (legitimate interest).</li>
          <li>To process payments and meet tax obligations (legal obligation).</li>
          <li>To send transactional emails (contract). We never send marketing without explicit opt-in.</li>
        </ul>

        <h2>Third-party processors</h2>
        <p>
          We share the minimum necessary data with the following processors,
          each bound by their own DPA:
        </p>
        <ul>
          <li><strong>Clerk</strong> — authentication and session management.</li>
          <li><strong>Neon</strong> — Postgres hosting (project metadata, ledger).</li>
          <li><strong>Cloudflare R2</strong> — object storage (uploaded + generated assets).</li>
          <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
          <li><strong>OpenAI</strong> — AI copy and image generation.</li>
          <li><strong>fal.ai</strong> — AI image processing.</li>
          <li><strong>Trigger.dev</strong> — background job orchestration.</li>
          <li><strong>Loops</strong> — transactional email delivery.</li>
          <li><strong>PostHog</strong> — product analytics (events only, no PII).</li>
          <li><strong>Sentry</strong> — error monitoring.</li>
          <li><strong>Vercel</strong> — application hosting and edge network.</li>
        </ul>

        <h2>Data retention</h2>
        <ul>
          <li>
            <strong>AI prompts</strong> — passed through to model providers
            and not retained by us beyond 24 hours.
          </li>
          <li>
            <strong>Project assets</strong> — kept for the lifetime of your
            account. Deleted within 30 days of project deletion or account
            closure.
          </li>
          <li>
            <strong>Billing records</strong> — retained for 7 years to meet
            tax and accounting obligations.
          </li>
          <li>
            <strong>Logs</strong> — kept for 30 days, then deleted.
          </li>
        </ul>

        <h2>Your rights (GDPR, CCPA)</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access — request a copy of your data.</li>
          <li>Correction — fix inaccurate data.</li>
          <li>Deletion — close your account and delete all associated data.</li>
          <li>Portability — export your data in a machine-readable format.</li>
          <li>Object — opt out of processing for legitimate-interest purposes.</li>
        </ul>
        <p>
          Email{" "}
          <a href="mailto:privacy@shotshq.com" className="link-tick">privacy@shotshq.com</a>
          {" "}with any of these requests. We respond within 30 days.
        </p>

        <h2>Security</h2>
        <p>
          See our <Link href="/docs/security" className="link-tick">security</Link>{" "}
          page for details on encryption, access controls, and disclosure.
        </p>

        <h2>Children</h2>
        <p>
          ShotsHQ is not intended for users under 13. We don&apos;t knowingly
          collect data from children.
        </p>

        <h2>Changes</h2>
        <p>
          Material changes will be announced via email and the{" "}
          <Link href="/changelog" className="link-tick">changelog</Link> at
          least 14 days before they take effect.
        </p>

        <h2>Data Protection Officer</h2>
        <p>
          For EU/UK GDPR matters:{" "}
          <a href="mailto:privacy@shotshq.com" className="link-tick">privacy@shotshq.com</a>.
        </p>
      </>
    ),
  },

  security: {
    title:   "SECURITY",
    excerpt: "Encryption, access controls, and how to report a vulnerability.",
    body: (
      <>
        <h2>Encryption</h2>
        <ul>
          <li><strong>In transit:</strong> TLS 1.3 for all API + web traffic.</li>
          <li><strong>At rest:</strong> AES-256 for all storage (Cloudflare R2, Neon Postgres).</li>
          <li><strong>API keys:</strong> hashed before storage; only displayed once on creation.</li>
        </ul>

        <h2>Access controls</h2>
        <ul>
          <li>Project assets are scoped per-user — no cross-tenant access.</li>
          <li>Admin access is limited to the founder + uses MFA.</li>
          <li>AI prompts are not retained past 24 hours.</li>
        </ul>

        <h2>Compliance</h2>
        <ul>
          <li>SOC 2 Type II — in progress with target completion 2027-Q1.</li>
          <li>GDPR + CCPA — see <Link href="/docs/privacy" className="link-tick">privacy policy</Link>.</li>
        </ul>

        <h2>Responsible disclosure</h2>
        <p>
          Found a security issue? Please email{" "}
          <a href="mailto:security@shotshq.com" className="link-tick">security@shotshq.com</a>.
        </p>
        <p>We commit to:</p>
        <ul>
          <li>Acknowledge your report within 24 hours.</li>
          <li>Provide a remediation timeline within 5 business days.</li>
          <li>Credit you publicly (with your permission) once the issue is resolved.</li>
        </ul>
        <p>
          Please don&apos;t exploit or share vulnerabilities before we&apos;ve
          had a chance to fix them.
        </p>
      </>
    ),
  },

  about: {
    title:   "ABOUT",
    excerpt: "Who builds ShotsHQ and why.",
    body: (
      <>
        <h2>Built by an indie dev for indie devs</h2>
        <p>
          ShotsHQ is a solo studio — one builder, building in public. The
          tool exists because launching an iOS app means generating the same
          screenshot pack at three resolutions, with localized copy, with
          App Store-safe margins, with new device dimensions every September.
          That work shouldn&apos;t take a weekend. It should take a coffee.
        </p>
        <p>
          Every commit, every release, every postmortem ships to the{" "}
          <Link href="/changelog" className="link-tick">changelog</Link>.
          No vague &quot;bug fixes and improvements&quot; — you can read
          exactly what changed and when.
        </p>

        <h2>What we believe</h2>
        <ul>
          <li>
            <strong>Failed AI calls don&apos;t bill</strong> — credits return to
            your ledger, every time.
          </li>
          <li>
            <strong>Credits never expire</strong> — buy when you launch,
            spend whenever.
          </li>
          <li>
            <strong>Cancel via the Stripe portal</strong> — Studio
            subscriptions open the official Stripe billing portal from{" "}
            <Link href="/billing" className="link-tick">/billing</Link>.
            No email gauntlet, no retention dark patterns.
          </li>
          <li>
            <strong>App Store-exact pixels</strong> — Studio renders at
            the dimensions the App Store actually expects (1290×2796,
            1320×2868, 2064×2752). Server-side render queue +
            multi-locale fan-out ship in v1.1.
          </li>
        </ul>

        <h2>Status</h2>
        <p>
          Active development. New builds deploy every other Friday unless
          there&apos;s a fire. See the{" "}
          <Link href="/changelog" className="link-tick">changelog</Link> and{" "}
          <Link href="/docs/status" className="link-tick">system status</Link>{" "}
          for the latest.
        </p>

        <h2>Get in touch</h2>
        <p>
          Email{" "}
          <a href="mailto:hello@shotshq.com" className="link-tick">hello@shotshq.com</a>{" "}
          for partnerships, press, or just to say hi.
        </p>
      </>
    ),
  },

  contact: {
    title:   "CONTACT",
    excerpt: "Support and escalation.",
    body: (
      <>
        <ul>
          <li>
            <strong>Support:</strong>{" "}
            <a href="mailto:support@shotshq.com" className="link-tick">support@shotshq.com</a>
            {" "}— reply within 12 hours on weekdays.
          </li>
          <li>
            <strong>Privacy / GDPR:</strong>{" "}
            <a href="mailto:privacy@shotshq.com" className="link-tick">privacy@shotshq.com</a>
          </li>
          <li>
            <strong>Security disclosure:</strong>{" "}
            <a href="mailto:security@shotshq.com" className="link-tick">security@shotshq.com</a>
          </li>
          <li>
            <strong>Press / partnerships:</strong>{" "}
            <a href="mailto:hello@shotshq.com" className="link-tick">hello@shotshq.com</a>
          </li>
        </ul>
      </>
    ),
  },

  export: {
    title:   "EXPORT PIPELINE",
    excerpt: "Studio renders today; server queue + ASC push are v1.1 targets.",
    body: (
      <>
        <h2>What you get today</h2>
        <p>
          Studio renders the currently-active panel in-browser at App
          Store-exact pixel dimensions and downloads it as a PNG. One
          click per panel — no resampling, no scaling, no drift between
          what you see and what you ship.
        </p>
        <ul>
          <li><strong>Format:</strong> PNG (sRGB), no transparency.</li>
          <li><strong>Dimensions:</strong> 1290×2796 (iPhone 6.9″), 1320×2868 (iPhone 6.7″), 2064×2752 (iPad 13″).</li>
          <li><strong>Filename:</strong> <samp>{`{appname}-{device}.png`}</samp></li>
          <li><strong>Free tier:</strong> watermarked. Any paid pack removes the watermark.</li>
        </ul>

        <h2>v1.1 — server render queue</h2>
        <p>
          The next milestone wraps the per-panel render in a Trigger.dev
          task with R2 streaming so multi-frame and multi-locale fan-out
          run in parallel server-side. Same pixel-exact output, but a
          single click ships a ZIP of every panel × locale combination.
        </p>

        <h2>v1.1 — direct App Store Connect push</h2>
        <p>
          Studio + Lifetime plans will be able to skip the ZIP entirely
          and push direct to App Store Connect. See{" "}
          <Link href="/docs/asc" className="link-tick">App Store Connect setup</Link>.
          The exports page inside the authenticated app currently labels
          this button <samp>ASC · v1.1</samp> so you can see it lined up
          alongside the live <samp>Export current</samp> action.
        </p>
      </>
    ),
  },

  "device-frames": {
    title:   "DEVICE FRAMES",
    excerpt: "Supported iPhone and iPad frames + safe-area rules.",
    body: (
      <>
        <h2>Supported devices</h2>
        <p>
          Every device required by App Store Connect, plus the most recent
          model in each family. Apple auto-scales submitted screenshots
          across smaller devices in the same family.
        </p>
        <ul>
          <li><strong>iPhone 6.9″</strong> — 1290×2796 (iPhone 16 Pro Max, iPhone 17 Pro Max)</li>
          <li><strong>iPhone 6.7″</strong> — 1320×2868 (iPhone 15 Pro Max)</li>
          <li><strong>iPhone 6.5″ &amp; 5.5″</strong> — auto-scaled by Apple</li>
          <li><strong>iPad 13″ M4</strong> — 2064×2752 (the only iPad submission required)</li>
          <li><strong>iPad mini A17 Pro</strong> — Studio plan</li>
          <li><strong>Apple Watch Series 10</strong> — Studio plan</li>
        </ul>

        <h2>Safe areas</h2>
        <p>
          Every frame includes the correct status-bar zone, dynamic-island
          cutout (where applicable), and home-indicator margin. Headlines
          and CTAs rendered above or below the device automatically respect
          these bounds — your copy never gets clipped.
        </p>

        <h2>Selecting frames per project</h2>
        <p>
          Pick which devices to target when you create a project, or change
          them later in the project settings. Required devices for App Store
          submission are flagged with a red dot.
        </p>

        <h2>Custom frames</h2>
        <p>
          Studio plan supports uploading your own device frame masters
          (SVG or PNG with alpha) for marketing-only renders — useful for
          showcasing on websites or in press kits.
        </p>
      </>
    ),
  },
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
