# ASOForge screenshot engine → ShotsHQ transplant plan

## Short answer
Yes — the ASOForge screenshot engine can be built into ShotsHQ.

But the right move is **not** to rip out the current Fabric editor in one shot.
The better move is:

1. keep the existing ShotsHQ project / uploads / credit / render pipeline,
2. add the **ASOForge-style screenshot studio as a second creative engine**, and
3. only replace the current editor as the default after the new engine proves itself.

That gives us the superior creation UX without blowing up the parts ShotsHQ already has that ASOForge does not.

---

## What is actually superior in ASOForge

After tracing the ASOForge repo, the strongest parts of its screenshot engine are:

### 1. Deterministic exact-pixel export contract
Core files:
- `apps/web/components/screenshot-studio/types.ts`
- `apps/web/components/screenshot-studio/panel.tsx`
- `apps/web/components/screenshot-studio/export.ts`

The engine renders a fixed base DOM node, then exports to exact App Store dimensions using `html-to-image` with explicit:
- `pixelRatio`
- `canvasWidth`
- `canvasHeight`

That is simpler and more predictable than the current ShotsHQ freeform-canvas flow for standard App Store creative.

### 2. Better opinionated composition model
Core file:
- `apps/web/components/screenshot-studio/studio.tsx`

ASOForge uses a constrained design model instead of a blank canvas:
- screenshot/image input
- headline/subhead
- theme preset
- background preset
- layout preset
- device frame preset
- ordered filmstrip / A-B set of panels

That is closer to how screenshot packs are actually produced.

### 3. Better device-frame library for marketing preview
Core file:
- `apps/web/components/screenshot-studio/device-frame.tsx`

It has a pure CSS/SVG device-frame system that is lightweight and visually strong.

### 4. Better multi-panel / filmstrip workflow
Core file:
- `apps/web/components/screenshot-studio/studio.tsx`

ASOForge already thinks in ordered panels:
- add
- duplicate
- delete
- reorder

That is exactly what ShotsHQ still lacks (`v1.1` multi-frame issue already exists in repo).

### 5. Better “seed from existing app assets” ergonomics
Core file:
- `apps/web/server/routers/studio.ts`

ASOForge has a thin server endpoint that returns existing assets as data URLs for editor seeding.
ShotsHQ can do the same from R2-backed screenshots.

---

## What ShotsHQ already has that we should NOT lose

ShotsHQ already has valuable infrastructure that should stay authoritative:
- project model + auth-gated app shell
- screenshot upload intake / bucketing
- credit ledger + pricing logic
- Trigger.dev background jobs
- server-side sharp render path
- R2 upload/output storage
- app-specific surfaces / exports model
- locale / AI routes already wired around the product

So this is **not** “replace ShotsHQ with ASOForge.”
It is “replace the creative editor engine with the ASOForge mental model.”

---

## Recommended integration strategy

## Strategy: add a new `studio` engine inside ShotsHQ first

### Do NOT do this first
- do not directly replace `FabricCanvas` everywhere
- do not mutate the current `ShotsCanvas` schema into something half-Fabric, half-ASOForge in one pass
- do not couple the first transplant to ASC push / AI backdrop / export surfaces all at once

### Do this instead
Create a new **ShotsHQ Studio mode** with its own schema and route:
- current route stays: `/projects/[id]/editor`
- new route becomes something like: `/projects/[id]/studio`

Then wire the project detail page to show both temporarily:
- `Open editor` (legacy canvas)
- `Open studio` (new ASOForge-style engine)

Once the studio is clearly better and stable, make it primary.

---

## Concrete architecture mapping

## 1. New schema: `StudioDesignSet` inside ShotsHQ

Current ShotsHQ schema:
- `projects.polotnoJson` currently stores `ShotsCanvas`
- despite the name, it is now Fabric-backed JSON

Do not overload that immediately.

Add a new JSON shape for the transplanted engine, e.g.:

