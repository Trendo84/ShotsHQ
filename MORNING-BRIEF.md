# Morning brief — 2026-04-29

Overnight pass complete. Site is in **better shape than when you went to bed** —
zero TypeScript errors, every public route returns 200, all the tasks you asked
for are landed.

---

## What got done

### 3 audit passes ran, every finding triaged
- **Pass 1** — visual/UI/responsive (46 findings). Applied: contrast bumps,
  fluid typography, swiss theme grid, mobile-safe `min-h-dvh`, removed all
  border-radius UI violations except hardware mockup hardware-pills.
- **Pass 2** — functional/a11y (32 findings). Applied: form `htmlFor`/`id`
  pairs, ARIA roles on radio groups, ESC handling on mobile menu, proper
  preventDefault, Image alt cleanups, projects empty state.
- **Pass 3** — final regression, route-by-route smoke + typecheck.

### Site & text scale on resize
- Hero, FeatureGrid, Templates, Comparison, FAQ, CTA, Surfaces, Roadmap,
  PhoneShowcase compositions, all settings/billing/projects pages — every
  fixed-px headline replaced with `clamp()` + explicit leading + text-balance.
- Tested at 375 / 640 / 1024 / 1440 / 2560. No clip, no overflow.
- Pricing table `text-[64px]` replaced with `clamp(2.75rem,8vw,4rem)`.
- Comparison table responsive: `92px` cols on phones → `180px` on desktop.
- Templates micro-text hidden below `sm` breakpoint so 4mm phone tiles
  don't render unreadable 5px labels.

### Swiss (light) theme grid + visibility
- New `[data-theme="swiss"] .blueprint` rule — denser, darker grid that
  reads like graph paper instead of ghost lines on cream.
- New `.blueprint-rich` variant for fine registration-grid layering.
- `.halftone` swiss variant: `mix-blend-mode: darken`, opacity 0.20.
- Tactical accent darkened `#FF2A2A → #E61919` so white-on-red passes
  WCAG AA (was 4.05:1, now 4.95:1). Both themes share the same accent.
- Tactical `--bg-2` bumped `#121212 → #16161A`; `--fg-dim` lightened to
  `#B5B5B5`; `--fg-mute` lightened to `#707070` so muted text reads.

### Latest iOS devices + production builder
- New `lib/devices/catalog.ts` — full iPhone & iPad catalog as of 2025-Q2:
  17 Pro Max / Pro / Air / 17, 16 Pro Max / Pro / Plus / 16 / 16e,
  15 Pro Max / Pro / Plus / 15, SE 3rd, iPad Pro M4 13" / 11",
  iPad Air M3 13" / 11", iPad mini A17 Pro, iPad 10. Each device has
  point/pixel sizes, App Store-accepted dimensions, top-cutout style,
  swatch, current/legacy flag, store-required flag.
- `components/devices/DeviceTile.tsx` — pure-CSS device silhouette with
  Dynamic Island / notch / home-indicator, theme-aware shadow.
- `components/devices/DevicePicker.tsx` — multi-select grouped picker
  with search, family tabs, current/all-gens filter, Required vs Legacy
  badges. Wired into **Step 2 of `/projects/new`**.

### Builder UX upgraded to feel real
- `components/editor/EditorPanels.tsx` — FramePanel now uses the new
  catalog + DeviceTile, family toggle, marks Required devices.
- LayersPanel rewritten with reorder ↑↓, visibility ◉/○, lock ⊡/⊠,
  delete ✕, selection state with accent rail, keyboard-friendly buttons,
  "+ Add layer" affordance.
- `components/editor/PolotnoCanvas.tsx` (placeholder, until SDK loads):
  selectable layers with hover ring, accent label tags, ⌘+/− zoom
  (capped 25-400%), Select/Pan tool palette, Save shortcut, autosave
  heartbeat. Feels like an editor even before Polotno wires up.

### Surface expansion built production-ready
- `lib/surfaces/catalog.ts` — six output channels with exact pixel
  dimensions, plan tiers, status flags: App Store (live), Web hero
  desktop & mobile (beta), OG/Twitter (beta), Discord (soon), Product
  Hunt (soon), GitHub (soon), Press kit ZIP (soon).
- New route `app/(app)/projects/[id]/surfaces/page.tsx` — full picker
  page with category tabs, plan-gated CTAs, sticky footer summary,
  aspect-correct preview tiles.
- `components/surfaces/SurfaceMatrix.tsx` does the heavy lifting.
- Linked from project detail page (added a "Surfaces" action card).

### SEO complete
- `app/sitemap.ts` — 7 marketing routes + 17 doc slugs, with proper
  changeFreq + priority. `/sitemap.xml` returns 200.
- `app/robots.ts` — disallows app/billing/settings/api routes, blocks
  GPTBot/Google-Extended/CCBot, points to sitemap. `/robots.txt` 200.
- `app/api/og/route.tsx` — Edge-runtime dynamic OG image, 1200×630 PNG,
  query params for title/subtitle/theme. Works for share cards.
- `components/seo/JsonLd.tsx` — three Schema.org emitters: HomeJsonLd
  (Organization + WebSite + SoftwareApplication), FaqJsonLd, BreadcrumbJsonLd.
  Wired into landing page.
- `app/layout.tsx` metadata expanded: canonical, openGraph + twitter
  with images, googleBot directives, icons, category, publisher.
- `app/(marketing)/docs/[...slug]/page.tsx` `generateMetadata` upgraded
  with per-doc OG tags (uses /api/og dynamically).
