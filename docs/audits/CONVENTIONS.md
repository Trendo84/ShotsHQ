# Conventions for `docs/audits/`

This folder captures **audit reports + their triage outcomes** — sibling
to `docs/issues/`. Where `docs/issues/` is "follow-up work we've designed
but not opened on GitHub," `docs/audits/` is "external feedback received
+ what we did about it."

## Why this folder exists

Captured during the second audit-triage exchange on 2026-05-01. Audits
(reviewer reports, autonomous browse-and-report runs, stranger walk-
throughs) generate findings faster than they can be acted on. Code
comments rot; a Slack message disappears; a chat log doesn't survive a
context reset. A markdown file in git survives all three.

The user's specific framing:

> Comet + Sonnet doing autonomous browse-and-report is a workflow
> worth doing again. The feedback is more grounded than positioning
> critique because it surfaces behaviors — clicked X, expected Y, got Z
> — rather than aesthetic opinions. This is the kind of audit that
> catches the bugs your own dogfooding misses because you know the
> product too well to encounter them as a stranger would.

The Triage section is the part that gives this folder its compounding
value over time. You can grep for "Rejected — reasoning:" across audits
and find the pattern of feedback you keep declining — which tells you
something either about the audits or about your product.

## When to add a file here

Capture as `docs/audits/*.md` whenever:

- Someone external (or an autonomous agent) ran a structured review of
  the product and produced findings worth preserving.
- A review surfaced more than two distinct issues — single-issue
  feedback can live in a regular `docs/issues/` draft.
- The feedback is grounded in observed behavior (clicked X, expected Y,
  got Z) — not just aesthetic preference. Behaviors generate fixes;
  preferences generate threads.
- You expect to reference the findings later when prioritizing work, or
  to compare against future audits to see what recurs.

Skip the folder for: one-off bug reports, aesthetic preferences with
no behavioral grounding, internal team chat that didn't get structured
into a review.

## Naming

```
docs/audits/<YYYY-MM-DD>-<source>-<scope>.md
```

- `<YYYY-MM-DD>` is the audit date (when the review was conducted, not
  filed). Sorts naturally by recency.
- `<source>` is the reviewer identifier in lowercase: `comet-sonnet`,
  `internal-team`, `external-designer`, `user-feedback-batch`. Reuse
  identifiers across audits so it's easy to track recurring sources.
- `<scope>` is the surface area audited: `editor`, `marketing`,
  `pricing`, `full-site`, etc.

Examples:

| File | Source | Scope |
|---|---|---|
| `2026-04-30-comet-sonnet-editor.md` | Comet+Sonnet autonomous browse | Editor + adjacent |
| `2026-05-15-internal-team-pricing.md` | Internal review | Pricing surfaces |
| `2026-06-01-comet-sonnet-full-site.md` | Comet+Sonnet repeat | Whole site |

## Required sections

Every file under this folder must have, in order:

1. **`# Title`** — H1 in the form `<source>: <scope> audit · <date>`.
   Example: `# Comet+Sonnet: editor audit · 2026-04-30`.
2. **Status header** — block-quoted line near the top:
   ```md
   > **Status:** Captured YYYY-MM-DD · Triaged YYYY-MM-DD · Closed YYYY-MM-DD (commits abc123…def456)
   ```
   States: `Captured` (raw, untriaged) → `Triaged` (decisions made,
   commits in flight) → `Closed` (all triage outcomes shipped or
   formally deferred). When in transit, list the latest state plus the
   prior one for context.
3. **`## Source`** — who/what conducted the audit. For autonomous agents
   include model + tool (e.g. `Comet browser + Sonnet 4.5`). For human
   reviewers include role context (designer, indie dev, PM) but no PII
   if the audit is going public.
4. **`## Scope`** — what surfaces / pages / flows were exercised. Be
   explicit so future audits can be deliberately repeated or contrasted.
5. **`## Findings`** — list of items, each tagged with one of:
   - **`[Bug]`** — observable behavior that's wrong (silent failure,
     broken redirect, malformed render). Action: file as `docs/issues/`
     or fix in this triage.
   - **`[Confusion]`** — the product does the right thing but the user
     misread it. Action: copy fix, taxonomy clarification, doc update.
   - **`[UX]`** — the product works but creates friction. Action: ship
     a UX iteration; rarely a one-line fix.
   - **`[Strategic]`** — the feedback is about positioning, scope, or
     pricing direction. Action: discuss before any code change.

   Each finding has: short title, observed-behavior description, and
   the reviewer's proposed fix (verbatim if possible, paraphrased only
   for length).

