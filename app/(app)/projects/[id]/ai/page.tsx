"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const LOCALES = [
  "en", "fr", "de", "es", "it", "pt-BR", "pt-PT", "nl", "sv", "da",
  "no", "fi", "pl", "cs", "ru", "uk", "tr", "ar", "he", "fa",
  "ja", "ko", "zh-Hans", "zh-Hant", "th", "vi", "id", "ms", "tl", "hi",
  "bn", "ta", "ml", "te", "el", "hu", "ro", "bg", "hr", "sk", "sr",
];

export default function AiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLocales, setActiveLocales] = useState<string[]>(["en"]);
  const [result, setResult] = useState<{ headline: string; subheadline: string; cta: string } | null>(null);

  function dispatchCopy() {
    if (!prompt.trim()) return;
    setRunning(true);
    setProgress(0);
    setResult(null);
    // Streamed progress placeholder — wires to /api/ai/generate-copy in the next pass.
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRunning(false);
          setResult({
            headline:    "—",
            subheadline: "Hook this button up to /api/ai/generate-copy",
            cta:         "—",
          });
          return 100;
        }
        return p + 8;
      });
    }, 120);
  }

  function toggleLocale(l: string) {
    setActiveLocales((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));
  }

  return (
    <>
      <Topbar section="AI PANEL" breadcrumb={["OPERATOR", "PROJECTS", "AI"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 02-AI ]</div>
          <h1 className="t-display-xl text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.9]">
            AI<br />MODULES
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-5 sm:p-6 md:p-10 grid grid-cols-2 gap-3 content-end border-t md:border-t-0 border-[var(--line)]">
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">MODELS</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">2</div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">GPT-5 + Flux 2</div>
          </div>
          <div className="border border-[var(--line)] p-3 sm:p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">QUEUE</div>
            <div className="t-display text-[clamp(1.5rem,3vw,2.25rem)] t-numeric mt-1 leading-none">0</div>
            <div className="t-mono-xs text-[var(--fg-mute)] mt-1">no active</div>
          </div>
        </aside>
      </div>

      {/* Copy module */}
      <section className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 lg:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4">
            <div className="t-mono-xs text-[var(--accent)]">[ MODULE / COPY ]</div>
            <Badge variant="warn">1 CR / GEN</Badge>
          </div>
          <h2 className="t-display text-[36px] mb-4">HEADLINE GENERATOR</h2>
          <Label>APP CONTEXT</Label>
          <Textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Briefly describe your app — name, category, what it does, target user. The model uses this to generate headlines that read like your brand wrote them."
          />
          <div className="mt-4 flex gap-3 items-center">
            <Button variant="accent" disabled={running} onClick={dispatchCopy}>
              {running ? "▸ DISPATCHING…" : "▸ DISPATCH GPT-5 · 1 CR"}
            </Button>
            <span className="t-mono-xs text-[var(--fg-mute)]">
              SCHEMA: HeadlineSchema · ZOD-VALIDATED · MAX 40CH HEADLINE
            </span>
          </div>

          {(running || progress === 100) && (
            <div className="mt-6 border border-[var(--line)] p-4">
              <div className="t-mono-xs text-[var(--fg-mute)] flex justify-between">
                <span>RUN · cp_8a72</span>
                <span className={running ? "text-[var(--accent)]" : "text-[var(--signal)]"}>
                  {running ? `◉ STREAMING ${progress}%` : "◯ COMPLETED"}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-[var(--bg-2)] relative">
                <div className="absolute left-0 top-0 h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              {result && (
                <div className="mt-4">
                  <div className="t-mono-xs text-[var(--fg-mute)]">HEADLINE</div>
                  <div className="t-display text-[36px] leading-[0.85] mt-1">{result.headline}</div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-3">SUBHEADLINE</div>
                  <div className="t-mono-md text-[var(--fg)] mt-1">{result.subheadline}</div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-3">CTA</div>
                  <div className="t-mono-md text-[var(--accent)] mt-1">{result.cta}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-5 p-5 sm:p-6 md:p-10 border-t lg:border-t-0 border-[var(--line)]">
          <div className="t-mono-xs text-[var(--accent)] mb-3">[ JOB QUEUE ]</div>
          <div className="border border-dashed border-[var(--line-strong)] p-5 sm:p-6 text-center">
            <div className="t-mono-xs text-[var(--fg-mute)] mb-2">QUEUE EMPTY</div>
            <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
              Dispatched jobs stream here in real time via Trigger.dev.
              Failed runs auto-refund credits.
            </p>
          </div>
        </aside>
      </section>

      {/* Translate module */}
      <section id="i18n" className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-5 border-r border-[var(--line)] p-6 md:p-10">
          <div className="flex items-center justify-between mb-4">
            <div className="t-mono-xs text-[var(--accent)]">[ MODULE / TRANSLATE ]</div>
            <Badge variant="warn">1 CR / LOC</Badge>
          </div>
          <h2 className="t-display text-[36px] leading-[0.9] mb-4">
            41-LOCALE<br />FAN-OUT
          </h2>
          <p className="t-mono-sm text-[var(--fg-mute)] leading-relaxed">
            EACH SELECTED LOCALE DISPATCHES IN PARALLEL VIA TRIGGER.DEV
            BATCH. AUTO-RELAYOUT FOR DE/JP/AR/HE.
          </p>
          <div className="mt-6 t-mono-xs text-[var(--fg-mute)]">
            SELECTED · {activeLocales.length} OF {LOCALES.length}
          </div>
          <Button variant="accent" className="mt-3 w-full">
            ▸ DISPATCH × {activeLocales.length} · {activeLocales.length} CR
          </Button>
        </div>
        <div className="col-span-12 md:col-span-7 p-6 md:p-10">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1">
            {LOCALES.map((l) => {
              const active = activeLocales.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => toggleLocale(l)}
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

      <div className="px-6 py-4 t-mono-xs text-[var(--fg-mute)] flex justify-between">
        <span>PROJECT · {id}</span>
        <Link href={`/projects/${id}`} className="link-tick">← OVERVIEW</Link>
      </div>
    </>
  );
}