```ts
export type StudioPanel = {
  id: string;
  headline: string;
  subhead: string;
  layout: "text-top" | "text-bottom" | "device-only" | "device-angled";
  themeId: string;
  bg: string;
  bg2: string;
  bgKind: "solid" | "linear" | "radial" | "image";
  text: string;
  accent: string;
  screenshotUrl: string | null;
  screenshotR2Key?: string;
  screenshotRemote: boolean;
  frameId: string;
  deviceId: "iphone_69" | "iphone_67" | "ipad_13";
  headlineSize: number;
  subheadSize: number;
  align: "left" | "center" | "right";
  fontFamily: "display" | "sans" | "mono";
};

export type StudioDesignSet = {
  version: "1";
  engine: "studio";
  activePanelId: string;
  panels: StudioPanel[];
};
```

Best storage option for phase 1:
- add `projects.studio_json jsonb null`

If you want to avoid a DB migration in the very first step, an acceptable temporary move is:
- store this under `projects.polotnoJson` behind a discriminant (`engine: "studio"`) only if we fully migrate the validator path

But the cleaner route is a dedicated `studio_json` column.

---

## 2. New route + component tree in ShotsHQ

Create:
- `app/(app)/projects/[id]/studio/page.tsx`
- `components/studio/StudioClient.tsx`
- `components/studio/StudioPanel.tsx`
- `components/studio/DeviceFrame.tsx`
- `components/studio/export.ts`
- `components/studio/types.ts`

This should be a targeted transplant from:
- `ASOForge/apps/web/components/screenshot-studio/studio.tsx`
- `panel.tsx`
- `device-frame.tsx`
- `export.ts`
- `types.ts`

But adapted to:
- ShotsHQ visual system
- ShotsHQ auth / layout shell
- ShotsHQ device IDs (`iphone_69`, `iphone_67`, `ipad_13`) instead of ASOForge’s `6.9`, `6.5`, `6.3`, `6.1`

Important:
ASOForge has four export size IDs, including ones ShotsHQ does not support.
For ShotsHQ v1, lock the new studio to the existing product classes:
- `iphone_69`
- `iphone_67`
- `ipad_13`

---

## 3. Reuse ShotsHQ screenshots as the studio seed source

ShotsHQ already stores uploaded screenshots in:
- `screenshots` table
- R2 objects

Build a small server helper / route to mirror ASOForge’s `assetDataUrl` pattern:
- read the project’s uploaded screenshots
- return selected screenshot as a data URL or signed URL
- seed the studio panel with it

The goal is the same ergonomic loop ASOForge has:
- upload screenshots
- open studio
- pull a screenshot in instantly
- compose headline/background/frame

This is a better fit for ShotsHQ than asking users to drag screenshots directly into Fabric.

---

## 4. Export contract in ShotsHQ: client preview, server authoritative final render

This is the biggest architecture difference.

ASOForge export path:
- client-side DOM
- `html-to-image`
- deterministic enough for its use case

ShotsHQ rulebook says:
- server render is authoritative
- client canvas export should not be the final source

So use a two-layer model:

### Phase 1
- use the transplanted studio for preview and local export parity checks
- store `StudioDesignSet` in DB
- add a preview export path in-browser for fast iteration

### Phase 2
- add a server renderer for `StudioDesignSet`
- mirror `renderFromShotsCanvas` with `renderFromStudioDesignSet`
- use `sharp` + SVG overlays for:
  - background
  - screenshot placement
  - text blocks
  - optional frame chrome overlay

That gives us the ASOForge engine UX with ShotsHQ’s server-authoritative render contract.

---

## 5. Connect AI modules to the new studio engine

Once the engine exists, the AI modules should target studio fields directly:

### AI copy
Existing route already exists in ShotsHQ.
Map result into:
- `headline`
- `subhead`
- maybe multiple variants per panel

### AI background / restyle
Instead of trying to paint arbitrary Fabric backgrounds, use them to mutate:
- `bg`
- `bg2`
- `bgKind`
- optional background image slot

