# ShotsHQ overnight BrowserOS status

## 2026-05-23 06:10 AEST · cycle #3

### What shipped this cycle

**`fix(studio): upload persistence — same-origin proxy + readiness requires durable storage`** (commit `22fac24`, pushed to `origin/main`).

BrowserOS cycle #3 brief confirmed the suspected persistence bug: Studio's `onUpload` stored a `blob:` URL only; `sanitizeStudioDesign` stripped it on save; reload reset the panel to ○ DRAFT. The readiness signal lied about whether the screenshot would survive.

Diagnostic also surfaced a deeper blocker: the existing presigned-PUT path (`/api/upload` + browser PUT to R2) is blocked by **CORS preflight** because the R2 bucket has no CORS config. Operator-side to fix; in the meantime the same-origin proxy path ships persistence today.

#### New route: `app/api/upload/direct/route.ts`

Same-origin multipart POST → server PUTs to R2 with our credentials → returns durable `publicUrl`. CSRF/auth via Clerk, scopes to `users/<userId>/projects/<projectId>/<nanoid>.<ext>`, 10 MB cap, PNG/JPEG/WEBP only. Sidesteps the bucket-CORS dependency entirely.

The existing `/api/upload` (presigned PUT) stays in place — CaptureDropzone still uses it; when R2 CORS is configured operator-side, both paths become reliable.

#### Studio upload flow (`components/studio/StudioClient.tsx`)

1. `URL.createObjectURL` → optimistic local blob URL; panel marked `screenshotUrl=blob, screenshotRemote=false`. Readiness shows `screenshot-uploading`.
2. POST file to `/api/upload/direct` same-origin (no CORS).
3. Server PUTs to R2, returns durable `https:` `publicUrl`.
4. Swap blob → `publicUrl`, flip `screenshotRemote=true`. Autosave persists the durable URL into `polotnoJson.studio.panels[].screenshotUrl`.
5. On reload, server re-hydrates with the durable URL intact; panel is still ● READY.

Race-safe: swap step verifies `panel.screenshotUrl === localUrl` so a stale completion can't overwrite a newer upload. On failure: keep the blob URL so the user can still design in-session, but never claim ready; surface error inline with a "Click to retry" affordance.

Per-panel upload state surfaces under the dropzone with distinct copy for idle / uploading / persisted / error.

#### Readiness rule tightened (`lib/studio/readiness.ts`)

A panel is now ready only when `screenshotRemote === true`. Three observable screenshot states:

| Panel state | Readiness issue |
|---|---|
| no URL | `no-screenshot` |
| URL + `remote=false` (blob or in-flight) | `screenshot-uploading` |
| URL + `remote=true` | ready (subject to headline) |

This is the canonical "blob-only does NOT count as ready" rule. A hypothetical https URL with `remote=false` would also be flagged uploading — readiness is bound to the flag, not URL sniffing.

### Files touched

```
A  app/api/upload/direct/route.ts        (server-side proxied PUT)
A  e2e/fixtures/iphone-69.png            (1290×2796 PNG test fixture)
A  e2e/studio-upload-persistence.spec.ts (2 specs)
M  components/studio/StudioClient.tsx    (onUpload → /api/upload/direct)
M  lib/studio/readiness.ts               (require remote=true)
M  tests/studio/readiness.test.ts        (new persistence-rule specs)
```

### Verification (all green, on commit `22fac24`)

```
pnpm typecheck   → clean
pnpm test        → 173 passed across 17 files
pnpm test:e2e    → 11 / 11 passed
                     - 2 new studio-upload-persistence
                     - 4 export-readiness     (cycle #2)
                     - 3 studio-device-switch (cycle #1)
                     - 2 wizard
pnpm build       → clean
git push         → bbaea49..22fac24 main -> main
```

### Acceptance-criteria status (brief's six bullets)

1. ✅ Uploading produces a durable remote URL (R2 public URL), not just a blob.
2. ✅ After autosave + reload, screenshot is still present.
3. ✅ Filmstrip/panel readiness stays READY after reload (e2e verifies via `data-panel-ready="true"`).
4. ✅ `Export current` / `Export all` only enable when `screenshotRemote=true`.
5. ✅ No temporary state claims ready unless screenshot survives reload (rule + tests pin this).
6. ✅ Automated coverage for upload → save → reload via the new e2e spec, including the `/exports` cross-surface assertion that the same project shows `data-readiness-status="ready"` after the round-trip.

