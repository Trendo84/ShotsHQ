/**
 * Brand extraction.
 *
 * Given a URL, fetch the page, strip noise, hand it to gpt-5 with a
 * structured Zod schema, get back a `BrandProfile`. ShotsHQ then locks
 * that profile into all downstream gpt-image-1 prompts so the AI
 * generates art-direction that matches the user's actual brand.
 *
 * Inspired by SkillUI's pattern (turn a live site into a Claude-readable
 * design skill) but tailored for ShotsHQ's screenshot-generation use
 * case — we care about palette, typography vibe, voice, category, and
 * the closest match to one of our 6 locked style directions.
 */

import { generateObject } from "ai";
import { openai, COPY_MODEL } from "@/lib/ai/gateway";
import { BrandProfileSchema, type BrandProfile } from "./schema";

const FETCH_TIMEOUT_MS  = 12_000;
const MAX_HTML_CHARS    = 35_000;
const USER_AGENT        =
  "Mozilla/5.0 (compatible; ShotsHQ/1.0; +https://shotshq.com)";

/** Fetch HTML with a sane timeout and UA. */
async function fetchHtml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal:  ctrl.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`brand fetch ${res.status}: ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Lightweight HTML pre-processing — strip scripts, comments, collapse whitespace. */
function reduceHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")          // SVGs balloon token count
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_HTML_CHARS);
}

/**
 * Extract a `BrandProfile` from a URL.
 *
 * - Throws on fetch errors or schema-validation failures.
 * - Cost: 1 gpt-5 call (~$0.005-0.01 depending on page size).
 * - Latency: 2-6 seconds.
 */
export async function extractBrand(url: string): Promise<BrandProfile> {
  const html    = await fetchHtml(url);
  const reduced = reduceHtml(html);

  const { object } = await generateObject({
    model:   openai(COPY_MODEL),
    schema:  BrandProfileSchema,
    prompt: [
      `You are a brand-extraction analyst for ShotsHQ. Look at the HTML/CSS of this website and extract a structured brand profile.`,
      ``,
      `URL: ${url}`,
      ``,
      `RULES:`,
      `- Return colors as 6-char hex (no shorthand). If you can't see exact hex, infer from context but stay believable for the brand.`,
      `- For typography, use real font family names if visible in CSS (e.g. "Inter", "Archivo Black"); otherwise describe the vibe ("Geometric sans", "Modern serif").`,
      `- For "vibe", pick the closest match from the 6 locked options:`,
      `    * minimal-light    — cream/off-white, lots of whitespace, modern sans (Notion-style)`,
      `    * tactical-dark    — pure black, neon accent, monospace, technical (Vercel-style)`,
      `    * warm-organic     — forest/earthy palette, hand-styled illustrations, warm voice (NYT Cooking)`,
      `    * playful-gradient — soft mesh gradients, rounded UI, friendly (Headspace)`,
      `    * tech-minimal     — cool greys + electric blue, thin lines, precise (Stripe)`,
      `    * editorial        — cream paper + serif headlines, magazine hierarchy (Substack)`,
      `- For "voice", one sentence in plain English describing how the brand sounds.`,
      `- For "taglineIdeas", 3-6 short marketing taglines (under 60 chars each) that sound like this brand wrote them. These will be used as App Store screenshot headline candidates.`,
      `- Be ruthless — pick the dominant brand colors, not every shade you see. The goal is a palette that drives consistent App Store output.`,
      ``,
      `HTML (truncated to ${MAX_HTML_CHARS} chars):`,
      ``,
      reduced,
    ].join("\n"),
  });

  return { ...object, sourceUrl: url };
}
