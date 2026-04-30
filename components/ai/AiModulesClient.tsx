"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

/**
 * AI dispatch client. Two modules wired end-to-end:
 *
 *   1. Copy   → POST /api/ai/generate-copy   → poll /api/ai/runs/[id]
 *   2. Backdrop → POST /api/ai/template-set  → poll /api/ai/runs/[id]
 *
 * Polling is the v1 streaming strategy — Trigger.dev's realtime hook
 * (useRealtimeRun) requires a public access token issued at dispatch
 * time. Polling avoids that surface area and is fine at our cost
 * profile (~5–30s task durations, 1.5s poll interval = max ~20 reqs).
 *
 * Both modules surface inline errors in the result panel rather than
 * toasting — the operator sees the failure mode at the same place
 * they're looking for the success result.
 */

const LOCALES = [
  "en", "fr", "de", "es", "it", "pt-BR", "pt-PT", "nl", "sv", "da",
  "no", "fi", "pl", "cs", "ru", "uk", "tr", "ar", "he", "fa",
  "ja", "ko", "zh-Hans", "zh-Hant", "th", "vi", "id", "ms", "tl", "hi",
  "bn", "ta", "ml", "te", "el", "hu", "ro", "bg", "hr", "sk", "sr",
];

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS  = 240_000; // 4 minutes — gpt-image-1 worst-case

const BACKDROP_STYLES = [
  { id: "minimal-light",     label: "Minimal · light"   },
  { id: "tactical-dark",     label: "Tactical · dark"   },
  { id: "warm-organic",      label: "Warm · organic"    },
  { id: "playful-gradient",  label: "Playful · gradient"},
  { id: "tech-minimal",      label: "Tech · minimal"    },
  { id: "editorial",         label: "Editorial"         },
] as const;
type BackdropStyle = typeof BACKDROP_STYLES[number]["id"];

type RunState =
  | { phase: "idle";       output?: never; error?: never; runId?: never }
  | { phase: "dispatching"; output?: never; error?: never; runId?: never }
  | { phase: "running";    output?: never; error?: never; runId: string }
  | { phase: "completed";  output: unknown; error?: never; runId: string }
  | { phase: "failed";     output?: never; error: string; runId?: string };

type CopyOutput = {
  ok: true;
  headline: string;
};
type TemplateSetOutput = {
  ok: true;
  url: string;
  cost?: number;
  newBalance?: number;
};

