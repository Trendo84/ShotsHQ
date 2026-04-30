# Conventions for `docs/issues/`

This folder holds **pre-cut issue drafts** — markdown bodies for GitHub
issues that haven't been opened yet, plus architectural decision records
for follow-up work that's been designed but not executed.

These conventions exist so the folder stays consistent as v1.2, v2,
etc. work accrues. Don't deviate without updating this file first.

## When to add a file here

Capture work as `docs/issues/*.md` instead of an inline `// TODO`
comment whenever the follow-up has more than two of these:

- A schema sketch that's longer than three lines
- A migration path that needs to be thought through
- More than one file touch point
- A test plan that isn't obvious from the change itself
- A "why not the other obvious approach" rationale worth preserving
- Cross-cutting impact (auth, billing, render pipeline, theme)

If it's a one-line cleanup ("rename this var", "delete this dead
import"), inline `// TODO` is fine.

## Naming

```
docs/issues/<milestone>-<kebab-case-title>.md
```

- `<milestone>` is the target version (`v1.1`, `v1.2`, `v2`) or
  `next` for "soon, no version assigned yet". Prefix locks the file
  to a horizon so the folder sorts by ship target.
- `<kebab-case-title>` is the GitHub issue title minus the milestone.
  Match exactly what the issue would be titled — makes the eventual
  `gh issue create --title "<milestone>: <Title>"` mechanical.

Examples:

| File | Issue title |
|---|---|
| `v1.1-multi-frame-canvas.md` | v1.1: multi-frame canvas schema |
| `v1.1-playwright-auth-bypass.md` | v1.1: Playwright auth bypass |
| `next-gpt5-prompt-cache-key.md` | next: GPT-5 prompt cache key |

## Required sections

Every file under this folder must have, in order:

1. **`# Title`** — H1 matches the GitHub issue title (minus milestone
   prefix is fine).
2. **Status header** — block-quoted line near the top:
   ```md
   > **Status:** Captured YYYY-MM-DD · Not yet opened on GitHub · See [README.md](./README.md)
   ```
   When you fire `gh issue create`, swap that for:
   ```md
   > **Status:** Tracking on GitHub: https://github.com/<owner>/<repo>/issues/N
   ```
   Anyone reading the file in 6 months knows whether the markdown is
   the source of truth or a stale snapshot.
3. **Related** — block-quoted line listing related issue files (or
   live GitHub URLs once those exist). At minimum: every `v1.1-*` file
   should cross-link the others if there's any chance of joint
   sequencing. When ambiguous, cross-link.
4. **`## Why`** — the problem, in plain English. What forced this
   issue's creation. One paragraph, ideally.
5. **`## What`** — the proposed change. Schema sketches, code
   snippets, file structure are welcome here.
6. **`## Touch points`** — every file path that will be modified,
   with a one-line reason. This is the section reviewers reach for
   first when scoping the work.
7. **`## Tests`** — what regression coverage looks like. Vitest for
   logic, Playwright for behavior, manual smoke for UI presentation.
8. **`## Done when`** — checkbox list. Each item must be observable
   (passes a test, ships a route, deletes a file).

Optional sections (use when relevant):

- **`## Risk`** — what could go wrong, and the mitigation. Required
  for anything touching auth, billing, or production env vars.
- **`## Out of scope`** — explicit non-goals. Stops scope creep.
- **`## Migration`** — schema/data changes. Required if a JSONB
  column or DB schema is touched.
- **`## Tracking refs in code`** — line numbers + file paths where
  in-code TODO comments reference this issue. Lets you find them when
  the issue ships and the comments need cleanup.
- **`## Future work`** — what becomes possible once this lands.
  Distinct from "out of scope" — out-of-scope is "we considered and
  rejected"; future work is "we considered and deferred".

## Lifecycle

