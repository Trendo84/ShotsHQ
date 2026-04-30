import type { TextLayer, TextRole } from "./schema";

/**
 * Pure helpers for the editor's "add a text layer" flow.
 *
 * Why these live OUTSIDE FabricCanvas:
 *   - They're trivial unit-testable logic (no Fabric, no DOM).
 *   - The same rules need to apply server-side if we ever pre-seed
 *     canvases via the API (e.g. brand-extraction templates).
 *   - The system-flag policy is genuinely product behavior, not
 *     rendering: it deserves its own module so a future "apply
 *     starter template" can call into the same dispatch logic.
 */

// ── Canonical text positions ──────────────────────────────────────────────────
//
// Source of truth for where each text role lives on a fresh canvas. Both
// `defaultCanvas()` (initial state for a NULL polotnoJson) and the editor's
// "add this role" UI dispatch through these values. Previously the two code
// paths used DIFFERENT y-coordinates (defaults at h*0.07–0.30, addTextLayer
// at h*0.42–0.46), which caused the "duplicate template content in two zones"
// bug — adding a headline placed it in the lower zone while the original
// headline sat in the upper zone.
//
// All values are fractions of canvas height. x/width are fractions of width.
// CTA intentionally sits below the others — it anchors the bottom of the
// screen content area, matching App Store screenshot conventions.

export const TEXT_LAYOUT: Record<
  TextRole,
  { x: number; y: number; width: number }
> = {
  eyebrow:     { x: 0.10, y: 0.07, width: 0.80 },
  headline:    { x: 0.05, y: 0.12, width: 0.90 },
  subheadline: { x: 0.10, y: 0.30, width: 0.80 },
  cta:         { x: 0.20, y: 0.45, width: 0.60 },
};

export type TextDefaults = {
  content:    string;
  fontFamily: string;
  fontSize:   number;
  fontWeight: string;
  color:      string;
  x:          number;
  y:          number;
  width:      number;
};

const ROLE_TYPE: Record<TextRole, Omit<TextDefaults, "x" | "y" | "width">> = {
  eyebrow: {
    content:    "APP NAME",
    fontFamily: "JetBrains Mono, monospace",
    fontSize:   52,
    fontWeight: "400",
    color:      "#FF2A2A",
  },
  headline: {
    content:    "New headline",
    fontFamily: "Archivo Black, sans-serif",
    fontSize:   130,
    fontWeight: "900",
    color:      "#FFFFFF",
  },
  subheadline: {
    content:    "Supporting copy here",
    fontFamily: "Inter, sans-serif",
    fontSize:   58,
    fontWeight: "400",
    color:      "#B5B5B5",
  },
  cta: {
    content:    "Download Free",
    fontFamily: "JetBrains Mono, monospace",
    fontSize:   48,
    fontWeight: "700",
    color:      "#FF2A2A",
  },
};

/**
 * Default styling + position for a text role on a canvas of the given
 * dimensions. Used by `addTextLayer` in the editor; matched 1:1 (within ±1px
 * after rounding) by `defaultCanvas()`'s seeded layers.
 */
export function textDefaultsFor(
  role: TextRole,
  canvasWidth: number,
  canvasHeight: number,
): TextDefaults {
  const layout = TEXT_LAYOUT[role];
  return {
    ...ROLE_TYPE[role],
    x:     Math.round(canvasWidth  * layout.x),
    y:     Math.round(canvasHeight * layout.y),
    width: Math.round(canvasWidth  * layout.width),
  };
}

// ── Collision resolution ──────────────────────────────────────────────────────

export type DispatchAction =
  /** Add the layer fresh — no collision. */
  | "add"
  /** A `system: true` layer of the same role exists; remove it and add user-authored. */
  | { kind: "replace"; targetId: string }
  /**
   * A user-authored layer of the same role exists. Don't add a duplicate —
   * focus the existing one so the user can edit in place. Singletons only
   * (eyebrow / headline / subheadline). For `cta`, we always allow add.
   */
  | { kind: "focus"; targetId: string }
  /** Multi-instance role (cta) — add another, stacking below the most recent. */
  | { kind: "stack"; afterId: string };

/**
 * Decide what should happen when the user clicks "add this role" in the
 * editor's TEXT panel. Pure function — no Fabric, no DOM. Tested in
 * `tests/canvas/system-flag.test.ts`.
 *
 * Rules:
 *   1. system layer of same role exists → REPLACE it (user is overwriting
 *      the placeholder).
 *   2. user-authored layer of same role exists, role is a singleton → FOCUS
 *      the existing one.
 *   3. user-authored layer of same role exists, role is `cta` → STACK below.
 *   4. otherwise → ADD fresh.
 */
export function resolveTextDispatch(
  layers: ReadonlyArray<TextLayer>,
  role: TextRole,
): DispatchAction {
  const sameRole = layers.filter((l) => l.role === role);
  if (sameRole.length === 0) return "add";

  const placeholder = sameRole.find((l) => l.system === true);
  if (placeholder) return { kind: "replace", targetId: placeholder.id };

  // All same-role layers are user-authored.
  if (role === "cta") {
    // Most recent (last in the array) anchors the stack.
    const last = sameRole[sameRole.length - 1]!;
    return { kind: "stack", afterId: last.id };
  }

  // Singleton roles — eyebrow / headline / subheadline.
  return { kind: "focus", targetId: sameRole[0]!.id };
}
