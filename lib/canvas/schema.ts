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
 */

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
