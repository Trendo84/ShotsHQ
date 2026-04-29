/**
 * Test: generate a MIKI FM marketing screenshot set with EMPTY phone screens.
 *
 * The point: prove that gpt-image-1 can produce a beautiful marketing
 * surround that perfectly matches the app's aesthetic, without
 * hallucinating fake in-app UI. The empty phone screens are where
 * ShotsHQ's pipeline will composite the user's real screenshots.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   pnpm tsx scripts/test-miki-fm.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateImage } from "../lib/ai/openai-image";

const PROMPT = `
Design a complete App Store screenshot set for an iOS app called "MIKI FM" — a hi-fi rock radio and music encyclopedia app for serious music lovers and vinyl collectors.

LAYOUT: One wide horizontal canvas (1536x1024) containing exactly 6 vertical App Store screenshot frames arranged side-by-side. Each frame is a 9:19.5 aspect ratio. Light vertical gutter (~24px) between frames. Subtle dark background continuity across all 6.

THE 6 FRAMES (in order, left to right) — each shows an iPhone 16 Pro mockup with the screen **intentionally left BLANK and dark grey (#1A1A1A)** so a real app screenshot can be composited in later. Do NOT invent UI inside the phone screens.

Above each phone, place a bold short headline in warm amber:
  1. "DISCOVER" — subhead "Hi-fi rock radio + the music encyclopedia"
  2. "TUNE IN" — subhead "945 curated stations worldwide"
  3. "THE CRATE" — subhead "Save what you love. Forever."
  4. "DEEP CUTS" — subhead "Album archives. Liner notes. Stories."
  5. "ALWAYS ON AIR" — subhead "FLAC quality. Anywhere."
  6. "FREE FOREVER" — subhead "Pour the needle down."

STYLE DIRECTION:
- Pure black background (#0A0A0A)
- Warm amber accent (#F5A623) — NOT neon, slightly muted, vintage
- Hand-drawn line illustrations in the amber accent: vinyl records, stylus needles, EQ waveforms, cassette tapes, small sound waves, audio knobs. Sketched, not vector-clean.
- Subtle warm glow / vinyl grain texture in the background
- Bold condensed serif or chunky sans-serif headlines (think classic record sleeve typography — Black Sabbath, Pink Floyd albums)
- Faint album art photography fragments as background accents (vintage rock LPs, partial vinyl grooves)
- Audiophile / vintage analog / hi-fi / record store aesthetic
- Each iPhone mockup: realistic dark metal frame, screen completely blank dark grey

TYPOGRAPHY: Headline at top of each frame in warm amber, bold, large enough to read at thumbnail size. Subheading one line below in muted off-white (#CFCFCF). Phone occupies lower 60% of frame.

AVOID:
- ANY UI inside the phone screens. The screens MUST be blank dark grey (#1A1A1A) — leave them empty for compositing.
- Generic stock music imagery (dancing crowds, DJ silhouettes).
- Neon / cyberpunk vibe. This is warm vintage analog, not futuristic.
- Excessive ornament. Keep it confident and minimal.
- Lorem ipsum or placeholder text.
- Soft dreamy AI-photo aesthetic. This is a precise marketing asset.

OUTPUT: Cohesive 6-frame App Store campaign that looks like it was art-directed by one designer in one sitting. Same palette, same illustration style, same iPhone angle and lighting across all 6.
`.trim();

async function main() {
  console.log("──────────────────────────────────────────────────────────");
  console.log(" MIKI FM template-set test (empty phone screens)");
  console.log(" model: gpt-image-1, size: 1536x1024, quality: high");
  console.log(" cost:  ~$0.19");
  console.log("──────────────────────────────────────────────────────────");
  console.log("");
  console.log("Calling gpt-image-1…");

  const t0 = Date.now();
  const result = await generateImage({
    prompt:  PROMPT,
    size:    "1536x1024",
    quality: "high",
  });
  const ms = Date.now() - t0;

  const outDir = resolve(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "miki-fm-shell.png");
  writeFileSync(outPath, result.buffer);

  console.log("");
  console.log("── Done ──────────────────────────────────────────────────");
  console.log(" duration: ", `${(ms / 1000).toFixed(1)}s`);
  console.log(" size:     ", `${(result.buffer.length / 1024).toFixed(1)} KB`);
  console.log(" saved to: ", outPath);
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
