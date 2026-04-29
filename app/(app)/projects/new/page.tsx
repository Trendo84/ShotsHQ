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

  const [submitting, setSubmitting] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Stub: in production this POSTs to /api/projects then redirects.
    // Uses requestAnimationFrame so the spinner has a frame to paint.
    requestAnimationFrame(() => {
      router.push(`/projects/p_new`);
    });
  }

  return (
    <>
      <Topbar section="NEW PROJECT" breadcrumb={["OPERATOR", "PROJECTS", "NEW"]} />

      <div className="grid grid-cols-12 border-b border-[var(--line)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-12">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ INTAKE / 01-PROJECT ]</div>
          <h1 className="t-display-xl text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.9]">
            COMMISSION<br />
            PROJECT
          </h1>
          <p className="t-mono-md text-[var(--fg-dim)] mt-4 max-w-xl">
            FOUR FIELDS, ONE INTAKE. THIS METADATA SEEDS COPY GENERATION,
            ASO HINTS, AND THE INITIAL EDITOR STATE.
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
            ESTIMATED RUNTIME · 90 SECONDS · 0 CREDITS COMMITTED
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
              <div className="t-mono-xs text-[var(--accent)] mb-3">[ AI PREVIEW ]</div>
              <div className="t-display text-[24px] leading-[0.9]">
                {appName || "—"}
              </div>
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">CATEGORY · {category}</div>
              <div className="t-mono-sm text-[var(--fg-dim)] mt-3 leading-relaxed">
                {description || "Short product description seeds the GPT-5 prompt for headline generation."}
              </div>
            </div>
            <div className="flex justify-between">
              <Link href="/dashboard" className="btn">CANCEL</Link>
              <Button variant="accent" onClick={() => setStep(2)} disabled={!name || !appName}>
                NEXT &gt;&gt;
              </Button>
            </div>
          </aside>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-8 border-r border-[var(--line)] p-6 md:p-10">
            <div className="t-mono-xs text-[var(--accent)] mb-2">[ STEP / 02 ]</div>
            <h2 className="t-display text-[clamp(1.75rem,4vw,2.25rem)] leading-[0.9]">DEVICE TARGETS</h2>
            <p className="t-mono-sm text-[var(--fg-mute)] mt-2">
              PICK EVERY DEVICE YOU INTEND TO EXPORT. WE'LL RENDER ALL APPLE-REQUIRED
              SCREENSHOT DIMENSIONS AUTOMATICALLY FROM YOUR SELECTION.
            </p>

            <div className="mt-6">
              <DevicePicker selected={targets} onChange={setTargets} minSelected={1} />
            </div>
          </div>
          <aside className="col-span-12 md:col-span-4 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-mono-xs text-[var(--accent)] mb-3">[ MANIFEST ]</div>
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
              <Button variant="ghost" onClick={() => setStep(1)}>&lt;&lt; BACK</Button>
              <Button variant="accent" onClick={() => setStep(3)} disabled={targets.length === 0}>
                NEXT &gt;&gt;
              </Button>
            </div>
          </aside>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="grid grid-cols-12 border-b border-[var(--line)]">
          <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
            <div className="t-mono-xs text-[var(--accent)] mb-2">[ STEP / 03 ]</div>
            <h2 className="t-display text-[36px]">UPLOAD SCREENS</h2>
            <p className="t-mono-sm text-[var(--fg-mute)] mt-2">DROP RAW iOS SCREENSHOTS BELOW. STORED DIRECT-TO-R2.</p>

            <div className="mt-6 border-2 border-dashed border-[var(--line-strong)] p-12 text-center min-h-[280px] flex flex-col items-center justify-center hover:border-[var(--accent)] transition-colors">
              <div className="t-display text-[32px]">DROP HERE</div>
              <div className="t-mono-sm text-[var(--fg-mute)] mt-2">.PNG · 1290×2796 · 1320×2868 · 2064×2752</div>
              <div className="hazard h-2 w-full mt-6" aria-hidden />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-4">OR <button className="link-tick">SELECT FROM DEVICE</button></div>
            </div>
          </div>
          <aside className="col-span-12 md:col-span-5 p-6 md:p-10 flex flex-col justify-between gap-6">
            <div className="border border-[var(--line)] p-5">
              <div className="t-mono-xs text-[var(--accent)] mb-3">[ READY TO COMMISSION ]</div>
              <p className="t-mono-sm text-[var(--fg-dim)] leading-relaxed">
                ONCE COMMITTED, THE PROJECT WILL OPEN IN THE EDITOR. AI
                MODULES ARE OPT-IN AND CHARGED PER OPERATION.
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>&lt;&lt; BACK</Button>
              <Button variant="accent" onClick={() => submit()} disabled={submitting}>
                {submitting ? "COMMITTING…" : "COMMIT >>"}
              </Button>
            </div>
          </aside>
        </section>
      )}
    </>
  );
}
