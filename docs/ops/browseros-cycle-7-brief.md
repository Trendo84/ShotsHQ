# BrowserOS cycle #7 brief — eliminate authenticated-app hydration mismatches

Work in `/Volumes/NVME EXT/Ivan/CODEX/ShotsHQ`.

## What BrowserOS verified this cycle

### Local app/browser state
- Local dev app is reachable at `http://localhost:3000` with the internal bypasses active.
- `/projects` now shows truthful readiness counts and READY/DRAFT badges on real data.
- The export loop thread in Claude appears to have progressed past the stale-server issue and identified a broader next blocker.

### Highest-priority current gap
A pervasive hydration mismatch is still affecting the authenticated app shell across major routes.

#### Concrete evidence observed in the browser / Claude thread
- `/dashboard`
- `/projects`
- `/projects/new`
- `/projects/[id]/studio`
- `/billing`
- `/settings`

All of the above are implicated in repeated hydration mismatch errors, and the stack points to the shared authenticated chrome — especially `components/app/Topbar.tsx` around the Clerk user control / `UserButton` / `ClerkHostRenderer` area.

This is now higher priority than smaller UX polish because it undermines the whole authenticated shell, causes noisy dev/runtime instability, and risks masking real regressions.

## Task for this cycle
Fix the authenticated-app hydration mismatch end-to-end, prioritizing the real SSR/client consistency issue over suppression hacks.

### Scope
Start with `components/app/Topbar.tsx` and any directly-related wrapper/helpers used by:
- the user/account control
- theme switcher state
- notification stub
- any client-only timestamp/status/rendered values in the shared app shell

### What to look for
Common likely causes in this codebase shape:
- server-rendered markup differing from client-rendered Clerk user control output
- rendering `UserButton` or related Clerk UI in a way that differs before/after mount
- using time-dependent, random, browser-only, or auth-only values in SSR markup
- topbar content that depends on client-only theme/mount state without a stable server fallback
- conditional branches that differ between server and client for the same route

## Acceptance criteria
1. Visiting `/dashboard`, `/projects`, `/projects/new`, `/projects/[id]/studio`, `/billing`, and `/settings` produces **zero hydration mismatch errors** in browser console and Next dev logs.
2. `components/app/Topbar.tsx` still preserves layout and behavior:
   - theme switcher works
   - notifications placeholder remains intact
   - user/account control still works
3. No client-only `mounted` workaround should cause major layout jump or remove essential shell actions until after hydration.
4. If Clerk UI must be client-only, implement it in a deliberate isolated boundary that keeps server and client markup stable.
5. Re-run the fastest meaningful verification for the touched shell routes, then the standard gates.

## Required verification
At minimum run:
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Also do a browser smoke across:
- `/dashboard`
- `/projects`
- `/projects/new`
- one ready project `/studio`
- `/billing`
- `/settings`

and confirm hydration mismatch errors are gone from console/dev logs.

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
