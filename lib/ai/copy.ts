import { generateObject } from "ai";
import { z } from "zod";
import { openai, COPY_MODEL } from "@/lib/ai/gateway";
import { buildHeadlinePrompt } from "@/lib/ai/prompts";

export const HeadlineSchema = z.object({
  headline:      z.string().max(40),
  subheadline:   z.string().max(80),
  emoji:         z.string().optional(),
  ctaSuggestion: z.string().max(20),
});

export type Headline = z.infer<typeof HeadlineSchema>;

export async function generateHeadline(input: {
  appName: string;
  appDescription: string;
  category: string;
  locale?: string;
}): Promise<Headline> {
  const { object } = await generateObject({
    model:  openai(COPY_MODEL),
    schema: HeadlineSchema,
    prompt: buildHeadlinePrompt(input),
  });
  return object;
}
