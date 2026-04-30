"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

/**
 * AI dispatch client. Three modules wired end-to-end via Trigger.dev:
 *
 *   1. Copy      → POST /api/ai/generate-copy   → poll /api/ai/runs/[id]
 *   2. Backdrop  → POST /api/ai/template-set    → poll /api/ai/runs/[id]
 *   3. Translate → POST /api/ai/translate       → poll /api/ai/runs/[id]
 *
 * Polling is the v1 streaming strategy — Trigger.dev's realtime hook
 * (useRealtimeRun) requires a public access token issued at dispatch
 * time. Polling avoids that surface area and is fine at our cost
 * profile (~5–60s task durations, 1.5s poll interval ≈ ≤40 reqs).
 *
 * Translate uses the Copy module's last result as the source headline —
 * the dispatch button stays disabled until Copy has produced output. If
 * a user re-runs Copy, Translate output is cleared so the two stay in
 * sync.
 *
 * Casing follows the rule in CLAUDE.md: button labels in Title Case,
 * tags / micro-labels at ≤12px in ALL CAPS, descriptive copy in
 * sentence case.
 */

const LOCALES = [
  "en", "fr", "de", "es", "it", "pt-BR", "pt-PT", "nl", "sv", "da",
  "no", "fi", "pl", "cs", "ru", "uk", "tr", "ar", "he", "fa",
  "ja", "ko", "zh-Hans", "zh-Hant", "th", "vi", "id", "ms", "tl", "hi",
  "bn", "ta", "ml", "te", "el", "hu", "ro", "bg", "hr", "sk", "sr",
];

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS  = 240_000; // 4 minutes — gpt-image-1 worst case

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
  | { phase: "idle";        output?: never; error?: never; runId?: never }
  | { phase: "dispatching"; output?: never; error?: never; runId?: never }
  | { phase: "running";     output?: never; error?: never; runId: string  }
  | { phase: "completed";   output: unknown; error?: never; runId: string }
  | { phase: "failed";      output?: never; error: string;  runId?: string };

