# BrowserOS cycle #16 brief — audit `/projects/[id]/surfaces` and verify live parity

Work in: `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`

Read before acting:
- `docs/ops/overnight-browseros-loop.md`
- the top entry of `docs/ops/overnight-browseros-status.md`
- `CLAUDE.md`
- `AGENTS.md`

## Context
Cycle #15 already shipped and was pushed to `origin/main`.
Latest shipped commit from the status log: `6a8a7dc`.
The public funnel issues called out in the last cycle were addressed. Treat the repo + git state as truth, not chat memory.

## Focus for this cycle
Primary target: audit `/projects/[id]/surfaces` — the last untouched project-scoped route that has been carried across multiple cycles.

Apply the same readiness-contract pattern used in cycles #5 / #11 / #12 / #13 / #14 / #15:
- derive state from real data
- distinguish ready vs blocked vs empty honestly
- remove or relabel fake-live affordances
- keep the UI customer-facing and calm
- do not broaden scope into unrelated feature work

## Also verify in the browser on live `shotshq.com`
1. `/templates` renders all preview images correctly
2. `/` renders the compact templates row with real previews
3. the Surfaces section clearly reads as **live App Store now / coming next for the rest**, not equal-weight fake-live surfaces

## Pivot rule
If `/projects/[id]/surfaces` is already honest and materially complete, pivot to the parallel-worker e2e flake investigation at `--workers=2`.
Known flake area from prior status entries:
- `project-list-surfaces` around line 157
- hydration smoke under load
- `--workers=1` is currently clean across all 59 tests

## Constraints
- Implement directly. No back-and-forth.
- Do not broaden scope into new features.
- Keep changes tightly tied to the target route or the flake if you pivot.
- Do not reset, discard, or overwrite unrelated local changes.
- Keep product honesty intact.

## Required verification
Re-run and report exact outcomes for:
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Handoff required
Update `docs/ops/overnight-browseros-status.md` with:
- timestamp
- what shipped this cycle
- files touched
- verification results
- blockers
- highest-priority next target
- a ready-to-send next BrowserOS prompt

Then reply with a concise ship report only.
