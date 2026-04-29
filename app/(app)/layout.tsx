import { Sidebar } from "@/components/app/Sidebar";
import { SystemBar } from "@/components/SystemBar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // In production these come from db queries on the authenticated user.
  const creditBalance = 142;
  const plan = "Indie";

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <SystemBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar creditBalance={creditBalance} plan={plan} />
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