### Blockers

- **R2 bucket CORS config** — operator-side. Cloudflare R2 bucket `shotshq-exports` has no CORS rule, so the browser-direct presigned-PUT path (`/api/upload`) is blocked by preflight. Today the server-side proxy at `/api/upload/direct` is the path Studio uses; the existing `/api/upload` remains for CaptureDropzone but its browser PUT is broken until CORS lands. Recommended rule (set via Cloudflare R2 dashboard or `aws s3api put-bucket-cors`):
  ```json
  [{
    "AllowedOrigins": ["https://shotshq.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders":  ["ETag"],
    "MaxAgeSeconds":  3600
  }]
  ```
  Once configured, CaptureDropzone's existing presign path will start working in the browser, and Studio could optionally migrate back to presigned PUTs (better for big files; the 10 MB proxy cap is conservative).

- **Clerk live-key swap in Vercel production env** — carried forward from cycle #1.

### Highest-priority next target

Two strong candidates:

1. **Verify Studio export actually renders the persisted screenshot.** The persistence loop is now solid, but the `html-to-image` export path crops the panel including the remote `<img>`. We need to confirm:
   - The remote URL loads with `crossOrigin="anonymous"` (DeviceFrame.tsx sets this).
   - R2 returns proper CORS headers for the GET (separate from the PUT-preflight issue — public R2 URLs typically do return `Access-Control-Allow-Origin: *`, but worth confirming with the `Export current` button after upload).
   - The exported PNG matches the expected dim (1290×2796 etc.) — `measurePng` in the export log will say so.
   This is a 30-min browser smoke; if it works, ship the v0.10 changelog entry. If it doesn't, R2 likely needs `image/*` GET CORS too.

2. **CaptureDropzone parity.** CaptureDropzone (in `/projects/new` Step 3) still uses the presign + browser PUT path that's broken by missing R2 CORS. Either:
   - (a) Make CaptureDropzone use `/api/upload/direct` too (consistent, works today).
   - (b) Wait for the operator R2 CORS swap (cleaner, still presigned).
   Decision depends on operator timeline.

### Next BrowserOS prompt (paste verbatim next hour)

```
Continue the overnight loop in /Volumes/NVME EXT/Ivan/CODEX/ShotsHQ.
Read docs/ops/overnight-browseros-loop.md (operating rules) and the
top entry of docs/ops/overnight-browseros-status.md (latest cycle —
yours).

Focus for this cycle: verify Studio's full export loop now that
upload persistence is real. Specifically:

 1. On /projects/new, create a fresh project. Open Studio.
 2. Upload a real screenshot (any PNG/JPG; iPhone-aspect preferred).
 3. Confirm: panel flips to ● READY, screenshot persisted indicator
    shows "Screenshot persisted — survives reload", Export current
    button enables.
 4. Click Export current. A PNG should download to your Downloads
    folder named like `01_iphone_69_<projectslug>.png`.
 5. The Studio "Last export run" log should show "Exact" with
    "Expected 1290×2796 · got 1290×2796".
 6. Verify the downloaded PNG actually contains the uploaded screen-
    shot rendered into the device frame at exact dims.

If any step fails, that's the cycle's bug to fix. The most-likely
break-points:
  - The remote R2 GET might trigger a CORS-tainted canvas, making
    toDataURL throw. DeviceFrame.tsx already sets crossOrigin=
    "anonymous" for remote URLs; R2 public URLs should serve with
    Access-Control-Allow-Origin: * by default, but worth checking
    network response headers in DevTools.
  - The pixelRatio scaling in export.ts could mismatch the actual
    pixel output; the "Last export run" log will show the actual
    dim vs expected.

If the full upload → export loop works end-to-end, write a v0.10
changelog entry catching the public changelog up (it stops at v0.7;
v0.8 was the audit batch, v0.9 was the Studio engine + persistence).

If the export is broken, fix it as the cycle's task. Patterns to
match: same data-* attributes for testability, e2e spec that
asserts the exported PNG dim matches expected.

Treat the repo + git state as truth. Update docs/ops/overnight-
browseros-status.md with timestamp + what shipped + verification +
blockers + next target + next prompt before stopping. Reply with a
concise ship report.
```

