# Internal-team: editor viewport audit · 2026-05-01

> **Status:** Captured 2026-05-01 · Triaged 2026-05-01 · Closed 2026-05-01 (commits 79023eb, this-commit).

## Source

Internal team observation, surfaced post-triage of the
[2026-04-30 Comet+Sonnet editor audit](./2026-04-30-comet-sonnet-editor.md)
during dogfooding of the fixes shipped in that batch (commits 1–6, closed
2026-05-01).

This is **not** an autonomous browse-and-report run. It's two distinct
follow-up findings the team caught while exercising the now-fixed editor
flow. They share the editor surface but address different concerns
(canvas viewport behavior + device-picker visual treatment), so they're
captured together rather than split across two single-finding files.

## Scope

Two surfaces:

- `/projects/[id]/editor` — Fabric canvas viewport behavior across panel
  switches, sidebar collapse, and browser-window resize
- `/projects/new` Step 01 + the editor's **Device Frame** tool tab —
  device picker tile mockups (`components/devices/DeviceTile.tsx`)

## Findings

### #1 [Bug] — Canvas viewport offset stale on container resize

**Observed:** After switching tool tabs in the editor (LeftPanel: Device
→ Backdrop → Text → AI → Layers), or after collapsing the App Sidebar,
or after resizing the browser window, **mouse coordinates desynchronize
from canvas pixels**. The most user-visible symptom is "I can't grab the
backdrop" — a click on the visible backdrop lands on empty space because
Fabric maps the click using a stale internal `_offset` cache. Other
clicks land off-by-N pixels in the same direction. Layers continue to
render at the right pixels (the visible canvas looks fine) but the
mouse-to-canvas mapping is broken.

**Reviewer's diagnosed cause:** `components/editor/FabricCanvas.tsx`
contains zero ResizeObserver instances and never calls
`canvas.calcOffset()`. Fabric's mount-time offset is correct; it never
gets recomputed when the wrapping `<div>` shifts position in the DOM
(any cause: window resize, App Sidebar collapse, parent panel reflow,
scrollbar appearance/disappearance, tab-switch reflow). The existing
zoom-sync `useEffect` reacts to `[zoomExtra, baseScale, shots.height]`
but not to container size, which is the gap.

**Reviewer's proposed fix:** Wire a ResizeObserver on the canvas
workspace wrapper that calls `canvas.calcOffset()` on size change. Don't
touch `viewportTransform` (preserves user pan), `setZoom` (preserves
user zoom), or `setDimensions` (preserves canvas pixel size — DISPLAY_W
stays 460 fixed). The fix should be small and proportional — about
20 lines wired through a pure helper for unit testability.

Honest framing note: the symptom is most visible during tool-tab
switches, but `LeftPanel` is `w-[280px]` fixed across all tabs
(`components/editor/EditorPanels.tsx`), so the panel width does not
change between tabs. The bug is **layout-reflow-agnostic**. Tab
switches make it user-perceptible because that's when the click-target
drift gets noticed; window resize and sidebar collapse trigger the
same bug class.

### #2 [UX] — Device picker mockups read as generic placeholders

**Observed:** `components/devices/DeviceTile.tsx` renders every device
(iPhone 15/16/17 Pro Max, iPhone SE 3, iPad Pro 13″, etc.) with the
same plain-CSS skeleton — a flat rectangle, a small `<span>` for the
top cutout, a thin home-indicator pill at the bottom. The only visual
difference between an iPhone 17 Pro Max (Dynamic Island) and an iPhone
SE 3 (home button, no notch) is the size of one black `<span>`. Picker
feels under-designed; users have a harder time recognizing which device
is which at a glance.

**Reviewer's proposed fix:** Replace the inline cutout `<span>`s with
SVG silhouettes per device family. Catalog already encodes
`topCutout: "island" | "notch" | "none"` on every device
(`lib/devices/catalog.ts`), so the silhouette family is deterministic
from `(family, topCutout)` — no schema additions, no migration. Four
silhouettes cover the catalog:

| Silhouette | Decision rule | Devices |
|---|---|---|
| `iphone-dynamic-island` | `family === "iphone" && topCutout === "island"` | iPhone 15/16/17 Pro Max, Pro, Plus, Air, base |
| `iphone-notch` | `family === "iphone" && topCutout === "notch"` | iPhone 16e |
| `iphone-home-button` | `family === "iphone" && topCutout === "none"` | iPhone SE 3 |
| `ipad-flat` | `family === "ipad"` | All iPad Pro / Air / mini / iPad 10 |