| State | Where it lives | What to do |
|---|---|---|
| **Designed, not tracked** | This folder. Status: "Captured YYYY-MM-DD · Not yet opened on GitHub". | Nothing. Markdown is the source of truth. |
| **Open issue** | GitHub. File still exists. | Update Status line to point at the GitHub URL. Update in-code TODO refs from file paths to issue numbers. |
| **In progress** | GitHub. File still exists. | Don't keep editing the markdown — discussion lives on GitHub. The file is now a snapshot of original design. |
| **Shipped** | File stays in place, status line updated to point at the implementing commit. | Status line: `Shipped in vX.Y · superseded by <commit-sha>` (e.g. `Shipped in v1.1 · superseded by 9238463`). Remove in-code TODO refs. Update CLAUDE.md if architectural invariants changed. **Don't delete the file** — the markdown becomes the permanent design record of what was decided and why, which survives long after the GitHub issue archive and even the implementing commit's diff stops being readable. Same logic as ADRs being immutable once accepted: you supersede, you don't edit. |
| **Superseded** | File still exists, marked superseded by another design. | Status line: `Superseded by <new-file>.md on YYYY-MM-DD`. Don't delete — the rationale is still useful for "why we changed direction". |

## In-code TODO refs

In-code comments that reference `docs/issues/*.md` should:

- Use the file path, NOT the future GitHub URL: `docs/issues/v1.1-foo.md`.
  When the issue is opened, do a single sweep to update those refs to
  the live URL or issue number.
- Keep one source-of-truth file per concern. If the same TODO appears
  in three places, all three should point at the same `docs/issues/*.md`.

Example (good):

```ts
// TODO(v1.1): drive FRAMES from real per-frame state.
// Tracked in `docs/issues/v1.1-multi-frame-canvas.md` —
// paste into a real GitHub issue when the project tracker is set up.
```

Example (avoid):

```ts
// TODO(v1.1): drive FRAMES from real per-frame state. Tracking issue:
//   https://github.com/Trendo84/ShotsHQ/issues/<frames-schema-v1.1>
```

The placeholder URL pattern is dead-link-shaped — better to point at
something that actually exists today (the file) and update once the
real URL exists.

## Why this folder exists at all

Captured during the editor-render-bug-fix pass on 2026-04-30. The
plan that produced the first three issue drafts in this folder is
itself in git history under commit `9238463` and the followups under
`42c3030` / this commit. The user's specific feedback:

> A GitHub issue is one `git remote remove origin` away from being
> orphaned. A markdown file in the repo is in every clone. Reviewable
> as part of code review. ADRs by another name. Idempotent migration
> to GitHub.

That captures the rationale better than this section can. Quoted in
full so anyone reading this in 12 months understands the why, not just
the what.

## Anti-patterns

- **Don't scatter inline `// TODO` comments for non-trivial follow-ups.**
  Anything matching the "When to add a file here" criteria above
  belongs in `docs/issues/*.md`, with the in-code comment pointing at
  the file. Inline TODOs accrete invisibly, never get found again, and
  rot in place as the surrounding code changes around them. Files in
  this folder show up in `git log`, get reviewed in PRs, and surface
  when someone greps for `v1.1`. Discipline lives at the boundary —
  the boundary is "is this two lines of context, or twenty?"
- **Don't open a GitHub issue without first writing the markdown.**
  The issue body is the markdown. Drafting in this folder forces the
  required sections (Status / Why / What / Touch points / Tests / Done
  when), gets reviewed in a PR, and produces a permanent design record
  in git regardless of what happens to the GitHub issue. Skipping the
  file step yields one-paragraph issue bodies that nobody reviews and
  that can't survive the issue tracker being deprecated, archived, or
  forked.
- **Don't open a real GitHub issue prematurely.** Open it only when:
  (a) you're starting work on it, (b) someone external needs to
  comment, or (c) you want it on a project board. Until then, the
  file is doing the job.
- **Don't let the folder accumulate stale "designed but probably
  won't ship" entries.** Delete or move to `docs/issues/superseded/`
  with a status line explaining why. Survival bias bloats the folder
  fast.
- **Don't write a one-paragraph file.** If the issue is small enough
  for one paragraph, it's small enough to be a `// TODO` line in
  code.
- **Don't edit a file after the work ships.** Mark it superseded
  (see Lifecycle above), don't rewrite history. Same logic as ADRs:
  immutable once accepted; you supersede, you don't edit.
- **Don't paste secrets, internal user data, or unverified
  third-party info into these files.** They're public (on GitHub
  once the repo is). Same hygiene as a public commit message.
