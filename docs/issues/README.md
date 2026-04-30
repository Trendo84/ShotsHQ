# Pre-cut issues

Markdown drafts for follow-up GitHub issues that don't have a tracker
yet. Each file is **ready to paste** into a new issue body — title goes
in the GitHub form, body is the file's contents below the H1.

## Why these exist as files

The plan that produced these followed a strict scope discipline: the
TODO comments in code (`components/editor/RightPanel.tsx`,
`e2e/wizard.spec.ts`, `CLAUDE.md`) point at v1.1 work that's been
designed but not yet executed. Code comments rot in isolation —
issues are how that work survives a context reset / new contributor.

These drafts live in git so the design context is captured **now**,
without depending on a synchronous "open three GitHub issues" step.
Once `gh` is auth'd locally (`gh auth login`), each file becomes a
30-second `gh issue create` away from a real issue.

## Open issue checklist

Run from the repo root with `gh` authenticated:

```bash
gh issue create \
  --title "v1.1: multi-frame canvas schema" \
  --label "v1.1" --label "schema" \
  --body-file docs/issues/v1.1-multi-frame-canvas.md

gh issue create \
  --title "v1.1: export-only bezel overlay" \
  --label "v1.1" --label "render" \
  --body-file docs/issues/v1.1-export-only-bezel-overlay.md

gh issue create \
  --title "v1.1: Playwright auth bypass" \
  --label "v1.1" --label "tests" \
  --body-file docs/issues/v1.1-playwright-auth-bypass.md
```

Once issues are open, optionally:

1. Update the in-code TODO refs to point at the live GitHub URLs
   instead of the file paths. Files affected:
   - `components/editor/RightPanel.tsx` (multi-frame TODO)
   - `e2e/wizard.spec.ts` (auth-bypass TODO)
   - `CLAUDE.md` "Editor canvas model" (bezel-overlay reference)

2. Delete this `docs/issues/` directory once all three issues are
   live — the markdown drafts will then be redundant. Or leave them
   as architectural decision records (ADR-style) — they're more
   detailed than typical issue bodies and have value as repo
   documentation.

## Lifecycle

| State | Where it lives |
|---|---|
| **Designed, not tracked** | This folder. |
| **Open issue** | GitHub. Update code TODO refs to point at the issue URL. Delete or keep the file as ADR. |
| **In progress** | GitHub issue assigned. Code TODO refs unchanged. |
| **Shipped** | Close the issue. Update CLAUDE.md "Editor canvas model" section as needed. Remove TODO refs in code. |
