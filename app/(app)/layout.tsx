import type { Metadata } from "next";
import { AppNav } from "@/components/app/AppNav";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/auth/clerk";
import { getBalance } from "@/lib/db/queries/credits";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Authenticated app layout — structural redesign 2026-05-24.
 *
 * Was: fixed 240px Sidebar + 64px Topbar wrapping every page = ~250+px
 * of persistent chrome. The brief was explicit that this read as
 * "internal tool / operator dashboard" no matter how the colors or
 * copy were tuned.
 *
 * Now: a single thin AppNav header at 56px, full-width content below.
 * The shell recedes; pages get the stage. Mobile gets the same nav
 * plus a horizontally-scrolling secondary row of workspace links.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const creditBalance = await getBalance(user.id);

  const unmetered =
    user.plan === "studio_monthly" ||
    user.plan === "studio_annual" ||
    user.plan === "lifetime";

  const plan: "Free" | "Studio" | "Lifetime" =
    user.plan === "lifetime"
      ? "Lifetime"
      : user.plan === "studio_monthly" || user.plan === "studio_annual"
        ? "Studio"
        : "Free";

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <AppNav
        creditBalance={unmetered ? Number.POSITIVE_INFINITY : creditBalance}
        unmetered={unmetered}
        plan={plan}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
