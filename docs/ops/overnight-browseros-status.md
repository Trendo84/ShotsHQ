# ShotsHQ overnight BrowserOS status

## 2026-05-23 04:10 AEST · cycle #1

### What shipped this cycle

**`fix(studio): device-class switch — unambiguous selected state + reducer + tests`** (commit `0114147`, pushed to `origin/main`).

The browser-audit finding ("clicking iPhone 6.7" or iPad 13" leaves iPhone 6.9" visually selected; preview header + filmstrip stuck") was a visual-ambiguity bug, not a state bug. The underlying React state was updating correctly, but the active/inactive styling pair was indistinguishable in practice — the inactive class even contained the substring `border-[var(--accent)]` via its `hover:` variant.

Fix had three components:

1. **Unambiguous selected state on Studio device buttons.** Added `aria-checked` + `aria-pressed` + `data-device-id` + `data-active` + `role="radio"`/`role="radiogroup"`. Active state now also flips text color to `var(--accent)` — doubles the visual contrast from the border-only cue, no longer relies on subtle bg-color changes. A11y + tests + sighted users all win.

2. **Extracted the device-switch logic to a pure reducer** (`lib/studio/device-switch.ts`). `applyDeviceToPanel` + `applyDeviceToActivePanel` are pure functions; the Studio React shell now routes its click handler through the reducer instead of duplicating the logic inline. Frame compatibility (iPhone-only frame → iPad default; cross-family `frameless` survives) is enforced inside the reducer.

3. **Test coverage that proves the contract**:
   - 12 unit specs in `tests/studio/device-switch.test.ts` (reducer behavior: no-op identity, frame compat across all four directions, panel-state preservation, active-panel-only mutation, missing-activePanelId handling, reference-change for React diffing).
   - 3 Playwright specs in `e2e/studio-device-switch.spec.ts`: click updates selected styling + preview header; filmstrip + preview reflect chosen device; **selection persists across page reload via autosave** (the acceptance-criteria #4 scenario).
   - Updated `e2e/wizard.spec.ts` assertion from "Open editor" to "Open studio" to sync with the wizard CTA the Studio pivot renamed (no functional change, just kept e2e in lockstep with shipped UI).

### Files touched

```
M  components/studio/StudioClient.tsx     (aria/data attrs + reducer wiring + active text-color)
M  e2e/wizard.spec.ts                     (rename assertion: Open editor → Open studio)
A  e2e/studio-device-switch.spec.ts       (3 specs)
A  lib/studio/device-switch.ts            (pure reducer)
A  tests/studio/device-switch.test.ts     (12 specs)
```

### Verification (all green, on commit `0114147`)

```
pnpm typecheck   → clean
pnpm test        → 154 passed across 16 files (12 new in studio/device-switch)
pnpm test:e2e    → 5 / 5 passed (3 new Studio specs + 2 existing wizard)
pnpm build       → clean
git push         → 09068fc..0114147 main -> main
```

### Acceptance criteria status

1. ✅ Clicking any Device class option immediately updates selected styling (verified via e2e + `data-active` toggle).
2. ✅ Preview/export contract text updates to chosen dims/device (e2e asserts `2064×2752` + `iPad 13` after iPad click).
3. ✅ Filmstrip metadata updates to chosen device (e2e asserts `iPad 13` text appears in filmstrip).
4. ✅ Panel state persists through save/reload (dedicated e2e spec: switch → wait for `Saved` indicator → `page.reload()` → assert `data-active="true"` still on iPad).
5. ✅ Frame compatibility enforced when switching devices (4 unit specs cover all four direction-pairs + cross-family survival).
6. ✅ Tests cover Studio device switching, not the retired Fabric editor.

### Blockers

None code-side. Two operator items still pending from prior cycles (carried forward, neither affects this cycle's fix):

- **Clerk live-key swap in Vercel production env** (`pk_test_*` → `pk_live_*`, `sk_test_*` → `sk_live_*`). The repo-side guardrail in `next.config.ts` is strict-by-default; production needs an operator to do the env-var swap.
- **Real status page** — `/docs/status` is honest static copy; backing it with a real surface (Statuspage / Better Stack or a self-hosted board over `/api/health`) is a deploy-side decision.

### Highest-priority next target (for the next BrowserOS hour)

Two strong candidates, in priority order:

1. **Studio frame-style + theme switching** — same risk profile as device-class: stateful selector groups with subtle visual cues. If browser verification finds another "click but no change" surface (Frame style buttons, Theme preset buttons, Layout buttons, or the Background mode toggles), the same fix pattern applies: `aria-pressed` + `data-active` + active text-color flip. BrowserOS should specifically verify each of those control groups by clicking through and watching for *both* the panel re-render *and* the persisted state surviving a reload.

2. **Studio bulk-export `Export all (N)` button** — clicking should download N PNGs sequentially. BrowserOS should verify the file count actually matches `studio.panels.length` and that the last-export-run log shows N "Exact" rows.

3. **Surfaces `Render all` honesty** — verified honestly disabled at yesterday's audit; should be re-checked to confirm no regressed-to-active state ships during the homepage refactor cycle.

### Next BrowserOS prompt (paste verbatim next hour)

```
Continue the overnight loop in /Volumes/NVME EXT/Ivan/CODEX/ShotsHQ.
Read docs/ops/overnight-browseros-loop.md (operating rules) and
docs/ops/overnight-browseros-status.md (the latest cycle handoff —
yours).

Focus for this cycle: verify Studio's *other* control groups behave
the same as device-class now does. Specifically:

 1. On /projects/{any-existing-id}/studio, click through Frame style,
    Theme preset, Layout, Background mode, Align, Font tone in turn.
    For each group, after click: (a) the active styling must move to
    the clicked option, (b) the preview node must visibly reflect
    the change. Note any that fail — same UI-lie shape as the device-
    class bug fixed in commit 0114147.

 2. Verify Studio's Export current and Export all buttons. Export
    current should download exactly one PNG matching activeDevice's
    dimensions. Export all should download studio.panels.length PNGs
    in order, with the last-export-run log showing N "Exact" rows.

 3. Verify the headline / subhead / size slider inputs persist
    through reload (autosave round-trip — same path Studio device
    persistence uses, tested in e2e/studio-device-switch.spec.ts).

If any control-group lie is found, fix it using the same pattern as
commit 0114147: aria-checked / aria-pressed / data-active markers,
active text-color contrast, and a pure reducer in lib/studio/ +
matching unit + e2e specs. Re-run pnpm typecheck / pnpm test /
pnpm test:e2e / pnpm build and confirm 5+ e2e green.

If nothing's lying, pivot to the highest-leverage user-visible gap
you can fully land in one cycle: candidates per the brief priority
order include real export honesty on the Surfaces "Render all"
button (verify still disabled, no regression), or wiring the
existing /docs/editor entry to point at /docs/studio with content
that matches Studio reality (current entry still says "Canvas
editor / ⌘S / ⌘E / ⌘Z" — those shortcuts don't exist in Studio).

Treat the repo + git state as truth. Don't trust session memory.
Update docs/ops/overnight-browseros-status.md with timestamp, what
shipped, verification, blockers, next target, and the next prompt
before stopping. Reply in chat with a concise ship report.
```

### Historical note for future cycles

The Studio pivot left a few user-facing copy surfaces still describing the old Fabric editor (`/docs/editor` keyboard shortcuts that Studio doesn't implement; FAQ "drag/swap layers" overpromise; CTA "unlimited editor" → should be "unlimited Studio"; Roadmap line 47 "in the editor"; Changelog stops at v0.7 while v0.8 audit batch and v0.9 Studio engine are unwritten). These were identified during this cycle's audit pass but **deprioritized** when the user pivoted to the higher-impact device-switch bug. They remain a coordinated honesty-pass candidate for a future cycle if no broken core flow trumps them.