type CopyOutput        = { ok: true; headline: string };
type TemplateSetOutput = { ok: true; url: string; cost?: number; newBalance?: number };
type TranslateOutput   = { ok: true; results: Record<string, string>; failures: number };

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
    // Re-running copy invalidates any prior translate output — don't show
    // translations of a now-stale headline.
    setTranslateState({ phase: "idle" });
    setCopyState({ phase: "dispatching" });

    const res = await fetch("/api/ai/generate-copy", {
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
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json.data?.runId) {
      setCopyState({ phase: "failed", error: errorMessage(res.status, json?.error) });
      return;
    }
    setCopyState({ phase: "running", runId: json.data.runId });
  }

  // ── Backdrop module ──────────────────────────────────────────────────────
  const [style,   setStyle]   = useState<BackdropStyle>("tactical-dark");
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
      setBgState({ phase: "failed", error: errorMessage(res.status, json?.error) });
      return;
    }
    setBgState({ phase: "running", runId: json.data.runId });
  }

  // ── Translate module ─────────────────────────────────────────────────────
  // Default selection drops English (the source) — picking the user's most
  // common launch markets. They can toggle to any subset of the 41.
  const [activeLocales, setActiveLocales] = useState<string[]>(
    ["fr", "de", "es", "it", "ja", "ko", "zh-Hans"],
  );
  const [translateState, setTranslateState] = useState<RunState>({ phase: "idle" });

  function toggleLocale(l: string) {
    if (l === "en") return; // source — never deselectable
    setActiveLocales((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));
  }
  function selectAllLocales() {
    setActiveLocales(LOCALES.filter((l) => l !== "en"));
  }
  function clearLocales() {
    setActiveLocales([]);
  }

  const sourceHeadline =
    copyState.phase === "completed"
      ? (copyState.output as CopyOutput | null)?.headline ?? null
      : null;

  const canTranslate =
    sourceHeadline !== null &&
    activeLocales.length > 0 &&
    translateState.phase !== "dispatching" &&
    translateState.phase !== "running";

  async function dispatchTranslate() {
    if (!canTranslate || !sourceHeadline) return;
    setTranslateState({ phase: "dispatching" });

    const res = await fetch("/api/ai/translate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        projectId,
        source:     sourceHeadline,
        fromLocale: "en",
        toLocales:  activeLocales,
        context:    [appName.trim(), category, description.trim()].filter(Boolean).join(" · "),
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json.data?.runId) {
      setTranslateState({ phase: "failed", error: errorMessage(res.status, json?.error) });
      return;
    }
    setTranslateState({ phase: "running", runId: json.data.runId });
  }

  // ── Poll runs ───────────────────────────────────────────────────────────
  useRunPoller(copyState,      setCopyState);
  useRunPoller(bgState,        setBgState);
  useRunPoller(translateState, setTranslateState);

  // ── Queue counter ───────────────────────────────────────────────────────
  const activeCount =
    (isInFlight(copyState)      ? 1 : 0) +
    (isInFlight(bgState)        ? 1 : 0) +
    (isInFlight(translateState) ? 1 : 0);

  return (
    <>
      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Project · AI modules</div>
          <h1 className="t-display t-h-2 text-balance">
            Three modules. One credit ledger.
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 grid grid-cols-2 gap-3 content-end border-t md:border-t-0 border-[var(--line)]">
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">MODELS</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">4</div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">copy · backdrop · set · translate</div>
          </div>
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">QUEUE</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">
              {activeCount}
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
          <h2 className="t-display t-h-3 mb-4">Headline generator</h2>
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
              disabled={isInFlight(copyState)}
              aria-busy={isInFlight(copyState)}
              onClick={dispatchCopy}
            >
              {copyState.phase === "dispatching"
                ? "Dispatching…"
                : copyState.phase === "running"
                ? "Streaming…"
                : "Dispatch · GPT-5 · 1 cr"}
            </Button>
            <span className="t-mono-xs text-[var(--fg-mute)]">
              SCHEMA · HEADLINESCHEMA · ZOD · MAX 40CH
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
                    <div className="t-mono-xs text-[var(--fg-mute)]">HEADLINE · EN</div>
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
              {activeCount > 0 ? "ACTIVE" : "QUEUE EMPTY"}
            </div>
            <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
              Dispatched jobs run on Trigger.dev. Failed runs auto-refund credits.
            </p>
          </div>
        </aside>
      </section>

      {/* ── Backdrop module (placeholder for v1.1) ──────────────────────────
         Distinct from Template set below. AI Backdrop = Flux 2 single-frame
         scene regen (2 cr / frame), in-canvas operation. Template Set =
         gpt-image-1 6-frame composition (8 cr / set), whole-carousel
         operation. Disambiguated per audit triage of
         docs/audits/2026-04-30-comet-sonnet-editor.md #3.
         The dispatch wiring lands when ai-background gets its own
         Trigger.dev task — until then this section is locked. */}
      <section id="ai-backdrop" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 lg:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-eyebrow t-eyebrow-accent">Module · AI backdrop</div>
            <Badge variant="warn">2 cr / frame</Badge>
          </div>
          <h2 className="t-display t-h-3 mb-4">Backdrop · Flux 2</h2>
          <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
            Single-frame backdrop regen. Flux 2 swaps the surrounding scene
            around your screenshot — your UI stays pixel-untouched. Use
            this when you want to re-vibe a frame you already like; use
            Template set below when you want a fresh 6-frame carousel from
            scratch.
          </p>
          <Button
            variant="ghost"
            disabled
            title="Single-frame Flux 2 dispatch · coming soon (v1.1)"
            aria-label="Dispatch Flux 2 backdrop — coming in v1.1"
            className="mt-5 opacity-40 cursor-not-allowed"
          >
            Dispatch · Flux 2 · 2 cr <span className="text-[var(--fg-mute)]/70 ml-1">· soon</span>
          </Button>
        </div>
        <aside className="col-span-12 lg:col-span-5 p-5 sm:p-6 md:p-10 border-t lg:border-t-0 border-[var(--line)]">
          <div className="t-eyebrow t-eyebrow-accent mb-3">When to pick which</div>
          <ul className="space-y-2 t-mono-sm text-[var(--fg-dim)] leading-relaxed">
            <li>▸ <span className="text-[var(--fg)]">AI backdrop (this)</span> — already have a frame composition, want a new vibe behind it.</li>
            <li>▸ <span className="text-[var(--fg)]">Template set (below)</span> — empty canvas, want six cohesive frames from app metadata.</li>
            <li>▸ Stack them: dispatch a template set first, then re-backdrop individual frames you want to differentiate.</li>
          </ul>
        </aside>
      </section>

      {/* ── Template set module ─────────────────────────────────────────── */}
      <section id="template-set" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 lg:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-eyebrow t-eyebrow-accent">Module · Template set</div>
            <Badge variant="warn">8 cr / set</Badge>
          </div>
          <h2 className="t-display t-h-3 mb-4">Template set · gpt-image-1</h2>
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
              disabled={isInFlight(bgState)}
              aria-busy={isInFlight(bgState)}
              onClick={dispatchBackdrop}
            >
              {bgState.phase === "dispatching"
                ? "Dispatching…"
                : bgState.phase === "running"
                ? "Rendering…"
                : "Dispatch · gpt-image-1 · 8 cr"}
            </Button>
            <span className="t-mono-xs text-[var(--fg-mute)]">
              1536×1024 · 6-FRAME COMPOSITION
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

      {/* ── Translate module ──────────────────────────────────────────────── */}
      <section id="i18n" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-5 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="t-eyebrow t-eyebrow-accent">Module · Translate</div>
            <Badge variant="warn">1 cr / locale</Badge>
          </div>
          <h2 className="t-display t-h-3 mb-4">41-locale fan-out</h2>
          <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
            Each selected locale dispatches in parallel via a Trigger.dev
            batch. Auto-relayout for de · ja · ar · he. Translate runs
            against your latest English headline — generate that first.
          </p>

          {sourceHeadline && (
            <div className="mt-5 border border-[var(--line)] p-3 bg-[var(--bg-2)]">
              <div className="t-mono-xs text-[var(--fg-mute)] mb-1">SOURCE · EN</div>
              <div className="text-[14px] text-[var(--fg)] leading-snug truncate">
                {sourceHeadline}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <span className="t-mono-xs text-[var(--fg-mute)]">
              SELECTED · {activeLocales.length} OF {LOCALES.length - 1}
            </span>
            <span className="t-mono-xs text-[var(--fg-mute)] flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllLocales}
                className="hover:text-[var(--fg)] underline underline-offset-2 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]"
              >
                ALL
              </button>
              <span className="opacity-40">·</span>
              <button
                type="button"
                onClick={clearLocales}
                className="hover:text-[var(--fg)] underline underline-offset-2 decoration-[var(--line-strong)] hover:decoration-[var(--accent)]"
              >
                CLEAR
              </button>
            </span>
          </div>

          <Button
            variant="accent"
            disabled={!canTranslate}
            aria-busy={isInFlight(translateState)}
            onClick={dispatchTranslate}
            title={
              !sourceHeadline
                ? "Generate a headline above first."
                : activeLocales.length === 0
                ? "Pick at least one locale."
                : undefined
            }
            className="mt-3 w-full"
          >
            {translateState.phase === "dispatching"
              ? "Dispatching…"
              : translateState.phase === "running"
              ? `Translating × ${activeLocales.length}…`
              : !sourceHeadline
              ? "Generate a headline first"
              : `Dispatch × ${activeLocales.length} · ${activeLocales.length} cr`}
          </Button>

          <RunPanel
            label="Translate run"
            state={translateState}
            renderResult={(output) => {
              const o = output as TranslateOutput | null;
              if (!o?.results) return null;
              const entries = Object.entries(o.results);
              return (
                <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto">
                  {entries.map(([locale, text]) => (
                    <div
                      key={locale}
                      className="grid grid-cols-[60px_1fr] gap-3 items-baseline border-b border-[var(--line)] pb-2 last:border-b-0"
                    >
                      <span className="t-mono-xs text-[var(--accent)] uppercase tracking-[0.14em]">
                        {locale}
                      </span>
                      <span
                        className="text-[14px] text-[var(--fg)] leading-snug"
                        // ar / he need rtl flow; everything else inherits ltr
                        dir={locale === "ar" || locale === "he" || locale === "fa" ? "rtl" : "ltr"}
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                  {o.failures > 0 && (
                    <p className="t-mono-xs text-[var(--accent)] pt-2">
                      {o.failures} locale{o.failures === 1 ? "" : "s"} failed — credits refunded automatically.
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>
        <div className="col-span-12 md:col-span-7 p-6 md:p-10">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1">
            {LOCALES.map((l) => {
              const isSource = l === "en";
              const active   = activeLocales.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLocale(l)}
                  aria-pressed={active}
                  disabled={isSource}
                  title={isSource ? "Source locale — always included" : undefined}
                  className={`t-mono-xs uppercase px-2 py-2 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                    isSource
                      ? "border-[var(--line-strong)] bg-[var(--bg-2)] text-[var(--fg-mute)] cursor-default"
                      : active
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function isInFlight(s: RunState): boolean {
  return s.phase === "dispatching" || s.phase === "running";
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
            error: "Timed out waiting for the run. Check the Trigger.dev dashboard.",
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
      {/* Indeterminate bar — we don't get progress percentages from
         gpt-image-1 / GPT-5 / batch-translate. A pulsing accent stripe
         tells the user something's happening without lying about
         how close to done we are. */}
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

// ── Error helpers ─────────────────────────────────────────────────────────────

function errorMessage(httpStatus: number, code?: string): string {
  if (code === "insufficient_credits") return "Not enough credits. Top up in Billing.";
  if (code === "rate_limited")         return "Too many runs — wait a moment and retry.";
  if (code === "unauthorized")         return "Sign in to dispatch.";
  if (code === "invalid_body")         return "App name + ≥10-char description required.";
  if (code === "dispatch_failed")      return "Could not reach Trigger.dev — check TRIGGER_SECRET_KEY.";
  if (httpStatus >= 500)               return `Server error (${httpStatus}). Try again.`;
  return code ? `Could not start run (${code}).` : `Could not start run.`;
}
