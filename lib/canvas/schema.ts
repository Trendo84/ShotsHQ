/** ─── ShotsCanvas JSON schema ─────────────────────────────────────────────
 *
 * This is our internal canvas format. It lives in `projects.polotnoJson`
 * (column kept for backwards compat) and is the source-of-truth for both:
 *   • The browser editor  (Fabric.js renders it interactively)
 *   • The server renderer (sharp composites it server-side)
 *
 * All x/y/width/height/fontSize values are in **full-resolution canvas pixels**
 * (e.g. 1290 for iPhone 6.9"). The browser scales them down for display;
 * the server renderer uses them verbatim.
 *
 * Runtime validation: see `validateShotsCanvas()` at the bottom of this
 * file. Use it whenever loading `polotnoJson` from the DB before passing
 * to the editor — invalid data falls back to `defaultCanvas()` rather
 * than crashing the route.
 */

import { z } from "zod";

export type DeviceId = "iphone_69" | "iphone_67" | "ipad_13";

// ── Backgrounds ──────────────────────────────────────────────────────────────

export type SolidBackground    = { type: "solid";    color: string };
export type GradientBackground = { type: "gradient"; colors: [string, string]; angle: number };
export type ImageBackground    = { type: "image";    url: string; r2Key?: string };
export type ShotsBackground    = SolidBackground | GradientBackground | ImageBackground;

// ── Layers ────────────────────────────────────────────────────────────────────

export type TextRole = "eyebrow" | "headline" | "subheadline" | "cta";

export type TextLayer = {
  id:         string;
  kind:       "text";
  role:       TextRole;
  content:    string;
  fontFamily: string;
  fontSize:   number;
  fontWeight: string;
  color:      string;
  align:      "left" | "center" | "right";
  x:          number;
  y:          number;
  width:      number;
  visible:    boolean;
  locked:     boolean;
  /**
   * Marks default placeholder content seeded by `defaultCanvas()` or by
   * applying a starter template. The collision-resolver in
   * `lib/canvas/dispatch.ts` REPLACES system layers when the user
   * dispatches a new layer of the same role — so clicking "Headline" in
   * the Text panel doesn't pile a duplicate on top of the placeholder.
   *
   * Flips to `false` (or absent) on first user edit (`text:changed`),
   * after which the layer is treated as user-authored and won't be
   * replaced by future dispatches.
   *
   * Optional + undefined-safe so existing persisted projects (no flag
   * present) behave as `system: false` — backwards compatible, no JSONB
   * migration required.
   */
  system?:    boolean;
};

export type AppScreenshotLayer = {
  id:      string;
  kind:    "app-screenshot";
  url:     string;
  r2Key?:  string;
  x:       number;
  y:       number;
  width:   number;
  height:  number;
  visible: boolean;
  locked:  boolean;
};

export type ShotsLayer = TextLayer | AppScreenshotLayer;

// ── Canvas ────────────────────────────────────────────────────────────────────

export type ShotsCanvas = {
  version:    "1";
  device:     DeviceId;
  width:      number;
  height:     number;
  background: ShotsBackground;
  layers:     ShotsLayer[];
};

// ── Runtime validation ───────────────────────────────────────────────────────
//
// Zod schemas mirror the TypeScript types above, used to validate `polotnoJson`
// loaded from the DB before we hand it to the Fabric editor. Without this,
// malformed JSONB (older save format, manual SQL edit, schema drift) would
// throw inside FabricCanvas's mount loop and the editor route would crash —
// see audit finding `docs/audits/2026-04-30-comet-sonnet-editor.md` #2.
//
// `validateShotsCanvas()` returns the parsed canvas on success or `null` on
// any validation failure. Callers fall back to `defaultCanvas()` on null,
// so the worst case is "user opens an old project and gets the default
// starter content" rather than "user opens an old project and gets a
// silently broken page."

const deviceIdSchema = z.enum(["iphone_69", "iphone_67", "ipad_13"]);

const backgroundSchema: z.ZodType<ShotsBackground> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"),    color: z.string() }),
  z.object({ type: z.literal("gradient"), colors: z.tuple([z.string(), z.string()]), angle: z.number() }),
  z.object({ type: z.literal("image"),    url: z.string(), r2Key: z.string().optional() }),
]);

const textLayerSchema: z.ZodType<TextLayer> = z.object({
  id:         z.string(),
  kind:       z.literal("text"),
  role:       z.enum(["eyebrow", "headline", "subheadline", "cta"]),
  content:    z.string(),
  fontFamily: z.string(),
  fontSize:   z.number(),
  fontWeight: z.string(),
  color:      z.string(),
  align:      z.enum(["left", "center", "right"]),
  x:          z.number(),
  y:          z.number(),
  width:      z.number(),
  visible:    z.boolean(),
  locked:     z.boolean(),
  system:     z.boolean().optional(),
});

const appScreenshotLayerSchema: z.ZodType<AppScreenshotLayer> = z.object({
  id:      z.string(),
  kind:    z.literal("app-screenshot"),
  url:     z.string(),
  r2Key:   z.string().optional(),
  x:       z.number(),
  y:       z.number(),
  width:   z.number(),
  height:  z.number(),
  visible: z.boolean(),
  locked:  z.boolean(),
});

const layerSchema = z.union([textLayerSchema, appScreenshotLayerSchema]);

const shotsCanvasSchema: z.ZodType<ShotsCanvas> = z.object({
  version:    z.literal("1"),
  device:     deviceIdSchema,
  width:      z.number().positive(),
  height:     z.number().positive(),
  background: backgroundSchema,
  layers:     z.array(layerSchema),
});

/**
 * Returns the parsed canvas on success, `null` on any validation failure.
 *
 * Use at every read site that loads from `projects.polotnoJson`:
 *   const canvas = validateShotsCanvas(project.polotnoJson) ?? null;
 *   // null → editor falls back to defaultCanvas()
 *
 * Logs a warning via the caller's preferred logger; this helper stays
 * pure (no console.log, no Sentry coupling) so it works in server actions
 * + route handlers + tests alike.
 */
export function validateShotsCanvas(value: unknown): ShotsCanvas | null {
  const result = shotsCanvasSchema.safeParse(value);
  return result.success ? result.data : null;
}
