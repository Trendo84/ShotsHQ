import type { Metadata } from "next";
import { Sidebar } from "@/components/app/Sidebar";
import { SystemBar } from "@/components/SystemBar";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/auth/clerk";
import { getBalance } from "@/lib/db/queries/credits";

/** Authenticated app — never indexed, never followed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Auth-gated layout. Resolves credit balance + plan from the canonical
 * Postgres source of truth, then passes to the Sidebar so the credit
 * count shown in the chrome matches every other surface (dashboard,
 * billing ledger, AI panel).
 *
 * Previously the Sidebar fell back to hardcoded `142 · Indie` defaults,
 * which mismatched the dashboard's real balance. Single source now.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user          = await requireUser();
  const creditBalance = await getBalance(user.id);

  // Studio + Lifetime plans are unmetered — show ∞ instead of a stale number.
  const isUnmetered = user.plan === "studio_monthly"
                   || user.plan === "studio_annual"
                   || user.plan === "lifetime";

  const planLabel =
    user.plan === "studio_monthly" ? "Studio"   :
    user.plan === "studio_annual"  ? "Studio"   :
    user.plan === "lifetime"       ? "Lifetime" :
                                     "Free";

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <SystemBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar
          creditBalance={isUnmetered ? Number.POSITIVE_INFINITY : creditBalance}
          plan={planLabel}
        />
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
