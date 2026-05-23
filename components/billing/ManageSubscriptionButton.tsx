"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";

/**
 * Client-side island that opens the Stripe-hosted billing portal
 * so a Studio subscriber can manage their subscription (change
 * cadence, update payment method, cancel) without us having to
 * build any of those UI surfaces ourselves.
 *
 * Wiring:
 *   1. Click → POST /api/stripe/portal (no body)
 *   2. Server returns the Stripe portal URL
 *   3. Client navigates with window.location.assign so the back
 *      button from Stripe lands on /billing again
 *
 * Failure modes:
 *   - 400 / no_stripe_customer: user is on a paid plan locally
 *     but no Stripe customer exists. Shouldn't normally happen
 *     once Stripe is in the loop; surface the error honestly.
 *   - 401 / unauthorized: page is auth-gated, but fall back to
 *     /sign-in.
 *
 * Audit cycle #9: /billing had no manage-subscription affordance
 * for Studio users despite the route already existing. The
 * `Manage subscription` button now lives on the billing page when
 * billingStatus.canManageSubscription is true.
 */
export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        window.location.assign("/sign-in");
        return;
      }
      if (!res.ok || !json?.ok || !json.data?.url) {
        const code = json?.error ?? `http_${res.status}`;
        setError(
          code === "no_stripe_customer"
            ? "No Stripe customer on file — contact support@shotshq.com."
            : `Could not open billing portal (${code}).`,
        );
        setLoading(false);
        return;
      }
      window.location.assign(json.data.url as string);
    } catch (err) {
      console.error("[manage-subscription] network failure", err);
      setError("Network error — please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5" data-manage-subscription="true">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="Manage subscription via Stripe portal"
        aria-busy={loading}
        className="btn inline-flex items-center gap-2 text-[12px]"
      >
        {loading
          ? <><Loader2 size={12} className="animate-spin" /> Opening Stripe…</>
          : <><Settings size={12} /> Manage subscription</>}
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
