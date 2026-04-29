/**
 * Centralized AI prompts. Never inline prompts in feature code.
 * Prompts are config: they need version control, A/B testing hooks, and
 * one-place updates.
 */

export function buildHeadlinePrompt(input: {
  appName: string;
  appDescription: string;
  category: string;
  locale?: string;
}): string {
  const locale = input.locale ?? "en";
  return [
    `You are an App Store screenshot copywriter. Generate one polished headline,`,
    `a supporting subheadline, an optional emoji, and a single CTA suggestion`,
    `for an iOS app being submitted to the App Store. Constraints are strict:`,
    ``,
    `App name: ${input.appName}`,
    `Category: ${input.category}`,
    `Description: ${input.appDescription}`,
    `Locale: ${locale}`,
    ``,
    `RULES:`,
    `- headline ≤ 40 characters, no hashtags, no quotes, single sentence preferred.`,
    `- subheadline ≤ 80 characters, action-oriented, plain language, no jargon.`,
    `- emoji optional (omit if app is professional/finance/health).`,
    `- ctaSuggestion ≤ 20 characters, imperative voice ("Start tracking", "Find waves").`,
    ``,
    `The result must validate against the provided Zod schema.`,
  ].join("\n");
}

export function buildBackdropPrompt(input: {
  appName: string;
  category: string;
  mood: string;
}): string {
  return [
    `Generate a backdrop image for the App Store screenshot of an iOS app.`,
    ``,
    `App: ${input.appName} (${input.category})`,
    `Mood: ${input.mood}`,
    ``,
    `RULES:`,
    `- Output a clean, brand-friendly background — no text, no logos.`,
    `- Geometric, minimal, slightly abstract.`,
    `- Aspect ratio matches device frame; safe area for centered subject.`,
    `- Avoid faces, hands, brand marks.`,
  ].join("\n");
}

export function buildTranslatePrompt(input: {
  source: string;
  fromLocale: string;
  toLocale: string;
  context: string;
}): string {
  return [
    `Translate App Store marketing copy from ${input.fromLocale} to ${input.toLocale}.`,
    `Preserve the punchy, imperative tone. Account for character-length expansion`,
    `(German: +30%, French: +20%, Japanese: -20%). RTL languages must reverse`,
    `directional cues.`,
    ``,
    `Context: ${input.context}`,
    ``,
    `Source: ${input.source}`,
    ``,
    `Return only the translated string. No quotes, no explanation.`,
  ].join("\n");
}