export function AiModulesClient({
  projectId,
  appName: initialAppName,
  appDescription: initialDescription,
  category,
}: {
  projectId:      string;
  appName:        string;
  appDescription: string;
  category:       string;
}) {
  // ── Copy module ──────────────────────────────────────────────────────────
  const [appName,     setAppName]     = useState(initialAppName);
  const [description, setDescription] = useState(initialDescription);
  const [copyState,   setCopyState]   = useState<RunState>({ phase: "idle" });

  async function dispatchCopy() {
    if (copyState.phase === "dispatching" || copyState.phase === "running") return;
    if (!appName.trim() || description.trim().length < 10) {
      setCopyState({
        phase: "failed",
        error: "Add an app name + at least 10 characters of description.",
      });
      return;
    }
    setCopyState({ phase: "dispatching" });
    const dispatch = await fetch("/api/ai/generate-copy", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        projectId,
        appName:        appName.trim(),
        appDescription: description.trim(),
        category:       category || "Productivity",
        locale:         "en",
      }),
    });
    const json = await dispatch.json().catch(() => null);
    if (!dispatch.ok || !json?.ok || !json.data?.runId) {
      setCopyState({
        phase: "failed",
        error: errorMessage(dispatch.status, json?.error),
      });
      return;
    }
    setCopyState({ phase: "running", runId: json.data.runId });
  }

  // ── Backdrop module ──────────────────────────────────────────────────────
  const [style, setStyle] = useState<BackdropStyle>("tactical-dark");
  const [bgState, setBgState] = useState<RunState>({ phase: "idle" });

  async function dispatchBackdrop() {
    if (bgState.phase === "dispatching" || bgState.phase === "running") return;
    if (!appName.trim() || description.trim().length < 10) {
      setBgState({
        phase: "failed",
        error: "Add an app name + at least 10 characters of description.",
      });
      return;
    }
    setBgState({ phase: "dispatching" });
    const res = await fetch("/api/ai/template-set", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        projectId,
        appName:        appName.trim(),
        appDescription: description.trim(),
        category:       category || "Productivity",
        style,
        device:         "iphone",
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json.data?.runId) {
      setBgState({
        phase: "failed",
        error: errorMessage(res.status, json?.error),
      });
      return;
    }
    setBgState({ phase: "running", runId: json.data.runId });
  }

  // ── Translate module (still mocked — wires up when batch-translate is approved) ──
  const [activeLocales, setActiveLocales] = useState<string[]>(["en"]);
  function toggleLocale(l: string) {
    setActiveLocales((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));
  }

  // ── Poll runs ───────────────────────────────────────────────────────────
  useRunPoller(copyState, setCopyState);
  useRunPoller(bgState,   setBgState);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Project · AI modules</div>
          <h1 className="t-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.92] text-balance">
            AI<br />modules
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 grid grid-cols-2 gap-3 content-end border-t md:border-t-0 border-[var(--line)]">
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">MODELS</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">2</div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">copy + image</div>
          </div>
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">QUEUE</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">
              {(copyState.phase === "running" || copyState.phase === "dispatching" ? 1 : 0) +
               (bgState.phase === "running"  || bgState.phase === "dispatching"  ? 1 : 0)}
            </div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">active runs</div>
          </div>
        </aside>
      </div>

      {/* ── Copy module ───────────────────────────────────────────────────── */}
      <section className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 lg:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-eyebrow t-eyebrow-accent">Module · Copy</div>
            <Badge variant="warn">1 cr / gen</Badge>
          </div>
          <h2 className="t-display text-[clamp(1.5rem,3vw,2.25rem)] leading-[0.95] mb-4">
            Headline generator
          </h2>
          <Label htmlFor="ai-app-name">App name</Label>
          <input
            id="ai-app-name"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Tideline"
            className="w-full px-3 py-2 border border-[var(--line-strong)] bg-[var(--bg)] text-[14px] focus-visible:outline-none focus-visible:border-[var(--accent)]"
          />
          <Label htmlFor="ai-app-context" className="mt-3 block">App context</Label>
          <Textarea
            id="ai-app-context"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe your app — name, category, what it does, target user. The model uses this to generate headlines that read like your brand wrote them."
          />
          <div className="mt-4 flex gap-3 items-center flex-wrap">
            <Button
              variant="accent"
              disabled={copyState.phase === "dispatching" || copyState.phase === "running"}
              onClick={dispatchCopy}
            >
              {copyState.phase === "dispatching"
                ? "▸ DISPATCHING…"
                : copyState.phase === "running"
                ? "▸ STREAMING…"
                : "▸ DISPATCH GPT-5 · 1 CR"}
            </Button>
            <span className="t-mono-xs text-[var(--fg-mute)]">
              SCHEMA · HeadlineSchema · ZOD · MAX 40CH
            </span>
          </div>

          <RunPanel
            label="Copy run"
            state={copyState}
            renderResult={(output) => {
              const o = output as CopyOutput | null;
              if (!o?.headline) return null;
              return (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="t-mono-xs text-[var(--fg-mute)]">HEADLINE</div>
                    <div className="t-display text-[36px] leading-[0.85] mt-1">{o.headline}</div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        <aside className="col-span-12 lg:col-span-5 p-5 sm:p-6 md:p-10 border-t lg:border-t-0 border-[var(--line)]">
          <div className="t-eyebrow t-eyebrow-accent mb-3">Job queue</div>
          <div className="border border-dashed border-[var(--line-strong)] p-5 sm:p-6 text-center">
            <div className="t-mono-xs text-[var(--fg-mute)] mb-2">
              {copyState.phase === "running" || bgState.phase === "running" ? "ACTIVE" : "QUEUE EMPTY"}
            </div>
            <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
              Dispatched jobs run on Trigger.dev. Failed runs auto-refund credits.
            </p>
          </div>
        </aside>
      </section>

      {/* ── Backdrop module ───────────────────────────────────────────────── */}
      <section id="backdrop" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 lg:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-eyebrow t-eyebrow-accent">Module · Backdrop</div>
            <Badge variant="warn">8 cr / gen</Badge>
          </div>
          <h2 className="t-display text-[clamp(1.5rem,3vw,2.25rem)] leading-[0.95] mb-4">
            Template set · gpt-image-1
          </h2>
          <Label className="block mb-2">Style</Label>
          <div role="radiogroup" aria-label="Backdrop style" className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {BACKDROP_STYLES.map((s) => {
              const active = style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStyle(s.id)}
                  className={`t-mono-xs uppercase tracking-[0.12em] border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--fg-mute)] hover:text-[var(--fg)] hover:border-[var(--accent)]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-3 items-center flex-wrap">
            <Button
              variant="accent"
              disabled={bgState.phase === "dispatching" || bgState.phase === "running"}
              onClick={dispatchBackdrop}
            >
              {bgState.phase === "dispatching"
                ? "▸ DISPATCHING…"
                : bgState.phase === "running"
                ? "▸ RENDERING…"
                : "▸ DISPATCH gpt-image-1 · 8 CR"}
            </Button>
            <span className="t-mono-xs text-[var(--fg-mute)]">
              1536×1024 · 6-frame composition
            </span>
          </div>

          <RunPanel
            label="Backdrop run"
            state={bgState}
            renderResult={(output) => {
              const o = output as TemplateSetOutput | null;
              if (!o?.url) return null;
              return (
                <div className="mt-4">
                  <div className="t-mono-xs text-[var(--fg-mute)] mb-2">RESULT</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.url}
                    alt="Generated 6-frame backdrop"
                    className="w-full border border-[var(--line)] block"
                  />
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-2 flex justify-between">
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="link-tick">
                      OPEN FULL ↗
                    </a>
                    {typeof o.newBalance === "number" && (
                      <span>BALANCE · {o.newBalance}</span>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>

        <aside className="col-span-12 lg:col-span-5 p-5 sm:p-6 md:p-10 border-t lg:border-t-0 border-[var(--line)]">
          <div className="t-eyebrow t-eyebrow-accent mb-3">How it routes</div>
          <ol className="space-y-2 t-mono-sm text-[var(--fg-dim)] leading-relaxed">
            <li>1 · Pre-flight balance check (debit happens in the task)</li>
            <li>2 · Dispatch <code>ai-template-set</code> to Trigger.dev</li>
            <li>3 · Task debits 8 cr → calls gpt-image-1 → uploads to R2</li>
            <li>4 · Stripe meter event fires for paying customers</li>
            <li>5 · On any failure: credits refund automatically</li>
          </ol>
        </aside>
      </section>

      {/* ── Translate module (still preview) ──────────────────────────────── */}
      <section id="i18n" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-5 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-mono-xs text-[var(--accent)]">[ MODULE / TRANSLATE ]</div>
            <Badge variant="warn">1 CR / LOC</Badge>
          </div>
          <h2 className="t-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[0.9] mb-4">
            41-locale<br />fan-out
          </h2>
          <p className="t-mono-sm text-[var(--fg-mute)] leading-relaxed">
            Each selected locale dispatches in parallel via Trigger.dev
            batch. Auto-relayout for de/jp/ar/he. Generate the headline
            first — translate runs against the saved English copy.
          </p>
          <div className="mt-6 t-mono-xs text-[var(--fg-mute)]">
            SELECTED · {activeLocales.length} OF {LOCALES.length}
          </div>
          <Button
            variant="accent"
            disabled
            title="Translate dispatch · coming soon"
            aria-label="Dispatch translate — coming soon"
            className="mt-3 w-full opacity-50 cursor-not-allowed"
          >
            ▸ DISPATCH × {activeLocales.length} · {activeLocales.length} CR · SOON
          </Button>
        </div>
        <div className="col-span-12 md:col-span-7 p-6 md:p-10">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1">
            {LOCALES.map((l) => {
              const active = activeLocales.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLocale(l)}
                  aria-pressed={active}
                  className={`t-mono-xs uppercase px-2 py-2 border transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "border-[var(--line)] text-[var(--fg-mute)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

// ── Run polling hook ──────────────────────────────────────────────────────────

function useRunPoller(
  state: RunState,
  setState: React.Dispatch<React.SetStateAction<RunState>>,
) {
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (state.phase !== "running" || !state.runId) {
      startedAt.current = null;
      return;
    }
    if (startedAt.current === null) startedAt.current = Date.now();
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res  = await fetch(`/api/ai/runs/${state.runId}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || !json?.ok) {
          setState({
            phase: "failed",
            error: errorMessage(res.status, json?.error),
            runId: state.runId,
          });
          return;
        }
        const status: string = json.data.status;
        if (status === "completed") {
          setState({ phase: "completed", output: json.data.output, runId: state.runId });
          return;
        }
        if (status === "failed") {
          setState({
            phase: "failed",
            error: typeof json.data.error === "string"
              ? json.data.error
              : "Run failed — credits were refunded automatically.",
            runId: state.runId,
          });
          return;
        }
        if (status === "unavailable") {
          setState({
            phase: "failed",
            error: "Trigger.dev not configured — set TRIGGER_SECRET_KEY in Vercel.",
            runId: state.runId,
          });
          return;
        }
        // pending | running — keep polling unless we've blown past the timeout.
        if (Date.now() - (startedAt.current ?? 0) > POLL_TIMEOUT_MS) {
          setState({
            phase: "failed",
            error: "Timed out waiting for the run. Check Trigger.dev dashboard.",
            runId: state.runId,
          });
          return;
        }
      } catch (err) {
        if (cancelled) return;
        // Transient network errors — keep polling, the next tick may succeed.
        // eslint-disable-next-line no-console
        console.warn("[ai.poll] tick error", err);
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.runId]);
}

// ── Run panel UI ──────────────────────────────────────────────────────────────

function RunPanel({
  label,
  state,
  renderResult,
}: {
  label: string;
  state: RunState;
  renderResult: (output: unknown) => React.ReactNode;
}) {
  if (state.phase === "idle") return null;
  const isRunning = state.phase === "dispatching" || state.phase === "running";
  const failed    = state.phase === "failed";
  const done      = state.phase === "completed";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-6 border p-4 ${
        failed ? "border-[var(--accent)]" :
        done   ? "border-[var(--signal)]" :
                 "border-[var(--line)]"
      }`}
    >
      <div className="t-mono-xs text-[var(--fg-mute)] flex justify-between flex-wrap gap-2">
        <span className="truncate">
          {label}
          {state.phase === "running" || state.phase === "completed" || state.phase === "failed"
            ? state.runId ? ` · ${state.runId.slice(0, 12)}` : ""
            : ""}
        </span>
        <span
          className={
            failed     ? "text-[var(--accent)]" :
            done       ? "text-[var(--signal)]" :
            isRunning  ? "text-[var(--accent)]" :
                         "text-[var(--fg-mute)]"
          }
        >
          {state.phase === "dispatching" && "◌ DISPATCHING"}
          {state.phase === "running"     && "◉ RUNNING…"}
          {state.phase === "completed"   && "◯ COMPLETED"}
          {state.phase === "failed"      && "✕ FAILED"}
        </span>
      </div>
      {/* Indeterminate bar — we don't get progress percentages from gpt-image-1.
         A pulsing accent stripe at idle width tells the user something's
         happening without lying about how close to done we are. */}
      {isRunning && (
        <div className="mt-2 h-1 bg-[var(--bg-2)] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[var(--accent)] animate-[ai-shimmer_1400ms_linear_infinite]" />
        </div>
      )}
      {failed && state.error && (
        <p className="mt-2 t-mono-sm text-[var(--accent)] leading-snug">{state.error}</p>
      )}
      {done && renderResult(state.output)}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorMessage(httpStatus: number, code?: string): string {
  if (code === "insufficient_credits") return "Not enough credits. Top up in Billing.";
  if (code === "rate_limited")         return "Too many runs — wait a moment and retry.";
  if (code === "unauthorized")         return "Sign in to dispatch.";
  if (code === "invalid_body")         return "App name + ≥10-char description required.";
  if (code === "dispatch_failed")      return "Could not reach Trigger.dev — check TRIGGER_SECRET_KEY.";
  if (httpStatus >= 500)               return `Server error (${httpStatus}). Try again.`;
  return code ? `Could not start run (${code}).` : `Could not start run.`;
}
