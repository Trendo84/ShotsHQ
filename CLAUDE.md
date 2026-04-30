# CLAUDE.md — ShotsHQ working agreements

This file tells future Claude (and humans) how to work in this repo. It
mirrors the build spec but distilled into rules-of-engagement.

## Locked architectural decisions

These are **not up for debate** without an explicit user override:

| Decision | Rule |
|---|---|
| Framework | Next.js 16 App Router. No Remix, no SvelteKit. |
| Auth | Clerk. Not NextAuth, not Better Auth, not Supabase Auth. |
| DB | Neon Postgres + Drizzle. Prisma was rejected (cold starts). |
| Payments | Stripe Billing — `meterEvents` + `creditGrants`. Never `usageRecords` (deprecated 2025-03-31.basil). |
| Canvas | **Fabric.js v7** (free, OSS). Polotno rejected — $899/mo, not viable for bootstrapped v1. |
| AI orchestration | Vercel AI SDK v6 with `generateObject` + Zod for structured output. |
| AI copy | OpenAI GPT-5. Claude is the backup. |
| AI images | fal.ai (Flux 2 + birefnet). Replicate too slow. Direct DALL-E rejected. |
| Background jobs | Trigger.dev v3. Inngest, BullMQ, raw queues rejected. |
| Storage | Cloudflare R2. S3 + Vercel Blob both rejected (egress). |
| Server render | `sharp`. jimp slow, native `canvas` heavy deps. |

## Credit-ledger invariants

The `credit_ledger` is **append-only** and the **source of truth** for
balances. `users.credit_balance` is a denormalized cache and must never
be trusted for authorization.

- Every credit-affecting operation needs an `idempotency_key`.
- AI calls: dispatch to a Trigger.dev task. The task is the single
  transaction boundary for debit + AI call + meter event.
- Refund automatically on AI failure inside the task.
- For Studio / Lifetime users, insert a `delta=0` ledger row for analytics
  and skip the actual debit.
- Stripe meter events reuse the same `idempotency_key` as the ledger row.

## Anti-patterns — do not commit code that does these

- ❌ Debit credits in a route handler that calls fal.ai or OpenAI directly.
- ❌ Trust `users.credit_balance` for any authorization decision.
- ❌ Call `stripe.billing.usageRecords.create` (deprecated).
- ❌ Grant credits from the Stripe Checkout success URL — webhook only.
- ❌ Inline AI prompts in feature code — they live in `lib/ai/prompts.ts`.
- ❌ Use `generateText` for AI copy — use `generateObject` with Zod schemas.
- ❌ Trust client-side Fabric canvas exports for final assets — server
  re-renders via `sharp` (using `ShotsCanvas` JSON) are authoritative.
- ❌ Reference `NEXT_PUBLIC_POLOTNO_KEY` anywhere — Polotno is gone.
- ❌ Use `border-radius` anywhere in UI. The aesthetic is rigid 90° corners.

## Conventions

- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. No `any`.
  Prefer `type` over `interface` unless declaration merging required.
- **Files:** `kebab-case.ts` for libs, `PascalCase.tsx` for React components.
- **DB tables:** `snake_case` plural. Drizzle exports `camelCase` matching.
- **Routes:** `/api/kebab-case/route.ts`.
- **Server vs client:** Default to Server Components. Add `"use client"`
  only when you need interactivity / browser APIs / third-party client libs.
- **Errors:** API routes return `{ ok: true, data } | { ok: false, error, code }`.
  Use `Response.json()`, not `NextResponse`.
- **Forms:** React Hook Form + Zod resolver. Server actions for mutations
  where possible; route handlers when you need client SDK calls.
- **Out-of-scope follow-ups:** Capture as `docs/issues/<milestone>-<title>.md`
  files (e.g. `docs/issues/v1.1-multi-frame-canvas.md`), NOT as inline
  `// TODO` comments scattered through the code. Each file is a
  ready-to-paste GitHub issue body with required sections (Status,
  Why, What, Touch points, Tests, Done when). In-code TODO comments
  reference the file path. When you fire `gh issue create`, swap the
  in-code refs to live issue URLs. See `docs/issues/CONVENTIONS.md`
  for the full pattern + rationale. The point: design context survives
  context resets when it lives in git, and an issue is one
  `git remote remove origin` away from orphaned.

## Copy & casing system

The site uses three casing levels. Don't mix them inside a single
component — that's the audit-pass-2 critique that triggered this
section. When in doubt: sentence case wins.

