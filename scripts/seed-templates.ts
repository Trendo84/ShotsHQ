/**
 * Seed the templates gallery with a starter set. Templates are stored as
 * Polotno JSON in `public/templates/` plus a manifest entry for indexing.
 *
 * Run with: pnpm tsx scripts/seed-templates.ts
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TEMPLATES = [
  { id: "minimal-mono",    name: "Minimal Mono",   category: "Productivity",  device: "iphone_69" },
  { id: "high-contrast",   name: "High Contrast",  category: "Utilities",     device: "iphone_69" },
  { id: "soft-pastel",     name: "Soft Pastel",    category: "Lifestyle",     device: "iphone_69" },
  { id: "indie-grid",      name: "Indie Grid",     category: "Photo & Video", device: "iphone_69" },
  { id: "dark-tactical",   name: "Dark Tactical",  category: "Productivity",  device: "iphone_69" },
];

async function main() {
  const dir = path.join(process.cwd(), "public/templates");
  await mkdir(dir, { recursive: true });
  for (const t of TEMPLATES) {
    const file = path.join(dir, `${t.id}.json`);
    const stub = {
      id:       t.id,
      name:     t.name,
      category: t.category,
      device:   t.device,
      polotno: {
        width:  1290,
        height: 2796,
        fonts:  ["Archivo Black", "JetBrains Mono"],
        pages:  [],
      },
    };
    await writeFile(file, JSON.stringify(stub, null, 2));
    console.log(`✓ ${t.id}`);
  }
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify({ templates: TEMPLATES }, null, 2));
  console.log("done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
