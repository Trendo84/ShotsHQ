# ShotsHQ

AI-powered App Store screenshot generation for indie iOS developers.
Polished, localized, conversion-optimized listing images in minutes.

> **This repository is the v1 scaffold.** It implements the full file
> structure from the build spec, all marketing & app pages with a custom
> dual-theme aesthetic, the Drizzle schema, lib helpers, API routes, and
> Trigger.dev task signatures. Real Clerk / Stripe / Neon / Trigger /
> fal.ai / OpenAI / R2 wiring activates the moment you provide credentials.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7+ strict |
| Runtime | Node.js 22 LTS |
| UI | shadcn/ui primitives + Tailwind v4 |
| Canvas | Polotno SDK (license required) |
| Auth | Clerk |
| DB | Neon Postgres + Drizzle |
| Payments | Stripe Billing (Meters + Credit Grants) |
| AI orchestration | Vercel AI SDK v6 |
| AI copy | OpenAI GPT-5 with Zod schemas |
| AI images | fal.ai (Flux 2 + birefnet) |
| Image storage | Cloudflare R2 |
| Server render | sharp |
| Background jobs | Trigger.dev v3 |
| Hosting | Vercel + Trigger.dev Cloud |

## Quickstart

```bash
pnpm install
cp .env.example .env.local              # fill in keys
pnpm tsx scripts/stripe-bootstrap.ts     # provision Stripe products + meter
pnpm drizzle-kit generate                # generate first migration
pnpm drizzle-kit migrate                 # apply
pnpm dev                                 # http://localhost:3000
```

For the canvas editor and AI features:

```bash
pnpm dlx trigger.dev@latest init   # link Trigger.dev project
pnpm trigger:dev                   # run worker locally
```

## Visual archetypes

The interface ships with **two complete visual modes**, swappable from any
header via the `[ TACTICAL / SWISS ]` toggle. Tokens are CSS-variable based
so every component works in both modes without refactor.

- **Tactical Telemetry (default)** — dark CRT terminal, monospace-dominant,
  scanlines + noise, hazard-red accent, terminal-green signal indicator.
- **Swiss Industrial Print** — light unbleached newsprint, Archivo Black at
  display sizes, aviation-red accent, halftone disruptors.

Switch the default by changing `data-theme="tactical"` on `<html>` in
`app/layout.tsx`.

## Project map

```
app/
├── (marketing)/        # Landing, pricing, changelog, docs
├── (auth)/             # Clerk sign-in / sign-up
├── (app)/              # Authed dashboard, projects, editor, billing, settings
└── api/                # Stripe, AI, render, upload, webhooks

components/
├── ui/                 # shadcn-style primitives (button, card, dialog, …)
├── marketing/          # Landing-page sections
├── editor/             # Polotno canvas + side panels
├── billing/            # Pricing table, credit balance
├── app/                # Sidebar, topbar
└── providers/          # Theme, Clerk, PostHog, Polotno

lib/
├── db/                 # Drizzle schema + queries (credits, projects, jobs)
├── auth/               # Clerk helpers, permissions
├── stripe/             # Client, meters, credit grants, webhook handlers
├── ai/                 # OpenAI, fal.ai, prompts, zod schemas
├── storage/            # R2 + presigned URLs
├── render/             # Sharp renderer + device-frame registry
├── analytics/          # PostHog server
├── email/              # Loops API
└── utils/              # cn, credits, locales, ratelimit, store-dimensions

trigger/tasks/          # ai-generate-copy, ai-restyle, batch-translate, render-screenshot, …
emails/                 # React Email templates
scripts/                # stripe-bootstrap, seed-templates
drizzle/                # generated migrations
public/                 # device frames, templates, og
```

## Build phases (per spec)

1. **Foundation** — auth + db ✓ scaffolded; needs your Clerk + Neon keys.
2. **Payments + credits** — Stripe Bootstrap script + ledger logic ✓ written; run `pnpm stripe:bootstrap`.
3. **Editor** — Polotno mount point ✓; canvas behavior activates with license.
4. **AI features** — Trigger tasks + AI SDK calls ✓; activate with FAL_KEY + OPENAI_API_KEY.
5. **Launch polish** — App Store Connect upload task is stubbed.

See `CLAUDE.md` for full architectural conventions and locked decisions.
