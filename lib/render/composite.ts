/**
 * Per-frame compositor.
 *
 * Takes:
 *   - AI-generated backdrop (any size, will be resized to App Store dim)
 *   - Real user app screenshot (any size, clipped to phone screen rect)
 *   - Headline + optional subhead
 *   - Phone frame (vector for now, swappable for PNG later)
 *
 * Produces:
 *   - 1290×2796 (or 1320×2868 / 2064×2752) PNG buffer
 *
 * Layer order, bottom→top:
 *   1. Backdrop (covers full canvas, resized with sharp Lanczos)
 *   2. Headline + subhead text band (top ~17% of canvas)
 *   3. User screenshot (clipped to rounded rect, positioned at phone screen)
 *   4. iPhone frame SVG (overlay, screen area is transparent cutout)
 *   5. Watermark (if free tier)
 */

import sharp from "sharp";
import { iphoneFrame } from "./iphone-frame";
import { STORE_DIMENSIONS } from "@/lib/utils/store-dimensions";

export type CompositeInput = {
  device:        keyof typeof STORE_DIMENSIONS;
  backdropPng:   Buffer;
  screenshotPng: Buffer | null; // null = render frame with placeholder screen
  headline:      string;
  subhead?:      string;
  /** Where the iPhone frame sits within the canvas (top-left). */
  framePosition?: { x?: number; y?: number };
  /** Frame width in canvas pixels. */
  frameWidth?:    number;
  applyWatermark: boolean;
};

export async function compositeFrame(input: CompositeInput): Promise<Buffer> {
  const { width: W, height: H } = STORE_DIMENSIONS[input.device];

  // ── 1. Backdrop resized to canvas ───────────────────────────────────────
  const backdrop = await sharp(input.backdropPng)
    .resize(W, H, { fit: "cover", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  // ── 2. Phone frame geometry ─────────────────────────────────────────────
  // Best-practice marketing screenshot proportions:
  //   - Phone ≈ 78% of canvas width (dominant focal point)
  //   - Phone top at ≈ 17% of canvas height
  //   - Headline area occupies the top ~15% (above the phone)
  //   - Phone bottom edge sits ~5% from canvas bottom
  const frame        = iphoneFrame();
  const targetFrameW = input.frameWidth ?? Math.round(W * 0.78);
  const scale        = targetFrameW / frame.width;
  const targetFrameH = Math.round(frame.height * scale);
  const frameLeft    = input.framePosition?.x ?? Math.round((W - targetFrameW) / 2);
  const frameTop     = input.framePosition?.y ?? Math.round(H * 0.17);

  // Render the SVG frame at target size
  const frameOverlay = await sharp(Buffer.from(frame.svg))
    .resize(targetFrameW, targetFrameH, { fit: "fill" })
    .png()
    .toBuffer();

  // ── 3. Screenshot clipped into the screen rect ──────────────────────────
  const screenW = Math.round(frame.screen.width  * scale);
  const screenH = Math.round(frame.screen.height * scale);
  const screenX = frameLeft + Math.round(frame.screen.x * scale);
  const screenY = frameTop  + Math.round(frame.screen.y * scale);
  const cornerR = Math.round(frame.screen.cornerRadius * scale);

  // Build a rounded-rect mask
  const mask = Buffer.from(
    `<svg width="${screenW}" height="${screenH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${screenW}" height="${screenH}" rx="${cornerR}" ry="${cornerR}" fill="#fff"/>
    </svg>`
  );

  let screenshotLayer: Buffer;
  if (input.screenshotPng) {
    screenshotLayer = await sharp(input.screenshotPng)
      .resize(screenW, screenH, { fit: "cover" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } else {
    // Placeholder: dark grey rounded rect with subtle "screenshot here" indicator
    const placeholder = Buffer.from(
      `<svg width="${screenW}" height="${screenH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${screenW}" height="${screenH}" rx="${cornerR}" fill="#1A1A1A"/>
        <text x="50%" y="50%" font-family="monospace" font-size="${Math.round(screenW * 0.035)}"
              fill="#3A3A3A" text-anchor="middle" dominant-baseline="middle">
          [ YOUR APP SCREENSHOT ]
        </text>
      </svg>`
    );
    screenshotLayer = await sharp(placeholder).png().toBuffer();
  }

  // ── 4. Headline + subhead text band ─────────────────────────────────────
  // Tight headline area in the top 13% (was 20%), positioned just below
  // the top edge so the phone has room to dominate the lower 80%.
  const textBand = await renderTextBand(W, Math.round(H * 0.13), input.headline, input.subhead);

  // ── 5. Compose ──────────────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [
    // Headline band sits at the top, snug against the canvas top
    { input: textBand, top: Math.round(H * 0.025), left: 0 },
    // Screenshot underneath the frame
    { input: screenshotLayer, top: screenY, left: screenX },
    // Frame overlay on top of screenshot (its transparent cutout reveals the screenshot)
    { input: frameOverlay, top: frameTop, left: frameLeft },
  ];

  if (input.applyWatermark) {
    const wm = await watermark(W);
    composites.push({ input: wm, gravity: "southeast" });
  }

  return sharp(backdrop)
    .composite(composites)
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderTextBand(
  width:   number,
  height:  number,
  headline: string,
  subhead?: string,
): Promise<Buffer> {
  // Headline + subhead sized for a tight 13%-tall band at the top.
  // Auto-scale headline font down for long strings.
  const charCount    = headline.length;
  const baseSize     = width * 0.085;          // ~110px on 1290 canvas
  // Target: ~12 chars at full size; longer than that, shrink proportionally.
  const headlineSize = Math.round(charCount > 12 ? baseSize * (12 / charCount) : baseSize);
  const subheadSize  = Math.round(width * 0.030);
  const headlineY    = Math.round(headlineSize * 0.95);
  const subheadY     = headlineY + Math.round(headlineSize * 0.48);

  const subheadEl = subhead
    ? `<text
         x="${width / 2}" y="${subheadY}"
         font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
         font-size="${subheadSize}"
         font-weight="400"
         fill="#CFCFCF"
         text-anchor="middle"
         letter-spacing="0.5"
       >${escapeXml(subhead)}</text>`
    : "";

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${width / 2}" y="${headlineY}"
      font-family="'Archivo Black', 'Arial Black', Impact, sans-serif"
      font-size="${headlineSize}"
      font-weight="900"
      fill="#FFFFFF"
      text-anchor="middle"
      letter-spacing="-1"
    >${escapeXml(headline)}</text>
    ${subheadEl}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function watermark(width: number): Promise<Buffer> {
  const w = Math.max(180, Math.round(width * 0.10));
  const h = Math.round(w / 6);
  return sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.65 } },
  })
    .composite([{
      input: Buffer.from(
        `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="55%" font-family="monospace"
            font-size="${Math.round(h * 0.45)}" fill="white"
            text-anchor="middle" letter-spacing="2">SHOTSHQ®</text>
        </svg>`,
      ),
      top: 0, left: 0,
    }])
    .png()
    .toBuffer();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
