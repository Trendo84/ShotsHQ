/**
 * Badge state helper for the exports page device tiles.
 *
 * Replaces the binary "READY / NOT TARGETED" label that read as a setup
 * failure ("you forgot to select these") rather than the actual meaning
 * ("you decided not to include these"). See audit finding
 * `docs/audits/2026-04-30-comet-sonnet-editor.md` #4.
 *
 * Four states:
 *   - not-included    Device isn't in the project's storeTargets array.
 *   - waiting          Targeted, but no frames have been rendered yet.
 *   - in-progress     Some frames rendered, more pending.
 *   - complete        All frames rendered.
 *
 * Pure function — no React, no Badge styling. The caller renders the
 * appropriate Badge variant + label string. Tested in
 * `tests/exports/badge-state.test.ts`.
 */

export type BadgeState =
  | { kind: "not-included" }
  | { kind: "waiting" }
  | { kind: "in-progress"; rendered: number; total: number }
  | { kind: "complete"; total: number };

export function deriveBadgeState(opts: {
  /** Is this device in the project's storeTargets array? */
  targeted: boolean;
  /** Frames rendered so far for this device. Default 0. */
  framesRendered?: number;
  /**
   * Total frames expected for this device. Default 0 — N=0 reads as
   * "waiting" rather than the degenerate "0 / 0 FRAMES".
   */
  framesTotal?: number;
}): BadgeState {
  if (!opts.targeted) return { kind: "not-included" };

  const rendered = opts.framesRendered ?? 0;
  const total    = opts.framesTotal    ?? 0;

  if (total === 0) return { kind: "waiting" };
  if (rendered >= total) return { kind: "complete", total };
  return { kind: "in-progress", rendered, total };
}

/**
 * Render the badge state to a label string. Caller picks the Badge
 * variant separately based on `state.kind`.
 */
export function badgeLabel(state: BadgeState): string {
  switch (state.kind) {
    case "not-included": return "NOT INCLUDED";
    case "waiting":      return "READY · WAITING FOR FRAMES";
    case "in-progress":  return `READY · ${state.rendered} / ${state.total} FRAMES`;
    case "complete":     return `COMPLETE · ${state.total} / ${state.total} FRAMES`;
  }
}
