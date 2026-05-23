# BrowserOS cycle #8 brief — make /surfaces truthful and persistent

Work in `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`.

## What BrowserOS verified this cycle

### Local app/browser state
- The export loop is now real enough to pass the dedicated end-to-end spec: local browser showed READY status on the project surfaces, and the new `e2e/studio-export-loop.spec.ts` passes locally.
- The authenticated shell hydration issue became the active Claude cycle (#7) and appears to be the correct current focus.
- After that, the next highest-impact trust gap in the app is `/projects/[id]/surfaces`.

### Highest-priority current gap after hydration
`/surfaces` currently simulates operator progress with **client-only fake state**:

- Clicking `+ Add to render` changes the card CTA to `✓ Selected`.
- The sticky footer updates from `1 surface · 3 variants` to higher counts.
- But **reloading the page resets everything** back to the default App Store-only state.
- The file itself confirms this is intentionally in-memory only right now:
  - `components/surfaces/SurfaceMatrix.tsx`
  - `useState<string[]>(["ios-appstore"])`
  - comment: `Persistence + render dispatch will be wired in a follow-up. For now we keep selection state in component memory`
- Meanwhile the page headline still promises: `Pick every channel you want this project to ship to. Same source screens, every aspect, one render pass.`

So the current UX creates a misleading feeling of saved configuration even though nothing durable exists yet.

## Task for this cycle
Fix `/projects/[id]/surfaces` so it is **truthful, durable, and operator-safe**.

Prefer one of these honest outcomes:

### Preferred
Implement real persistence of surface selections on the project, then make the page read/write that persisted state.

### Acceptable fallback
If durable persistence cannot be landed cleanly this cycle, then remove the fake-selected behavior and convert `/surfaces` into an explicitly informational/planned surface matrix:
- no faux manifest counts that imply saved state
- no `✓ Selected` state that disappears on reload
- clear copy about what is live now vs planned for v1.1
- App Store remains always-on and truthful

## Concrete browser evidence to reproduce
On a ready local project such as:
- `http://localhost:3000/projects/4b866266-fd4a-41b8-99d8-c95a88745576/surfaces`

Observed behavior:
1. Initial footer shows `1 surface · 3 variants`
2. Click `+ Add to render` on `Website hero — desktop`
3. CTA becomes `✓ Selected`
4. Footer becomes `2 surfaces · 6 variants`
5. Reload the page
6. State resets back to `+ Add to render` and `1 surface · 3 variants`

That means the current manifest is not a real saved configuration.

## Acceptance criteria
1. `/projects/[id]/surfaces` no longer presents ephemeral client-only selection state as if it were real saved project configuration.
2. If a surface is shown as selected, that selection survives reload and is derived from persisted project data.
3. If persistence is not yet shipped, the UI must stop pretending selection is durable.
4. The sticky manifest summary must reflect real saved state only.
5. `Render all` / export language remains honest about what is actually functional today.
6. App Store screenshots remain always-on and truthful.
7. Existing export-loop, READY/DRAFT truthfulness, and authenticated-shell fixes must not regress.

## Implementation guidance
Start by inspecting:
- `components/surfaces/SurfaceMatrix.tsx`
- the project schema / project JSON storage used elsewhere for studio/export truthfulness
- any existing project-level config blob where surface preferences could live cleanly

A good shape would be:
- server reads persisted surface manifest from project data
- client toggles write through a typed route / server action
- optimistic UI is allowed, but must reconcile to persisted truth
- if the backend piece is too large, simplify the UI instead of faking durability

## Required verification
At minimum run:
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Also do a browser smoke on `/projects/[id]/surfaces` and verify:
- a selected surface survives reload **or**
- the UI no longer implies saved selection if persistence is absent

## Docs / handoff
Update `docs/ops/overnight-browseros-status.md` with:
- timestamp
- what shipped
- verification
- blockers
- next target
- next BrowserOS prompt

Then reply in Claude with a concise ship report.

Treat the repo + git state as truth.
