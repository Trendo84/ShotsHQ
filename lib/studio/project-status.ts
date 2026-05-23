/**
 * Shared project-level readiness helpers.
 *
 * Three surfaces (project overview, dashboard, projects index) each
 * need to render a project's status — badge text, badge variant,
 * counts, "next useful action" — in a way that stays consistent
 * with the truth source used inside Studio and `/exports`:
 *
 *   project.polotnoJson
 *     → extractStudioDesignSet (lib/studio/schema.ts)
 *     → evaluateStudio          (lib/studio/readiness.ts)
 *     → statusOf                (lib/studio/readiness.ts)
 *
 * Audit history:
 *   - cycle #2 (2026-05-23): Studio + /exports lying independently.
 *     Fixed by introducing the readiness reducer.
 *   - cycle #4 (2026-05-23): /projects/[id] overview lying with
 *     hardcoded "0 / 24 slots" + "◯ READY" rows. Fixed by deriving
 *     state from the same reducer.
 *   - cycle #5 (this file): /dashboard and /projects each hardcoded
 *     `<Badge>Draft</Badge>` regardless of real state. We now share
 *     one helper so future surfaces can't drift again.
 *
 * Pure functions. No DOM, no React. Suitable for both server-rendered
 * pages and (eventually) any API surface that needs to expose status.
 */

import { extractStudioDesignSet } from "@/lib/studio/schema";
import {
  evaluateStudio,
  statusOf,
  type ReadinessStatus,
  type StudioReadiness,
} from "@/lib/studio/readiness";
import type { StudioDesignSet } from "@/components/studio/types";

/**
 * Empty design-set used when a project has no persisted Studio
 * state yet. We do NOT fall back to `defaultStudioDesignSet()` here
 * because that materializes a phantom panel in-memory; the project
 * legitimately has zero panels until Studio's autosave fires for the
 * first time. Truth wins over UX-friendly fake content.
 */
const EMPTY_STUDIO_SET: StudioDesignSet = {
  version:       "2",
  activePanelId: "",
  panels:        [],
};

export type ProjectStatus = {
  /** Canonical machine-readable status enum. Same values across all surfaces. */
  status:       ReadinessStatus;
  /** Always-non-null studio set (empty when no persisted state). */
  studio:       StudioDesignSet;
  /** Full readiness breakdown — per-panel + aggregates. */
  readiness:    StudioReadiness;
};

/**
 * Compute the canonical status for a project from its persisted
 * `polotnoJson` blob. Accepts the unknown JSONB value directly so
 * the caller doesn't need to type-narrow it.
 *
 * Stateless. Pure. Safe to call inside a server component for every
 * project in a list — the only DB read happened upstream (loading
 * the project record).
 */
export function projectStatus(polotnoJson: unknown): ProjectStatus {
  const studio    = extractStudioDesignSet(polotnoJson) ?? EMPTY_STUDIO_SET;
  const readiness = evaluateStudio(studio);
  const status    = statusOf(readiness);
  return { status, studio, readiness };
}

// ── Display layer ─────────────────────────────────────────────────────────

export type ProjectBadgeVariant = "default" | "warn" | "live";

export type ProjectStatusDisplay = {
  /** Short uppercase label suitable for a status pill. */
  label:    string;
  /** Badge variant key — matches `components/ui/badge.tsx`'s `BadgeVariant`. */
  variant:  ProjectBadgeVariant;
  /** Sub-line / tooltip copy describing what state this is. */
  help:     string;
  /** Operator's most useful next action (id + label). */
  next:     NextAction;
};

/**
 * Single source of truth for badge label + variant + help copy across
 * /dashboard, /projects, and /projects/[id]. Lets the three surfaces
 * stay in lockstep without duplicating the switch statement.
 */
export function projectStatusDisplay(
  s: ProjectStatus,
  projectId: string,
): ProjectStatusDisplay {
  switch (s.status) {
    case "empty":
      return {
        label:   "DRAFT",
        variant: "default",
        help:    "No persisted Studio state yet — open Studio to create the first panel.",
        next:    nextActionFor(projectId, "empty"),
      };
    case "blocked":
      return {
        label:   "DRAFT",
        variant: "default",
        help:    `${s.readiness.readyPanels} of ${s.readiness.totalPanels} panels ready — upload screenshots + write headlines.`,
        next:    nextActionFor(projectId, "blocked"),
      };
    case "partial":
      return {
        label:   "IN PROGRESS",
        variant: "warn",
        help:    `${s.readiness.readyPanels} of ${s.readiness.totalPanels} panels ready — finish the remaining to enable Export all.`,
        next:    nextActionFor(projectId, "partial"),
      };
    case "ready":
      return {
        label:   "READY",
        variant: "live",
        help:    `${s.readiness.totalPanels} of ${s.readiness.totalPanels} panels ready — exports run at App Store-exact pixel dimensions.`,
        next:    nextActionFor(projectId, "ready"),
      };
  }
}

// ── Next-action ───────────────────────────────────────────────────────────

export type NextActionId =
  | "add-targets-in-studio"
  | "upload-in-studio"
  | "prepare-in-studio"
  | "open-exports";

export type NextAction = {
  id:    NextActionId;
  href:  string;
  label: string;
  /** Inline help / sub-line explaining what this action accomplishes. */
  help:  string;
};

/**
 * State-aware "most useful next action" for an operator looking at
 * a project. Centralized so the project overview's primary CTA and
 * the dashboard's per-row quick-action stay aligned.
 *
 * `Icon` is intentionally left out of this pure helper so the helper
 * stays JSX-free; callers map `id` → `lucide-react` icon themselves.
 */
export function nextActionFor(projectId: string, status: ReadinessStatus): NextAction {
  switch (status) {
    case "empty":
      return {
        id:    "add-targets-in-studio",
        href:  `/projects/${projectId}/studio`,
        label: "Open studio",
        help:  "Start by adding a panel in Studio and uploading your first screenshot.",
      };
    case "blocked":
      return {
        id:    "upload-in-studio",
        href:  `/projects/${projectId}/studio`,
        label: "Upload in Studio",
        help:  "Drop a screenshot into the active panel and add a headline to unblock export.",
      };
    case "partial":
      return {
        id:    "prepare-in-studio",
        href:  `/projects/${projectId}/studio`,
        label: "Prepare in Studio",
        help:  "Some panels still need a screenshot or headline. Finish those to enable Export all.",
      };
    case "ready":
      return {
        id:    "open-exports",
        href:  `/projects/${projectId}/exports`,
        label: "Open Exports",
        help:  "Every panel is ready. Open Exports to download the App Store-exact pack.",
      };
  }
}
