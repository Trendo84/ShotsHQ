/**
 * Master prompt for generating a 6-up App Store screenshot set in a
 * single gpt-image-1 call.
 *
 * The PulseChef discovery: one wide composition with one master art
 * direction beats six separate frame prompts. The model keeps the set
 * cohesive when it sees all six frames at once.
 *
 * Output: a wide image (1536×1024 by default) containing six vertical
 * App Store frames at consistent style, palette, typography, and brand
 * accents. ShotsHQ slices this into individual frames downstream.
 */

export type TemplateSetStyle =
  | "minimal-light"        // cream + accent + lots of whitespace, Notion-esque
  | "tactical-dark"        // black + neon accent + monospace, Linear-esque
  | "warm-organic"         // forest green + cream + hand-styled (PulseChef)
  | "playful-gradient"     // soft mesh gradients, rounded UI, Headspace-esque
  | "tech-minimal"         // cool grey + electric blue, Stripe-esque
  | "editorial"            // serif type, generous whitespace, Substack-esque;

export type TemplateSetParams = {
  appName:        string;
  appDescription: string;          // 1-3 sentences
  category:       string;          // e.g. "Productivity", "Health & Fitness"
  style:          TemplateSetStyle;
  /** Hex colors. Optional — model picks if absent. */
  primaryColor?:   string;
  accentColor?:    string;
  /** Optional brand voice hints. */
  voice?:         string;
  /** Optional: device family (default: iPhone). */
  device?:        "iphone" | "ipad";
};

const STYLE_DIRECTION: Record<TemplateSetStyle, string> = {
  "minimal-light":
    "Cream/off-white background (#F4F1EA), single bold accent color, generous whitespace, " +
    "ultra-clean modern sans-serif typography, NO photographic texture, hand-drawn micro-illustrations as accents. " +
    "Reference: Notion, Linear marketing site, Apple Newsroom.",
  "tactical-dark":
    "Pure black background (#0A0A0A), one neon-saturated accent (red #FF2A2A or green #4AF626), " +
    "monospace JetBrains-style typography, technical telemetry vibes, thin geometric line art, " +
    "subtle grid backgrounds, dataviz accents. Reference: Vercel, Linear, Statsig.",
  "warm-organic":
    "Deep forest green background (#1B3A2F), cream cards (#F5F0E1), tomato-red accent (#E74C3C), " +
    "warm hand-styled illustrations (vegetables, leaves, organic shapes), serif/humanist sans mix, " +
    "lifestyle photography ingredients. Reference: PulseChef, Yummly, NYT Cooking.",
  "playful-gradient":
    "Soft mesh gradient backgrounds (lavender→peach or mint→sky), rounded card UI inside frames, " +
    "friendly geometric sans-serif, cute 3D-rendered objects floating, lots of glow and softness. " +
    "Reference: Headspace, Calm, Linear's onboarding.",
  "tech-minimal":
    "Cool grey background (#F1F2F4), electric blue accent (#0066FF), precise modern sans-serif, " +
    "thin line UI elements, isometric or perspective product mockups, subtle dot grids. " +
    "Reference: Stripe, Vercel, Modern Treasury.",
  "editorial":
    "Cream paper background (#F5EFDF), high-contrast serif headlines (Garamond/Tiempos style), " +
    "magazine-style hierarchy, single-color illustrated woodcut accents, generous letterspacing. " +
    "Reference: Substack, The New Yorker, Readwise.",
};

/**
 * Build the master prompt. Designed for gpt-image-1 with size 1536×1024,
 * which produces ~6 vertical App Store frames in a single horizontal row.
 */
export function buildTemplateSetPrompt(p: TemplateSetParams): string {
  const direction = STYLE_DIRECTION[p.style];
  const device    = p.device ?? "iphone";
  const palette   = p.primaryColor && p.accentColor
    ? `Locked palette: primary ${p.primaryColor}, accent ${p.accentColor}.`
    : `Pick a palette consistent with the style direction.`;
  const voice = p.voice ? `Brand voice: ${p.voice}.` : "";

  return [
    // ── Top-level brief ─────────────────────────────────────────────────────
    `Design a complete App Store screenshot set for an iOS app called "${p.appName}".`,
    `Category: ${p.category}.`,
    `App description: ${p.appDescription.trim()}`,
    "",

    // ── Composition rules (the most important block) ────────────────────────
    `LAYOUT: One wide horizontal canvas containing exactly 6 vertical App Store screenshot frames`,
    `arranged side-by-side. Each frame is a 9:19.5 aspect-ratio screenshot of the ${device}.`,
    `Light vertical gutter (~24px) between frames. Subtle background continuity across all 6.`,
    "",

    // ── The 6 frame structure (App Store best practice) ─────────────────────
    `THE 6 FRAMES (in order, left to right):`,
    `  1. HERO: app name + lockup + 1-line value prop. The "title card".`,
    `  2. CORE FEATURE: most distinctive thing this app does. ${device} mockup showing the feature in action, with a short headline above.`,
    `  3. SECONDARY FEATURE: complementary capability. Same composition pattern as frame 2.`,
    `  4. SOCIAL PROOF or DATA: numbers, ratings, before/after, or a notable result. ${device} mockup optional.`,
    `  5. WORKFLOW or DETAIL: a curated detail that builds trust (settings, customization, integrations).`,
    `  6. CALL TO ACTION: short conversion line + visual that closes the deal.`,
    "",

    // ── Style direction ─────────────────────────────────────────────────────
    `STYLE DIRECTION: ${direction}`,
    palette,
    voice,
    "",

    // ── Typography rules ────────────────────────────────────────────────────
    `TYPOGRAPHY: Each frame has a clear hierarchy — headline (top, bold, largest), `,
    `optional subhead (one line, medium weight), and the ${device} mockup occupying the lower 60-65% of the frame. `,
    `Do not crowd. Headlines must be legible at thumbnail size.`,
    "",

    // ── ${device} mockup rules ──────────────────────────────────────────────
    `DEVICE MOCKUPS: Render realistic ${device === "iphone" ? "iPhone 16 Pro" : "iPad Pro M4"} mockups `,
    `with believable in-app UI inside the screen. UI should reflect the app's actual functionality from `,
    `the description above — do NOT use lorem ipsum, do NOT use generic chat bubbles, do NOT show iOS home screen. `,
    `Show the app actually being used.`,
    "",

    // ── Anti-patterns ───────────────────────────────────────────────────────
    `AVOID:`,
    `  - Generic stock photography or AI-photo aesthetic.`,
    `  - Text in non-English unless explicitly part of the brand.`,
    `  - Overcrowded frames. White space is sacred.`,
    `  - Inconsistent device angles or sizes between frames.`,
    `  - Random emoji clutter.`,
    `  - Visible AI artifacts in the device UI (warped text, melting icons).`,
    `  - Soft "AI dream" aesthetic. This is a precise marketing asset, not a hallucination.`,
    "",

    // ── Final instructions ──────────────────────────────────────────────────
    `OUTPUT: A single high-resolution wide image. The 6 frames should look like they belong to one `,
    `cohesive App Store campaign. Brand consistency across all 6 is non-negotiable: same palette, `,
    `same typography, same illustration style, same ${device} angle and lighting.`,
  ].filter(Boolean).join("\n");
}
