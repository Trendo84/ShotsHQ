import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";

/**
 * Stripe checkout success landing.
 *
 * The Stripe redirect URL includes `?cs={CHECKOUT_SESSION_ID}` so the
 * client can correlate, but credit grants are NEVER trusted from this
 * URL — the Stripe webhook is the only authority for ledger updates.
 * This page intentionally does not read the cs query param.
 *
 * Robots.txt disallows /billing/success so the session ID can't leak
 * to crawlers via referrer logs.
 */
export default function SuccessPage() {
  return (
    <>
      <Topbar section="Billing" breadcrumb={["Operator", "Billing", "Success"]} />
      <section className="grid place-items-center min-h-[70vh] p-4 sm:p-6">
        <div className="max-w-xl w-full border-2 border-[var(--accent)] bg-[var(--bg)] p-6 sm:p-10 shadow-[8px_8px_0_var(--accent)] text-center">
          <div className="t-mono-xs text-[var(--accent)] mb-4">[ Transaction complete ]</div>
          <h1 className="t-display text-[clamp(2rem,7vw,5rem)] leading-[0.88]">
            Credits<br />
            <span className="text-[var(--accent)]">received.</span>
          </h1>
          <p className="t-prose text-[var(--fg-dim)] mt-4 leading-relaxed">
            Stripe has confirmed the payment. Your credit ledger is being
            updated by webhook now — the new balance appears in the
            sidebar within 30 seconds. Refresh if you don&apos;t see it.
          </p>
          <div className="hazard h-3 mt-6" aria-hidden />
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <Link href="/projects/new" className="btn btn-accent">
              Start new project &gt;&gt;
            </Link>
            <Link href="/billing" className="btn">View ledger</Link>
          </div>
        </div>
      </section>
    </>
  );
}
