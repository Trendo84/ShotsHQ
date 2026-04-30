"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DevicePicker } from "@/components/devices/DevicePicker";
import { DEFAULT_PROJECT_DEVICES, DEVICES_BY_ID } from "@/lib/devices/catalog";

const CATEGORIES = [
  "PRODUCTIVITY", "HEALTH & FITNESS", "PHOTO & VIDEO", "MUSIC", "FINANCE",
  "GAMES", "EDUCATION", "TRAVEL", "FOOD & DRINK", "UTILITIES",
  "BUSINESS", "WEATHER", "NAVIGATION", "REFERENCE",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [targets, setTargets] = useState<string[]>(DEFAULT_PROJECT_DEVICES);

  // Step 3 (raw screenshot upload to R2) is intentionally a preview —
  // direct-to-R2 presigned URLs land in the next pass. The COMMIT button
  // creates the project record now and routes into the editor; the user
  // can drop screenshots from inside the editor when that ships.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canCommit = name.trim().length > 0 && appName.trim().length > 0 && targets.length > 0;

  async function commit() {
    if (submitting || !canCommit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:           name.trim(),
          appName:        appName.trim(),
          appDescription: description.trim(),
          category,
          storeTargets:   targets,
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push("/sign-in?next=/projects/new");
        return;
      }
      if (!res.ok || !json?.ok || !json.data?.id) {
        const code = json?.error ?? `http_${res.status}`;
        setSubmitError(
          code === "rate_limited"
            ? "Too many requests — wait a moment and retry."
            : `Could not create project (${code}).`,
        );
        setSubmitting(false);
        return;
      }
      router.push(`/projects/${json.data.id}`);
    } catch (err) {
      console.error("[projects.new] network failure", err);
      setSubmitError("Network error — please retry.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar section="New project" breadcrumb={["Operator", "Projects", "New"]} />

      <div className="grid grid-cols-12 border-b border-[var(--line)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-12">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Step 01 · Project metadata</div>
          <h1 className="t-display text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.92] text-balance">
            Commission<br />
            project.
          </h1>
          <p className="t-prose mt-4 max-w-xl text-[var(--fg-dim)]">
            Four fields, one intake. This metadata seeds copy generation,
            ASO hints, and the initial editor state.
          </p>
        </div>
        <div className="col-span-12 md:col-span-5 p-6 md:p-12 flex flex-col justify-between gap-4">
          <ol className="space-y-3">
            {[
              { n: "01", label: "PROJECT METADATA", active: step === 1 },
              { n: "02", label: "STORE TARGETS",    active: step === 2 },
              { n: "03", label: "UPLOAD SCREENS",   active: step === 3 },
            ].map((s) => (
              <li key={s.n} className={`flex items-center justify-between border ${s.active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]" : "border-[var(--line)]"} px-3 py-2`}>
                <span className="t-mono-xs">{s.n} · {s.label}</span>
                {s.active ? <span className="text-[var(--accent-fg)]">▸</span> : <span className="text-[var(--fg-mute)]">·</span>}
              </li>
            ))}
          </ol>
          <div className="t-mono-xs text-[var(--fg-mute)]">
            EST · 90 SEC · 0 CR COMMITTED
          </div>
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <section className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10 space-y-5">
            <div>
              <Label htmlFor="project-name">PROJECT NAME (INTERNAL)</Label>
              <Input id="project-name" name="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. tideline-spring-launch" />
            </div>
            <div>
              <Label htmlFor="app-name">APP NAME (PUBLIC)</Label>
              <Input id="app-name" name="appName" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Tideline" />
            </div>
            <div>
              <Label htmlFor="app-description">ONE-LINE DESCRIPTION (AI INPUT)</Label>
              <Textarea
                id="app-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The fastest local surf forecast. Wave height, tide, wind. Apple Watch sync."
                rows={3}
              />
            </div>
            <div>
              <div id="category-label" className="text-[12px] text-[var(--fg-mute)] block mb-1.5 font-medium">APP STORE CATEGORY</div>
              <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {CATEGORIES.map((c) => {
                  const isActive = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setCategory(c)}
                      className={`t-mono-xs border px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                        isActive
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                          : "border-[var(--line)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">AI preview</div>
              <div className="t-display text-[24px] leading-[0.9]">
                {appName || "—"}
              </div>
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">CATEGORY · {category}</div>
              <div className="t-mono-sm text-[var(--fg-dim)] mt-3 leading-relaxed">
                {description || "Short product description seeds the GPT-5 prompt for headline generation."}
              </div>
            </div>
            <div className="flex justify-between">
              <Link href="/dashboard" className="btn">Cancel</Link>
              <Button variant="accent" onClick={() => setStep(2)} disabled={!name || !appName}>
                Next ›
              </Button>
            </div>
          </aside>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-8 border-r border-[var(--line)] p-6 md:p-10">
            <div className="t-eyebrow t-eyebrow-accent mb-2">Step 02 · Device targets</div>
            <h2 className="t-display t-h-3">Device targets</h2>
            <p className="t-prose text-[var(--fg-dim)] mt-2 max-w-prose">
              Pick every device you intend to export. We&apos;ll render
              all Apple-required screenshot dimensions automatically
              from your selection.
            </p>

            <div className="mt-6">
              <DevicePicker selected={targets} onChange={setTargets} minSelected={1} />
            </div>
          </div>
          <aside className="col-span-12 md:col-span-4 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Manifest</div>
              <dl className="dl-rule">
                <div><dt>NAME</dt><dd className="truncate">{name || "—"}</dd></div>
                <div><dt>APP</dt><dd className="truncate">{appName || "—"}</dd></div>
                <div><dt>CATEGORY</dt><dd className="truncate">{category}</dd></div>
                <div><dt>DEVICES</dt><dd>{targets.length}</dd></div>
              </dl>
              {targets.length > 0 && (
                <ul className="mt-4 pt-3 border-t border-[var(--line)] space-y-1.5">
                  {targets.slice(0, 6).map((id) => {
                    const d = DEVICES_BY_ID[id];
                    if (!d) return null;
                    return (
                      <li key={id} className="flex items-center justify-between text-[12px]">
                        <span className="truncate text-[var(--fg)]">{d.name}</span>
                        <span className="t-mono-xs text-[var(--fg-dim)] tabular-nums shrink-0 ml-2">{d.shortSpec}</span>
                      </li>
                    );
                  })}
                  {targets.length > 6 && (
                    <li className="text-[11px] text-[var(--fg-mute)] pt-1">+ {targets.length - 6} more</li>
                  )}
                </ul>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>‹ Back</Button>
              <Button variant="accent" onClick={() => setStep(3)} disabled={targets.length === 0}>
                Next ›
              </Button>
            </div>
          </aside>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
            <div className="t-eyebrow t-eyebrow-accent mb-2">Step 03 · Upload screens</div>
            <h2 className="t-display t-h-3">Upload screens</h2>
            <p className="t-prose text-[var(--fg-dim)] mt-2 max-w-prose">
              Drop raw iOS screenshots below — stored direct-to-R2.
            </p>

            <div
              aria-disabled
              title="Direct upload · coming soon"
              className="mt-6 border-2 border-dashed border-[var(--line-strong)] p-8 sm:p-12 text-center min-h-[240px] sm:min-h-[280px] flex flex-col items-center justify-center opacity-60 cursor-not-allowed"
            >
              <div className="t-display text-[28px] sm:text-[32px]">Drop here · soon</div>
              <div className="t-mono-sm text-[var(--fg-mute)] mt-2">
                .PNG · 1290×2796 · 1320×2868 · 2064×2752
              </div>
              <div className="hazard h-2 w-full mt-6" aria-hidden />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-4">
                You&apos;ll drop screens from inside the editor in v1.
              </div>
            </div>
          </div>
          <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">Ready to commission</div>
              <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
                Commit now to create the project and open the editor.
                You can add screenshots, copy, and AI modules from there
                — nothing is charged until you dispatch an AI run.
              </p>
              {submitError && (
                <p role="alert" className="t-mono-xs text-[var(--accent)] mt-3 leading-tight">
                  {submitError}
                </p>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting}>
                ‹ Back
              </Button>
              <Button
                variant="accent"
                onClick={commit}
                disabled={submitting || !canCommit}
                aria-busy={submitting}
                title={canCommit ? undefined : "Fill in name, app name, and at least one device"}
              >
                {submitting ? "Committing…" : "Commit ›"}
              </Button>
            </div>
          </aside>
        </section>
      )}
    </>
  );
}
