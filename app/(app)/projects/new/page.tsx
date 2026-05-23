"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DevicePicker } from "@/components/devices/DevicePicker";
import { CaptureDropzone } from "@/components/capture/CaptureDropzone";
import { DEFAULT_PROJECT_DEVICES, DEVICES_BY_ID } from "@/lib/devices/catalog";
import { TEMPLATES_BY_SLUG } from "@/lib/templates/catalog";

const CATEGORIES = [
  "PRODUCTIVITY", "HEALTH & FITNESS", "PHOTO & VIDEO", "MUSIC", "FINANCE",
  "GAMES", "EDUCATION", "TRAVEL", "FOOD & DRINK", "UTILITIES",
  "BUSINESS", "WEATHER", "NAVIGATION", "REFERENCE",
];

/**
 * Per-step header content. The top section of /projects/new used to be
 * hardcoded "Step 01 · Project metadata" / "Commission project." regardless
 * of which step the user was on — which made step 02 feel "missing"
 * (the visual anchor never updated, so users scrolled past the device
 * picker without realizing they'd advanced). This map drives the header
 * dynamically off `step`.
 */
type StepNum = 1 | 2 | 3;
const STEP_META: Record<StepNum, { eyebrow: string; title: [string, string]; body: string }> = {
  1: {
    eyebrow: "Step 01 · About your app",
    title:   ["Tell us", "what ships."],
    body:    "App name, one-line pitch, App Store category. We use these to seed AI copy and pre-fill the editor — nothing is published anywhere.",
  },
  2: {
    eyebrow: "Step 02 · Device targets",
    title:   ["Pick the", "devices."],
    body:    "Pick every device you intend to submit. Each one gets all Apple-required screenshot dimensions, ready to drop into App Store Connect.",
  },
  3: {
    eyebrow: "Step 03 · Upload screens",
    title:   ["Drop your", "screens."],
    body:    "Commit the project, then drop raw .PNGs straight from Xcode or the Simulator. We auto-bucket each by dimension into the right device slot. You can also skip and add screens from inside the editor later.",
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Template seeding — see docs/audits/2026-04-30-comet-sonnet-editor.md #1
  // and lib/templates/catalog.ts. Logged-in users clicking a template card
  // arrive here with `?template=<slug>`. Anonymous users land here after
  // sign-up via the same path. We pre-fill the form fields the template
  // gives us hints for; the user can edit anything before committing.
  // Pre-fill is a hint, not a lock.
  const templateSlug = searchParams?.get("template") ?? null;
  const seededTemplate = templateSlug ? TEMPLATES_BY_SLUG[templateSlug] ?? null : null;

  const [step, setStep] = useState<StepNum>(1);
  // App name is the only required textual identity field at first
  // contact. The "internal" project name auto-derives from it (kebab-
  // cased + "-launch" suffix); the user can override but doesn't have
  // to. This drops the cognitive load on Step 1 from four fields to
  // three for a "ship in minutes" promise.
  const [appName, setAppName] = useState(
    seededTemplate ? seededTemplate.name : "",
  );
  const [nameOverride, setNameOverride] = useState<string | null>(
    seededTemplate ? `${seededTemplate.slug}-launch` : null,
  );
  const derivedName = appName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const name = nameOverride ?? (derivedName ? `${derivedName}-launch` : "");

  const [description, setDescription] = useState(
    seededTemplate ? seededTemplate.subhead : "",
  );
  const [category, setCategory] = useState(
    // Templates' categories don't always map 1:1 to App Store categories.
    // If the slug's category fuzzy-matches one of CATEGORIES, use it; else default.
    seededTemplate
      ? CATEGORIES.find((c) => seededTemplate.category.toUpperCase().includes(c.split(" ")[0]!)) ?? CATEGORIES[0]
      : CATEGORIES[0],
  );
  const [targets, setTargets] = useState<string[]>(DEFAULT_PROJECT_DEVICES);
  // Surface the auto-derived internal name as an optional "advanced"
  // override — collapsed by default so Step 1 reads as 3 fields, not 4.
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 3 wires the CaptureDropzone (drag-drop screen intake) once
  // the project has been created. Two phases:
  //   - Pre-commit: COMMIT creates the project, returns its id, holds
  //     the user on Step 3 (no longer redirects). User can then drop
  //     screens directly into the dropzone.
  //   - Post-capture: dropzone returns `{inserted, skipped}`; we show
  //     a "→ Open editor" CTA. Skip-with-no-screens is also valid;
  //     the editor accepts an empty frame manifest.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [captureSummary, setCaptureSummary] = useState<{ inserted: number; skipped: number } | null>(null);

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
      // Hold the user on Step 3 with the dropzone primed. Routing to
      // the editor moves to the explicit CTA after capture (or the
      // "Skip → Open editor" affordance for users who want to add
      // screens later from inside the editor).
      setCreatedProjectId(json.data.id);
      setSubmitting(false);
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
          <div className="t-eyebrow t-eyebrow-accent mb-2">{STEP_META[step].eyebrow}</div>
          <h1 className="t-display t-h-1 text-balance">
            {STEP_META[step].title[0]}<br />
            <span className="text-[var(--accent)]">{STEP_META[step].title[1]}</span>
          </h1>
          <p className="t-prose mt-4 max-w-xl text-[var(--fg-dim)]">
            {STEP_META[step].body}
          </p>
        </div>
        <div className="col-span-12 md:col-span-5 p-6 md:p-12 flex flex-col justify-between gap-4">
          {/* Right-rail step list — clickable so users can navigate back. */}
          <ol className="space-y-3">
            {([
              { n: 1, code: "01", label: "PROJECT METADATA" },
              { n: 2, code: "02", label: "STORE TARGETS"    },
              { n: 3, code: "03", label: "UPLOAD SCREENS"   },
            ] as const).map((s) => {
              const active = step === s.n;
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setStep(s.n)}
                    aria-current={active ? "step" : undefined}
                    className={`w-full flex items-center justify-between border px-3 py-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <span className="t-mono-xs">{s.code} · {s.label}</span>
                    {active ? (
                      <span className="text-[var(--accent-fg)]">▸</span>
                    ) : (
                      <span className="text-[var(--fg-mute)]">·</span>
                    )}
                  </button>
                </li>
              );
            })}
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
            {/*
              Step 1 was four fields with "Project name (internal)" up
              top — cognitive load that fought a "ship in minutes"
              promise. Now: app name is the lead (it's what users
              actually think about first), description and category
              follow, and the internal project slug lives in an
              optional disclosure (auto-derived if untouched).
            */}
            <div>
              <Label htmlFor="app-name">App name</Label>
              <Input
                id="app-name"
                name="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Tideline"
                autoFocus
              />
              <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
                ▸ How your app appears on the App Store.
              </p>
            </div>
            <div>
              <Label htmlFor="app-description">One-line description</Label>
              <Textarea
                id="app-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. The fastest local surf forecast. Wave height, tide, wind. Apple Watch sync."
                rows={3}
              />
              <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
                ▸ Seeds AI headline + backdrop generation. You can edit anything in the editor later.
              </p>
            </div>
            <div>
              <div id="category-label" className="text-[12px] text-[var(--fg)] block mb-1.5 font-medium">App Store category</div>
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

            {/* Optional internal-name override — collapsed by default. */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--accent)] inline-flex items-center gap-2 transition-colors"
              >
                <span aria-hidden>{showAdvanced ? "▾" : "▸"}</span>
                {showAdvanced ? "Hide advanced" : "Advanced"}
              </button>
              {showAdvanced && (
                <div className="mt-3">
                  <Label htmlFor="project-name">Internal project name</Label>
                  <Input
                    id="project-name"
                    name="projectName"
                    value={name}
                    onChange={(e) => setNameOverride(e.target.value)}
                    placeholder={derivedName ? `${derivedName}-launch` : "e.g. tideline-spring-launch"}
                  />
                  <p className="t-mono-xs text-[var(--fg-mute)] mt-1.5">
                    ▸ Auto-derived from your app name. Override only if you need a specific identifier.
                  </p>
                </div>
              )}
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
            <div className="space-y-2">
              {!appName.trim() && (
                <p className="t-mono-xs text-[var(--fg-mute)] text-right">
                  ▸ Add your app name to continue.
                </p>
              )}
              <div className="flex justify-between">
                <Link href="/dashboard" className="btn">Cancel</Link>
                <Button
                  variant="accent"
                  onClick={() => setStep(2)}
                  disabled={!name || !appName.trim()}
                  title={!appName.trim() ? "Add your app name to continue" : undefined}
                >
                  Next ›
                </Button>
              </div>
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
              {createdProjectId
                ? "Drop raw iOS screenshots below — we read each PNG's dimensions and bucket them into the right device slot automatically."
                : "Commit the project metadata first, then drop screenshots directly into R2 from this step."}
            </p>

            <div className="mt-6">
              {createdProjectId ? (
                <CaptureDropzone
                  projectId={createdProjectId}
                  onComplete={(r) => setCaptureSummary(r)}
                />
              ) : (
                <div
                  aria-disabled
                  title="Commit the project to enable the dropzone"
                  className="border-2 border-dashed border-[var(--line)] p-8 sm:p-12 text-center min-h-[240px] sm:min-h-[280px] flex flex-col items-center justify-center opacity-50"
                >
                  <div className="t-display text-[28px] sm:text-[32px]">Drop here.</div>
                  <div className="t-mono-sm text-[var(--fg-mute)] mt-2">
                    .PNG · 1290×2796 · 1320×2868 · 2064×2752
                  </div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-4">
                    Commit metadata to enable upload.
                  </div>
                </div>
              )}
            </div>
          </div>
          <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-eyebrow t-eyebrow-accent mb-3">
                {createdProjectId ? "Project committed" : "Ready to commission"}
              </div>
              {!createdProjectId ? (
                <p className="t-prose text-[var(--fg-dim)] leading-relaxed">
                  Commit now to create the project. The dropzone
                  activates after commit — drop a folder of PNGs (we
                  auto-bucket by dimension) or skip and add screens
                  from inside the editor later. Either path is fine;
                  nothing is charged until you dispatch an AI run.
                </p>
              ) : (
                <>
                  <dl className="dl-rule">
                    <div><dt>PROJECT</dt><dd className="truncate">{name || appName || "—"}</dd></div>
                    {captureSummary && (
                      <>
                        <div><dt>UPLOADED</dt><dd className="tabular-nums">{captureSummary.inserted}</dd></div>
                        {captureSummary.skipped > 0 && (
                          <div><dt>SKIPPED</dt><dd className="tabular-nums text-[var(--fg-mute)]">{captureSummary.skipped} (dupes)</dd></div>
                        )}
                      </>
                    )}
                  </dl>
                  <p className="t-mono-xs text-[var(--fg-mute)] mt-3 leading-relaxed">
                    {captureSummary
                      ? "Open the studio to compose your first screenshot set."
                      : "Drop your screens or skip — you can always upload more from inside the studio."}
                  </p>
                </>
              )}
              {submitError && (
                <p role="alert" className="t-mono-xs text-[var(--accent)] mt-3 leading-tight">
                  {submitError}
                </p>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting || !!createdProjectId}>
                ‹ Back
              </Button>
              {!createdProjectId ? (
                <Button
                  variant="accent"
                  onClick={commit}
                  disabled={submitting || !canCommit}
                  aria-busy={submitting}
                  title={canCommit ? undefined : "Fill in name, app name, and at least one device"}
                >
                  {submitting ? "Committing…" : "Commit ›"}
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => router.push(`/projects/${createdProjectId}/studio`)}
                >
                  {captureSummary ? "Open studio →" : "Skip → Open studio"}
                </Button>
              )}
            </div>
          </aside>
        </section>
      )}
    </>
  );
}
