"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Client-side island that wires a billing pack card to Stripe checkout.
 *
 * Flow:
 *   1. Click → POST /api/stripe/checkout { plan }
 *   2. Server returns a checkout URL (signed, single-use)
 *   3. Client navigates with `window.location.assign` so the back button
 *      returns to /billing instead of into Stripe's hosted page state.
 *
 * Failure modes:
 *   - 401 / unauthorized: shouldn't reach here (page is auth-gated), but
 *     fall back to /sign-in if it does.
 *   - 500 / checkout_failed: Stripe price not configured. Surface the
 *     error inline so the operator sees it without opening DevTools.
 *
 * Idempotency: the route returns a fresh session URL on every click —
 * Stripe sessions are short-lived (24h) so duplicate clicks just yield
 * a new session URL. No client-side dedupe needed.
 */
type Plan = "indie" | "pro" | "studio_monthly" | "studio_annual" | "lifetime";

const PLAN_FROM_ID: Record<string, Plan | null> = {
  indie:          "indie",
  pro:            "pro",
  studio_monthly: "studio_monthly",
  studio_annual:  "studio_annual",
  lifetime:       "lifetime",
};

export function PurchaseButton({
  packId,
  packName,
  accent = false,
}: {
  packId: string;
  packName: string;
  accent?: boolean;
}) {
  const plan = PLAN_FROM_ID[packId] ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // No plan mapping → render "soon" treatment (matches pre-Stripe state).
  if (!plan) {
    return (
      <button
        type="button"
        disabled
        title={`${packName} · coming soon`}
        aria-label={`${packName} — coming soon`}
        className={`w-full mt-3 text-[10px] py-2 transition-colors opacity-50 cursor-not-allowed ${
          accent ? "btn btn-accent" : "btn"
        }`}
      >
        PURCHASE · SOON
      </button>
    );
  }

  async function handleClick() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        window.location.assign("/sign-in");
        return;
      }
      if (!res.ok || !json?.ok || !json.data?.url) {
        const code = json?.error ?? `http_${res.status}`;
        setError(
          code === "checkout_failed"
            ? "Checkout unavailable — Stripe price not configured."
            : `Could not start checkout (${code}).`,
        );
        setLoading(false);
        return;
      }
      // Hand off to Stripe.
      window.location.assign(json.data.url as string);
    } catch (err) {
      console.error("[purchase] network failure", err);
      setError("Network error — please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={`Purchase ${packName}`}
        aria-busy={loading}
        className={`w-full text-[10px] py-2 transition-colors disabled:opacity-60 disabled:cursor-progress inline-flex items-center justify-center gap-2 ${
          accent ? "btn btn-accent" : "btn"
        }`}
      >
        {loading
          ? <><Loader2 size={11} className="animate-spin" /> OPENING…</>
          : <>PURCHASE &gt;&gt;</>}
      </button>
      {error && (
        <p
          role="alert"
          className="t-mono-xs text-[var(--accent)] leading-tight"
        >
          {error}
        </p>
      )}
    </div>
  );
}
