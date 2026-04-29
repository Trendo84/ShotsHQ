/** Cost per AI operation in credits. Source of truth. */

export const CREDIT_COST = {
  ai_copy:         1,
  ai_background:   2,  // Flux 2 single backdrop
  ai_restyle:      3,
  ai_translate:    1,  // per locale
  ai_render:       0,
  ai_template_set: 8,  // gpt-image-1 wide 6-frame composition (premium)
} as const;

export type AiOp = keyof typeof CREDIT_COST;

export function costFor(op: AiOp, multiplier = 1): number {
  return CREDIT_COST[op] * multiplier;
}