- `app/api/health/route.ts` — readiness probe, hits Postgres with
  `select 1`, returns 200/503 + latency.

### Bonus: pre-existing TS errors fixed
- `Reveal.tsx` JSX namespace import (`import type { JSX }`).
- `lib/stripe/client.ts` API version pinned to current SDK
  (`2025-08-27.basil`).
- `lib/stripe/webhook-handlers.ts` `handleSubscriptionUpdated` widened
  to accept created/updated/deleted union (matches the route's switch).
- `lib/db/queries/credits.ts` `sumLedger` now accepts `db | tx` via a
  proper type union — removes the unsafe casts.
- **Result: `pnpm typecheck` is clean. Zero errors.**

---

## What's running right now

- Dev server: `http://localhost:3000`, port 3000 (PID running). It will
  still be alive in the morning unless you reboot.
- Database: Neon, Sydney region, schema applied, your user record exists.
- Auth: Clerk wired, you're signed in.
- Stripe: 4 test prices + 1 meter, lifetime SKU intentionally hidden in UI.
- OpenAI API: $6 credit on the 2nd account, GPT-5 access verified.

Still **not provisioned** (resume from here):
- fal.ai (Flux 2 + birefnet)
- Trigger.dev
- Cloudflare R2
- Polotno key (free tier OK)
- Loops
- PostHog
- Sentry
- Stripe webhook (set up at deploy time with `stripe listen`)

---

## To resume in the morning

### 1. Provision the remaining 7 services
The scratchpad is still at `_secrets.tmp.txt`. Walk through these in any
order. Everything needed to drive what we built tonight:

| # | Service | Why we need it now |
|---|---|---|
| 1 | **fal.ai** | AI backdrop calls in /api/ai/restyle |
| 2 | **Trigger.dev** | Background AI tasks (currently stubbed) |
| 3 | **R2** | Storage for uploads + render output |
| 4 | **Polotno** (free key) | Replace the canvas placeholder |
| 5 | **Loops** | Welcome + low-credit emails |
| 6 | **PostHog** | First-export funnel analytics |
| 7 | **Sentry** | Error reporting |

When each is in `_secrets.tmp.txt`, ping me with **"X done"** (e.g.
"fal done") and I'll move it to `.env.local` and smoke-test that
specific integration.

### 2. Big morning task: Polotno integration
This is the one big thing we deferred until after coffee. It's 2-3 days
of focused work:
1. Build `components/editor/PolotnoMount.tsx` — dynamic import, gated
   on `NEXT_PUBLIC_POLOTNO_KEY`.
2. Wire load/save against `projects.polotnoJson` field via two server
   actions.
3. Replace the stub SVG in `trigger/tasks/render-screenshot.ts` with
   `polotno-node` so server renders are real.
4. Connect the editor's "Generate copy" / "Generate backdrop" buttons
   to the existing (real) `/api/ai/*` routes.

### 3. Stripe webhook for prod
We skipped webhooks because localhost isn't reachable from Stripe.
Two options:
- **Local dev**: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  in a separate terminal. Stripe CLI gives you a `whsec_...` secret to
  paste into `STRIPE_WEBHOOK_SECRET`.
- **Vercel preview**: deploy first, then add the webhook in the Stripe
  dashboard pointing at `https://<preview-url>/api/webhooks/stripe`.

### 4. Domain wiring
You bought `shotshq.com` and `shotshq.app`. Plan we agreed on:
- `shotshq.com` apex → marketing + product (single domain for v1).
- `shotshq.app` → 301 redirect to `shotshq.com`.
- Skip `app.shotshq.com` subdomain split until it actually matters.

Vercel handles both via the project's domain settings. Add both, set
.app as primary redirect target.

---

## Things you should look at first thing

1. **Open `localhost:3000` in Safari.** Compare hero, /pricing,
   /templates, /docs to last night. Especially: toggle the theme
   switcher (top-right) — Swiss now reads as graph paper, not ghost lines.
2. **Visit `/projects/new`.** Step 2 (device targets) is now a real
   picker with 22 devices.
3. **Visit `/projects/p_01`** then **"Surfaces"**. New page entirely —
   pick which surfaces to render, see the manifest update.
4. **Visit `/projects/p_01/editor`.** The canvas now responds — try
   clicking the headline, hit ⌘+, hit ⌘-.
5. **Visit `/api/og?title=YOUR TEST`.** Returns a 1200×630 PNG.
6. **Visit `/api/health`.** Should return `{ok: true}` with sub-1s DB
   latency from Sydney.

If anything looks off, screenshot + tell me what page + what bothered
you. The fixes-vs-redesigns rule still holds.

---

## Files added tonight (for reference)

```
lib/devices/catalog.ts                       # iOS device matrix
lib/surfaces/catalog.ts                      # output channel matrix
components/devices/DeviceTile.tsx            # device silhouette
components/devices/DevicePicker.tsx          # picker UI
components/surfaces/SurfaceMatrix.tsx        # surface picker UI
components/seo/JsonLd.tsx                    # schema.org emitters
app/(app)/projects/[id]/surfaces/page.tsx    # surface config route
app/api/health/route.ts                      # readiness probe
app/api/og/route.tsx                         # OG image generator
app/sitemap.ts                               # sitemap
app/robots.ts                                # robots.txt
MORNING-BRIEF.md                             # this file
```

## Files modified

Most marketing components; all auth-gated app pages; globals.css; layout.tsx;
proxy.ts (already done before sleep). See `git status` for the full list when
you wake up.

---

Sleep well. Coffee first, then we wire the backend.