---

## 2026-05-23 05:05 AEST · cycle #2

### What shipped this cycle

**`fix(export): truthful readiness funnel — Studio + /exports share one model`** (commit `37344fb`, pushed to `origin/main`).

The entire ship/export funnel was lying. Live browser QA caught:

- Fresh project with zero uploaded screenshots claimed `EXPORT READY` in Studio's "Export" InfoCell.
- `Export current` + `Export all` buttons were enabled.
- Clicking them produced no visible result (the export pipeline rendered an empty StudioPanel and silently no-op'd).
- `/projects/[id]/exports` independently showed `Render now — coming soon` with disabled bundle downloads and `Render history 0 entries`.
- **Two surfaces, two different lies, no shared truth.**

Fix: single-source readiness model + truthful gating across both surfaces.

#### New module: `lib/studio/readiness.ts`

Pure reducer (no React, no DOM, no DB):

```ts
evaluatePanel(panel)        → { ready, issues[] }
evaluateStudio(set)         → { fullyReady, exportable, perPanel[], readyPanels, totalPanels }
evaluatePanelById(set, id)
statusOf(readiness)         → "empty" | "blocked" | "partial" | "ready"
statusLabel(status)
statusHelp(readiness)
describeIssues(issues)      → "missing app screenshot" / "missing headline"
```

A panel is ready when it has a non-blank headline AND an uploaded screenshot (blob: or https). A project is `exportable` when at least one panel is ready; `fullyReady` when every panel is ready. Both Studio and `/exports` derive their UI state from these calls — no drift.

#### Studio changes (`components/studio/StudioClient.tsx`)

- **Export current** disabled unless the active panel is ready. Title attribute names the missing pieces.
- **Export all** disabled unless `≥1` panel is ready. Label switches between `"Export all (N)"` (fully ready) and `"Export ready (X/N)"` (partial).
- **Export InfoCell** value now shows `Empty / Blocked / Partial / Ready` from the live reducer instead of the hardcoded `"Ready"` lie.
- **Readiness callout** above the export controls when not fully ready, per-panel checklist with specific blockers.
- **Filmstrip tiles** badge each panel `● READY` (green) / `○ DRAFT` (muted), `data-panel-ready="true|false"` for tests.
- **Defense-in-depth** in `exportCurrent` / `exportAll` handlers: if a blocked panel is somehow dispatched (DevTools strips `disabled`), the run records a `Blocked` row in the log with the missing-pieces reason instead of silently no-opping. `exportAll` SKIPS unready panels (records them) instead of failing the whole batch.

#### `/exports` page changes (`app/(app)/projects/[id]/exports/page.tsx`)

- **Header readiness card** (new) — status pill `Blocked/Partial/Ready` with `X/N` panel counts, derived from the same `evaluateStudio` Studio uses. `data-readiness-status` attribute matches across surfaces.
- **Primary CTA** replaces dead-end `Render now — coming soon` with:
  - not-ready → `Prepare in Studio` (links to `/studio`)
  - ready → `Open Studio to export` (accent variant)
- **ASC button** stays disabled but relabeled `ASC · v1.1` with a truthful title naming the v1.1 server-render queue.
- **Per-panel checklist section** shown when blocked/partial.
- **Per-device cards**: hardcoded `FRAMES 0` replaced with real `PANELS X / READY Y` counts. Download buttons replaced with `Export in Studio` / `Prepare in Studio` / `Not targeted` based on real state.
- **Render history** copy: clarifies that browser exports land in Downloads (not here yet); server queue is v1.1.

### Files touched

```
M  app/(app)/projects/[id]/exports/page.tsx
M  components/studio/StudioClient.tsx
A  e2e/export-readiness.spec.ts         (4 specs)
A  lib/studio/readiness.ts              (pure reducer)
A  tests/studio/readiness.test.ts       (18 specs)
```

### Verification (all green, on commit `37344fb`)

```
pnpm typecheck   → clean
pnpm test        → 172 passed across 17 files (+18 readiness)
pnpm test:e2e    → 9 / 9 passed
                     - 4 new export-readiness specs
                     - 3 studio device-switch (from cycle #1)
                     - 2 wizard
pnpm build       → clean
git push         → 7fef40a..37344fb main -> main
```

### Acceptance-criteria status (audit's six bullets)

1. ✅ Fresh/empty projects never claim `EXPORT READY` — Studio shows `Blocked` from `statusOf()`; `/exports` shows the same.
2. ✅ Export CTAs are consistent — both surfaces gate on the same reducer; `data-readiness-status` matches.
3. ✅ Clicking export on empty/ineligible project: disabled-button title names the blockers; if forced (DevTools), handler returns a `Blocked` log row with reason. No silent no-op or fake `Exporting…`.
4. ✅ `/exports` reflects readiness truthfully — primary render CTA replaced with `Prepare in Studio` / `Open Studio to export`, per-device cards show real `PANELS X / READY Y` counts.
5. ✅ Honest interim flow shipped — readiness checklist, upload requirement copy, target/frame counts, disabled-CTA copy that names what remains.
6. ✅ Tests cover empty-state gating + Studio↔Exports consistency on live routes (4 e2e specs).

### Blockers

None code-side. Two operator items still carried forward from prior cycles (neither blocks this cycle's fix):

- **Clerk live-key swap in Vercel production env** (`pk_test_*` → `pk_live_*`, `sk_test_*` → `sk_live_*`). Strict-by-default guardrail is in `next.config.ts`; production needs the env-var swap.
- **Server-authoritative render queue + R2 streaming** (v1.1 work). Today's exports are browser-side from Studio and land in the user's Downloads folder. The header copy + render-history surface are now honest about this; when the v1.1 backend ships, both surfaces light up at the same gate.

### Highest-priority next target

A few candidates, in roughly decreasing leverage:

1. **Screenshot upload persistence audit.** The readiness model accepts `blob:` URLs as ready, but blob URLs are browser-local and don't survive a reload. Studio currently uploads to a blob URL (`onUpload`); the screenshot is sanitized off-disk on save. So after autosave + reload, a "ready" panel becomes "not-ready" again. Confirm in browser, then either (a) wire blob upload into the existing `/api/upload` + R2 path (Capture v1.1 already has presigned PUT route), or (b) make readiness gate on `screenshotRemote === true` so partial states are honest. Likely (a) is the right fix — Studio should upload to R2 on drop, mirror back the URL, and readiness flips to `true` only when remote.

2. **Studio's other control groups (Frame style / Theme preset / Layout / Background mode).** Same shape as the device-class fix in cycle #1: subtle visual cues, no `aria-pressed` / `data-active`. BrowserOS should verify each, and if any are lying, apply the same fix pattern.

3. **`/docs/editor` content still describes the retired Fabric editor** (`⌘ S manual save`, `⌘ E export`, `⌘ Z undo` — none of which Studio implements). FAQ + CTA marketing copy similarly stale. Coordinated honesty pass after the Studio pivot.

### Next BrowserOS prompt (paste verbatim next hour)

```
Continue the overnight loop in /Volumes/NVME EXT/Ivan/CODEX/ShotsHQ.
Read docs/ops/overnight-browseros-loop.md (operating rules) and
docs/ops/overnight-browseros-status.md (latest cycle handoff — yours).

Focus for this cycle: verify and fix Studio's screenshot-upload
persistence. The cycle-#2 readiness model treats blob: URLs as
ready, but blob URLs are browser-local. Verify in browser:

 1. Create a fresh project via /projects/new, open Studio.
 2. Upload a real PNG/JPG screenshot to Panel 01.
 3. Confirm Studio flips that panel to ● READY and enables the
    Export current button.
 4. Wait for the autosave indicator to show "Saved".
 5. Reload the page.
 6. Check: is the panel still ● READY after reload? Or did it
    revert to ○ DRAFT?

If the panel reverts (likely — sanitizeStudioDesign strips blob URLs
on save), the readiness signal is lying about persistence. Fix it by
either:
  (a) Wire the Studio upload through the existing /api/upload
      presign + R2 PUT path (Capture v1.1's /api/screenshots/register
      shows the pattern). On upload, immediately PUT to R2 and
      replace the blob URL with the remote https URL. The
      screenshotRemote flag flips to true; readiness survives reload.
  (b) Make readiness require screenshotRemote === true (more
      restrictive — panels with blob-only screenshots are NOT
      considered ready, since they'd vanish on reload anyway). This
      keeps the lie out but doesn't deliver the upload promise yet.

(a) is the real fix. (b) is the honest interim if (a) is bigger
than one cycle.

Add e2e coverage: upload a screenshot fixture via setInputFiles,
wait for Saved, reload, assert the panel is still data-panel-ready=
"true". Add a unit test for the readiness rule if (b) is chosen.

Re-run pnpm typecheck / pnpm test / pnpm test:e2e / pnpm build,
update docs/ops/overnight-browseros-status.md with timestamp +
what shipped + verification + blockers + next target + the next
prompt, then reply with a concise ship report.

Treat the repo + git state as truth. Don't trust session memory.
```

---

## 2026-05-23 04:10 AEST · cycle #1

### What shipped this cycle

**`fix(studio): device-class switch — unambiguous selected state + reducer + tests`** (commit `0114147`, pushed to `origin/main`).

The browser-audit finding ("clicking iPhone 6.7" or iPad 13" leaves iPhone 6.9" visually selected; preview header + filmstrip stuck") was a visual-ambiguity bug, not a state bug. The underlying React state was updating correctly, but the active/inactive styling pair was indistinguishable in practice — the inactive class even contained the substring `border-[var(--accent)]` via its `hover:` variant.

Fix had three components:

1. **Unambiguous selected state on Studio device buttons.** Added `aria-checked` + `aria-pressed` + `data-device-id` + `data-active` + `role="radio"`/`role="radiogroup"`. Active state now also flips text color to `var(--accent)` — doubles the visual contrast from the border-only cue, no longer relies on subtle bg-color changes. A11y + tests + sighted users all win.

2. **Extracted the device-switch logic to a pure reducer** (`lib/studio/device-switch.ts`). `applyDeviceToPanel` + `applyDeviceToActivePanel` are pure functions; the Studio React shell now routes its click handler through the reducer instead of duplicating the logic inline. Frame compatibility (iPhone-only frame → iPad default; cross-family `frameless` survives) is enforced inside the reducer.

3. **Test coverage that proves the contract**:
   - 12 unit specs in `tests/studio/device-switch.test.ts` (reducer behavior: no-op identity, frame compat across all four directions, panel-state preservation, active-panel-only mutation, missing-activePanelId handling, reference-change for React diffing).
   - 3 Playwright specs in `e2e/studio-device-switch.spec.ts`: click updates selected styling + preview header; filmstrip + preview reflect chosen device; **selection persists across page reload** (the acceptance-criteria #4 scenario).
   - Updated `e2e/wizard.spec.ts` assertion from "Open editor" to "Open studio" to sync with the wizard CTA the Studio pivot renamed.

### Verification (cycle #1)

```
pnpm typecheck   → clean
pnpm test        → 154 passed across 16 files (12 new in studio/device-switch)
pnpm test:e2e    → 5 / 5 passed (3 new Studio specs + 2 existing wizard)
pnpm build       → clean
git push         → 09068fc..0114147 main -> main
```

### Historical note for future cycles

The Studio pivot left a few user-facing copy surfaces still describing the old Fabric editor (`/docs/editor` keyboard shortcuts that Studio doesn't implement; FAQ "drag/swap layers" overpromise; CTA "unlimited editor" → should be "unlimited Studio"; Roadmap line 47 "in the editor"; Changelog stops at v0.7 while v0.8 audit batch and v0.9 Studio engine are unwritten). Identified during cycle #1's audit pass but **deprioritized** when the device-switch bug surfaced. Remains a coordinated honesty-pass candidate.