Tile dimensions, REQUIRED badge, name+spec label, selected/unselected
states, theme-variable consumption all stay unchanged — only the inner
mockup graphic changes. SVGs use `currentColor` strokes so the parent
controls line color via Tailwind text utilities; selected state uses
`var(--accent)` on the silhouette cutout fill.

## Diagnostic notes

### #1's hypothesis pruning trail

Three plausible causes were considered before settling on missing
`calcOffset()`:

1. **(Ruled out) Parent layout reflow.** `EditorClient.tsx` parents
   the three panels in a sibling flex layout with `<FabricCanvas />`
   wrapped in `flex-1 min-w-0`. Direct read confirmed the wrapper does
   reflow when the parent width changes. The CSS layout is correct.
2. **(Ruled out) Panel-width-changes-between-tabs.** Worth checking
   because the user-perceived correlation is "happens when I switch
   tabs." `EditorPanels.tsx` shows `LeftPanel` is `w-[280px]` fixed
   across every tab; the FramePanel's 2-column device grid stays
   inside the 280px panel and doesn't push it wider. So tab-switch
   correlation is incidental, not causal.
3. **(Confirmed) Fabric viewport never recalculates.** Direct read of
   `FabricCanvas.tsx`: zero `ResizeObserver` references, zero
   `calcOffset` calls, mount-time `setZoom(baseScale)` is the only
   viewport-adjacent operation. The existing `useEffect` at
   `FabricCanvas.tsx` lines 284–294 reacts only to
   `[zoomExtra, baseScale, shots.height]`. The gap is real and
   localized.

The "can't grab backdrop" symptom maps cleanly to (3): layers render
at correct PIXELS but Fabric's `_offset` cache mismaps mouse coords.
The fix kills the whole bug class, not just the tab-switch symptom.

## Triage

| # | Outcome | Where |
|---|---|---|
| 1 | **Fixed in commit `79023eb`** — ResizeObserver via `lib/editor/viewport.ts` helper + 7-assertion call-count contract test in `tests/editor/viewport-resize.test.ts` (the +1 over the original spec is an SSR-safety check for `typeof ResizeObserver === "undefined"`). "Fit canvas" button extended to also reset pan and renamed "Fit to view (reset zoom + pan)" for honesty. | this session |
| 2 | **Fixed in this commit** — 4 SVG silhouettes in `components/devices/silhouettes/` + `pickSilhouette(device)` helper with TypeScript exhaustiveness guard + DeviceTile rewires + `tests/devices/silhouette-pick.test.ts` decision-tree test (6 specs). No catalog changes — `topCutout` field already encodes the silhouette family. | this session |

## Workflow notes

This audit emerged from internal use of the fixes shipped in the prior
batch. **Meta-pattern worth documenting:** audits surface from the
triage + dogfooding loop, not just external reviewers. The Comet+Sonnet
audit caught the silent "Open editor" bug; the fix made the editor
loud-on-failure; with the editor reliable enough to actually use,
team dogfooding caught the next layer of issues. Closing one audit
makes the next one possible.

What worked this round:

- **Cross-audit refs as a real artifact.** This file links back to
  the original; the original's Status remains Closed (untouched).
  Convention's "don't edit closed audits" rule pays off — the
  follow-up finding lives in its own file rather than retroactively
  expanding the original's scope.
- **Hypothesis pruning preserved verbatim.** The three-hypothesis
  trail in #1's Diagnostic notes captures *why* the fix is small:
  most candidate causes were ruled out by direct file read before
  any code change. Future audits referencing this file will see why
  we didn't reach for a layout overhaul.

What to refine:

- **No Workflow notes from external reviewer.** This audit is
  internal-team-sourced, so the "what worked / what to refine"
  introspection is about our own triage process rather than how the
  audit prompt structure produced findings. Future internal-team
  audits should explicitly note that distinction.

## Cross-audit refs

- **Predecessor:** [`2026-04-30-comet-sonnet-editor.md`](./2026-04-30-comet-sonnet-editor.md)
  — closed audit; this follow-up emerged from dogfooding the fixes
  shipped in commits 1–6 of that batch.
- **Successor:** none yet. If a future Comet+Sonnet pass re-finds
  either #1 or #2, link forward from here.