| Level | Use for | Examples |
|---|---|---|
| `ALL CAPS` (≤12px only) | Eyebrow tags, micro-labels, status pills, telemetry metadata | `LIVE`, `BETA`, `SOON`, `01 INTAKE`, `1 CR / GEN`, `NEXT >>` |
| `Title Case` | Component / feature names, plan names, button labels | `Start free`, `Indie pack`, `Headline generator`, `Pipeline` |
| `sentence case` | Section headings, body copy, microcopy under buttons | `How a raw screenshot becomes a finished listing.`, `No card · Free tier exports include a watermark` |

Heuristics:
- If it's smaller than 12px, ALL CAPS reads as a label, not copy.
- If it's a sentence, lowercase the rest. `"Stop designing. Start shipping."` → `"Stop designing. Start shipping."` (sentence case despite the period-period rhythm).
- If it's a button people press, Title Case the verb. `"Start free"` not `"START FREE"` (the eyebrow tag inside a button can be ALL CAPS, but the visible label is Title Case).
- Brand names stay as the brand wrote them: `App Store Connect`, `GitHub`, `OpenAI`, `Trigger.dev`.

## Editor canvas model

**The editor canvas IS the device screen.** Width × height matches Apple's
App Store screenshot dimensions exactly:

| Device | Canvas dimensions |
|---|---|
| iPhone 6.9″ | 1290 × 2796 |
| iPhone 6.7″ | 1320 × 2868 |
| iPad 13″    | 2064 × 2752 |

The backdrop fills the full canvas. Text layers position at canvas-pixel
coordinates inside the screen. There is no Fabric-rendered device frame
or bezel — the schema (`lib/canvas/schema.ts → ShotsCanvas`) has no
device-frame layer kind, and `FabricCanvas` does not mount one.

The red offset shadow visible around the canvas in the editor UI
(`boxShadow: "8px 8px 0 var(--accent)"` on the wrapper div) is **brand
decoration only** — not a device-bezel render. Don't try to "fix" the
canvas to render a device chrome inside Fabric. If a bezel is ever needed
for marketing or social previews, it lives on a separate export-only
overlay path, not on the editing canvas.

Other editor invariants worth pinning:

- `lib/canvas/dispatch.ts` is the single source of truth for default text
  layer positions (`TEXT_LAYOUT`) and styling (`textDefaultsFor`). Both
  `defaultCanvas()` (initial-state seed) and the editor's `addTextLayer`
  flow read from it, so the two paths can never drift apart again.
- `TextLayer.system?: boolean` marks placeholder content seeded by
  defaults. The collision-resolver in `dispatch.ts` REPLACES system
  layers when the user dispatches a layer of the same role — preventing
  the duplicate-text bug that would otherwise pile a new headline on top
  of the placeholder. Editing flips `system` to `false` (handled by the
  `text:changed` listener in `FabricCanvas`).
- One project = one canvas in v1. The right-rail "FRAMES" UI is single-
  frame today; multi-frame App Store carousels (5–10 screenshots per
  device, each with its own backdrop + layer set) ship in v1.1 as a
  purely additive `frames: ShotsFrame[]` field on `ShotsCanvas`.

## Visual system

The dual-theme system in `app/globals.css` defines tokens for both
**Tactical Telemetry** and **Swiss Industrial Print** archetypes. All
components must read from CSS variables (`var(--bg)`, `var(--fg)`,
`var(--accent)` etc.) so theme switches are instant.

Locked typographic stack:

- Display: **Archivo Black** — Macro-typography, headers. Negative tracking.
- Mono: **JetBrains Mono** — Telemetry, metadata, navigation. Generous tracking.
- Sans: **Inter** — Reserve for body when mono fatigues.
- Serif disruptor: **EB Garamond italic** — Used sparingly with halftone overlay.

## "Done" for v1 (per spec)

- [ ] Sign-up via Google / Apple / email
- [ ] Project create + Polotno editor
- [ ] AI copy with credit debit + meter event
- [ ] AI backdrop with credit debit + meter event
- [ ] Translate to ≥10 locales
- [ ] Export at iPhone 6.9″, 6.7″, iPad 13″
- [ ] Watermark on free-tier exports
- [ ] $19 credit pack updates balance within 30s
- [ ] Studio Monthly subscription skips credit debits
- [ ] All Stripe webhooks idempotent (replay-safe)
- [ ] All AI calls run through Trigger.dev (no route timeouts)
- [ ] Sentry + PostHog signup → first export funnel
- [ ] Loops welcome + low-credit emails

## When stuck

- Stripe credit/meter behavior → https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits
- Polotno → https://polotno.com/docs/overview
- Trigger.dev v3 → https://trigger.dev/docs
- Vercel AI SDK → https://sdk.vercel.ai/docs
- Drizzle → https://orm.drizzle.team

If a search result contradicts this document, **this document wins**
unless the user has explicitly updated it. Ask before deviating.
