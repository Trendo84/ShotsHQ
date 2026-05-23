"use client";

import { Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Client-side forms for the settings page.
 *
 * Cycle #11 — first time these forms ship real save flows. Before, the
 * page exposed a `Save profile · soon` button that was always disabled
 * and an `ASC verify · soon` button that ditto, against marketing copy
 * that promised changes "persist within five seconds". This file is
 * now the honest counterpart.
 *
 * - `ProfileForm` POSTs to /api/settings/profile, tracks dirty state,
 *   and reports idle / saving / saved / error inline. Persisted values
 *   are passed in from the server component so a reload reads the
 *   user's actual stored profile rather than the fixture defaults.
 * - `StudioApiForm` is now an honest v1.1 status surface (Studio plan
 *   gating still in place, but the placeholder API key + webhook
 *   inputs are gone — they pretended a key was real).
 * - `AscForm` is also an honest v1.1 surface — the App Store Connect
 *   integration ships alongside the server render queue (see the
 *   `/docs/asc` doc rewritten in cycle #10).
 *
 * Each section root carries `data-settings-section` so e2e can pin
 * structure independently of copy.
 */

// ── Profile section ──────────────────────────────────────────────────────────

const HANDLE_RE = /^[a-z0-9_-]+$/i;

type ProfileState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

export function ProfileForm({
  email,
  initial,
}: {
  email:   string;
  initial: { displayName: string; handle: string; bio: string };
}) {
  // The "snapshot" is the last value we either loaded from the server
  // or successfully saved. Dirty-state = current ≠ snapshot.
  const [snapshot,     setSnapshot]     = useState(initial);
  const [displayName,  setDisplayName]  = useState(initial.displayName);
  const [handle,       setHandle]       = useState(initial.handle);
  const [bio,          setBio]          = useState(initial.bio);
  const [state,        setState]        = useState<ProfileState>({ kind: "idle" });

  const dirty = useMemo(
    () =>
      displayName !== snapshot.displayName ||
      handle      !== snapshot.handle      ||
      bio         !== snapshot.bio,
    [displayName, handle, bio, snapshot],
  );

  const handleError = useMemo(() => {
    if (handle === "") return null; // empty handle is allowed
    if (handle.length < 3 || handle.length > 30)
      return "Handle must be 3-30 characters.";
    if (!HANDLE_RE.test(handle))
      return "Handle: letters, digits, _ and - only.";
    return null;
  }, [handle]);
  const displayNameError = displayName.length > 50
    ? "Display name must be 50 characters or fewer."
    : null;
  const bioError = bio.length > 280
    ? "Bio must be 280 characters or fewer."
    : null;
  const valid = !handleError && !displayNameError && !bioError;

  const submitting = state.kind === "saving";
  const canSubmit  = dirty && valid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/settings/profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ displayName, handle, bio }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const code = json?.error ?? `http_${res.status}`;
        setState({ kind: "error", message: `Could not save profile (${code}).` });
        return;
      }
      const next = json.data as { displayName: string; handle: string; bio: string };
      setSnapshot(next);
      setDisplayName(next.displayName);
      setHandle(next.handle);
      setBio(next.bio);
      setState({ kind: "saved", at: Date.now() });
    } catch (err) {
      console.error("[settings.profile] network failure", err);
      setState({ kind: "error", message: "Network error — please retry." });
    }
  }

  const statusValue: "idle" | "dirty" | "saving" | "saved" | "error" = submitting
    ? "saving"
    : state.kind === "error"
      ? "error"
      : state.kind === "saved" && !dirty
        ? "saved"
        : dirty
          ? "dirty"
          : "idle";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Profile settings"
      className="space-y-5"
      data-profile-status={statusValue}
      data-profile-dirty={dirty ? "true" : "false"}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="settings-display-name">Display name</Label>
          <Input
            id="settings-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            maxLength={50}
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={displayNameError ? "true" : undefined}
          />
          {displayNameError && (
            <p className="t-mono-xs text-[var(--accent)] mt-1.5" role="alert">
              {displayNameError}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="settings-handle">Handle</Label>
          <Input
            id="settings-handle"
            name="handle"
            type="text"
            autoComplete="username"
            maxLength={30}
            placeholder="your-handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            aria-invalid={handleError ? "true" : undefined}
          />
          {handleError && (
            <p className="t-mono-xs text-[var(--accent)] mt-1.5" role="alert">
              {handleError}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="settings-email">Email</Label>
        <Input
          id="settings-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={email}
          readOnly
        />
        <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
          ▸ Synced from Clerk. Update via your auth provider.
        </p>
      </div>
      <div>
        <Label htmlFor="settings-bio">Bio (public)</Label>
        <Textarea
          id="settings-bio"
          name="bio"
          rows={3}
          maxLength={280}
          autoComplete="off"
          placeholder="Tell people what you ship in one or two lines."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          aria-invalid={bioError ? "true" : undefined}
        />
        <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
          ▸ {bio.length} / 280
        </p>
        {bioError && (
          <p className="t-mono-xs text-[var(--accent)] mt-1.5" role="alert">
            {bioError}
          </p>
        )}
      </div>
      <div className="pt-1 flex items-center gap-3 flex-wrap">
        <Button
          type="submit"
          variant="accent"
          disabled={!canSubmit}
          aria-label={canSubmit ? "Save profile changes" : dirty ? "Save profile — fix validation errors first" : "Save profile — no changes"}
          aria-busy={submitting}
          data-profile-save="true"
          className="text-[12px] tracking-[0.04em] normal-case inline-flex items-center gap-2"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          {submitting ? "Saving…" : "Save profile"}
        </Button>
        {state.kind === "saved" && !dirty && (
          <span
            className="t-mono-xs uppercase tracking-[0.16em] text-[var(--signal)] inline-flex items-center gap-1.5"
            data-profile-saved="true"
            role="status"
          >
            <Check size={12} /> Saved
          </span>
        )}
        {state.kind === "error" && (
          <span
            className="t-mono-xs text-[var(--accent)]"
            role="alert"
            data-profile-error="true"
          >
            {state.message}
          </span>
        )}
        {!dirty && state.kind === "idle" && (
          <span className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.16em]">
            No changes
          </span>
        )}
      </div>
    </form>
  );
}

// ── Studio API section ───────────────────────────────────────────────────────

/**
 * Studio API surface — cycle #11 rewrite.
 *
 * The previous version showed a fake `sk_live_••••` API key and a
 * webhook form with a fake `whsec_••••` secret. Neither was wired to
 * anything. Cycle #10 marked the public REST + webhook API as a v1.1
 * target across the marketing surfaces; the settings section now
 * reflects the same truth.
 *
 * We still distinguish Studio/Lifetime users (who would see the live
 * surface in v1.1) from free users (who upgrade first), so the page
 * stays purchase-funnel-aware.
 */
export function StudioApiForm({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div
        className="border border-dashed border-[var(--line)] p-4 space-y-2"
        data-api-status="locked"
      >
        <p className="t-prose text-[14px]">
          REST + webhook API is included with Studio and Lifetime.
          Upgrade now to be in the first wave when it ships.
        </p>
        <a
          href="/billing"
          className="btn text-[11px] tracking-[0.04em] normal-case inline-flex items-center gap-2"
        >
          Upgrade to Studio →
        </a>
      </div>
    );
  }

  return (
    <div
      className="border border-[var(--line)] p-4 space-y-2"
      data-api-status="planned"
    >
      <p className="t-prose text-[14px]">
        Your Studio plan includes the public REST + webhook API. We&apos;ll
        email the day it ships — see{" "}
        <a href="/docs/api" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">/docs/api</a>{" "}
        for the planned contract.
      </p>
    </div>
  );
}

