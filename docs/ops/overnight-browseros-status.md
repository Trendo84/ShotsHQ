# ShotsHQ overnight BrowserOS status

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
