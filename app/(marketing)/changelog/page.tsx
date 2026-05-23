import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every milestone in building ShotsHQ in public. Pre-launch — real ship dates, honest status.",
};

/**
 * Changelog — pre-launch edition.
 *
 * The build-in-public site is held to a strict honesty rule: nothing
 * goes on this page that isn't actually in the deployed code or has a
 * verifiable PR. Speculative work belongs on the Roadmap below, not in
 * release notes.
 *
 * Channels:
 *   PRE-LAUNCH — wired in code, gated by the WIP banner on shotshq.com
 *   PREVIEW    — endpoint or UI exists but needs operator config
 *                (Stripe price IDs, Clerk live key, etc.)
 *   INTERNAL   — landed in the repo but not surfaced in the UI
 */

type Channel = "PRE-LAUNCH" | "PREVIEW" | "INTERNAL";

const ENTRIES: Array<{
  rev:     string;
  date:    string;
  channel: Channel;
  note?:   string;
  changes: { tag: "ADD" | "FIX" | "PERF" | "REM"; body: string }[];
}> = [
  {
    rev:     "v0.11",
    date:    "2026-05-23",
    channel: "PRE-LAUNCH",
    note:    "App-shell stability: Clerk's UserButton was emitting hydration mismatch errors on every authenticated route. The shell now hydrates cleanly + the e2e harness no longer flakes on heavy upload paths.",
    changes: [
      { tag: "FIX",  body: "Topbar's <UserButton /> wrapped in a mount-gate (stable aria-hidden placeholder during SSR + first client render, swap to real Clerk widget after useEffect). Eliminates `Hydration failed because the server rendered HTML didn't match the client` errors on /dashboard, /projects, /projects/new, /projects/[id], /studio, /exports, /billing, /settings. Placeholder dims match the eventual avatar box so there's no layout shift." },
      { tag: "ADD",  body: "e2e/no-hydration-errors.spec.ts — Playwright spec that visits all 8 Topbar routes, listens for any console-error or pageerror matching React #418 / #421 / #423 / #425 codes or `hydrat*` text, fails the build on a regression." },
      { tag: "PERF", body: "Playwright workers capped at 2 locally + 1 retry (CI keeps 1 worker / 2 retries). The studio upload + autosave path saturates Next dev under unbounded parallelism; the cap drops e2e flakes to zero and the full suite runs 21/21 green." },
    ],
  },
  {
    rev:     "v0.10",
    date:    "2026-05-23",
    channel: "PRE-LAUNCH",
    note:    "Studio uploads now persist + Export current produces a real exact-pixel App Store PNG. Two stacked bugs were silently masking each other in the pre-fix code.",
    changes: [
      { tag: "ADD",  body: "/api/upload/direct — same-origin proxied multipart upload that PUTs to R2 with server credentials. Sidesteps missing R2 bucket-CORS without operator action. Studio's onUpload routes through this; the blob URL is swapped for the durable https URL on success and screenshotRemote flips to true." },
      { tag: "ADD",  body: "/api/r2-proxy — same-origin read proxy for R2 public URLs. Strict key-regex validation (users/<uuid>/(projects/<uuid>|uploads)/<nanoid>.<ext>), content-type allowlist (PNG/JPEG/WEBP), 12 MB cap, immutable cache headers. Lets html-to-image's canvas.drawImage read R2 bytes without tainting the canvas." },
      { tag: "FIX",  body: "Studio readiness now requires screenshotRemote === true. A blob URL alone (browser-local, stripped on save) no longer counts as ready — the prior signal lied because panels looked ready but vanished on reload." },
      { tag: "FIX",  body: "Export pixel-ratio double-scaling. html-to-image multiplies canvasWidth by pixelRatio when both are set; the prior code passed both and produced 3782×… instead of 1290×2796. Dropped the redundant canvasWidth/canvasHeight options — single source of truth is `node CSS width × pixelRatio = output px`." },
      { tag: "ADD",  body: "e2e/studio-export-loop.spec.ts — sharp-measured PNG validation. Drives upload → autosave → Export current → captured download → sharp.metadata() asserts format=png + exact 1290×2796 dims + file size > 20 KB (rules out tainted blanks). Cross-surface READY asserted on /dashboard + /projects + /projects/[id] after the export." },
      { tag: "ADD",  body: "e2e/studio-upload-persistence.spec.ts — proves the upload survives autosave + page reload, with the panel still marked READY on the rehydrated /studio surface." },
    ],
  },
  {
    rev:     "v0.9",
    date:    "2026-05-23",
    channel: "PRE-LAUNCH",
    note:    "Truthful surfaces sweep: Studio, /exports, /projects/[id], /dashboard, and /projects all derive status from one shared readiness model instead of hardcoding `READY` / `DRAFT` regardless of real state.",
    changes: [
      { tag: "ADD",  body: "lib/studio/readiness.ts — single source of truth. evaluatePanel + evaluateStudio + statusOf + statusLabel produce a canonical enum (empty / blocked / partial / ready) that every surface consumes." },
      { tag: "ADD",  body: "lib/studio/project-status.ts — wraps the readiness chain for per-project status across the list + overview surfaces. Same enum, same badge variant, same state-aware next-action (Open studio / Upload in Studio / Prepare in Studio / Open Exports)." },
      { tag: "FIX",  body: "Studio's `EXPORT READY` InfoCell + Export current / Export all buttons now gate on real readiness. Empty projects no longer claim ready or enable export. Defense-in-depth: if a blocked panel is dispatched anyway (DevTools strip), the run logs a Blocked row with the missing-pieces reason instead of silently no-opping." },
      { tag: "FIX",  body: "/projects/[id]/exports — dead-end `Render now · coming soon` CTA replaced with state-aware `Prepare in Studio` / `Open Studio to export`. Per-device cards show real PANELS X / READY Y counts derived from studio.panels[].deviceId. Header readiness card matches Studio's data-readiness-status." },
      { tag: "FIX",  body: "/projects/[id] overview — replaced hardcoded `Shot grid · 0 / 24 slots` + 8 empty placeholders + always-`◯ READY` target rows with real panel-derived state. Per-panel checklist surfaces what's blocking; target rows progress READY / PARTIAL / DRAFTING / TARGETED." },
      { tag: "FIX",  body: "/dashboard rows + /projects cards no longer hardcode `<Badge>Draft</Badge>` on every entry. Both surfaces consume projectStatus() — data-project-status enum + truthful badge label + truthful `X / Y panels ready` sub-line. Cross-surface consistency spec asserts /dashboard / /projects / /projects/[id] all agree per project." },
    ],
  },
  {
    rev:     "v0.8",
    date:    "2026-05-23",
    channel: "PRE-LAUNCH",
    note:    "Screenshot Studio engine: ASOForge-style constrained pack builder replaces the Fabric.js freeform editor as the primary editing surface. /editor redirects to /studio.",
    changes: [
      { tag: "ADD",  body: "components/studio/* — Phase A engine: one project owns an ordered panel set (headline + subhead + screenshot + theme + layout + device class + frame style per panel). Constrained-by-design produces App Store-ready output without freeform layout decisions." },
      { tag: "ADD",  body: "Multi-panel filmstrip on /studio with ordered selection, duplication, reordering, deletion, and bulk export naming. Each panel renders into the device frame at exact pixel dimensions on export." },
      { tag: "ADD",  body: "Studio is now the default editing route — /projects/[id]/editor server-side redirects to /projects/[id]/studio. The legacy Fabric route is retired from the user path; lib/canvas/* stays as schema infrastructure that Studio reads/writes through." },
      { tag: "FIX",  body: "Studio device-class switch was a UI lie. Clicking iPhone 6.7 or iPad 13 left iPhone 6.9 visually selected; preview header + filmstrip metadata stuck on the old device. Added aria-pressed + aria-checked + data-active + role=radio markers + an active text-color flip so the selected state is unambiguous. Extracted the switch logic to a pure reducer (lib/studio/device-switch.ts) with 12 unit specs + 3 Playwright specs covering click → selected styling, filmstrip metadata, and selection persistence across page reload (autosave)." },
    ],
  },
  {
    rev:     "v0.7",
    date:    "2026-04-30",
    channel: "PRE-LAUNCH",
    note:    "AI dispatch is real now — Copy + Backdrop both call live models behind a Trigger.dev task that owns the credit ledger transaction.",
    changes: [
      { tag: "ADD",  body: "AI Copy module wired end-to-end: GPT-5 via Vercel AI SDK + Zod, dispatched as a Trigger.dev task, polled for completion." },
      { tag: "ADD",  body: "AI Backdrop module wired end-to-end: gpt-image-1 6-frame composition, six art-direction presets (minimal-light, tactical-dark, warm-organic, playful-gradient, tech-minimal, editorial), result lands in Cloudflare R2." },
      { tag: "ADD",  body: "Status passthrough at /api/ai/runs/[runId] so the editor can poll any dispatched task." },
      { tag: "ADD",  body: "Sentry observability helper (lib/observability/log.ts) replaces every console.error in the API surface." },
      { tag: "ADD",  body: "OG image fonts: Archivo Black + JetBrains Mono fetched from Google's CDN at edge runtime, rendered into every social card." },
      { tag: "FIX",  body: "Editor save path is now single-source — FabricCanvas's status bar is the only save UI; redundant disabled topbar Save removed." },
      { tag: "REM",  body: "Polotno scaffolding deleted (PolotnoProvider, PolotnoCanvas) — Fabric.js v7 is the locked canvas." },
    ],
  },
  {
    rev:     "v0.6",
    date:    "2026-04-30",
    channel: "PREVIEW",
    note:    "Purchase + project-create flows are functional in code but require Stripe price IDs and Trigger.dev secrets in Vercel before traffic can hit them.",
    changes: [
      { tag: "ADD",  body: "Stripe Checkout: /api/stripe/checkout POST + new PurchaseButton client island. Surfaces inline errors when Stripe price IDs aren't configured." },
      { tag: "ADD",  body: "/api/projects POST creates real DB rows; new-project wizard COMMIT button now routes into the editor instead of 404-ing." },
      { tag: "ADD",  body: "/api/ai/template-set migrated from synchronous route handler to a Trigger.dev task — closes the credit-ledger invariant violation flagged in audit pass 3." },
      { tag: "FIX",  body: "Mobile horizontal scroll: html { overflow-x: clip } global guard + dropped whitespace-nowrap on the hero headline that overflowed below 375px." },
    ],
  },
  {
    rev:     "v0.5",
    date:    "2026-04-29",
    channel: "PRE-LAUNCH",
    note:    "Pre-launch hygiene + the work-in-progress banner. Site goes from 'looking ready' to 'visibly building'.",
    changes: [
      { tag: "ADD",  body: "Hazard-stripe WIP banner above every page — local-storage dismissable, version-keyed so we can re-arm it for major changes." },
      { tag: "ADD",  body: "Build-time Clerk live-key guard in next.config.ts: warns by default, fails the Vercel build when STRICT_LAUNCH_CHECKS=1." },
      { tag: "FIX",  body: "Wordmark lockup splits SHOTS / HQ across six surfaces — Header, Footer, sticky CTA bar, auth chrome, sidebar, OG route." },
      { tag: "FIX",  body: "Every unwired CTA in the logged-in app surfaces is now visibly disabled with 'coming soon' tooltips. No more silent no-ops." },
    ],
  },
  {
    rev:     "v0.4",
    date:    "2026-04-28",
    channel: "PRE-LAUNCH",
    note:    "Conversion audit pass — anti-AI-slop sweep, brand-respectful motion, and the /tools/web-hero landing.",
    changes: [
      { tag: "ADD",  body: "/tools/web-hero designer landing for the surface that ships outside App Store." },
      { tag: "ADD",  body: "Scroll-reveal motion across marketing surfaces — IntersectionObserver-based, GPU-only transform + opacity, prefers-reduced-motion honored." },
      { tag: "FIX",  body: "Tactical theme contrast: --fg-mute calibrated to 6.2:1 against #0A0A0A (was failing WCAG AA at 4.04:1)." },
      { tag: "FIX",  body: "Hero backdrop banding: quality bumped to 95, AVIF format priority, fractalNoise dither overlay to break 8-bit gradient banding." },
    ],
  },
  {
    rev:     "v0.3",
    date:    "2026-04-25",
    channel: "INTERNAL",
    note:    "Brand-extraction pipeline: paste a URL, the model reads the site's palette, typography, and voice and seeds it into the project.",
    changes: [
      { tag: "ADD",  body: "/api/brand/extract endpoint backed by gpt-5 with Zod-validated BrandProfile schema." },
      { tag: "ADD",  body: "Surface system: every project ships App Store + Web hero + OG card + Discord banner + Product Hunt gallery + GitHub social card from one canvas." },
      { tag: "PERF", body: "Pipeline diagram tracer animation: pure transform/opacity, runs at 60fps on iOS Safari without GPU thermal throttling." },
    ],
  },
  {
    rev:     "v0.2",
    date:    "2026-04-15",
    channel: "INTERNAL",
    note:    "Canvas + credit ledger landed. Trigger.dev task graph for the long-running AI work.",
    changes: [
      { tag: "ADD",  body: "Fabric.js v7 canvas integrated, state persisted to JSONB. (Polotno was evaluated and rejected — $899/mo not viable for v1.)" },
      { tag: "ADD",  body: "Credit ledger: append-only, idempotency-keyed, Stripe meter event reuses the same key." },
      { tag: "ADD",  body: "Trigger.dev v3 tasks: ai-generate-copy, ai-restyle, batch-translate, render-screenshot, upload-to-app-store. Each task is the transaction boundary for debit + AI + meter." },
    ],
  },
  {
    rev:     "v0.1",
    date:    "2026-04-01",
    channel: "INTERNAL",
    note:    "Initial scaffold. Auth, DB, storage, payments wired before the first feature commit.",
    changes: [
      { tag: "ADD",  body: "Next.js 16 App Router + Clerk auth + Neon Postgres (Drizzle) + Cloudflare R2 + Stripe Billing + sharp render pipeline." },
      { tag: "ADD",  body: "Dual theme system (Tactical / Swiss) keyed off CSS variables for instant runtime switching inside the app." },
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  ADD:  "text-[var(--signal)] border-[var(--signal)]",
  FIX:  "text-[var(--accent)] border-[var(--accent)]",
  PERF: "text-[var(--fg)] border-[var(--fg)]",
  REM:  "text-[var(--fg-mute)] border-[var(--fg-mute)]",
};

const CHANNEL_COLORS: Record<Channel, string> = {
  "PRE-LAUNCH": "text-[var(--signal)] border-[var(--signal)]",
  PREVIEW:      "text-[var(--accent)] border-[var(--accent)]",
  INTERNAL:     "text-[var(--fg-mute)] border-[var(--line-strong)]",
};

const ROADMAP: { title: string; detail: string; eta: string }[] = [
  {
    title: "Stripe checkout live to traffic",
    detail: "Price IDs configured in Vercel, end-to-end test with a real card. Publishes the existing PurchaseButton flow.",
    eta:    "This week",
  },
  {
    title: "Clerk production keys + DNS",
    detail: "Custom-domain DNS for the Clerk prod instance, OAuth providers configured, pk_live_/sk_live_ rotated in Vercel, STRICT_LAUNCH_CHECKS=1.",
    eta:    "This week",
  },
  {
    title: "Translate module UI",
    detail: "batch-translate task already exists; the 41-locale picker dispatches in parallel.",
    eta:    "Next week",
  },
  {
    title: "Real per-template visual previews",
    detail: "Replace the 21 stylized placeholders on /templates with actual rendered previews of each template's typography and palette.",
    eta:    "Next week",
  },
  {
    title: "Lift WIP banner",
    detail: "Once Stripe + Clerk are live and the translate UI ships, the yellow hazard banner comes off and the site enters public beta.",
    eta:    "TBD — gated on the items above",
  },
];

export default function ChangelogPage() {
  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Release log</div>
              <h1 className="t-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92]">
                Build log, in public.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="t-prose-lg max-w-md">
                Pre-launch — every entry below is shipped code or a
                signed PR. Anything we&apos;d like to ship but haven&apos;t
                yet lives in the roadmap section at the bottom.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-4 md:px-8 grid grid-cols-12 gap-10 py-12">
        <aside className="hidden lg:block col-span-3 sticky top-[88px] self-start">
          <div className="t-eyebrow mb-4">Index</div>
          <ul className="space-y-2.5 border-l border-[var(--line)] pl-4">
            {ENTRIES.map((e) => (
              <li key={e.rev} className="flex items-baseline justify-between gap-3">
                <a
                  href={`#${e.rev.replace(/[\s.]/g, "-")}`}
                  className="text-[14px] text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
                >
                  {e.rev}
                </a>
                <span className="text-[12px] text-[var(--fg-mute)] t-numeric">{e.date}</span>
              </li>
            ))}
            <li className="pt-2 mt-2 border-t border-[var(--line)]">
              <a
                href="#roadmap"
                className="text-[14px] text-[var(--accent)] hover:text-[var(--fg)] transition-colors"
              >
                Roadmap
              </a>
            </li>
          </ul>
        </aside>

        <div className="col-span-12 lg:col-span-9 space-y-16">
          {ENTRIES.map((entry) => (
            <article key={entry.rev} id={entry.rev.replace(/[\s.]/g, "-")}>
              <header className="flex items-baseline justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-[var(--line)]">
                <div className="flex items-baseline gap-4 flex-wrap">
                  <h2 className="t-display text-[28px] sm:text-[32px] leading-none normal-case tracking-[-0.02em]">
                    {entry.rev}
                  </h2>
                  <span className="text-[13px] text-[var(--fg-mute)] t-numeric">{entry.date}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-[0.14em] uppercase border px-2 py-0.5 ${
                    CHANNEL_COLORS[entry.channel]
                  }`}
                >
                  {entry.channel}
                </span>
              </header>
              {entry.note && (
                <p className="t-mono-xs text-[var(--fg-dim)] mb-5 italic border-l-2 border-[var(--line-strong)] pl-3 leading-relaxed">
                  {entry.note}
                </p>
              )}
              <ul className="space-y-2.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`inline-block min-w-[42px] text-center text-[10px] font-semibold tracking-[0.08em] uppercase border px-1.5 py-0.5 mt-0.5 ${
                        TAG_COLORS[c.tag] ?? ""
                      }`}
                    >
                      {c.tag.toLowerCase()}
                    </span>
                    <span className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed">{c.body}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* ── Roadmap ─────────────────────────────────────────────────── */}
          <article id="roadmap" className="pt-6 border-t-2 border-[var(--line-strong)]">
            <header className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
              <div className="flex items-baseline gap-4 flex-wrap">
                <h2 className="t-display text-[28px] sm:text-[32px] leading-none normal-case tracking-[-0.02em]">
                  Roadmap
                </h2>
                <span className="text-[13px] text-[var(--fg-mute)]">Next ship targets</span>
              </div>
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase border px-2 py-0.5 text-[var(--fg-mute)] border-[var(--line-strong)]">
                Not shipped
              </span>
            </header>
            <ul className="space-y-4">
              {ROADMAP.map((r) => (
                <li key={r.title} className="grid grid-cols-12 gap-3 sm:gap-4 border-b border-[var(--line)] pb-4 last:border-b-0">
                  <div className="col-span-12 sm:col-span-3 md:col-span-2 t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] pt-1">
                    {r.eta}
                  </div>
                  <div className="col-span-12 sm:col-span-9 md:col-span-10">
                    <div className="text-[15px] text-[var(--fg)] font-medium leading-snug">
                      {r.title}
                    </div>
                    <p className="text-[13px] text-[var(--fg-dim)] mt-1 leading-relaxed">
                      {r.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </>
  );
}
