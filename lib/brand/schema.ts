import { z } from "zod";

/**
 * Brand profile — the structured output of a brand extraction.
 *
 * Used to pre-fill ShotsHQ projects: when a user pastes their app URL
 * (or landing page URL), we extract this profile and lock it into all
 * downstream gpt-image-1 calls. Output stays brand-consistent without
 * the user filling out forms.
 */

const HEX = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const BrandProfileSchema = z.object({
  /** Source URL the profile was extracted from. */
  sourceUrl:        z.string().url(),

  /** Inferred app/product name. */
  productName:      z.string().max(60),

  /** 1-2 sentence description of what the product does. */
  productPitch:     z.string().max(280),

  /** App Store category guess. */
  category:         z.string().max(40),

  /** ── Palette ────────────────────────────────────────────────────── */
  /** Primary brand color (the "main" color — usually a dark or rich tone). */
  primaryColor:     HEX,
  /** Accent color (CTA, highlights, signal). */
  accentColor:      HEX,
  /** Background color (canvas / surface). */
  backgroundColor:  HEX,
  /** Foreground / text-on-background color. */
  foregroundColor:  HEX,

  /** ── Typography ─────────────────────────────────────────────────── */
  /** Display font family name (or vibe descriptor if name unknown). */
  displayFont:      z.string().max(60),
  /** Body font family name. */
  bodyFont:         z.string().max(60),

  /** ── Voice & vibe ───────────────────────────────────────────────── */
  /** 1-sentence brand voice description. */
  voice:            z.string().max(160),

  /** Best matching style direction from our 6 locked options. */
  vibe: z.enum([
    "minimal-light",
    "tactical-dark",
    "warm-organic",
    "playful-gradient",
    "tech-minimal",
    "editorial",
  ]),

  /** 3-6 short tagline ideas in this brand's voice. */
  taglineIdeas:     z.array(z.string().max(60)).min(3).max(6),
});

export type BrandProfile = z.infer<typeof BrandProfileSchema>;
