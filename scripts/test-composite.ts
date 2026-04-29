/**
 * End-to-end test: backdrop generation + per-frame composite.
 *
 *   1. Calls gpt-image-1 to generate a portrait backdrop (1024×1536) — no
 *      phone, no UI, no text. Just art-directed backdrop.
 *   2. Composites: backdrop + iPhone vector frame + placeholder screenshot
 *      + crisp server-rendered headline → 1290×2796 final PNG.
 *   3. Saves to tmp/composite-{style}-{purpose}.png.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   pnpm tsx scripts/test-composite.ts
 *
 * Cost: ~$0.19 per run (one gpt-image-1 call).
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateImage } from "../lib/ai/openai-image";
import { buildBackdropPrompt } from "../lib/ai/prompts/backdrop";
import { compositeFrame } from "../lib/render/composite";

async function main() {
  const style    = "tactical-dark" as const;
  const purpose  = "hero" as const;
  const headline = "TUNE IN.";
  const subhead  = "945 curated stations. Worldwide.";

  console.log("──────────────────────────────────────────────────────────");
  console.log(" composite test — per-frame architecture");
  console.log(" style:    ", style);
  console.log(" purpose:  ", purpose);
  console.log(" headline: ", headline);
  console.log("──────────────────────────────────────────────────────────");

  // ── 1. Backdrop ─────────────────────────────────────────────────────────
  const tmp = resolve(process.cwd(), "tmp");
  mkdirSync(tmp, { recursive: true });
  const backdropCachePath = resolve(tmp, `backdrop-${style}-${purpose}.png`);

  let backdrop: Buffer;
  if (existsSync(backdropCachePath)) {
    console.log("Using cached backdrop:", backdropCachePath);
    backdrop = readFileSync(backdropCachePath);
  } else {
    console.log("Calling gpt-image-1 (~30s, $0.19)…");
    const prompt = buildBackdropPrompt({
      appName:        "MIKI FM",
      appDescription: "Hi-fi rock radio + music encyclopedia. 945 curated stations, album archives, deep cuts. For serious music lovers and vinyl collectors.",
      category:       "Music",
      style,
      purpose,
      voice:          "Confident, warm, vintage analog. Audiophile premium.",
      frameIndex:     1,
    });
    const t0 = Date.now();
    const result = await generateImage({
      prompt,
      size:    "1024x1536",
      quality: "high",
    });
    console.log(`  → backdrop generated in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${(result.buffer.length / 1024).toFixed(0)} KB`);
    writeFileSync(backdropCachePath, result.buffer);
    backdrop = result.buffer;
  }

  // ── 2. Composite ────────────────────────────────────────────────────────
  // Use a real MIKI FM screenshot if available, else placeholder
  const screenshotPath = resolve(process.cwd(), "tmp/test-app/IMG_0208.PNG");
  const screenshotPng  = existsSync(screenshotPath) ? readFileSync(screenshotPath) : null;
  console.log(screenshotPng ? "Using real MIKI FM screenshot" : "Using placeholder");

  console.log("Compositing 1290×2796 frame…");
  const t1 = Date.now();
  const final = await compositeFrame({
    device:         "iphone_69",
    backdropPng:    backdrop,
    screenshotPng,
    headline,
    subhead,
    applyWatermark: false,
  });
  console.log(`  → composited in ${Date.now() - t1}ms`);

  const outPath = resolve(tmp, `composite-${style}-${purpose}.png`);
  writeFileSync(outPath, final);

  console.log("");
  console.log("── Done ──────────────────────────────────────────────────");
  console.log(" final size:  ", `${(final.length / 1024).toFixed(0)} KB`);
  console.log(" dimensions:  ", "1290×2796 (App Store iPhone 6.9″)");
  console.log(" saved to:    ", outPath);
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
