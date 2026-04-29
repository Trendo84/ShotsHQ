/**
 * Per-frame backdrop prompt for gpt-image-1.
 *
 * Generates ONE portrait backdrop (1024×1536) for ONE App Store frame.
 * The backdrop contains:
 *   - Background art (palette, texture, decorative motifs)
 *   - Empty central column where the iPhone frame will be composited
 *
 * The backdrop does NOT contain:
 *   - Phone mockups (we composite a real iPhone frame on top)
 *   - In-app UI (user's real screenshot composites in)
 *   - Headline text (rendered server-side with sharp at the end)
 *
 * This is the "art direction only" mode that produces App Store-grade
 * output when combined with the ShotsHQ render pipeline.
 */

import type { TemplateSetStyle } from "./template-set";

export type FramePurpose =
  | "hero"          // First frame — sets the brand
  | "feature"       // Showcase one feature
  | "data"          // Numbers / social proof / before-after
  | "workflow"      // Process / detail / customization
  | "lifestyle"     // Aspirational, mood-driven
  | "cta";          // Final frame — close the deal

export type BackdropParams = {
  appName:        string;
  appDescription: string;
  category:       string;
  style:          TemplateSetStyle;
  purpose:        FramePurpose;
  /** Hex colors. Optional — model picks if absent. */
  primaryColor?:  string;
  accentColor?:   string;
  /** Optional voice hint. */
  voice?:         string;
  /** Index in the set (1-6) — helps the model vary composition slightly. */
  frameIndex?:    number;
};

const STYLE_DIRECTION: Record<TemplateSetStyle, string> = {
  "minimal-light":
    "Cream off-white background (#F4F1EA → #FAF7EE gradient), single bold accent color, ultra-clean, generous whitespace, hand-drawn micro-illustrations as accents. Reference: Notion, Linear marketing.",
  "tactical-dark":
    "Pure black (#0A0A0A → #14141A radial), one neon-saturated accent (red #FF2A2A or green #4AF626), thin geometric line art, subtle dot grids, dataviz accents. Reference: Vercel, Linear.",
  "warm-organic":
    "Deep forest green (#1B3A2F → #14302A), cream cards optional, tomato-red accent (#E74C3C), warm hand-styled illustrations (vegetables, leaves, organic shapes), serif/humanist mix. Reference: PulseChef, NYT Cooking.",
  "playful-gradient":
    "Soft mesh gradient (lavender→peach OR mint→sky), rounded forms, glow, friendly geometric. Reference: Headspace, Calm.",
  "tech-minimal":
    "Cool grey (#F1F2F4 → #E6E8EC), electric blue accent (#0066FF), thin lines, subtle dot grids. Reference: Stripe, Vercel.",
  "editorial":
    "Cream paper (#F5EFDF → #EFE7D2), high-contrast serif energy, magazine-style hierarchy, single-color woodcut accents, generous letterspacing. Reference: Substack, The New Yorker.",
};

const PURPOSE_HINT: Record<FramePurpose, string> = {
  hero:
    "This is the HERO frame — the first thing seen. Most striking composition. The backdrop should feel iconic and brand-defining. Decorations should be slightly more dense or expressive here.",
  feature:
    "This frame showcases a specific feature. Backdrop should be slightly calmer, leaving visual room for the feature to read clearly when composited.",
  data:
    "This frame will show numbers or social proof. Backdrop should be quieter still — almost like a studio backdrop. Maybe a soft halo or single decorative anchor in a corner.",
  workflow:
    "This frame shows process or detail. Backdrop can be a touch more textured to communicate craftsmanship.",
  lifestyle:
    "This frame is mood-driven. Backdrop can lean lifestyle/photographic — a partial real object (vinyl, ingredient, hand) at the edge if appropriate to the style.",
  cta:
    "This is the CLOSING frame — call to action. Backdrop should feel resolved. A small celebratory accent (confetti, sparkle, glow) is allowed if on-brand.",
};

/**
 * Build the per-frame backdrop prompt.
 *
 * IMPORTANT: this prompt explicitly forbids generating a phone, UI, or
 * any text. The model produces backdrop art ONLY. ShotsHQ composites
 * the phone frame, screenshot, and headline in the next stage.
 */
export function buildBackdropPrompt(p: BackdropParams): string {
  const direction = STYLE_DIRECTION[p.style];
  const purpose   = PURPOSE_HINT[p.purpose];
  const palette   = p.primaryColor && p.accentColor
    ? `Locked palette: primary ${p.primaryColor}, accent ${p.accentColor}.`
    : `Pick a palette consistent with the style direction.`;
  const voice = p.voice ? `Brand voice: ${p.voice}.` : "";
  const idxLine = p.frameIndex
    ? `This is frame ${p.frameIndex} of 6 in a cohesive set. Maintain visual consistency with the rest of the set; vary composition subtly so each frame feels distinct.`
    : "";

  return [
    // ── Brief ─────────────────────────────────────────────────────────────
    `Design a portrait App Store screenshot BACKDROP for an iOS app called "${p.appName}".`,
    `Category: ${p.category}.`,
    `App description: ${p.appDescription.trim()}`,
    "",

    // ── Output spec ───────────────────────────────────────────────────────
    `OUTPUT: A SINGLE portrait image (1024×1536, ratio 2:3) that will serve as the BACKDROP `,
    `for one App Store screenshot frame. The center vertical band of the image is reserved — `,
    `leave that area visually quieter / cleaner, because a phone mockup will be composited there later. `,
    `Decorate the top, sides, and bottom of the canvas with style-consistent art.`,
    "",

    // ── Critical: what NOT to produce ─────────────────────────────────────
    `DO NOT INCLUDE:`,
    `  - Any iPhone, smartphone, or phone mockup. (We composite a real one on top later.)`,
    `  - Any in-app UI, screens, buttons, or interface elements.`,
    `  - Any text, headline, label, or typography. (Text is rendered server-side later.)`,
    `  - Lorem ipsum or placeholder copy.`,
    `  - Watermarks or logos.`,
    "",

    // ── Style + purpose ───────────────────────────────────────────────────
    `STYLE DIRECTION: ${direction}`,
    palette,
    voice,
    "",
    `FRAME PURPOSE: ${purpose}`,
    idxLine,
    "",

    // ── Art direction ─────────────────────────────────────────────────────
    `INCLUDE:`,
    `  - Atmospheric background — palette, texture, lighting, mood.`,
    `  - Hand-styled decorative motifs in the accent color (illustrations, line art, organic shapes).`,
    `  - Subtle continuity hooks (so when 6 frames sit side-by-side later, they feel like one campaign).`,
    `  - Gentle visual focus toward the center vertical band (so the composited phone reads clearly).`,
    "",

    // ── Anti-patterns ─────────────────────────────────────────────────────
    `AVOID:`,
    `  - Generic stock photography or AI-photo dream aesthetic.`,
    `  - Crowded composition. White space (or dark space) is sacred.`,
    `  - Centered subject — the center is where the phone goes, keep it open.`,
    `  - Soft AI hallucinations in details (warped objects, melting forms).`,
    `  - Visible AI artifacts, signatures, or watermarks.`,
    "",

    `Final output: a clean, art-directed portrait backdrop. Confident. Premium. Empty in the middle.`,
  ].filter(Boolean).join("\n");
}
