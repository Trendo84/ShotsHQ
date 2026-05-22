# BrowserOS cycle #3 brief — screenshot upload persistence

Work in `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`.

## What BrowserOS verified this cycle

### Confirmed fixed from cycle #2
The export/readiness funnel now looks truthful in the live local app (`http://localhost:3000`):

- Landing still promises export-ready output.
- Local authenticated app is reachable.
- `/projects/556dda18-33c4-4e73-bba4-6858f2ccae2d/studio` and `/projects/dcc9986c-f284-41ea-a9a5-4c740fcc59d2/studio` both show:
  - filmstrip tile `○ DRAFT`
  - `EXPORT ALL (0)` disabled
  - `EXPORT CURRENT` disabled
  - explicit blocked readiness copy
- Matching `/exports` pages now show:
  - `READINESS · BLOCKED`
  - `0 / 1 PANELS`
  - `PREPARE IN STUDIO`
  - truthful device cards (`READY · 0 / 1 FRAMES` / `WAITING FOR FRAMES` / `NOT TARGETED`)
  - honest render-history copy about browser exports landing in Downloads

So cycle #2’s shared readiness model appears real in the browser.

## Highest-priority next gap
Screenshot upload persistence is still the most important next fix.

### Why this is the next target
I was not able to complete a fresh browser upload through the hidden BrowserOS session because the Studio upload control exposes a hidden file input that BrowserOS cannot directly target from the snapshot layer in this run.

But repo + live-app evidence strongly point to the same persistence bug identified in the handoff:

- `components/studio/StudioClient.tsx` currently sets upload state with:
  - `screenshotUrl: url`
  - `screenshotRemote: false`
- `tests/studio/readiness.test.ts` currently **accepts `blob:` URLs as ready**.
- `lib/studio/schema.ts` sanitizes studio designs before persistence.
- The existing upload/register path already exists elsewhere:
  - `/api/upload`
  - `/api/screenshots/register`
  - `components/capture/CaptureDropzone.tsx` shows the intended presign → PUT → register pattern.

That means a just-uploaded screenshot can likely look ready in-memory via a blob URL, but the saved project payload cannot reliably survive reload with that local-only blob source.

This is a core product integrity issue because it makes the Studio/export readiness signal depend on an ephemeral browser-local URL instead of a persisted asset.

## Task for this cycle
Fix screenshot upload persistence end-to-end, prioritizing the real fix over an interim honesty patch.

### Preferred implementation
Wire Studio uploads through the existing remote upload path:

1. On upload in Studio, call `/api/upload` to get a presigned PUT target.
2. PUT the PNG/JPG bytes to R2 (or the existing backing store used by Capture).
3. Register/persist the upload using the established screenshot-registration path/pattern.
4. Replace the temporary blob URL with the resulting durable remote `https:` URL in Studio state.
5. Set `screenshotRemote: true` once the remote asset is persisted.
6. Ensure autosave + reload preserves the screenshot and panel readiness.

### Acceptable fallback only if the real fix is too large for one cycle
If wiring the remote upload path is unexpectedly larger than expected, make the readiness model honest immediately:

- a blob-only screenshot must **not** count as ready
- readiness should require durable remote persistence (`screenshotRemote === true` or equivalent)
- UI copy should explain the in-progress state clearly

But the preferred outcome is the full durable upload path.

## Acceptance criteria
1. Uploading a screenshot in Studio eventually produces a durable remote screenshot URL, not just a blob URL.
2. After autosave and page reload, the screenshot is still present.
3. The filmstrip/panel readiness remains `READY` after reload when the screenshot truly persisted.
4. `Export current` / `Export all` only enable when the persisted screenshot requirement is satisfied.
5. No temporary state claims export-readiness unless the screenshot will survive reload.
6. Add automated coverage for the upload → save → reload persistence path.

## Required verification
Run at least:

- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Add/adjust e2e coverage so it uploads a real screenshot fixture, waits for saved state, reloads, and asserts the panel still reads as ready.

Update `docs/ops/overnight-browseros-status.md` with:
- timestamp
- what shipped
- verification
- blockers
- next target
- next BrowserOS prompt

Then reply with a concise ship report.