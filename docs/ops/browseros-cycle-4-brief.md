# BrowserOS cycle #4 brief — Surfaces manifest must become real

Work only in `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`.

## What BrowserOS verified just now

### Already looks materially fixed
- The local app was booted in the project’s own internal QA mode (`NEXT_PUBLIC_E2E=1`, `SHOTSHQ_CONSTRUCTION_MODE=0`) so the product routes could be exercised end to end.
- `/projects/:id/studio` for project `4b866266-fd4a-41b8-99d8-c95a88745576` now shows a truthful ready state:
  - screenshot badge says `PERSISTED — SURVIVES RELOAD`
  - `Export current` and `Export all (1)` are enabled
  - the panel is marked `● READY`
- `/projects/:id/exports` is now honest and aligned with Studio:
  - header says `Readiness · Ready`
  - copy explicitly says browser-side renders happen in Studio and server queue/R2 streaming is a v1.1 target
  - non-targeted device bundles are clearly disabled instead of pretending to exist
- Project overview reflects the ready status and links the operator back to Studio / Exports coherently.

### Highest-priority gap BrowserOS found
The **`/projects/[id]/surfaces` route is still a polished-looking dead end** and is now the most important completeness gap.

Observed in browser:
- The page strongly frames the product as multi-surface shipping: website hero, mobile hero, OG card, Discord, Product Hunt, GitHub banner, press kit.
- The sticky footer says `Render manifest 1 surface · 3 variants` and the page invites the operator to `Pick every channel you want this project to ship to`.
- But the primary action is still `Render all · Soon` (disabled), so the route stops short of a truthful shippable workflow.
- The selection model is not durable today. Even if the in-memory card toggle UI exists, it is not a real saved project-level manifest the rest of the app can rely on.
- This leaves a major product promise half-built: the route looks productized but does not yet become a dependable planning/configuration surface.

Repo confirmation:
- `components/surfaces/SurfaceMatrix.tsx` explicitly says persistence + render dispatch are follow-up work and that current selection state is only kept in component memory.

## This cycle’s only task
Turn `/projects/[id]/surfaces` from a presentational picker into a **real, persisted surface manifest** that feels trustworthy across the app, even if actual cross-surface render jobs are still staged for later.

## Product intent
If we cannot fully render every non-App-Store surface yet, that is fine — but the route must still do real work:
1. let the operator choose target surfaces,
2. persist that selection to the project,
3. survive reload/navigation,
4. update project summaries/counts consistently,
5. explain clearly what is ready now vs. what is staged for later.

This should feel like a real planning + configuration step, not a mockup.

## Acceptance criteria
1. **Surface selections persist to the project**
   - Selecting supported optional surfaces on `/projects/[id]/surfaces` updates durable project state, not component-only memory.
   - Reloading the page preserves selected surfaces.
   - Navigating away and back preserves selected surfaces.

2. **The UI becomes observably stateful and truthful**
   - Optional cards visibly toggle between unselected and selected states (`+ Add to render` → a selected state like `✓ Selected` / `Included`, etc.).
   - The sticky manifest footer updates from persisted state, not transient local state.
   - If render dispatch is still not available for some/all non-App-Store surfaces, the CTA/copy must say exactly what *is* happening now (e.g. “Selections saved to project manifest”) and what is still pending for v1.1.
   - Do not leave a vague disabled `Soon` button as the page’s main conclusion if a real save/config action now exists.

3. **Cross-route counts become consistent**
   - Project overview `/projects/[id]` reflects the persisted target count derived from the manifest.
   - List/dashboard surfaces that summarize target counts should also reflect the saved manifest, not stale defaults.
   - Do not inflate “ready” counts for surfaces that are merely selected but not yet renderable.

4. **Exports route stays honest**
   - `/projects/[id]/exports` should remain truthful about what can be exported today.
   - If optional surfaces are selected but not yet render-dispatchable, show them as planned/staged/manifested — not as completed renders.
   - Preserve the good work from the export-readiness funnel; do not regress Studio ↔ Exports honesty.

5. **Tests pin the contract**
   - Add the smallest useful automated coverage proving:
     - selection persists across reload
     - target counts update consistently across relevant routes
     - non-rendered planned surfaces do not masquerade as completed exports

## Strong implementation preference
Prioritize **truthful persistence and cross-route consistency** over building a fake queue.

A good interim state is:
- App Store is live and exportable now.
- Additional surfaces can be selected and saved into the project manifest now.
- The UI explains that these saved surfaces define the upcoming render plan, while full non-App-Store render dispatch lands in v1.1.

That is far better than a visually polished but non-committal surface picker.

## Verification BrowserOS expects next cycle
- Open a project on `/surfaces`
- Select at least one optional surface
- Reload and confirm it remains selected
- Check `/projects/[id]` and at least one aggregate surface (`/projects` or `/dashboard`) for consistent target counts
- Check `/exports` and ensure planned surfaces are described honestly, not shown as completed renders

## Delivery requirements
- Update `docs/ops/overnight-browseros-status.md` with this cycle’s timestamp, what shipped, verification, blockers, next target, and next BrowserOS prompt.
- Reply in chat with a concise ship report.
