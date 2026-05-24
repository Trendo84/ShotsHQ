"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, LayoutTemplate, Smartphone, Upload } from "lucide-react";
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

type StepNum = 1 | 2 | 3;
const STEP_META: Record<StepNum, { label: string; title: string; body: string; icon: typeof LayoutTemplate }> = {
  1: {
    label: "About",
    title: "Start with the basics.",
    body: "Name the app, write one clear line about it, and pick the closest App Store category. This seeds the editor but doesn’t lock anything in.",
    icon: LayoutTemplate,
  },
  2: {
    label: "Devices",
    title: "Pick the devices.",
    body: "Pick every device you plan to submit for. We’ll handle the exact screenshot dimensions for each target automatically.",
    icon: Smartphone,
  },
  3: {
    label: "Screens",
    title: "Upload the screenshots.",
    body: "Commit the project, then drop in the PNGs from Xcode or Simulator. We’ll bucket them into the right device slots automatically.",
    icon: Upload,
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateSlug = searchParams?.get("template") ?? null;
  const seededTemplate = templateSlug ? TEMPLATES_BY_SLUG[templateSlug] ?? null : null;

  const [step, setStep] = useState<StepNum>(1);
  const [appName, setAppName] = useState(seededTemplate ? seededTemplate.name : "");
  const [nameOverride, setNameOverride] = useState<string | null>(
    seededTemplate ? `${seededTemplate.slug}-launch` : null,
  );
  const derivedName = appName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const name = nameOverride ?? (derivedName ? `${derivedName}-launch` : "");

  const [description, setDescription] = useState(seededTemplate ? seededTemplate.subhead : "");
  const [category, setCategory] = useState(
    seededTemplate
      ? CATEGORIES.find((c) => seededTemplate.category.toUpperCase().includes(c.split(" ")[0]!)) ?? CATEGORIES[0]
      : CATEGORIES[0],
  );
  const [targets, setTargets] = useState<string[]>(DEFAULT_PROJECT_DEVICES);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          appName: appName.trim(),
          appDescription: description.trim(),
          category,
          storeTargets: targets,
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
      <Topbar section="New screenshot set" breadcrumb={["Projects", "New"]} />

      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-[64ch]">
            {seededTemplate ? (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-3 py-1 text-[12px] text-[var(--fg-dim)]">
                Starting from template <span className="font-medium text-[var(--fg)]">{seededTemplate.name}</span>
              </p>
            ) : (
              <p className="mb-2 text-[13px] text-[var(--fg-mute)]">Start a new project</p>
            )}
            <p className="mb-2 text-[13px] text-[var(--fg-mute)]">Step {step} of 3</p>
            <h1 className="text-[clamp(2rem,4.4vw,3.4rem)] font-semibold tracking-[-0.045em] text-[var(--fg)] leading-[1.02]">
              {STEP_META[step].title}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.7] text-[var(--fg-dim)]">
              {STEP_META[step].body}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Project creation steps">
            {([1, 2, 3] as const).map((s) => {
              const meta = STEP_META[s];
              const Icon = meta.icon;
              const active = step === s;
              const completed = step > s || (s === 3 && createdProjectId);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStep(s)}
                  aria-current={active ? "step" : undefined}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors",
                    active
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--fg)]"
                      : "border-[var(--line)] bg-[var(--bg-2)] text-[var(--fg-dim)] hover:text-[var(--fg)]",
                  ].join(" ")}
                >
                  {completed ? <CheckCircle2 size={14} className="text-[var(--accent)]" /> : <Icon size={14} />}
                  {meta.label}
                </button>
              );
            })}
          </nav>
        </div>

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="surface p-6 sm:p-7">
              <div className="grid gap-5">
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
                  <p className="mt-2 text-[13px] text-[var(--fg-mute)]">This is what people will recognize first.</p>
                </div>

                <div>
                  <Label htmlFor="app-description">One-line description</Label>
                  <Textarea
                    id="app-description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. The fastest local surf forecast. Wave height, tide, wind. Apple Watch sync."
                    rows={4}
                  />
                  <p className="mt-2 text-[13px] text-[var(--fg-mute)]">Use plain language. You can refine the copy later inside the editor.</p>
                </div>

                <div>
                  <div id="category-label" className="mb-2 text-[13px] font-medium text-[var(--fg)]">App Store category</div>
                  <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CATEGORIES.map((c) => {
                      const isActive = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          onClick={() => setCategory(c)}
                          className={[
                            "rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]",
                            isActive
                              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--fg)]"
                              : "border-[var(--line)] bg-[var(--bg-2)] text-[var(--fg-dim)] hover:text-[var(--fg)]",
                          ].join(" ")}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="surface-raised p-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    aria-expanded={showAdvanced}
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--fg-dim)] transition-colors hover:text-[var(--fg)]"
                  >
                    <span aria-hidden>{showAdvanced ? "▾" : "▸"}</span>
                    Advanced · Internal project name
                  </button>
                  {showAdvanced && (
                    <div className="mt-4">
                      <Label htmlFor="project-name">Internal identifier</Label>
                      <Input
                        id="project-name"
                        name="projectName"
                        value={name}
                        onChange={(e) => setNameOverride(e.target.value)}
                        placeholder={derivedName ? `${derivedName}-launch` : "e.g. tideline-spring-launch"}
                      />
                      <p className="mt-2 text-[13px] text-[var(--fg-mute)]">We auto-generate this from the app name. Only override it if you need something specific.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="surface-raised p-6">
                <div className="mb-2 text-[13px] text-[var(--fg-mute)]">Preview</div>
                <div className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-tight">
                  {appName || "Your app name"}
                </div>
                <div className="mt-2 text-[13px] text-[var(--fg-mute)]">{category}</div>
                <p className="mt-4 text-[14px] leading-[1.65] text-[var(--fg-dim)]">
                  {description || "A short description here helps AI draft headline ideas and keeps the project easier to scan later."}
                </p>
              </div>

              <div className="surface p-5">
                <div className="mb-3 text-[13px] font-medium text-[var(--fg)]">What happens next</div>
                <ul className="space-y-3 text-[13.5px] leading-[1.6] text-[var(--fg-dim)]">
                  <li>Choose the App Store devices you need to export for.</li>
                  <li>Commit the project only when the basics look right.</li>
                  <li>Upload screenshots now or skip and add them in the studio later.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link href="/dashboard" className="inline-flex items-center rounded-[10px] border border-[var(--line)] px-4 py-2.5 text-[14px] text-[var(--fg-dim)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--fg)]">
                  Cancel
                </Link>
                <Button
                  variant="accent"
                  onClick={() => setStep(2)}
                  disabled={!name || !appName.trim()}
                  title={!appName.trim() ? "Add your app name to continue" : undefined}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="surface p-6 sm:p-7">
              <div className="mb-5">
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--fg)]">Device targets</h2>
                <p className="mt-2 text-[14px] leading-[1.65] text-[var(--fg-dim)]">
                  Pick every device family you want to support. ShotsHQ will handle the exact export dimensions behind the scenes.
                </p>
              </div>
              <DevicePicker selected={targets} onChange={setTargets} minSelected={1} />
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="surface-raised p-6">
                <div className="mb-4 text-[13px] text-[var(--fg-mute)]">Project summary</div>
                <dl className="space-y-3 text-[14px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[var(--fg-mute)]">Project</dt>
                    <dd className="text-right text-[var(--fg)]">{name || "—"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[var(--fg-mute)]">App</dt>
                    <dd className="text-right text-[var(--fg)]">{appName || "—"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[var(--fg-mute)]">Category</dt>
                    <dd className="text-right text-[var(--fg)]">{category}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[var(--fg-mute)]">Devices</dt>
                    <dd className="text-right text-[var(--fg)]">{targets.length}</dd>
                  </div>
                </dl>

                {targets.length > 0 && (
                  <ul className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">
                    {targets.slice(0, 6).map((id) => {
                      const d = DEVICES_BY_ID[id];
                      if (!d) return null;
                      return (
                        <li key={id} className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="text-[var(--fg)]">{d.name}</span>
                          <span className="text-[var(--fg-mute)]">{d.shortSpec}</span>
                        </li>
                      );
                    })}
                    {targets.length > 6 && (
                      <li className="pt-1 text-[12px] text-[var(--fg-mute)]">+ {targets.length - 6} more</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="accent" onClick={() => setStep(3)} disabled={targets.length === 0}>
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="surface p-6 sm:p-7">
              <div className="mb-5">
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--fg)]">Upload screenshots</h2>
                <p className="mt-2 text-[14px] leading-[1.65] text-[var(--fg-dim)]">
                  {createdProjectId
                    ? "Drop raw iOS screenshots below. We read the PNG dimensions and route each file to the right device bucket automatically."
                    : "Create the project first, then drop in screenshots here or skip this step and add them from inside the studio later."}
                </p>
              </div>

              {createdProjectId ? (
                <CaptureDropzone
                  projectId={createdProjectId}
                  onComplete={(r) => setCaptureSummary(r)}
                />
              ) : (
                <div
                  aria-disabled
                  title="Create the project to enable upload"
                  className="grid min-h-[280px] place-items-center rounded-[16px] border border-dashed border-[var(--line-strong)] bg-[var(--bg-2)] p-8 text-center"
                >
                  <div>
                    <div className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--fg)]">Upload unlocks after project creation.</div>
                    <div className="mt-3 text-[14px] leading-[1.6] text-[var(--fg-dim)]">Supported sizes include the common iPhone and iPad screenshot dimensions from Xcode and Simulator.</div>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="surface-raised p-6">
                <div className="mb-3 text-[13px] text-[var(--fg-mute)]">
                  {createdProjectId ? "Project ready" : "Before you commit"}
                </div>

                {!createdProjectId ? (
                  <p className="text-[14px] leading-[1.65] text-[var(--fg-dim)]">
                    Creating the project stores the name, description, category, and device targets. Nothing is charged until you actually run AI tools later.
                  </p>
                ) : (
                  <>
                    <dl className="space-y-3 text-[14px]">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-[var(--fg-mute)]">Project</dt>
                        <dd className="text-right text-[var(--fg)]">{name || appName || "—"}</dd>
                      </div>
                      {captureSummary && (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-[var(--fg-mute)]">Uploaded</dt>
                            <dd className="text-right text-[var(--fg)]">{captureSummary.inserted}</dd>
                          </div>
                          {captureSummary.skipped > 0 && (
                            <div className="flex items-start justify-between gap-3">
                              <dt className="text-[var(--fg-mute)]">Skipped</dt>
                              <dd className="text-right text-[var(--fg-dim)]">{captureSummary.skipped} duplicate file{captureSummary.skipped === 1 ? "" : "s"}</dd>
                            </div>
                          )}
                        </>
                      )}
                    </dl>
                    <p className="mt-4 text-[13.5px] leading-[1.6] text-[var(--fg-dim)]">
                      {captureSummary
                        ? "You can head into the studio now and start composing the actual screenshot pack."
                        : "Drop your screenshots now, or skip and start composing in the studio with an empty frame list."}
                    </p>
                  </>
                )}

                {submitError && (
                  <p role="alert" className="mt-4 text-[13px] text-[var(--accent)]">
                    {submitError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting || !!createdProjectId}>
                  Back
                </Button>

                {!createdProjectId ? (
                  <Button
                    variant="accent"
                    onClick={commit}
                    disabled={submitting || !canCommit}
                    aria-busy={submitting}
                    title={canCommit ? undefined : "Fill in the basics and keep at least one device selected"}
                  >
                    {submitting ? "Committing…" : "Commit"}
                    {!submitting && <ChevronRight size={14} />}
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    onClick={() => router.push(`/projects/${createdProjectId}/studio`)}
                  >
                    Open studio
                    <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
