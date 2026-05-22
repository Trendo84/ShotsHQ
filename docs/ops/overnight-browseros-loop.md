# ShotsHQ overnight BrowserOS × Claude loop — 2026-05-23

## Objective
Work autonomously overnight to make ShotsHQ materially more shippable, trustworthy, and functional **top to bottom**.

Prioritize real user-facing functionality, product honesty, and stable core flows over speculative redesigns.

Repo root: `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`

## Read first
- `CLAUDE.md`
- `AGENTS.md`

## Important context
- BrowserOS will revisit this project hourly and continue the loop.
- Treat the **actual filesystem + git state** as source of truth.
- If session history mentions fixes that are not present in the repo, trust the repo, not memory.
- Current noisy/unrelated state to avoid over-focusing on unless needed:
  - `tsconfig.tsbuildinfo`
  - `public/templates/preview/`
  - `scripts/generate-template-previews.mjs`

## Non-negotiables
- Keep the locked stack and architectural decisions in `CLAUDE.md` / `AGENTS.md`.
- No fake-live metrics, fake status, or active-looking dead controls.
- Strict TypeScript. No `any`.
- Fabric.js v7 stays. Clerk stays. Neon + Drizzle stays. Stripe billing model stays.
- Avoid touching unrelated files unless they are part of the problem you are fixing.

## Operating principle
Each cycle should leave the repo in a measurably better state by morning:
- more working
- more honest
- more verified
- less confusing

Favor **complete vertical slices** over scattered partial edits.

## This cycle: execute, don’t just plan
1. Inspect the current repo and git state.
2. Run the fastest useful verification to establish truth.
3. Audit the product from a real user perspective across:
   - marketing credibility
   - auth / sign-in flow
   - onboarding / project creation
   - editor behavior
   - AI actions / credits guardrails
   - surfaces / exports
   - billing / settings
   - docs / legal / status
   - empty states / disabled states / error honesty
4. Pick the **highest-leverage user-visible issues** that can be fully landed in this cycle.
5. Implement them cleanly, with tests where practical.
6. Re-run verification and report exact outcomes.
7. Update `docs/ops/overnight-browseros-status.md` with the handoff format below.
8. Reply in chat with a concise ship report.

## Prioritization order
1. Broken or misleading core flows
2. Trust / credibility problems
3. Editor and export functionality gaps
4. Billing / auth / settings safety and clarity
5. Lower-level polish

If something is not truly ready, disable or relabel it honestly instead of pretending it works.

## Handoff file format
Update or create: `docs/ops/overnight-browseros-status.md`

Include:
- timestamp
- summary of what shipped this cycle
- files touched
- verification run + result
- current blockers
- highest-priority next target
- a ready-to-send next prompt for BrowserOS to paste next hour

## Browser / operator note
If browser-only verification is needed, say exactly what BrowserOS should check on the next hourly pass.
If editor access requires auth and an existing browser session is available, Google identity permission is allowed for `ivansajtovi@gmail.com`.

## Definition of a successful overnight pass
By morning, a user should be able to point to meaningful progress in the actual product — not just internal cleanup.
