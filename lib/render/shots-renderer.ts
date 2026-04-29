/**
 * Server-side renderer for ShotsCanvas JSON → PNG Buffer.
 *
 * Uses sharp for compositing. Text is rendered via SVG overlays
 * (system fonts — Archivo Black / JetBrains Mono are not available on
 * the server, so we approximate with Arial Black / Courier New).
 */

import sharp from "sharp";
import type { GradientBackground, ShotsCanvas, TextLayer } from "@/lib/canvas/schema";

export async function renderFromShotsCanvas(
  canvas:         ShotsCanvas,
  applyWatermark: boolean,
): Promise<Buffer> {
  const { width: w, height: h, background, layers } = canvas;

  // ── 1. Background ────────────────────────────────────────────────
  let base: Buffer;
  if (background.type === "solid") {
    base = await svgBuf(solidSvg(w, h, background.color), w, h);
  } else if (background.type === "gradient") {
    base = await svgBuf(gradientSvg(w, h, background), w, h);
  } else if (background.type === "image" && background.url) {
    try {
      base = await sharp(await fetchBuf(background.url))
        .resize(w, h, { fit: "cover" })
        .png()
        .toBuffer();
    } catch {
      base = await svgBuf(solidSvg(w, h, "#0F1117"), w, h);
    }
  } else {
    base = await svgBuf(solidSvg(w, h, "#0F1117"), w, h);
  }

  // ── 2. Layer composites ──────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [];

  for (const layer of layers) {
    if (!layer.visible) continue;

    if (layer.kind === "text") {
      composites.push({
        input: Buffer.from(textSvg(w, h, layer)),
        top:   0,
        left:  0,
      });
    } else if (layer.kind === "app-screenshot" && layer.url) {
      try {
        const imgBuf = await fetchBuf(layer.url);
        const scaled = await sharp(imgBuf)
          .resize(layer.width, layer.height, { fit: "contain" })
          .png()
          .toBuffer();
        composites.push({
          input: scaled,
          top:   Math.max(0, Math.round(layer.y)),
          left:  Math.max(0, Math.round(layer.x)),
        });
      } catch {
        /* skip missing assets */
      }
    }
  }

  // ── 3. Watermark ─────────────────────────────────────────────────
  if (applyWatermark) {
    composites.push({ input: await watermarkBuf(w), gravity: "southeast" });
  }

  // ── 4. Composite ─────────────────────────────────────────────────
  let pipeline = sharp(base);
  if (composites.length > 0) pipeline = pipeline.composite(composites);
  return pipeline.png({ quality: 90, compressionLevel: 9 }).toBuffer();
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

async function svgBuf(svg: string, w: number, h: number): Promise<Buffer> {
  return sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
}

function solidSvg(w: number, h: number, color: string): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${xmlAttr(color)}"/>
  </svg>`;
}

function gradientSvg(w: number, h: number, bg: GradientBackground): string {
  // Convert CSS-style angle (0° = upward, clockwise) to SVG gradient percentages.
  const rad = ((bg.angle - 90) * Math.PI) / 180;
  const x1  = ((-Math.cos(rad) + 1) / 2 * 100).toFixed(2);
  const y1  = ((-Math.sin(rad) + 1) / 2 * 100).toFixed(2);
  const x2  = ((Math.cos(rad)  + 1) / 2 * 100).toFixed(2);
  const y2  = ((Math.sin(rad)  + 1) / 2 * 100).toFixed(2);
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%"   stop-color="${xmlAttr(bg.colors[0])}"/>
        <stop offset="100%" stop-color="${xmlAttr(bg.colors[1])}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
  </svg>`;
}

function textSvg(w: number, h: number, layer: TextLayer): string {
  const anchor =
    layer.align === "center" ? "middle" :
    layer.align === "right"  ? "end"    : "start";
  const anchorX =
    layer.align === "center" ? layer.x + layer.width / 2 :
    layer.align === "right"  ? layer.x + layer.width     : layer.x;

  // Approximate server-side font family (custom fonts not installed on server)
  const family =
    layer.fontFamily.includes("Archivo") ? "Arial Black, Impact, sans-serif" :
    layer.fontFamily.includes("JetBrains") ? "Courier New, monospace"         :
    "Arial, Helvetica, sans-serif";

  const lines = layer.content.split("\n");
  const lh    = layer.fontSize * 1.2;

  const textEls = lines.map((line, i) =>
    `<text
      x="${anchorX}"
      y="${layer.y + layer.fontSize + i * lh}"
      font-family="${xmlAttr(family)}"
      font-size="${layer.fontSize}"
      font-weight="${xmlAttr(layer.fontWeight)}"
      fill="${xmlAttr(layer.color)}"
      text-anchor="${anchor}"
    >${xmlEscape(line)}</text>`
  ).join("\n");

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${textEls}</svg>`;
}

async function watermarkBuf(width: number): Promise<Buffer> {
  const w = Math.max(180, Math.round(width * 0.12));
  const h = Math.round(w / 6);
  return sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.7 } },
  })
    .composite([{
      input: Buffer.from(
        `<svg width="${w}" height="${h}">
          <text x="50%" y="55%"
            font-family="monospace"
            font-size="${Math.round(h * 0.45)}"
            fill="white"
            text-anchor="middle"
            letter-spacing="2">SHOTSHQ®</text>
        </svg>`,
      ),
      top: 0, left: 0,
    }])
    .png()
    .toBuffer();
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
