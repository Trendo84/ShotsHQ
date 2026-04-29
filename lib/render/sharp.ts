import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2";

export type RenderInput = {
  baseImage: Buffer;             // raw screenshot bytes
  background?: Buffer;           // optional generated backdrop
  overlayText?: string;          // headline rendered server-side as PNG layer
  width: number;
  height: number;
  device: "iphone_69" | "iphone_67" | "ipad_13";
  applyWatermark: boolean;
};

export async function renderScreenshot(input: RenderInput): Promise<Buffer> {
  let pipeline = sharp(input.background ?? input.baseImage)
    .resize(input.width, input.height, { fit: "cover" });

  const composites: sharp.OverlayOptions[] = [];

  if (input.background) {
    composites.push({
      input: await sharp(input.baseImage).resize(input.width, input.height, { fit: "inside" }).toBuffer(),
      gravity: "center",
    });
  }

  if (input.applyWatermark) {
    const wm = await watermarkOverlay(input.width);
    composites.push({ input: wm, gravity: "southeast" });
  }

  if (composites.length > 0) pipeline = pipeline.composite(composites);

  return await pipeline.png({ quality: 90, compressionLevel: 9 }).toBuffer();
}

async function watermarkOverlay(width: number): Promise<Buffer> {
  const w = Math.max(180, Math.round(width * 0.12));
  const h = Math.round(w / 6);
  return await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.7 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${w}" height="${h}"><text x="50%" y="55%" font-family="JetBrains Mono, monospace" font-size="${Math.round(h * 0.45)}" fill="white" text-anchor="middle" letter-spacing="2">SHOTSHQ®</text></svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

export async function uploadRender(key: string, body: Buffer): Promise<{ key: string; url: string }> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: `${R2_PUBLIC_URL}/${key}` };
}
