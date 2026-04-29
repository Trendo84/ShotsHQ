/**
 * Generate 3 hero showcase compositions for the marketing site.
 *
 * Uses the full ShotsHQ pipeline:
 *   - Hardcoded MIKI FM brand profile (we already have the screenshots)
 *   - Per-frame backdrop generation via gpt-image-1
 *   - Sharp composite with real iPhone frame + real screenshot + crisp text
 *
 * Output:
 *   /public/showcase/hero-1.png   1290×2796   tactical-dark    (Stations)
 *   /public/showcase/hero-2.png   1290×2796   warm-organic     (The Crate)
 *   /public/showcase/hero-3.png   1290×2796   editorial        (Album detail)
 *
 * Cost: 3 × $0.19 = $0.57 OpenAI credit.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   pnpm tsx scripts/generate-hero-showcase.ts
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateImage } from "../lib/ai/openai-image";
import { buildBackdropPrompt, type BackdropParams } from "../lib/ai/prompts/backdrop";
import { compositeFrame } from "../lib/render/composite";
import type { BrandProfile } from "../lib/brand/schema";

// ── MIKI FM brand profile (hand-authored to match the real app) ─────────────
const MIKI_BRAND: BrandProfile = {
  sourceUrl:       "https://mikifm.app",
  productName:     "MIKI FM",
  productPitch:    "Hi-fi rock radio + the music encyclopedia. 945 curated stations, full album archives, deep cuts. For serious music lovers and vinyl collectors.",
  category:        "Music & Audio",
  primaryColor:    "#0A0A0A",
  accentColor:     "#F5A623",
  backgroundColor: "#0A0A0A",
  foregroundColor: "#F5F0E1",
  displayFont:     "Bebas Neue / Condensed Display Serif",
  bodyFont:        "JetBrains Mono",
  voice:           "Warm vintage analog. Audiophile premium. Confident, never neon.",
  vibe:            "tactical-dark",
  taglineIdeas: [
    "Tune in. Worldwide.",
    "Save what you love.",
    "Album archives. Liner notes.",
    "FLAC quality. Anywhere.",
    "Pour the needle down.",
    "Music for collectors.",
  ],
};

type HeroSpec = {
  outFile:        string;
  style:          BackdropParams["style"];
  purpose:        BackdropParams["purpose"];
  headline:       string;
  subhead:        string;
  screenshotPng:  string;
};

const HEROS: HeroSpec[] = [
  {
    outFile:       "hero-1.png",
    style:         "tactical-dark",
    purpose:       "feature",
    headline:      "TUNE IN.",
    subhead:       "945 curated stations.",
    screenshotPng: "tmp/test-app/IMG_0208.PNG",
  },
  {
    outFile:       "hero-2.png",
    style:         "warm-organic",
    purpose:       "lifestyle",
    headline:      "THE CRATE.",
    subhead:       "Save what you love.",
    screenshotPng: "tmp/test-app/IMG_0210.PNG",
  },
  {
    outFile:       "hero-3.png",
    style:         "editorial",
    purpose:       "data",
    headline:      "DEEP CUTS.",
    subhead:       "Every album. Every story.",
    screenshotPng: "tmp/test-app/IMG_0209.PNG",
  },
];

async function generateOne(spec: HeroSpec, idx: number) {
  const tmp     = resolve(process.cwd(), "tmp");
  mkdirSync(tmp, { recursive: true });
  const cacheKey = `backdrop-hero-${spec.style}-${spec.purpose}.png`;
  const cachePath = resolve(tmp, cacheKey);

  console.log(`\n──────── Hero ${idx + 1}: ${spec.style} / ${spec.purpose} ────────`);

  // 1. Backdrop (cached if we already have it for this style+purpose)
  let backdrop: Buffer;
  if (existsSync(cachePath)) {
    console.log("  → using cached backdrop:", cachePath);
    backdrop = readFileSync(cachePath);
  } else {
    console.log("  → generating backdrop via gpt-image-1 (~30s, $0.19)");
    const prompt = buildBackdropPrompt({
      appName:        MIKI_BRAND.productName,
      appDescription: MIKI_BRAND.productPitch,
      category:       MIKI_BRAND.category,
      style:          spec.style,
      purpose:        spec.purpose,
      primaryColor:   MIKI_BRAND.primaryColor,
      accentColor:    MIKI_BRAND.accentColor,
      voice:          MIKI_BRAND.voice,
      brand:          MIKI_BRAND,
      frameIndex:     idx + 1,
    });
    const t0 = Date.now();
    const result = await generateImage({
      prompt,
      size:    "1024x1536",
      quality: "high",
    });
    console.log(`  → backdrop generated in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${(result.buffer.length / 1024).toFixed(0)} KB`);
    writeFileSync(cachePath, result.buffer);
    backdrop = result.buffer;
  }

  // 2. Composite
  const screenshotPath = resolve(process.cwd(), spec.screenshotPng);
  if (!existsSync(screenshotPath)) {
    throw new Error(`screenshot missing: ${screenshotPath}`);
  }
  const screenshotPng = readFileSync(screenshotPath);

  console.log("  → compositing 1290×2796…");
  const t1 = Date.now();
  const final = await compositeFrame({
    device:         "iphone_69",
    backdropPng:    backdrop,
    screenshotPng,
    headline:       spec.headline,
    subhead:        spec.subhead,
    applyWatermark: false,
  });
  console.log(`  → composited in ${Date.now() - t1}ms, ${(final.length / 1024).toFixed(0)} KB`);

  // 3. Save to /public/showcase/
  const outDir = resolve(process.cwd(), "public/showcase");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, spec.outFile);
  writeFileSync(outPath, final);
  console.log(`  ✓ saved: ${outPath}`);
}

async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log(" Hero showcase generation — 3 compositions");
  console.log(" Brand: MIKI FM");
  console.log(" Cost:  ~$0.57 (3 × gpt-image-1 backdrop @ $0.19)");
  console.log("══════════════════════════════════════════════════════════");

  for (let i = 0; i < HEROS.length; i++) {
    await generateOne(HEROS[i]!, i);
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(" Done. Outputs:");
  for (const h of HEROS) {
    console.log(`   public/showcase/${h.outFile}`);
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
