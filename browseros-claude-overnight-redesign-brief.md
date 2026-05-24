# ShotsHQ overnight redesign brief

## Context
The current ShotsHQ design is visually striking, but it feels too brutalist, loud, busy, and cognitively heavy for this product. It looks memorable, but it does **not** feel easy, classy, intuitive, or premium. The redesign goal is **not** a cosmetic polish. It is a deliberate repositioning of the product into something more refined, usable, trustworthy, and professionally premium.

I have already backed up the current repo state here:
- `backups/redesign-20260524-033121/`

There is also unrelated in-progress local work around upload routes / CaptureDropzone in the working tree. **Do not reset, discard, or overwrite unrelated local changes.** Avoid touching those upload files unless absolutely necessary for the redesign.

## Your mission
Redesign the site and app experience so that when I wake up, ShotsHQ feels:
- easier to understand in under 10 seconds
- easier to navigate
- more premium and trustworthy
- more elegant and less aggressive
- more modern SaaS / product-tool, less poster / brutalist experiment
- clearer about what the product does and how to start

This is a real implementation task, not a moodboard exercise. Ship code.

## Visual direction
Move away from the current:
- pure black + hard red + warning yellow dominance
- oversized shouting typography everywhere
- dense grid/noise treatment
- rigid all-caps military terminal energy on every surface
- visually aggressive contrast in places that should feel calm and guided

Target a direction closer to:
- premium product SaaS
- refined, editorial, modern, confident
- clean hierarchy, strong whitespace, high clarity
- tasteful motion / depth if useful, but restrained
- "professional premium" over "edgy loud"

### Suggested style system
You can choose the exact implementation, but the end result should feel coherent and intentional. My preferred direction:
- **Palette:** charcoal / graphite / soft stone / off-white / muted metallic accent, with one restrained brand accent
- Avoid the current red/yellow overload
- If you keep a dark app shell, make it calmer, softer, and more legible
- Marketing can be light or dark, but it must feel premium, not harsh
- Reduce visual noise dramatically

### Brand update
Choose a new, cleaner brand expression for **ShotsHQ**:
- redesign the logo / mark / wordmark treatment
- create any needed SVG/PNG assets locally in the repo
- update favicon / header mark / any visible brand surfaces if needed
- keep the company/product name **ShotsHQ**
- brand should feel premium, minimal, memorable, and usable at small sizes

## UX problems to solve
From the current site/app audit:
- Hero is loud but not calm or premium
- Pricing is striking but not easy to scan or trust at a glance
- Dashboard feels visually severe rather than efficient
- Settings feel functional now, but visually still too harsh and mechanical
- The system overuses all-caps, mono, hard lines, and high-contrast blocks
- Important actions don’t feel guided; everything fights for attention
- The site feels like a concept piece more than a polished premium product

## Scope
Redesign the experience **holistically**, starting with the highest-visibility/highest-impact surfaces.

### Must redesign
#### Marketing
- `app/(marketing)/page.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(marketing)/templates/page.tsx`
- `app/(marketing)/docs/page.tsx`
- `app/(marketing)/layout.tsx`
- key shared marketing components in `components/marketing/*`

#### App shell / product surfaces
- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/settings/page.tsx`
- `components/app/Sidebar.tsx`
- `components/app/Topbar.tsx`
- `components/settings/SettingsForms.tsx`
- any shared UI primitives necessary to make the redesign coherent

#### Brand / shared system
- `app/layout.tsx`
- `components/ui/*` if needed
- any theme tokens, spacing, radii, shadows, typography, surface system, icon / badge styling
- create any new local brand assets needed

## Product constraints
Do **not** break or regress already-shipped truthful product behavior.
Keep the recent honesty fixes intact.
Do not reintroduce fake claims.

Protect these principles:
- product copy must stay truthful
- app flows must stay functional
- `/settings` real save flow must remain intact
- pricing / plan truthfulness must remain intact
- AI panel / export / billing / auth work should not be cosmetically redesigned into broken states
- preserve testability hooks where they matter

## Design goals by surface
### 1) Marketing homepage
Make it immediately clear:
- what ShotsHQ does
- who it is for
- why it is faster / better
- what the first step is

Need:
- calmer, more premium hero
- cleaner information hierarchy
- stronger product demo framing
- better CTA structure
- less visual screaming
- more trust and polish

### 2) Pricing
Make the pricing page feel:
- clearer
- easier to compare
- more premium
- more trustworthy
- less like a poster

Need:
- cleaner comparison hierarchy
- clearer plan emphasis
- more polished card system
- stronger spacing and typography

### 3) Dashboard / app shell
Make the app feel like a serious premium tool:
- clearer navigation hierarchy
- better spacing and density balance
- calmer surfaces
- easier scanning
- more intuitive action placement
- improved contrast and readability

### 4) Settings
Settings should feel:
- calm
- understandable
- premium
- professional
- trustworthy for account/configuration work

### 5) Shared UI system
Introduce a stronger design system so the redesign is coherent rather than page-by-page random.
You may refactor components/tokens if that helps.

## Images / assets
Generate whatever is needed locally in-repo, including:
- logo / logomark assets
- subtle background or hero assets if useful
- polished product framing visuals if needed
- any simple vector assets or illustrations needed to support the redesign

Do not depend on external manual design work from me.
If you need to generate SVGs, placeholders, composited assets, or scripted visuals, do it.

## Execution strategy
Do this as an implementation cycle, not endless analysis.
I want a real shipped redesign direction, not just a proposal.

Recommended order:
1. establish visual system / theme / tokens / typography / logo direction
2. redesign shared marketing shell + homepage
3. redesign pricing and key marketing sections
4. redesign app shell (sidebar/topbar/dashboard/settings)
5. clean up consistency issues
6. run verification

## Acceptance bar
When done, the redesigned product should feel:
- more premium than the current version
- easier to use
- less noisy
- less visually fatiguing
- more intuitive to first-time users
- more coherent across marketing + app

I should be able to look at it and say:
"Yes, this feels like a real premium software product now, not a loud concept aesthetic."

## Verification
Before reporting back:
- run typecheck
- run relevant tests
- run build
- add/update tests if the redesign required structural changes worth locking in
- make sure the app still works locally

## Output format
Implement the redesign and then reply with a concise ship report containing:
- what changed
- which surfaces were redesigned
- any new brand/logo/assets created
- verification results
- commits pushed
- remaining follow-ups, if any

## Important
Do not send me a long design essay first.
Do the work.
Ship the strongest coherent redesign you can tonight.