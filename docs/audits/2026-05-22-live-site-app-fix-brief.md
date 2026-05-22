# ShotsHQ fix brief — live public + logged-in app audit

## Goal
Fix the credibility, UX, and route issues found during a live audit of `https://shotshq.com`, then leave the repo in a shippable, type-safe state with passing checks.

Work in `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`.

## Read first
- `CLAUDE.md`
- `AGENTS.md`

## Non-negotiable constraints
Follow repo rules in `CLAUDE.md` / `AGENTS.md`.
Especially:
- Next.js 16 App Router
- Clerk auth stays
- Fabric.js v7 stays
- No Polotno workarounds or references
- Strict TypeScript, no `any`
- Do not introduce fake-live status or misleading production theater

## Audit findings to fix

### P0 — credibility / production hygiene
1. **Production Clerk dev-key leak**
   - Live auth pages show `Development mode`
   - Console warns Clerk dev keys are loaded in production
   - You probably cannot rotate secrets from code alone, but you must:
     - audit current env guardrails
     - make production builds fail hard when Clerk dev keys are present unless there is an explicit local/dev override
     - remove any code path that makes this easy to ship accidentally
     - document exactly which env vars must be changed in deployment

2. **`/docs/status` is fake live status**
   - Current page claims real-time metrics, 60s refresh, p50 latencies, and queue depth
   - Content is hardcoded in `app/(marketing)/docs/[...slug]/page.tsx`
   - Replace this with something honest:
     - either a real lightweight status surface backed by `/api/health`
     - or a clearly static operational-status explainer with no fake numbers
   - Do **not** leave fabricated metrics in production copy

3. **`/api/health` reports `version: "dev"` in production**
   - Fix health/version metadata so production reports a meaningful version/build identifier
   - Prefer commit SHA / deployment ID / package version fallback hierarchy
   - Keep response shape clean and explicit

### P1 — broken / confusing routes and app behavior
4. **Broken legacy/sample project route**
   - `/projects/p_01` fails while real UUID project routes work
   - Find references to this route and fix them
   - Either:
     - add a compatibility redirect if that route is intentionally publicized internally, or
     - remove all references and ensure no app/docs path points there

5. **Top-level short legal/contact routes 404**
   - `/privacy`, `/security`, `/terms`, `/contact` 404
   - Footer currently uses `/docs/*`, which is fine
   - Add redirects or route aliases so the top-level paths work too

6. **Editor device switch appears broken**
   - In the editor, switching from iPhone to iPad and selecting an iPad target did not update the active canvas/device metadata
   - UI still showed `1290×2796` and `IPHONE 69`
   - Fix device switching so selected device updates:
     - canvas dimensions
     - active device label
     - persisted editor state
     - save state if relevant
   - Add regression coverage

7. **Surfaces `Render all` CTA feels dead**
   - Selecting a surface changes state to selected
   - Clicking `Render all` gives no visible result, no useful feedback, and no clear transition
   - Fix this one of two ways:
     - implement the intended behavior if it is already meant to work
     - or disable / relabel it with explicit honest copy if rendering is not ready yet
   - Do not leave it looking active while being a no-op

### P2 — product honesty / guardrails / polish
8. **Wizard flow is too permissive or too unclear**
   - It was possible to move through the wizard with minimal setup and commit the project before uploads
   - Review intended UX and make it explicit:
     - if this is allowed, improve copy so users understand the project can be created before uploads
     - if it is not intended, tighten validation
   - Do not add fake friction; just make the behavior intentional and clear

9. **Too many visible dead controls in app shell**
   Areas observed as disabled / placeholder / not truly live:
   - search
   - notifications
   - editor undo/redo
   - add frame
   - exports actions
   - settings save / ASC verify
   - some billing / upgrade / render surfaces
   
   Triage these controls and improve honesty:
   - keep only what should be visible pre-launch
   - where features are not live, make the disabled state and copy deliberate
   - avoid active-looking CTAs that lead nowhere

10. **Settings page mostly shell**
   - If profile save / ASC verification are not ready, make that obvious and safe
   - Audit danger-zone behavior too; ensure destructive actions are not casually exposed without proper safeguards
   - Do not click destructive flows in production during testing without confirmation, but review code paths carefully

## Additional context from the audit
- Public marketing shell is mostly okay
- Dashboard/projects/new project/editor/AI panel/surfaces all load
- AI copy dispatch correctly failed with `402` when credits were `0`, and UI showed `NOT ENOUGH CREDITS. TOP UP IN BILLING.` — that part is acceptable
- Theme toggle worked in-app
- Health endpoint responded, but first DB latency was ~5.1s and second was ~0.6s; note any obvious cold-start/readiness issues if discovered, but do not fabricate performance claims

## Required implementation approach
1. Inspect the relevant code paths first and make a concrete plan
2. Fix highest-risk trust issues first:
   - status page honesty
   - production env guardrails for Clerk
   - health version metadata
3. Fix real route / app bugs next:
   - legacy route cleanup
   - top-level redirects
   - editor device switching
   - surfaces render CTA behavior
4. Tighten UX honesty for remaining partial features
5. Run verification

## Files likely involved
You decide exact touch points, but expect to inspect at least:
- `app/(marketing)/docs/[...slug]/page.tsx`
- `app/api/health/route.ts`
- app routing for top-level legal/contact pages
- project/editor routes and editor client components
- surfaces page / related components
- any env validation / next config / Clerk config code
- references to `/projects/p_01`

## Deliverables
1. Implement the fixes
2. Run and report:
   - `pnpm typecheck`
   - relevant tests
   - targeted manual verification notes
3. Add tests where practical, especially for:
   - top-level route aliases/redirects
   - health version metadata behavior
   - editor device-switch regression
   - any route compatibility fix for `p_01`
4. If a finding cannot be fully fixed in repo code because it depends on external secrets / dashboard config, do both:
   - add the strongest code-side guardrail possible
   - document the exact deployment action still required

## Definition of done
- No fabricated live metrics remain on the public status surface
- Production guardrails for Clerk dev keys are materially stronger
- Health endpoint reports a meaningful build/version in production
- `/privacy`, `/security`, `/terms`, `/contact` resolve correctly
- No stale app/docs references to broken sample project routes remain
- Editor device selection correctly updates active device/canvas state
- Surfaces CTA is either real or honestly disabled
- Wizard / placeholder states feel intentional instead of misleading
- Typecheck passes
- Any new tests pass

## Current repo status note
At handoff time, `git status --short --branch` showed:
- `## main...origin/main`
- ` M tsconfig.tsbuildinfo`
- `?? public/templates/preview/`
- `?? scripts/generate-template-previews.mjs`

Avoid touching unrelated files unless necessary.
