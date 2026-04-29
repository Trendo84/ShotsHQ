import { MarketingHeader } from "@/components/marketing/Header";
import { MarketingFooter } from "@/components/marketing/Footer";
import { StickyCtaBar } from "@/components/marketing/StickyCtaBar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <MarketingHeader />
      <main id="main" className="flex-1">{children}</main>
      <MarketingFooter />
      <StickyCtaBar />
    </div>
  );
}
