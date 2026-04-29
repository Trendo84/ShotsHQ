/**
 * OpenAI gpt-image-1 wrapper.
 *
 * Native API (not via the Vercel AI SDK because that one doesn't expose
 * gpt-image-1 cleanly yet). Returns the raw PNG buffer + revised prompt.
 *
 * Pricing (as of 2025-Q4): ~$0.19/image at high quality, 1024×1024 or
 * 1024×1536. Wide aspect ratios (e.g. 1536×1024) are also supported and
 * are what we use for the "6-up screenshot set" template-builder mode.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_IMAGES  = "https://api.openai.com/v1/images/generations";

export type GptImageSize    = "1024x1024" | "1024x1536" | "1536x1024" | "auto";
export type GptImageQuality = "low" | "medium" | "high" | "auto";

export type GenerateImageParams = {
  prompt:    string;
  size?:     GptImageSize;
  quality?:  GptImageQuality;
  n?:        number;
  /** Background. "transparent" requires png+ alpha. */
  background?: "transparent" | "opaque" | "auto";
};

export type GenerateImageResult = {
  buffer:        Buffer;
  revisedPrompt: string | null;
  /** Raw API response so callers can read pricing/usage if needed. */
  raw:           unknown;
};

export async function generateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResult> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  const body = {
    model:      "gpt-image-1",
    prompt:     params.prompt,
    size:       params.size    ?? "1024x1024",
    quality:    params.quality ?? "high",
    n:          params.n       ?? 1,
    background: params.background ?? "opaque",
    // gpt-image-1 returns base64 in `data[0].b64_json` (no URL option).
  };

  const res = await fetch(OPENAI_IMAGES, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`gpt-image-1 failed ${res.status}: ${text.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    data: Array<{ b64_json?: string; revised_prompt?: string }>;
  };

  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new Error("gpt-image-1 returned no image data");
  }

  return {
    buffer:        Buffer.from(first.b64_json, "base64"),
    revisedPrompt: first.revised_prompt ?? null,
    raw:           json,
  };
}
