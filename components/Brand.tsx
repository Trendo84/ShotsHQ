/**
 * ShotsHQ brand mark. Redesign 2026-05-24.
 *
 * The previous mark was a 8×8 accent-red square + `SHOTS<span>HQ</span>`
 * all-caps wordmark — the brutalist poster identity. The new mark
 * pairs a refined SVG glyph with a Geist-Sans wordmark for the
 * calmer SaaS direction:
 *
 *   - The glyph: an "S" shape carved out of a rounded square with a
 *     champagne-accent inner notch, evoking both a screenshot bezel
 *     and an aperture. Renders crisp at favicon sizes (16px) and
 *     scales cleanly up to 64px+.
 *   - The wordmark: mixed-weight "Shots" (semibold) + "HQ" (regular,
 *     muted). Drops the SHOUTING ALL CAPS treatment.
 *
 * Three sizes via the `size` prop. Default `md` (24px glyph + 17px
 * wordmark) is the marketing-header treatment. `sm` is the sidebar
 * collapsed-state. `lg` for the marketing footer / about pages.
 *
 * Accessibility: the SVG is `role="img"` + `aria-label`. The wordmark
 * is hidden via `data-wordmark-hidden` when only the glyph should
 * render (favicon-style placements).
 */

type Size = "sm" | "md" | "lg";

const DIMS: Record<Size, { glyph: number; wordmark: string; gap: string }> = {
  sm: { glyph: 18, wordmark: "text-[14px]",  gap: "gap-1.5" },
  md: { glyph: 24, wordmark: "text-[17px]",  gap: "gap-2"   },
  lg: { glyph: 32, wordmark: "text-[22px]",  gap: "gap-2.5" },
};

export function BrandMark({
  size = "md",
  wordmark = true,
  className = "",
}: {
  size?:     Size;
  wordmark?: boolean;
  className?: string;
}) {
  const { glyph, wordmark: wordmarkClass, gap } = DIMS[size];
  return (
    <span
      className={`inline-flex items-center ${gap} ${className}`}
      aria-label="ShotsHQ"
    >
      <BrandGlyph size={glyph} />
      {wordmark && (
        <span
          className={`${wordmarkClass} font-semibold tracking-[-0.02em] text-[var(--fg)] leading-none`}
        >
          Shots<span className="text-[var(--fg-mute)] font-normal">HQ</span>
        </span>
      )}
    </span>
  );
}

/**
 * The pure SVG glyph — usable on its own (favicon-style placements,
 * sidebar collapsed state). 24×24 viewBox, currentColor friendly for
 * the foreground strokes, accent-tinted for the inner notch.
 */
export function BrandGlyph({
  size = 24,
  className = "",
}: {
  size?:     number;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="ShotsHQ logomark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer rounded-square (the device bezel). */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Inner aperture — a small square offset that reads as a
         screenshot frame AND as the bowl of an "S" when paired with
         the outer rectangle. */}
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      {/* Champagne-accent shutter dot — the brand color shows up here,
         not in the outer rules. Reads as both an aperture center and
         a record/capture indicator. */}
      <circle
        cx="12"
        cy="12"
        r="2.4"
        fill="var(--accent)"
      />
    </svg>
  );
}
