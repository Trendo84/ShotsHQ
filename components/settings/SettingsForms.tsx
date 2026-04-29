"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Client-side forms for the settings page. Each section is a real
 * `<form>` element with proper field IDs, name attributes, autocomplete
 * hints, and (where applicable) value masking.
 *
 * The App Store Connect .p8 private key uses CSS text-security to mask
 * the key after it's been entered, with an explicit show/hide toggle.
 * Once a real save backend is wired, the form should never re-display
 * the raw key — show "•••••••••••" + a "Rotate key" action instead.
 */

// ── Profile section ──────────────────────────────────────────────────────────

export function ProfileForm({ email, handle }: { email: string; handle: string }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); /* TODO: wire to /api/settings/profile */ }}
      aria-label="Profile settings"
      className="space-y-5"
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
            defaultValue=""
          />
        </div>
        <div>
          <Label htmlFor="settings-handle">Handle</Label>
          <Input
            id="settings-handle"
            name="handle"
            type="text"
            autoComplete="username"
            maxLength={30}
            placeholder={`@${handle}`}
            defaultValue=""
          />
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
          defaultValue=""
        />
      </div>
      <div className="pt-1">
        <Button
          type="submit"
          variant="accent"
          className="text-[12px] tracking-[0.04em] normal-case"
        >
          Save profile
        </Button>
      </div>
    </form>
  );
}

// ── Studio API section ───────────────────────────────────────────────────────

export function StudioApiForm({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="border border-dashed border-[var(--line-strong)] p-5">
        <div className="t-mono-xs text-[var(--fg-mute)] mb-1">LOCKED</div>
        <p className="t-prose text-[14px] mb-3">
          API access is included with Studio and Lifetime plans.
        </p>
        <Button variant="ghost" className="text-[11px] tracking-[0.04em] normal-case">
          ▸ Upgrade to Studio
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); /* TODO: wire to /api/settings/api-keys */ }}
      aria-label="Studio API settings"
      className="space-y-4"
    >
      <div>
        <Label htmlFor="settings-api-key">API key</Label>
        <div className="flex gap-2 flex-wrap">
          <Input
            id="settings-api-key"
            name="apiKey"
            readOnly
            autoComplete="off"
            defaultValue="sk_live_•••••••••••••••••••••••"
            className="flex-1 min-w-0"
          />
          <Button type="button" variant="ghost" className="text-[11px] tracking-[0.04em] normal-case">Copy</Button>
          <Button type="button" variant="destructive" className="text-[11px] tracking-[0.04em] normal-case">Rotate</Button>
        </div>
        <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
          ▸ Shown only once on creation. Lost it? Rotate to issue a new one.
        </p>
      </div>
      <div>
        <Label htmlFor="settings-webhook-url">Webhook URL</Label>
        <Input
          id="settings-webhook-url"
          name="webhookUrl"
          type="url"
          autoComplete="off"
          placeholder="https://your.app/webhooks/shotshq"
        />
      </div>
      <div>
        <Label htmlFor="settings-webhook-secret">Webhook secret</Label>
        <Input
          id="settings-webhook-secret"
          name="webhookSecret"
          readOnly
          autoComplete="off"
          defaultValue="whsec_•••••••••••••••••••••"
        />
      </div>
    </form>
  );
}

// ── App Store Connect section ────────────────────────────────────────────────

export function AscForm() {
  const [showKey, setShowKey] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const isMasked = !showKey && keyValue.length > 0;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); /* TODO: wire to /api/settings/asc */ }}
      aria-label="App Store Connect credentials"
      className="space-y-4"
    >
      <div>
        <Label htmlFor="settings-asc-issuer">Issuer ID</Label>
        <Input
          id="settings-asc-issuer"
          name="issuerId"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="69a6de7d-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
          ▸ App Store Connect → Users and Access → Integrations → API Keys.
        </p>
      </div>

      <div>
        <Label htmlFor="settings-asc-key-id">Key ID</Label>
        <Input
          id="settings-asc-key-id"
          name="keyId"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="2X9YABCDEFG"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="settings-asc-private-key">Private key (.p8)</Label>
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            disabled={keyValue.length === 0}
            className="inline-flex items-center gap-1.5 t-mono-xs uppercase tracking-[0.14em] text-[var(--fg-mute)] hover:text-[var(--fg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={showKey ? "Hide private key" : "Show private key"}
            aria-pressed={showKey}
          >
            {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <Textarea
          id="settings-asc-private-key"
          name="privateKey"
          rows={6}
          autoComplete="off"
          spellCheck={false}
          placeholder="-----BEGIN PRIVATE KEY-----..."
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          // CSS-level masking — characters render as •••• when hidden.
          // This is sensitive cryptographic material; never display by default.
          style={
            isMasked
              ? ({
                  WebkitTextSecurity: "disc",
                  MozTextSecurity: "disc",
                  textSecurity: "disc",
                } as React.CSSProperties)
              : undefined
          }
        />
        <p className="t-mono-xs text-[var(--accent)] mt-1.5">
          ⚠ Sensitive cryptographic material. Never share or screenshot
          this field. Once saved, the raw key is never shown again — you
          can rotate to issue a new one.
        </p>
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          variant="accent"
          className="text-[12px] tracking-[0.04em] normal-case"
        >
          Verify and save
        </Button>
      </div>
    </form>
  );
}
