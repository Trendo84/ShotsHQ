import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.OPENAI_API_KEY ?? "";
const baseURL = process.env.AI_GATEWAY_API_KEY
  ? "https://gateway.ai.cloudflare.com/v1/openai" // example; replaced by real Vercel AI Gateway URL when deployed
  : undefined;

export const openai = createOpenAI({
  apiKey,
  baseURL,
});

/** Default model. Swap to gpt-5-mini for cost-sensitive paths. */
export const COPY_MODEL  = "gpt-5";
export const VISION_MODEL = "gpt-5";
