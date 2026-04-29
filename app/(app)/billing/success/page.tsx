import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";

export default function SuccessPage() {
  return (
    <>
      <Topbar section="BILLING" breadcrumb={["OPERATOR", "BILLING", "SUCCESS"]} />
      <section className="grid place-items-center min-h-[70vh] p-6">
        <div className="max-w-xl w-full border-2 border-[var(--accent)] bg-[var(--bg)] p-10 shadow-[8px_8px_0_var(--accent)] text-center">
          <div className="t-mono-xs text-[var(--accent)] mb-4">[ TRANSACTION COMPLETE ]</div>
          <div className="t-display-xl text-[clamp(2.5rem,7vw,5rem)] leading-[0.88]">
            CREDITS<br /><span className="text-[var(--accent)]">RECEIVED.</span>
          </div>
          <p className="t-mono-md text-[var(--fg-dim)] mt-4 leading-relaxed">
            STRIPE WEBHOOK ACK&apos;D · CREDIT LEDGER UPDATED · BALANCE
            VISIBLE IN SIDEBAR WITHIN 30 SECONDS.
          </p>
          <div className="hazard h-3 mt-6" aria-hidden />
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/projects/new" className="btn btn-accent">START NEW PROJECT &gt;&gt;</Link>
            <Link href="/billing" className="btn">VIEW LEDGER</Link>
          </div>
        </div>
      </section>
    </>
  );
}
