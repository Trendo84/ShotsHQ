import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "pipeline-icons");
const MODEL = "gpt-image-1";

const stages = [
  {
    file: "01-intake.png",
    title: "Intake",
    brief: "a precise upload tray receiving a screenshot plane, cloud intake gesture",
  },
  {
    file: "02-analyze.png",
    title: "Analyze",
    brief: "a visual scan aperture over a phone screen, eye-like lens but non-figurative",
  },
  {
    file: "03-copy.png",
    title: "Copy",
    brief: "a pen nib and structured headline lines, editorial copywriting system",
  },
  {
    file: "04-backdrop.png",
    title: "Backdrop",
    brief: "layered canvas sheets with a soft sun/bloom behind a phone-safe center",
  },
  {
    file: "05-translate.png",
    title: "Translate",
    brief: "globe grid with two speech panels orbiting, localization flow",
  },
  {
    file: "06-render.png",
    title: "Render",
    brief: "monitor frame with pixel grid resolving into a finished export",
  },
  {
    file: "07-deliver.png",
    title: "Deliver",
    brief: "paper-plane export arrow leaving a finished package tray",
  },
];

function promptFor(stage) {
  return [
    `Create one premium transparent PNG icon for the ShotsHQ seven-stage workflow stage: ${stage.title}.`,
    `Concept: ${stage.brief}.`,
    "Style: high-end Swiss industrial product UI glyph, ultra-thin Phosphor Light / technical drafting linework, 1px graphite-black strokes with one restrained warm red-orange accent stroke (#E61919), no fills except tiny accent dots, no shadows, no gradients, no glow.",
    "Composition: single centered icon, generous transparent padding, square 1024x1024 canvas, readable at 48px, precise geometry, no rounded app-icon tile, no background, no border box.",
    "Hard constraints: transparent background, no text, no numbers, no letters, no watermark, no app UI screenshot, no realistic objects, no thick strokes, no generic emoji look.",
  ].join("\n");
}

async function generate(stage) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: promptFor(stage),
      size: "1024x1024",
      quality: "high",
      background: "transparent",
      output_format: "png",
    }),
  });

  if (!res.ok) {
    throw new Error(`${stage.file}: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${stage.file}: no b64_json in response`);

  const raw = Buffer.from(b64, "base64");
  const output = path.join(OUT_DIR, stage.file);
  await sharp(raw)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(output);
  return output;
}

async function makeSheet() {
  const thumbs = await Promise.all(
    stages.map(async (stage) => ({
      input: await sharp(path.join(OUT_DIR, stage.file))
        .resize(220, 220, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
      file: stage.file,
    })),
  );

  const labelSvg = (label) => Buffer.from(
    `<svg width="260" height="48" xmlns="http://www.w3.org/2000/svg">
      <text x="130" y="30" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" fill="#EAEAEA" letter-spacing="2">${label.replace(".png", "").toUpperCase()}</text>
    </svg>`,
  );

  const composites = [];
  for (let i = 0; i < thumbs.length; i += 1) {
    const x = 60 + i * 300;
    composites.push({ input: thumbs[i].input, left: x + 20, top: 70 });
    composites.push({ input: labelSvg(thumbs[i].file), left: x, top: 320 });
  }

  await sharp({
    create: { width: 2160, height: 430, channels: 4, background: "#0A0A0A" },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, "pipeline-icons-sheet.png"));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const stage of stages) {
    const output = await generate(stage);
    console.log(output);
    await new Promise((resolve) => setTimeout(resolve, 13000));
  }

  await makeSheet();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
