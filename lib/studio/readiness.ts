/**
 * Single-source readiness model for the Studio export funnel.
 *
 * Browser audit (2026-05-23): the Studio engine claimed `EXPORT READY`
 * and enabled `Export current` + `Export all` on a fresh project with
 * zero uploaded screenshots. Clicking those CTAs produced no visible
 * result, and `/exports` still showed `Render history 0 entries`.
 * That's a textbook misleading-core-flow: the product promises shipping
 * pixel-exact App Store screenshots; an empty project cannot ship one.
 *
 * This module is the **single source of truth** for "is this panel
 * exportable?" and "is this project exportable?". Both Studio's
 * client-side export UI and the `/projects/[id]/exports` server-
 * rendered page derive their gating + labelling from these functions.
 * Two surfaces, one rule — no drift, no lying.
 *
 * Pure functions. No React, no DOM, no DB. Easy to unit-test against
 * any StudioDesign/StudioDesignSet shape.
 *
 * What counts as "ready"
 * ----------------------
 * A panel is ready when it has:
 *   - A non-blank headline (the constrained-by-design heart of the
 *     pack format — every App Store screenshot has a value-prop line)
 *   - An uploaded screenshot URL (the actual app screen being framed;
 *     blob: URLs count because they survive the export's
 *     `canvas.drawImage` path, and remote https URLs count because
 *     they survive a reload)
 *
 * A project is `exportable` when at least one panel is ready (so
 * "Export current" can act on the active panel if it's the ready one;
 * "Export all" produces ≥ 1 PNG).
 *
 * A project is `fullyReady` when every panel is ready (the bulk
 * "Export all" CTA can flip to its confident state).
 */

import type { StudioDesign, StudioDesignSet } from "@/components/studio/types";

export type PanelReadinessIssue =
  | "no-screenshot"
  | "no-headline";

export type PanelReadiness = {
  panelId: string;
  ready:   boolean;
  issues:  PanelReadinessIssue[];
};

export type StudioReadiness = {
  /** True iff `studio.panels.length >= 1 && every panel ready`. */
  fullyReady:   boolean;
  /** True iff at least one panel is ready (sufficient for Export current/Export ready). */
  exportable:   boolean;
  /** True iff `panels.length === 0` — degenerate empty set. Shouldn't normally happen but guard. */
  empty:        boolean;
  totalPanels:  number;
  readyPanels:  number;
  /** Per-panel readiness, in panel-array order. */
  perPanel:     PanelReadiness[];
};

const ISSUE_COPY: Record<PanelReadinessIssue, string> = {
  "no-screenshot": "missing app screenshot",
  "no-headline":   "missing headline",
};

/**
 * Human-readable list of what's missing for a panel. Empty array if ready.
 * Used inline in Studio (`"Add a screenshot · Add a headline"`) and on
 * the Exports page (per-panel checklist).
 */
export function describeIssues(issues: readonly PanelReadinessIssue[]): string[] {
  return issues.map((i) => ISSUE_COPY[i]);
}

/**
 * Evaluate a single panel. Pure.
 */
export function evaluatePanel(panel: StudioDesign): PanelReadiness {
  const issues: PanelReadinessIssue[] = [];
  if (!panel.screenshotUrl) issues.push("no-screenshot");
  if (!panel.headline.trim()) issues.push("no-headline");
  return {
    panelId: panel.panelId,
    ready:   issues.length === 0,
    issues,
  };
}

/**
 * Evaluate a whole design set. Pure.
 */
export function evaluateStudio(set: StudioDesignSet): StudioReadiness {
  const total = set.panels.length;
  if (total === 0) {
    return {
      fullyReady:  false,
      exportable:  false,
      empty:       true,
      totalPanels: 0,
      readyPanels: 0,
      perPanel:    [],
    };
  }
  const perPanel    = set.panels.map(evaluatePanel);
  const readyPanels = perPanel.filter((p) => p.ready).length;
  return {
    fullyReady:  readyPanels === total,
    exportable:  readyPanels > 0,
    empty:       false,
    totalPanels: total,
    readyPanels,
    perPanel,
  };
}

/**
 * Convenience: readiness of a specific panel by id. Returns `null` if
 * the panelId doesn't exist in the set (UI bug, defensive default).
 */
export function evaluatePanelById(set: StudioDesignSet, panelId: string): PanelReadiness | null {
  const panel = set.panels.find((p) => p.panelId === panelId);
  if (!panel) return null;
  return evaluatePanel(panel);
}

/**
 * Status pill / button-label state machine. Drives both the Studio
 * "Export" InfoCell value and the Exports page header status badge,
 * so wording stays in lockstep between the two surfaces.
 *
 *   empty    — `panels.length === 0` (defensive)
 *   blocked  — 0 / N panels ready (no exportable output yet)
 *   partial  — `1 ≤ readyPanels < totalPanels` (some ready, some not)
 *   ready    — all panels ready
 */
export type ReadinessStatus = "empty" | "blocked" | "partial" | "ready";

export function statusOf(r: StudioReadiness): ReadinessStatus {
  if (r.empty) return "empty";
  if (r.readyPanels === 0) return "blocked";
  if (r.readyPanels < r.totalPanels) return "partial";
  return "ready";
}

/**
 * Tight one-liner for status labels — used in Studio's "Export"
 * InfoCell and the Exports page header.
 */
export function statusLabel(status: ReadinessStatus): string {
  switch (status) {
    case "empty":   return "Empty";
    case "blocked": return "Blocked";
    case "partial": return "Partial";
    case "ready":   return "Ready";
  }
}

/**
 * Human-readable explanation of the status — Studio uses this as the
 * InfoCell sub-line; Exports uses it as the readiness-checklist
 * lead-in. Returns plain text (no JSX) so it's interchangeable.
 */
export function statusHelp(r: StudioReadiness): string {
  switch (statusOf(r)) {
    case "empty":
      return "No panels in this project yet.";
    case "blocked":
      return `Upload screenshots into the panels below — none are ready to export yet.`;
    case "partial":
      return `${r.readyPanels} of ${r.totalPanels} panels ready. Add a screenshot + headline to each remaining panel.`;
    case "ready":
      return `All ${r.totalPanels} panels ready — exports run at App Store-exact pixel dimensions.`;
  }
}