### Template set
This is where the transplant really wins.
The ASOForge engine naturally fits multi-panel generation:
- one AI run can return 5–6 `StudioPanel`s
- each panel gets headline/subhead/layout/theme/frame
- the filmstrip UI already matches that mental model

This is better than forcing template generation into a single freeform canvas.

---

## 6. Use this to solve ShotsHQ’s existing v1.1 multi-frame problem

ShotsHQ already has a known gap:
- one project = one canvas
- multi-frame carousel support still missing

The ASOForge engine is basically the right answer to that.

Instead of extending Fabric first, build `StudioDesignSet.panels[]` and let that become:
- the real ordered screenshot set per project
- the base unit for export bundles
- the unit for translation fan-out

That is the fastest path to “real App Store screenshot engine” in ShotsHQ.

---

## Recommended implementation phases

## Phase A — feasibility spike (1–2 sessions)
Goal: prove the engine can live inside ShotsHQ.

Ship:
- `components/studio/types.ts`
- `components/studio/DeviceFrame.tsx`
- `components/studio/StudioPanel.tsx`
- `components/studio/export.ts`
- `app/(app)/projects/[id]/studio/page.tsx`
- hardcoded local state only

Success condition:
- open a project
- render a studio page
- switch frame/device/layout/theme
- export an exact-pixel PNG in browser

## Phase B — project persistence + screenshot seeding
Ship:
- DB field or persisted JSON strategy
- save/load for `StudioDesignSet`
- pull uploaded screenshots from the project into studio panels
- open from project detail page

Success condition:
- project reopens with studio state preserved
- uploaded screenshot can be seeded into a panel

## Phase C — multi-panel authoring
Ship:
- add / duplicate / reorder / delete panel
- panel strip UI
- per-panel export
- bulk export naming

Success condition:
- one project can produce a real 5–6 screenshot set

## Phase D — AI integration
Ship:
- AI copy writes into panel fields
- AI template-set creates full `panels[]`
- AI background/restyle updates theme/background model

Success condition:
- the superior engine is meaningfully connected to the existing value loop

## Phase E — server-authoritative renderer
Ship:
- server render for `StudioDesignSet`
- R2 upload and exports integration
- surfaces/export pipeline compatibility

Success condition:
- ShotsHQ’s final assets come from the studio engine without relying on client-only export

---

## Files to reuse from ASOForge almost directly

High-confidence transplant candidates:
- `apps/web/components/screenshot-studio/device-frame.tsx`
- `apps/web/components/screenshot-studio/export.ts`
- large parts of `apps/web/components/screenshot-studio/panel.tsx`
- structural pieces of `apps/web/components/screenshot-studio/types.ts`

Files to adapt, not copy blindly:
- `apps/web/components/screenshot-studio/studio.tsx`
  - too tied to ASOForge app context + tRPC + icon studio extras
- `apps/web/server/routers/studio.ts`
  - useful pattern, but ShotsHQ should use route handlers/server actions/helpers consistent with current app
- `apps/web/server/services/imagery.ts`
  - only some ideas, not a direct dependency

---

## What I recommend for ShotsHQ specifically

### Recommendation
Build the **ASOForge-style Screenshot Studio as a new engine inside ShotsHQ**, and make it the intended successor to the current Fabric editor.

Not because Fabric is useless — it already exists and works for freeform edits — but because the ASOForge engine is better aligned with the actual product promise:
- App Store screenshot packs
- ordered multi-panel sets
- constrained, fast, opinionated composition
- exact export dimensions
- easier AI automation

### Translation into product language
Current ShotsHQ editor = low-level design surface.
ASOForge engine = high-level screenshot generation machine.

The second one is closer to what ShotsHQ should be.

---

## Immediate next step
If we execute this, the first coding pass should be:

1. create `components/studio/` in ShotsHQ
2. transplant the frame/panel/export/type system
3. add `/projects/[id]/studio`
4. keep it local-state only for the first pass
5. prove exact-pixel browser export on the three ShotsHQ device classes

Once that works, persistence + seeding is straightforward.
