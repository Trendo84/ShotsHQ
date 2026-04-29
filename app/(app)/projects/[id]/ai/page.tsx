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
  const [prompt, setPrompt] = useState("Surf forecast app for indie iOS. Wave height, tide, wind. Apple Watch sync.");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLocales, setActiveLocales] = useState<string[]>(["en", "fr", "de", "ja"]);
  const [result, setResult] = useState<{ headline: string; subheadline: string; cta: string } | null>(null);

  function dispatchCopy() {
    setRunning(true);
    setProgress(0);
    setResult(null);
    // Simulate streamed progress.
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRunning(false);
          setResult({
            headline: "TIDE CHARTED.",
            subheadline: "WAVE HEIGHT, WIND, TIDE — IN ONE GLANCE.",
            cta: "CHECK FORECAST",
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
      <Topbar section="AI PANEL" breadcrumb={["OPERATOR", "PROJECTS", "Tideline", "AI"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 02-AI ]</div>
          <h1 className="t-display-xl text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.9]">
            AI<br />MODULES
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 p-6 md:p-10 grid grid-cols-2 gap-3 content-end">
          <div className="border border-[var(--line)] p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">CREDITS</div>
            <div className="t-display text-[36px] t-numeric mt-1">142</div>
          </div>
          <div className="border border-[var(--line)] p-4">
            <div className="t-mono-xs text-[var(--fg-mute)]">QUEUE</div>
            <div className="t-display text-[36px] t-numeric mt-1">0</div>
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
          <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
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

        <aside className="col-span-12 lg:col-span-5 p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-3">[ JOB QUEUE ]</div>
          <ul className="font-mono text-[11px] space-y-1.5">
            {[
              { id: "cp_8a72", task: "ai-generate-copy", state: "RUNNING", at: "10:14:08" },
              { id: "bg_1a93", task: "ai-background",    state: "DONE",    at: "10:11:02" },
              { id: "tr_44e1", task: "translate × 41",   state: "DONE",    at: "10:08:33" },
              { id: "rs_87c0", task: "ai-restyle",       state: "ERR",     at: "10:05:12" },
            ].map((r) => (
              <li key={r.id} className="grid grid-cols-[80px_1fr_60px_56px] gap-2 border-b border-[var(--line)] py-1.5">
                <span className="text-[var(--fg-mute)]">{r.at}</span>
                <span>{r.task}</span>
                <span className={
                  r.state === "RUNNING" ? "text-[var(--accent)]" :
                  r.state === "ERR"     ? "text-[var(--accent)]" :
                  "text-[var(--signal)]"
                }>{r.state}</span>
                <span className="text-[var(--fg-mute)] text-right">{r.id}</span>
              </li>
            ))}
          </ul>
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
