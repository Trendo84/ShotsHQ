# AGENTS.md — ShotsHQ working agreements

This file tells future Codex (and humans) how to work in this repo. It
mirrors the build spec but distilled into rules-of-engagement.

## Locked architectural decisions

These are **not up for debate** without an explicit user override:

| Decision | Rule |
|---|---|
| Framework | Next.js 16 App Router. No Remix, no SvelteKit. |
| Auth | Clerk. Not NextAuth, not Better Auth, not Supabase Auth. |
| DB | Neon Postgres + Drizzle. Prisma was rejected (cold starts). |
| Payments | Stripe Billing — `meterEvents` + `creditGrants`. Never `usageRecords` (deprecated 2025-03-31.basil). |
| Canvas | **Fabric.js v7** (free, OSS). Polotno was rejected ($899/mo, not viable for bootstrapped v1). |
| AI orchestration | Vercel AI SDK v6 with `generateObject` + Zod for structured output. |
| AI copy | OpenAI GPT-5. Codex is the backup. |
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
- [ ] Project create + Fabric.js editor
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
- Fabric.js v7 → http://fabricjs.com/docs
- Trigger.dev v3 → https://trigger.dev/docs
- Vercel AI SDK → https://sdk.vercel.ai/docs
- Drizzle → https://orm.drizzle.team

If a search result contradicts this document, **this document wins**
unless the user has explicitly updated it. Ask before deviating.
