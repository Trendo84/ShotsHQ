/**
 * Smoke test: brand extraction.
 *
 *   pnpm tsx scripts/test-brand-extract.ts <url>
 *
 * Prints the extracted BrandProfile to stdout. Cost: ~$0.01 per run.
 */

import { extractBrand } from "../lib/brand/extract";

async function main() {
  const url = process.argv[2] ?? "https://stripe.com";
  console.log("──────────────────────────────────────────────────────────");
  console.log(" brand extraction smoke test");
  console.log(" url:", url);
  console.log("──────────────────────────────────────────────────────────");
  console.log("Fetching + analyzing…");

  const t0 = Date.now();
  const profile = await extractBrand(url);
  const ms = Date.now() - t0;

  console.log("");
  console.log(`Done in ${(ms / 1000).toFixed(1)}s.`);
  console.log("");
  console.log(JSON.stringify(profile, null, 2));
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
