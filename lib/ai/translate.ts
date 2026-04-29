import { generateText } from "ai";
import { openai, COPY_MODEL } from "@/lib/ai/gateway";
import { buildTranslatePrompt } from "@/lib/ai/prompts";

export async function translateString(input: {
  source: string;
  fromLocale: string;
  toLocale: string;
  context: string;
}): Promise<string> {
  const { text } = await generateText({
    model:  openai(COPY_MODEL),
    prompt: buildTranslatePrompt(input),
  });
  return text.trim();
}
