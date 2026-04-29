/**
 * Smoke test for gpt-image-1 + the master template-set prompt.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   pnpm tsx scripts/test-template-set.ts [style]
 *
 * Optional arg: style key (defaults to warm-organic, which is the PulseChef vibe).
 *
 * Saves the result PNG to ./tmp/template-set-test.png so you can open it.
 * Cost: ~$0.19 per run.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateImage } from "../lib/ai/openai-image";
import {
  buildTemplateSetPrompt,
  type TemplateSetStyle,
} from "../lib/ai/prompts/template-set";

const STYLES: TemplateSetStyle[] = [
  "minimal-light",
  "tactical-dark",
  "warm-organic",
  "playful-gradient",
  "tech-minimal",
  "editorial",
];

async function main() {
  const styleArg = (process.argv[2] ?? "warm-organic") as TemplateSetStyle;
  if (!STYLES.includes(styleArg)) {
    console.error(`Invalid style "${styleArg}". Use one of: ${STYLES.join(", ")}`);
    process.exit(1);
  }

  console.log("──────────────────────────────────────────────────────────");
  console.log(" gpt-image-1 template-set smoke test");
  console.log("──────────────────────────────────────────────────────────");
  console.log(" style:", styleArg);
  console.log(" model: gpt-image-1");
  console.log(" size:  1536x1024 (wide, 6 frames horizontal)");
  console.log(" cost:  ~$0.19");
  console.log("");

  const prompt = buildTemplateSetPrompt({
    appName:        "PulseChef",
    appDescription: "Smart meal planner and grocery inventory. Tracks your pantry, suggests personalized recipes, and builds grocery lists. Helps you cook more, waste less.",
    category:       "Health & Fitness",
    style:          styleArg,
    voice:          "Confident, warm, plainspoken. Never cute or quirky.",
    device:         "iphone",
  });

  console.log("── Master prompt ─────────────────────────────────────────");
  console.log(prompt);
  console.log("──────────────────────────────────────────────────────────");
  console.log("");
  console.log("Calling gpt-image-1 (this takes ~15-30s)…");

  const t0 = Date.now();
  const result = await generateImage({
    prompt,
    size:    "1536x1024",
    quality: "high",
  });
  const ms = Date.now() - t0;

  // Make tmp dir if missing
  const outDir = resolve(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `template-set-${styleArg}.png`);
  writeFileSync(outPath, result.buffer);

  console.log("");
  console.log("── Done ──────────────────────────────────────────────────");
  console.log(" duration: ", `${ms}ms (${(ms / 1000).toFixed(1)}s)`);
  console.log(" size:     ", `${(result.buffer.length / 1024).toFixed(1)} KB`);
  console.log(" saved to: ", outPath);
  if (result.revisedPrompt) {
    console.log("");
    console.log("── Revised prompt (model's interpretation) ──────────────");
    console.log(result.revisedPrompt.slice(0, 500) + (result.revisedPrompt.length > 500 ? "…" : ""));
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