6. **`## Triage`** — what was actually decided per finding. Three
   outcomes:
   - **Fixed in commit `<sha>`** — link to the implementing commit.
   - **Deferred to `docs/issues/<file>.md`** — link to the issue draft.
   - **Rejected — reasoning: …** — explicit. The reasoning trail is
     the most valuable part of the folder.

   When triage decisions get reversed (the rejected finding turns out
   to matter; the deferred work jumps the queue), update the Triage
   section by APPENDING — don't rewrite history. Use a sub-line:
   ```md
   - **Originally:** Rejected — reasoning: low conversion impact (2026-05-01)
   - **Updated 2026-06-12:** Fixed in commit abc123 after a second
     audit confirmed the same finding — see
     `2026-06-12-internal-team-marketing.md`.
   ```

Optional sections (use when relevant):

- **`## Diagnostic notes`** — investigation traces during triage that
  changed someone's mind (the example today: the audit reviewer flagged
  "credit cost contradiction" as a copy fix; cross-checking against
  `lib/utils/credits.ts` reframed it as a taxonomy gap). Preserve the
  reasoning trail — it's exactly the meta-information that's lost when
  you only capture the outcome.
- **`## Workflow notes`** — what worked and what didn't about the audit
  format itself. Recurring patterns inform how to structure the next
  audit. (Example: "Run the audit in a fresh incognito session next
  time so the reviewer hits onboarding rather than a power-user state.")
- **`## Cross-audit refs`** — links to other audits that share findings,
  so recurrence becomes visible.

## Lifecycle

| State | Where it lives | What to do |
|---|---|---|
| **Captured** | This folder. Raw findings, no triage yet. | Schedule a triage pass. Don't touch the audit text once captured — it's an external artifact. Triage decisions go in their own section. |
| **Triaged** | Same file. Triage section filled in. Commits in flight or queued. | Implement the Fixed-in-commit items. Open `docs/issues/` drafts for Deferred items. Document Rejected items with reasoning. |
| **Closed** | Same file. Status line updated, all triage outcomes resolved. | Don't delete. The closed audit is the historical record — useful for "we already considered this in May" arguments and for cross-audit recurrence detection. |
| **Superseded** | Same file. Status line marked superseded by a follow-up audit. | Append-only: don't rewrite the original audit; reference the newer one. |

## In-code refs

In-code TODO comments that reference audit findings should point at the
audit file path AND the specific finding:

```ts
// TODO: see docs/audits/2026-04-30-comet-sonnet-editor.md → finding #5
// (SOON badge density). Pattern 2 (collapsible v1.1 sections) is the
// next iteration; this file currently implements Pattern 1.
```

When the audit closes, in-code refs can stay — they're now historical
context, like a citation. Only remove if the entire feature changes
shape.

## Anti-patterns

- **Don't edit the captured findings after triage.** The audit is an
  external artifact: rewriting it after the fact loses the disagreement
  trail. Add Diagnostic notes / Workflow notes / Cross-audit refs to
  enrich; don't restructure the original list.
- **Don't open GitHub issues for every audit finding individually.**
  Audits batch well — open ONE GitHub issue per audit, reference the
  file, list the findings inline. Otherwise the issue tracker fills
  with "v1: misc audit fix" entries that don't compose.
- **Don't paste reviewer credentials, internal user data, or
  unverified third-party info into these files.** They're public on
  GitHub. Same hygiene as a public commit message.
- **Don't run audits as a vague "look at the site and tell me what's
  wrong" prompt.** Structured prompts produce structured findings.
  Reviewers (human or agent) need: scope, persona ("act as an indie
  dev considering signing up"), tagging schema (Bug / Confusion / UX /
  Strategic), session state ("fresh incognito, no test data"). The
  Workflow notes section is where you record what prompt structure
  produced this audit so you can repeat it.
- **Don't bury the rejected items.** "We rejected this finding because
  X" is the most valuable single sentence in any audit file. Keep
  rejection reasoning at the same prominence as fixes.
- **Don't capture audits you'll never triage.** A captured-but-never-
  triaged file is technical debt with extra steps. If you can't commit
  to triaging within ~2 weeks, decline the audit instead of stockpiling.