// ── App Store Connect section ────────────────────────────────────────────────

/**
 * App Store Connect surface — cycle #11 rewrite.
 *
 * The previous version exposed a multi-field credential form (Issuer
 * ID, Key ID, .p8 private key) with a permanently-disabled `Verify
 * and save · soon` button. A user could paste a real .p8 into the
 * textarea and walk away thinking it was saved — none of it was.
 * That's the worst-case dead control: it looks alive enough to
 * sink real secrets into a do-nothing form.
 *
 * Cycle #11 removes the pseudo-actionable form entirely and replaces
 * it with an honest v1.1 status surface. Cycle #10 had already marked
 * the ASC integration as v1.1 on the public docs; this aligns the
 * authenticated surface with the same truth. The data-asc-status hook
 * is `planned` so any future test that wires up real verification can
 * advance the status through `disconnected → draft → verifying →
 * connected → error` without changing the contract shape.
 */
export function AscForm() {
  return (
    <div
      className="border border-[var(--line)] p-4 space-y-2"
      data-asc-status="planned"
    >
      <p className="t-prose text-[14px]">
        Direct push to App Store Connect ships alongside the server
        render queue. We&apos;ll validate your Issuer ID, Key ID, and{" "}
        <samp>.p8</samp> against Apple in-flight — and never re-display
        the raw key after the first save.
      </p>
      <p className="t-mono-xs text-[var(--fg-dim)]">
        See <a href="/docs/asc" className="text-[var(--fg-dim)] hover:text-[var(--accent)] underline">/docs/asc</a> for the planned setup flow.
      </p>
    </div>
  );
}
