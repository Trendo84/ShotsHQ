import type { User } from "@/lib/db/schema";

const UNMETERED = new Set(["studio_monthly", "studio_annual", "lifetime"]);

export function isStudioOrLifetime(user: Pick<User, "plan">): boolean {
  return UNMETERED.has(user.plan);
}

export function canUseApi(user: Pick<User, "plan">): boolean {
  return user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
}

export function canBypassWatermark(user: Pick<User, "plan" | "creditBalance">): boolean {
  return UNMETERED.has(user.plan) || user.creditBalance > 0;
}
