# Comet+Sonnet: editor audit · 2026-04-30

> **Status:** Captured 2026-04-30 · Triaged 2026-05-01 · Closed pending commits 1–6 (this batch).

## Source

Comet browser + Sonnet 4.5 model running an autonomous browse-and-report
session against the live ShotsHQ build. The agent navigated the post-
launch editor surfaces as a fresh signed-in user and produced behavioral
findings (clicked X, expected Y, got Z) rather than positioning notes.

This is the second autonomous audit of the product (first one ran in
the original marketing-review pass). The Comet+Sonnet workflow has
proven worth repeating — see Workflow notes at the bottom.

## Scope

Five surfaces exercised:

- `/templates` — clicking template cards as a signed-in user
- `/projects/[id]` — project detail page and the "Open editor" CTA
- `/projects/[id]/editor` — editor route and FabricCanvas mount
- `/projects/[id]/exports` — exports page badge states
- `/projects/[id]/ai` — AI panel pricing labels
- `/pricing` (cross-checked) — credit-cost mentions
- General: visual density of "SOON" / disabled treatments across the app

## Findings

### #1 [Bug] — Templates redirect logged-in users to /sign-up

**Observed:** Signed-in user clicks a template card on `/templates` →
lands on `/sign-up?template=mono-punch`. For an authenticated session
this is functionally a 404. Worse, it's silent — the user might assume
the template feature itself is broken.

**Reviewer's proposed fix:** Conditional routing on the template card.
Authenticated → `/projects/new?template=mono-punch` (pre-seed the
wizard). Anonymous → `/sign-up?template=...&next=/projects/new?template=...`
(sign-up, then land on the seeded wizard). Verify the post-signup
redirect honors the param — currently the sign-up flow doesn't.

### #2 [Bug] — "Open editor" button doesn't reliably fire

**Observed:** Primary CTA on the project page visibly enters a hover/
loading state and then does nothing. No error, no log surface — just
silence. Worst possible failure mode (not loud enough for a support
ticket, confusing enough that users blame themselves and leave).

**Reviewer's diagnostic clue:** "Clicking + EMPTY in the Shot Grid
does work." (Note during triage: this attribution turned out to be
slightly off — `+ EMPTY` is a non-interactive `<div>` per
`projects/[id]/page.tsx:143–149`. The symptom is real; the comparison
case the reviewer remembered isn't quite what they thought.)

**Reviewer's proposed fix:** Two hypotheses to differentiate —
(a) race condition with session/project hydration in the button
handler, (b) `/projects/[id]/editor` throws on mount and an error
boundary catches it silently. Direct URL navigation is the diagnostic.

### #3 [Confusion] — Credit cost contradiction (2 CR vs 8 CR)

> **Originally diagnosed as:** Copy fix. The reviewer assumed "2 CR per
> frame × ~4 frames = 8 CR for a set" and recommended harmonizing to
> per-frame everywhere.
>
> **Reframed during triage (see Diagnostic notes below):** Taxonomy gap
> — these are two different products at different prices, not the same
> product mislabeled.

**Observed:** `/pricing` says "AI backdrop · 2 CR." AI Panel says
"2 CR / FRAME · GPT-IMAGE-1." (The agent saw inconsistency.)

**Reviewer's proposed fix (per copy-fix diagnosis):** Pick a unit and
use it everywhere. Pattern A (per-frame everywhere) preferred over
Pattern B (per-set with breakdown). 30-min audit across pricing /
home pricing block / AI panel / credit ledger.

### #4 [UX] — "NOT TARGETED" looks like a setup failure

**Observed:** Devices excluded from the project's storeTargets array
show `<Badge>NOT TARGETED</Badge>` on the exports page. Reads as "you
forgot to select these" when it actually means "you've decided not to
include these, here's progress on the ones you did."

**Reviewer's proposed fix:** Rename. Suggested labels: `PENDING RENDER`
or `READY — 0 FRAMES`. Triage refined to:

- N = 0 (targeted but no frames yet) → `READY · WAITING FOR FRAMES`
- N > 0 (targeted with renders) → `READY · X / N FRAMES`
- Not targeted → user didn't address; triage chose `NOT INCLUDED`.

### #5 [UX] — "SOON" overload signals "demo skeleton"

**Observed:** Density of disabled buttons + dim red `SOON` / `coming
soon` labels across the app reads as "demo skeleton" rather than
"honest pre-launch." 12+ instances across 7 files, all hand-rolled
(no shared component).

**Reviewer's proposed fix:** Three patterns at increasing effort:

- Pattern 1 (lowest): visual de-emphasis — quieter styling, same copy.
- Pattern 2 (medium): collapsible "Coming in v1.1" sections per
  surface. One concentrated signal instead of scattered badges.
- Pattern 3 (highest): locked-state UX with marketing-style preview
  cards (Linear-style aspirational features).

User triage chose Pattern 1 this session, Pattern 2 before next paid-
acquisition push, Pattern 3 v1.1 design pass.

