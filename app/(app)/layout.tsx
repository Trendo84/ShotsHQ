import type { Metadata } from "next";
import { Sidebar } from "@/components/app/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/auth/clerk";
import { getBalance } from "@/lib/db/queries/credits";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const creditBalance = await getBalance(user.id);

  const isUnmetered =
    user.plan === "studio_monthly" ||
    user.plan === "studio_annual" ||
    user.plan === "lifetime";

  const planLabel =
    user.plan === "studio_monthly"
      ? "Studio"
      : user.plan === "studio_annual"
        ? "Studio"
        : user.plan === "lifetime"
          ? "Lifetime"
          : "Free";

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <Sidebar
        creditBalance={isUnmetered ? Number.POSITIVE_INFINITY : creditBalance}
        plan={planLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
      <Toaster />
    </div>
  );
}
