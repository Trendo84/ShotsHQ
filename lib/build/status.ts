/**
 * Build status / roadmap — single source of truth.
 *
 * To update: change `status` on a step and run `pnpm dev`. The /build
 * page reads from this file directly.
 *
 *   "done"        → ✅ shipped, tested
 *   "in_progress" → 🟡 actively being worked on
 *   "todo"        → ⬜ not started
 *   "blocked"     → 🔴 waiting on something external
 */

export type Status = "done" | "in_progress" | "todo" | "blocked";

export type Link = { label: string; href: string };

export type Step = {
  id:          string;
  title:       string;
  status:      Status;
  description?: string;
  links?:      Link[];
  notes?:      string;
};

export type Phase = {
  id:          string;
  number:      string;
  title:       string;
  subtitle:    string;
  steps:       Step[];
};

export const LAST_UPDATED = "2026-04-29 19:30 AEST";
export const REPO_URL     = "https://github.com/Trendo84/ShotsHQ";
export const PROD_URL     = "https://shotshq.com";

export const PHASES: Phase[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "infra",
    number:   "01",
    title:    "Infrastructure & Provisioning",
    subtitle: "All third-party services wired and tested",
    steps: [
      {
        id:     "domain",
        title:  "Domain registration",
        status: "done",
        description: "Bought shotshq.com and shotshq.app via Spaceship.",
        links: [
          { label: "Spaceship dashboard", href: "https://www.spaceship.com" },
        ],
      },
      {
        id:     "cloudflare",
        title:  "Cloudflare DNS",
        status: "done",
        description:
          "Nameservers pointed from Spaceship → Cloudflare. A record + www CNAME for Vercel, plus 6 Loops email records (MX, 2 TXT, 3 DKIM CNAME). All set to DNS-only.",
        links: [
          { label: "Cloudflare DNS", href: "https://dash.cloudflare.com" },
        ],
      },
      {
        id:     "r2",
        title:  "Cloudflare R2 (storage)",
        status: "done",
        description:
          "Bucket `shotshq-exports` created, API token with Object R/W scope, public URL enabled, full PUT/HEAD/GET/DELETE round-trip verified.",
      },
      {
        id:     "neon",
        title:  "Neon Postgres",
        status: "done",
        description:
          "Sydney (ap-southeast-2) region, pooled + unpooled URLs wired, schema migrated (5 tables: users, projects, screenshots, credit_ledger, ai_jobs).",
        links: [
          { label: "Neon console", href: "https://console.neon.tech" },
        ],
      },
      {
        id:     "clerk",
        title:  "Clerk auth",
        status: "done",
        description:
          "Test mode keys wired. Google sign-in tested. User auto-syncs to Postgres on dashboard hit via `getOrCreateDbUser`.",
        notes:  "Switch to production keys before launch.",
        links: [
          { label: "Clerk dashboard", href: "https://dashboard.clerk.com" },
        ],
      },
      {
        id:     "stripe",
        title:  "Stripe Billing",
        status: "done",
        description:
          "Test mode. 4 products: Indie Pack ($19), Pro Pack ($49), Studio Monthly, Studio Annual. 1 meter (`ai_generation`). Webhook endpoint `/api/webhooks/stripe` configured for 5 events with signing secret wired.",
        notes:  "Switch to live mode before launch.",
        links: [
          { label: "Stripe webhooks",  href: "https://dashboard.stripe.com/test/webhooks" },
          { label: "Stripe products",  href: "https://dashboard.stripe.com/test/products" },
        ],
      },
      {
        id:     "openai",
        title:  "OpenAI API",
        status: "done",
        description: "Separate account from ChatGPT Pro. $6 starter credit. GPT-5 access verified.",
        notes:  "Top up to $50+ before public launch.",
        links: [
          { label: "OpenAI billing", href: "https://platform.openai.com/account/billing" },
        ],
      },
      {
        id:     "fal",
        title:  "fal.ai (Flux 2)",
        status: "done",
        description: "Key wired, $10 credit funded. Used for AI backdrop generation.",
        links: [
          { label: "fal.ai dashboard", href: "https://fal.ai/dashboard" },
        ],
      },
      {
        id:     "trigger",
        title:  "Trigger.dev v3",
        status: "done",
        description: "Project + secret key wired. Tasks: render-screenshot, ai-generate-copy, ai-restyle, batch-translate, send-low-credit-email, upload-to-app-store.",
        links: [
          { label: "Trigger.dev console", href: "https://cloud.trigger.dev" },
        ],
      },
      {
        id:     "loops",
        title:  "Loops (transactional email)",
        status: "in_progress",
        description: "API key wired. DNS records added in Cloudflare. Pending Loops verification (auto-completes once DNS propagates).",
        links: [
          { label: "Loops dashboard", href: "https://app.loops.so" },
        ],
      },
      {
        id:     "posthog",
        title:  "PostHog analytics",
        status: "done",
        description: "Project API key wired. Hosted region: us.i.posthog.com.",
        notes:  "Funnel events still need to be instrumented in app code.",
        links: [
          { label: "PostHog dashboard", href: "https://us.posthog.com" },
        ],
      },
      {
        id:     "sentry",
        title:  "Sentry error tracking",
        status: "done",
        description: "DSN wired (server + client). Project: shotshq.",
        notes:  "Sentry SDK still needs to be initialized in app code.",
        links: [
          { label: "Sentry issues", href: "https://sentry.io" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "deploy",
    number:   "02",
    title:    "Deploy & Domain",
    subtitle: "Production live at shotshq.com",
    steps: [
      {
        id:     "github",
        title:  "GitHub repository",
        status: "done",
        description: "Public repo. main branch tracks production. Initial commit + Next.js CVE patch landed.",
        links: [
          { label: "Repository", href: "https://github.com/Trendo84/ShotsHQ" },
        ],
      },
      {
        id:     "vercel-deploy",
        title:  "Vercel deployment",
        status: "done",
        description: "Project linked to GitHub main branch, auto-deploys on push. Next.js 16.2.4 (patched CVE-2025-66478). 28 env vars configured.",
        links: [
          { label: "Vercel dashboard", href: "https://vercel.com/dashboard" },
        ],
      },
      {
        id:     "domain-attached",
        title:  "Domain attached to Vercel",
        status: "in_progress",
        description: "shotshq.com A record points to 216.198.79.1. www → cname.vercel-dns.com. Awaiting Vercel verification (1-2 min after DNS propagates).",
        notes:  "Click Refresh in Vercel → Settings → Domains.",
      },
      {
        id:     "redirect-app",
        title:  "shotshq.app → shotshq.com 301",
        status: "todo",
        description: "Add shotshq.app to Vercel as a redirect-only domain pointing to shotshq.com.",
      },
      {
        id:     "stripe-webhook-prod",
        title:  "Stripe webhook (production endpoint)",
        status: "done",
        description: "Endpoint configured at https://shotshq.com/api/webhooks/stripe with 5 events. Signing secret added to Vercel env.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "core",
    number:   "03",
    title:    "Core Application",
    subtitle: "Marketing site, app shell, editor, AI pipeline",
    steps: [
      {
        id:     "marketing-site",
        title:  "Marketing site",
        status: "done",
        description: "Hero, FeatureGrid, Templates, Comparison, FAQ, CTA, Surfaces, Roadmap. Both themes (Tactical & Swiss). Fluid typography across 375→2560px.",
      },
      {
        id:     "auth-flow",
        title:  "Auth flow",
        status: "done",
        description: "Sign-in / sign-up pages. Clerk wired. User row auto-created in Postgres on first dashboard hit.",
      },
      {
        id:     "dashboard",
        title:  "Dashboard",
        status: "done",
        description: "Projects list, recent activity feed, credit balance widget.",
      },
      {
        id:     "projects-crud",
        title:  "Projects CRUD",
        status: "done",
        description: "/projects (list), /projects/new (3-step wizard with device picker), /projects/[id] (detail + actions).",
      },
      {
        id:     "fabric-editor",
        title:  "Fabric.js editor (replaces Polotno)",
        status: "done",
        description: "Real Fabric.js v7 canvas. Backdrop swatches + gradient presets wired to canvas. Text layer add/edit. Zoom controls. Auto-save to Postgres every 1.5s. Polotno SDK dropped ($899/mo) — replaced with free OSS Fabric.",
      },
      {
        id:     "ai-panel",
        title:  "AI panel UI",
        status: "done",
        description: "Module cards for Generate Copy, Generate BG, Restyle, Translate × 41. Cost badges (1-3 credits).",
      },
      {
        id:     "ai-routes",
        title:  "AI API routes",
        status: "in_progress",
        description: "/api/ai/copy and /api/ai/backdrop dispatch to Trigger.dev. UI not yet wired to call them.",
      },
      {
        id:     "credit-ledger",
        title:  "Credit ledger",
        status: "done",
        description: "Append-only ledger. Idempotent debits. Source-of-truth for balance. Studio/Lifetime users skip debits but still get analytics rows.",
      },
      {
        id:     "stripe-handlers",
        title:  "Stripe webhook handlers",
        status: "done",
        description: "Handles checkout.session.completed (credit packs + subs), subscription created/updated/deleted, invoice.payment_succeeded.",
      },
      {
        id:     "render-pipeline",
        title:  "Server render pipeline",
        status: "done",
        description: "trigger.dev task → sharp composites ShotsCanvas JSON → upload to R2 → screenshots row inserted. Watermark for free tier.",
      },
      {
        id:     "device-catalog",
        title:  "Device catalog",
        status: "done",
        description: "22 iOS devices (iPhone 17 Pro Max → iPhone SE 3, iPad Pro M4 → iPad mini A17 Pro). Full Apple spec metadata. Required-for-store flag.",
      },
      {
        id:     "surfaces",
        title:  "Surface expansion",
        status: "done",
        description: "6 output channels: App Store, web hero (desktop + mobile), OG/Twitter, Discord, Product Hunt, GitHub. Plan-gated.",
      },
      {
        id:     "seo",
        title:  "SEO + observability",
        status: "done",
        description: "/sitemap.xml, /robots.txt, /api/og (1200×630 dynamic), JSON-LD on landing, /api/health probe.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "design-quality",
    number:   "04",
    title:    "Design Quality (Critical)",
    subtitle: "Make output worthy of $19 — not generic AI slop",
    steps: [
      {
        id:     "gpt-image-1",
        title:  "gpt-image-1 route — premium tier",
        status: "done",
        description:
          "POST /api/ai/template-set generates a cohesive 6-up App Store screenshot composition in a single gpt-image-1 call (PulseChef-style). Cost: 8 credits. Auto-refund on failure. Uploaded to R2. Synchronous (15-30s).",
        links: [
          { label: "gpt-image-1 docs", href: "https://platform.openai.com/docs/guides/images" },
        ],
      },
      {
        id:     "per-frame-pipeline",
        title:  "Per-frame composite pipeline (production path)",
        status: "done",
        description:
          "lib/render/composite.ts: takes AI backdrop + real screenshot + headline → outputs 1290×2796 App Store-ready PNG. lib/render/iphone-frame.ts: vector iPhone 16 Pro with screen cutout. lib/ai/prompts/backdrop.ts: per-frame backdrop-only prompt (no phone, no UI, no text). End-to-end smoke test passing — output is genuinely submission-grade.",
      },
      {
        id:     "wide-preview-as-feature",
        title:  "Demote wide-composition to 'Style Preview' feature",
        status: "in_progress",
        description:
          "/api/ai/template-set route still works but is no longer the production path. It's now a low-cost vibe-check tool (1 call shows the full direction). Production output flows through the per-frame composite pipeline.",
      },
      {
        id:     "template-set-ui",
        title:  "Wire 'Generate template set' button on /projects/[id]",
        status: "todo",
        description:
          "UI on project page: pick style, paste app description, generate wide preview (8 cr), then 'Generate full set' triggers per-frame backdrops + composite (24 cr total).",
      },
      {
        id:     "premium-mockup-pack",
        title:  "Swap vector iPhone frame for premium PNG mockup library",
        status: "todo",
        description:
          "Buy/license 6-8 photo-realistic iPhone mockup PNGs (Envato, Mockup World, etc., ~$30 total). Replace vector frame in lib/render/iphone-frame.ts with PNG paths. Architecture is identical — just better-looking frames.",
      },
      {
        id:     "prompt-library",
        title:  "Build lib/ai/prompts/ library with design DNA",
        status: "in_progress",
        description:
          "Directory created. lib/ai/prompts/template-set.ts shipped with 6 style direction systems (minimal-light, tactical-dark, warm-organic, playful-gradient, tech-minimal, editorial). Still TODO: copy + layout + backdrop prompts, plus examples/ folder.",
      },
      {
        id:     "few-shot-examples",
        title:  "Curate 30+ few-shot examples across 6 categories",
        status: "todo",
        description:
          "Productivity, fitness, finance, social, AI tools, games. 5 examples each. Each example: app description input → copy + layout output. Pasted into the GPT call as context. Quality jumps without fine-tuning.",
      },
      {
        id:     "brand-extraction",
        title:  "Brand extraction from URL — 'paste your site, get matching screenshots'",
        status: "done",
        description:
          "POST /api/brand/extract takes any URL → fetches HTML → gpt-5 returns a structured BrandProfile (palette, typography, voice, vibe, tagline ideas). Validated on linear.app: extracted exact Linear colors (#6E56CF, #5EA2EF, #08090A) + correct vibe + Linear-voice taglines. Profile feeds directly into gpt-image-1 backdrop prompts so output stays brand-perfect.",
        notes:  "Stolen pattern from SkillUI's design-system extraction approach.",
      },
      {
        id:     "starter-templates",
        title:  "15 starter ShotsCanvas templates",
        status: "todo",
        description:
          "Hand-author or AI-generate 15 polished templates as JSON in `lib/templates/`. Each is a curated composition users can swap copy/colors into. Show on /projects/new picker.",
      },
      {
        id:     "app-screenshot-upload",
        title:  "App screenshot upload + auto-clip into device",
        status: "todo",
        description:
          "Drop zone in editor. Uploads PNG → R2. AppScreenshotLayer auto-positioned inside the device frame's screen rect. Ratio-locked.",
      },
      {
        id:     "device-mockup-pngs",
        title:  "Device mockup PNG library",
        status: "todo",
        description:
          "6+ phone mockups (front, angled left, angled right, dual-phone, tilted, in-hand). Currently using SVG silhouettes — too flat for premium output.",
      },
      {
        id:     "decorative-svgs",
        title:  "Decorative SVG asset library",
        status: "todo",
        description:
          "Halftones, blobs, dot grids, arrows, badges, frames. ~30-50 reusable assets. Pulled into editor's 'Stickers' panel.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "pre-launch",
    number:   "05",
    title:    "Pre-launch Polish",
    subtitle: "Things that have to be right before charging anyone",
    steps: [
      {
        id:     "smoke-test",
        title:  "End-to-end smoke test on production",
        status: "todo",
        description:
          "Sign up fresh → create project → add device → edit text → generate AI copy → generate backdrop → render screenshot → download. Every step must work on shotshq.com (not localhost).",
      },
      {
        id:     "stripe-test-purchase",
        title:  "Test Stripe purchase end-to-end",
        status: "todo",
        description:
          "Use test card 4242 4242 4242 4242. Buy Indie Pack. Verify: webhook fires → credit_ledger row inserted → user balance reflects 100 credits → Stripe credit grant created.",
      },
      {
        id:     "cron-monthly",
        title:  "Monthly credit reset cron",
        status: "todo",
        description: "Studio Monthly subscribers get analytics row + plan flag. Cron runs 1st of month. Use Vercel Cron Jobs or Trigger.dev schedule.",
      },
      {
        id:     "policies",
        title:  "Privacy + Terms + Refund policy",
        status: "todo",
        description: "Three legal docs at /privacy, /terms, /refund. Required for Stripe live mode + App Store-adjacent product.",
      },
      {
        id:     "support-email",
        title:  "Support email",
        status: "todo",
        description: "Set up support@shotshq.com forwarding to ivansajtovi@gmail.com via Cloudflare Email Routing (free).",
      },
      {
        id:     "loops-flows",
        title:  "Loops email flows",
        status: "todo",
        description:
          "Welcome (sign-up), low-credit warning (≤10 credits), purchase confirmation, render-complete. Templates created in Loops + triggered from app code.",
      },
      {
        id:     "posthog-funnel",
        title:  "PostHog funnel events",
        status: "todo",
        description: "Track: signup, project_created, ai_call, render_started, render_completed, export_downloaded, checkout_started, checkout_completed.",
      },
      {
        id:     "sentry-init",
        title:  "Sentry SDK init",
        status: "todo",
        description: "Add @sentry/nextjs init code. Test by throwing in an API route → verify it lands in Sentry dashboard.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id:       "launch",
    number:   "06",
    title:    "Launch",
    subtitle: "Going public",
    steps: [
      {
        id:     "stripe-live",
        title:  "Switch Stripe → live mode",
        status: "todo",
        description: "Create live products + meter. Update env vars in Vercel. Re-create webhook endpoint with live signing secret.",
      },
      {
        id:     "clerk-prod",
        title:  "Switch Clerk → production instance",
        status: "todo",
        description: "Production keys, custom domain (clerk.shotshq.com), SSO providers re-configured.",
      },
      {
        id:     "ph-launch",
        title:  "Product Hunt launch",
        status: "todo",
        description: "Submit Sunday night PT for Monday launch. Hunter outreach. Asset pack ready (gallery images, gif, tagline).",
      },
      {
        id:     "monitor",
        title:  "Monitor first 100 signups",
        status: "todo",
        description: "Watch Sentry, PostHog funnel, Stripe revenue, Vercel cold starts. Hotfix anything that breaks within 1 hour.",
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function countByStatus(phase: Phase): Record<Status, number> {
  const counts: Record<Status, number> = { done: 0, in_progress: 0, todo: 0, blocked: 0 };
  for (const s of phase.steps) counts[s.status]++;
  return counts;
}

export function totalCounts(): Record<Status, number> {
  const counts: Record<Status, number> = { done: 0, in_progress: 0, todo: 0, blocked: 0 };
  for (const p of PHASES) for (const s of p.steps) counts[s.status]++;
  return counts;
}

export function totalSteps(): number {
  return PHASES.reduce((acc, p) => acc + p.steps.length, 0);
}

export function pctComplete(): number {
  const total = totalSteps();
  if (total === 0) return 0;
  const done = totalCounts().done;
  return Math.round((done / total) * 100);
}