## Diagnostic notes

### Reframing #3 from copy fix to taxonomy gap

The reviewer's "2 CR per frame × 4 frames = 8 CR for a set" hypothesis
fits the surface evidence but didn't survive cross-checking against
`lib/utils/credits.ts`:

```ts
ai_background:   2,   // single-frame Flux backdrop regen
ai_template_set: 8,   // gpt-image-1 wide 6-frame composition
```

These are two distinct products:

- **AI Backdrop** (2 CR / frame) — Flux 2 single-frame backdrop swap.
  In-canvas operation that re-renders the scene around your existing
  screenshot. The screenshot itself stays untouched.
- **AI Template Set** (8 CR, one-time) — gpt-image-1 wide composition
  that generates a cohesive 6-frame layout from app metadata. Whole-
  composition operation, different model, different artifact.

The fix shape changed: not "harmonize the math" but "make the two
products visibly distinct in copy." The marketing surfaces collapse
them under a single "Backdrops" feature card; that's the actual gap.

This trail is preserved here verbatim because the meta-pattern (cross-
check the canonical source before accepting a copy-fix diagnosis) is
exactly the kind of thing future audits will benefit from seeing.

### #2's symptom-vs-cause reframe

The reviewer's two hypotheses were both reasonable. Triage Phase 1
exploration eliminated hypothesis (a): the project page's "Open editor"
links are plain `<Link href>` with no onClick handler. So the bug must
be in the route itself — hypothesis (b).

Confirmed during exploration that NO error boundaries exist anywhere
in the editor route tree (`app/error.tsx` and four progressively
narrower paths all absent). A throw during mount goes unhandled and
manifests as the silent loading-then-nothing state the reviewer saw.
The fix has two layers: (1) add the missing error boundary so future
failures are LOUD, (2) Zod-validate `polotnoJson` before passing to
the canvas so malformed JSONB falls back to `defaultCanvas()` instead
of throwing.

## Triage

| # | Outcome | Where |
|---|---|---|
| 1 | Fixed in commit 2 (auth-aware template card routing + wizard ?template= seeding + sign-up redirect_url honor with origin-match validation). Pro-locked-template gating deferred to `docs/issues/v1.1-template-tier-gating.md`. | this session |
| 2 | Fixed in commit 3 (error boundary + Zod validator + diagnostic curl pass). Symptom-loud-now even if a future regression sneaks in. | this session |
| 3 | Fixed in commit 5 (FeatureGrid splits into AI Backdrop + AI Template Set; pricing page adds the second product; AI panel section heading renamed; closing-CTA labels updated). | this session |
| 4 | Fixed in commit 4 (`READY · WAITING FOR FRAMES` / `READY · X / N FRAMES` for targeted, `NOT INCLUDED` for excluded). | this session |
| 5 | Fixed in commit 6 (Pattern 1 visual quieting site-wide). Pattern 2 deferred to next session pre-paid-acquisition push. Pattern 3 deferred to v1.1 design pass. | this session |

## Workflow notes

What worked about this audit:

- **Behavioral framing.** "Clicked X, expected Y, got Z" findings are
  deterministic to verify and trivial to triage. Aesthetic critiques
  ("the page feels heavy") generate threads, not fixes.
- **Mixed severity tagging.** The reviewer implicitly tagged each
  finding (real bug vs copy fix vs strategic call). Formalizing that
  into the four-tag schema (Bug / Confusion / UX / Strategic) makes
  triage decisions faster and more consistent across audits.
- **Concrete proposed fixes.** Each finding came with a specific
  implementation suggestion (URL builder, badge label, copy variant).
  Made the triage step "accept / reject / refine" rather than "design
  from scratch."

What to refine next time:

- **Run in fresh incognito with no test data.** This audit happened
  with a logged-in session that had pre-existing projects. The "Open
  editor" finding showed up; the actual onboarding state (sign up →
  empty dashboard → first project) wasn't audited. Next pass should
  start cold.
- **Have the reviewer pre-tag findings.** Bug / Confusion / UX /
  Strategic. The agent can do this if the prompt asks for it
  explicitly. Saves the triage step of re-tagging.
- **Have the reviewer rate confidence on each diagnosis.** "Almost
  certain" vs "guess based on observation" lets triage prioritize
  investigation depth. Finding #2's diagnostic clue was wrong but
  high-confidence-sounding; explicit confidence ratings would have
  flagged it for closer cross-check.
- **Have the reviewer note what they DIDN'T find as well.** Gaps in
  observation are diagnostic too. Missing categories of finding are
  often more telling than presence (e.g. "no findings about pricing
  comprehension" might mean the pricing copy is doing its job, OR it
  might mean the reviewer didn't engage with pricing).

## Cross-audit refs

This is the second audit; the first (marketing-review pass) is a
chat-only artifact and was not captured under this folder convention.
Worth retroactive capture if we want the recurrence-detection
machinery — file would be `2026-04-XX-comet-sonnet-marketing.md`.
Skipping for now; this folder starts here.
