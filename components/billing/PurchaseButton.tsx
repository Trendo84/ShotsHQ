"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  packCtaHelp,
  packCtaLabel,
  type PackRelevance,
} from "@/lib/billing/status";

/**
 * Client-side island that wires a billing pack card to Stripe checkout.
 *
 * Flow:
 *   1. Click → POST /api/stripe/checkout { plan }
 *   2. Server returns a checkout URL (signed, single-use)
 *   3. Client navigates with `window.location.assign` so the back button
 *      returns to /billing instead of into Stripe's hosted page state.
 *
 * Cycle-#9 update — the button now respects per-pack relevance:
 *   - `current`   — user is on this plan. Disabled + "Current plan".
 *   - `switch`    — same tier, different cadence. Active + "Switch ›"
 *                   (Stripe checkout handles the proration).
 *   - `upgrade`   — sensible upgrade path. Active + "Upgrade ›".
 *   - `available` — normal purchase. Active + "Purchase ›".
 *   - `redundant` — pack is covered by user's current plan. Disabled
 *                   + "Already covered" + help copy.
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
  /**
   * Plan-aware relevance. Defaults to `available` for backwards
   * compat with any caller that doesn't (yet) compute relevance.
   * The /billing page computes it via `packRelevance(status, id)`.
   */
  relevance = "available",
}: {
  packId: string;
  packName: string;
  accent?: boolean;
  relevance?: PackRelevance;
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
        data-pack-id={packId}
        data-pack-relevance="unknown"
        title={`${packName} · coming soon`}
        aria-label={`${packName} — coming soon`}
        className="w-full mt-3 text-[10px] py-2 transition-colors btn opacity-40 cursor-not-allowed"
      >
        Purchase <span className="text-[var(--fg-mute)]/70 ml-1">· soon</span>
      </button>
    );
  }

  const isPurchasable = relevance === "available" || relevance === "upgrade" || relevance === "switch";
  const ctaLabel      = packCtaLabel(relevance);
  const helpCopy      = packCtaHelp(relevance);

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

  // Non-purchasable states (current / redundant) — disabled CTA with
  // honest copy + help text. No fetch path; defense-in-depth against
  // DevTools strip is just "the route returns an error from Stripe."
  if (!isPurchasable) {
    return (
      <div className="mt-3 space-y-1.5" data-pack-id={packId} data-pack-relevance={relevance}>
        <button
          type="button"
          disabled
          aria-disabled
          aria-label={`${packName} — ${ctaLabel.toLowerCase()}`}
          title={helpCopy ?? undefined}
          className="w-full text-[10px] py-2 transition-colors btn opacity-50 cursor-not-allowed"
        >
          {ctaLabel}
        </button>
        {helpCopy && (
          <p className="t-mono-xs text-[var(--fg-mute)] leading-tight">
            {helpCopy}
          </p>
        )}
      </div>
    );
  }

  // Purchasable states (available / upgrade / switch). `upgrade` and
  // `switch` accent the button to call attention to the meaningful
  // path; `available` follows the caller's accent preference.
  const wantsAccent = accent || relevance === "upgrade" || relevance === "switch";

  return (
    <div className="mt-3 space-y-1.5" data-pack-id={packId} data-pack-relevance={relevance}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={`${ctaLabel} ${packName}`}
        aria-busy={loading}
        title={helpCopy ?? undefined}
        className={`w-full text-[10px] py-2 transition-colors disabled:opacity-60 disabled:cursor-progress inline-flex items-center justify-center gap-2 ${
          wantsAccent ? "btn btn-accent" : "btn"
        }`}
      >
        {loading
          ? <><Loader2 size={11} className="animate-spin" /> Opening…</>
          : <>{ctaLabel}</>}
      </button>
      {helpCopy && !loading && (
        <p className="t-mono-xs text-[var(--fg-mute)] leading-tight">
          {helpCopy}
        </p>
      )}
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
