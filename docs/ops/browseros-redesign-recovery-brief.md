# BrowserOS redesign recovery brief — finish the actual ShotsHQ redesign and ship it live

Work in: `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`

## Reality check
The site has received multiple narrow honesty/polish/funnel fixes and those are already on production. Production is not stale.

The real problem is scope drift: the overnight loop got pulled into cycle-by-cycle audits and micro-fixes, so the original full redesign objective was not actually completed.

Do not continue that drift.

## Source of truth
Read and follow these first:
- `browseros-claude-overnight-redesign-brief.md`
- `CLAUDE.md`
- `AGENTS.md`

Treat the original redesign brief as the primary mission again.

## What success means now
When this cycle is done, the live site and app should feel **visibly, unmistakably redesigned**, not merely copy-edited or mildly polished.

The user's complaint is valid: "site is still same where is the redesign".
Your job is to make that complaint false.

## Required outcome
Implement and ship a materially stronger redesign across the highest-visibility surfaces so the difference is obvious on first load.

Prioritize surfaces in this exact order:
1. marketing homepage
2. pricing
3. templates
4. authenticated app shell
5. dashboard
6. `/projects`
7. `/projects/new`
8. settings
9. only then `/projects/[id]/surfaces` if needed for consistency

## Redesign bar
This is **not** a trust-copy cleanup pass.
This is **not** another tiny honesty audit.
This is **not** a one-route cycle.

It must be a coherent visual/product redesign that is obvious in:
- layout
- spacing
- visual hierarchy
- typography treatment
- card/system styling
- navigation polish
- CTA framing
- onboarding clarity
- premium feel
- reduction of noisy/brutalist/internal-tool energy

## Design direction
Use the original brief's intent:
- more premium SaaS / product-tool
- calmer
- more elegant
- more trustworthy
- clearer in under 10 seconds
- less aggressive visually
- less noisy
- stronger whitespace and hierarchy
- still distinctive, but not harsh or poster-like

If the current tactical/brutalist identity blocks that outcome, evolve it.
Do not preserve the old feel just because it already exists.

## Explicit anti-drift rules
- Do not spend the cycle on tiny route-specific audits unless they directly support the redesign.
- Do not disappear into one isolated page for hours.
- Do not optimize wording while leaving layout mostly unchanged.
- Do not stop after "premium polish" if the result still reads as basically the same site.
- Do not send a design essay first. Ship code.

## Working-tree rule
There is in-flight work on `/projects/[id]/surfaces` from the prior misdirected cycle.
Handle it pragmatically:
- keep any valid parts if they help
- finish or fold them in cleanly if trivial
- but do **not** let that route hijack the redesign cycle again

## Must-do implementation areas
At minimum, make the redesign obvious on:
- homepage hero + supporting sections
- pricing information architecture
- templates gallery framing
- topbar/sidebar/app shell tone and density
- dashboard primary action hierarchy
- projects list presentation
- new-project step 1 and surrounding framing
- settings information grouping and hierarchy

## Live deployment requirement
This is not done until the changes are:
- committed
- pushed to `origin/main`
- deployed on Vercel production
- checked in the browser on live `shotshq.com`

Do not stop at local-only completion.

## Verification requirement
Run and report exact outcomes for:
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Then verify live production in browser for at least:
- `/`
- `/pricing`
- `/templates`
- `/dashboard`
- `/projects`
- `/projects/new`
- `/settings`

## Handoff format
Update `docs/ops/overnight-browseros-status.md` with a new top entry that clearly states:
- this cycle corrected scope drift
- what was redesigned
- which routes changed
- verification results
- commit(s) pushed
- whether live production now matches the redesign goal
- any small follow-ups that remain

Then reply with a concise ship report only.

## Final instruction
Implement the real redesign directly.
Make the live site look and feel different enough that a human immediately notices.