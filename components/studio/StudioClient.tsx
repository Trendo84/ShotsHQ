"use client";

import * as React from "react";
import { Download, Image as ImageIcon, Upload, Wand2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveStudio } from "@/app/actions/studio";
import { StudioPanel } from "./StudioPanel";
import {
  CANVAS_BASE_WIDTH,
  DEVICE_FRAMES,
  DEVICE_SIZES,
  LAYOUT_PRESETS,
  THEME_PRESETS,
  defaultStudioDesign,
  deviceById,
  frameById,
  themeById,
  type BackgroundKind,
  type StudioDesign,
} from "./types";
import type { DeviceId } from "@/lib/canvas/schema";
import { downloadDataUrl, exportName, measurePng, renderPanelToPng } from "./export";

type Props = {
  projectId: string;
  projectName: string;
  appName: string;
  appDescription: string;
  initialStudio?: StudioDesign | null;
};

type ExportResult = {
  file: string;
  expected: string;
  actual: string;
  ok: boolean;
};

type SaveState = "saved" | "dirty" | "saving" | "error";

const PREVIEW_W = 264;
const ALIGNMENTS: StudioDesign["align"][] = ["left", "center", "right"];
const FONT_CHOICES: StudioDesign["fontFamily"][] = ["display", "sans", "mono"];
const BACKGROUND_KINDS: BackgroundKind[] = ["radial", "linear", "solid"];

export function StudioClient({
  projectId,
  projectName,
  appName,
  appDescription,
  initialStudio,
}: Props) {
  const [design, setDesign] = React.useState<StudioDesign>(() => {
    if (initialStudio) return initialStudio;
    const d = defaultStudioDesign();
    return {
      ...d,
      headline: appName ? `${appName}\nthat ships clean.` : d.headline,
      subhead: appDescription || d.subhead,
    };
  });
  const [busy, setBusy] = React.useState(false);
  const [log, setLog] = React.useState<ExportResult | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const captureRef = React.useRef<HTMLDivElement>(null);
  const lastObjectUrl = React.useRef<string | null>(null);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveState("saving");
      void saveStudio(projectId, design)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [design, projectId, saveState]);

  const device = deviceById(design.deviceId);
  const previewScale = PREVIEW_W / CANVAS_BASE_WIDTH;
  const previewH = Math.round((CANVAS_BASE_WIDTH * device.height) / device.width * previewScale);

  const compatibleFrames = React.useMemo(
    () => DEVICE_FRAMES.filter((f) => f.families.includes(device.family)),
    [device.family],
  );

  function updateDesign(updater: (current: StudioDesign) => StudioDesign) {
    setDesign((current) => updater(current));
    setSaveState("dirty");
  }

  function patch<K extends keyof StudioDesign>(key: K, value: StudioDesign[K]) {
    updateDesign((current) => ({ ...current, [key]: value }));
  }

  function applyTheme(themeId: string) {
    const theme = themeById(themeId);
    updateDesign((current) => ({
      ...current,
      themeId,
      bg: theme.bg,
      bg2: theme.bg2,
      bgKind: theme.kind,
      text: theme.text,
      accent: theme.accent,
    }));
  }

  function applyDevice(nextDevice: DeviceId) {
    updateDesign((current) => {
      const nextFrame = frameById(current.frameId, nextDevice);
      return {
        ...current,
        deviceId: nextDevice,
        frameId: nextFrame.id,
      };
    });
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
    const url = URL.createObjectURL(file);
    lastObjectUrl.current = url;
    updateDesign((current) => ({
      ...current,
      screenshotUrl: url,
      screenshotRemote: false,
    }));
  }

  function onDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    onUpload(e.dataTransfer.files?.[0]);
  }

  async function exportCurrent() {
    if (!captureRef.current) return;
    setBusy(true);
    setLog(null);
    try {
      const dataUrl = await renderPanelToPng(captureRef.current, device);
      const dims = await measurePng(dataUrl);
      downloadDataUrl(dataUrl, exportName(projectName, device.shortLabel));
      setLog({
        file: exportName(projectName, device.shortLabel),
        expected: `${device.width}×${device.height}`,
        actual: `${dims.width}×${dims.height}`,
        ok: dims.width === device.width && dims.height === device.height,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-12 min-h-[calc(100dvh-7rem)]">
      <section className="col-span-12 xl:col-span-4 border-r border-[var(--line)] bg-[var(--bg)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Studio engine · Phase B</div>
          <h1 className="t-display text-[clamp(1.75rem,4vw,3rem)] leading-[0.92] tracking-[-0.04em] normal-case text-balance">
            Constrained screenshot studio.
          </h1>
          <p className="t-prose mt-3 text-[var(--fg-dim)] max-w-[46ch]">
            The ASOForge-style engine inside ShotsHQ: device frame, layout, headline, background, exact App Store export, and now project persistence.
          </p>
        </div>

        <div className="p-5 space-y-6 max-h-[calc(100dvh-10rem)] overflow-y-auto">
          <StudioField label="Headline">
            <textarea
              value={design.headline}
              onChange={(e) => patch("headline", e.target.value)}
              rows={3}
              className="w-full border border-[var(--line-strong)] bg-[var(--bg-2)] px-3 py-3 text-[15px] leading-[1.15] outline-none focus:border-[var(--accent)]"
            />
          </StudioField>

          <StudioField label="Subhead">
            <textarea
              value={design.subhead}
              onChange={(e) => patch("subhead", e.target.value)}
              rows={3}
              className="w-full border border-[var(--line-strong)] bg-[var(--bg-2)] px-3 py-3 text-[13px] leading-[1.4] outline-none focus:border-[var(--accent)]"
            />
          </StudioField>

          <StudioField label="Screenshot source">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="w-full border border-dashed border-[var(--line-strong)] bg-[var(--bg-2)] px-4 py-6 text-left hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-[var(--accent)]" />
                <div>
                  <div className="t-mono-sm text-[var(--fg)] uppercase tracking-[0.14em]">Upload PNG / JPG</div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-1">
                    {design.screenshotUrl ? "Screenshot loaded into the studio panel." : "Drop a screenshot here or click to pick a file."}
                  </div>
                </div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </StudioField>

          <StudioField label="Device class">
            <div className="grid grid-cols-1 gap-2">
              {DEVICE_SIZES.map((size) => {
                const active = size.id === design.deviceId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => applyDevice(size.id)}
                    className={`border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="t-mono-sm uppercase tracking-[0.12em]">{size.shortLabel}</div>
                    <div className="text-[12px] text-[var(--fg-mute)] mt-1">{size.width}×{size.height}</div>
                  </button>
                );
              })}
            </div>
          </StudioField>

          <StudioField label="Frame style">
            <div className="grid grid-cols-1 gap-2">
              {compatibleFrames.map((frame) => {
                const active = frame.id === design.frameId;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => patch("frameId", frame.id)}
                    className={`border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="t-mono-sm uppercase tracking-[0.12em]">{frame.label}</div>
                    <div className="text-[12px] text-[var(--fg-mute)] mt-1">{frame.hint}</div>
                  </button>
                );
              })}
            </div>
          </StudioField>

          <StudioField label="Layout">
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_PRESETS.map((layout) => {
                const active = layout.id === design.layout;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => patch("layout", layout.id)}
                    className={`border px-3 py-2 t-mono-xs uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {layout.label}
                  </button>
                );
              })}
            </div>
          </StudioField>

          <StudioField label="Theme preset">
            <div className="grid grid-cols-1 gap-2">
              {THEME_PRESETS.map((theme) => {
                const active = theme.id === design.themeId;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyTheme(theme.id)}
                    className={`border p-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="t-mono-sm uppercase tracking-[0.12em]">{theme.label}</div>
                        <div className="text-[12px] text-[var(--fg-mute)] mt-1">{theme.kind} background</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <span className="block w-5 h-5 border border-[var(--line)]" style={{ background: theme.bg }} />
                        <span className="block w-5 h-5 border border-[var(--line)]" style={{ background: theme.bg2 }} />
                        <span className="block w-5 h-5 border border-[var(--line)]" style={{ background: theme.accent }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </StudioField>

          <div className="grid grid-cols-2 gap-4">
            <StudioField label="Align">
              <div className="grid grid-cols-3 gap-2">
                {ALIGNMENTS.map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => patch("align", align)}
                    className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${design.align === align ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </StudioField>
            <StudioField label="Font tone">
              <div className="grid grid-cols-3 gap-2">
                {FONT_CHOICES.map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => patch("fontFamily", font)}
                    className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${design.fontFamily === font ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </StudioField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StudioField label="Headline size">
              <input
                type="range"
                min={24}
                max={52}
                step={1}
                value={design.headlineSize}
                onChange={(e) => patch("headlineSize", Number(e.target.value))}
                className="w-full"
              />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{design.headlineSize}px</div>
            </StudioField>
            <StudioField label="Subhead size">
              <input
                type="range"
                min={11}
                max={22}
                step={1}
                value={design.subheadSize}
                onChange={(e) => patch("subheadSize", Number(e.target.value))}
                className="w-full"
              />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{design.subheadSize}px</div>
            </StudioField>
          </div>

          <StudioField label="Background mode">
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => patch("bgKind", kind)}
                  className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${design.bgKind === kind ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </StudioField>
        </div>
      </section>

      <section className="col-span-12 xl:col-span-8 bg-[var(--bg-2)] min-h-[70dvh]">
        <div className="border-b border-[var(--line)] px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="t-eyebrow t-eyebrow-accent mb-1">Live preview</div>
            <div className="t-mono-sm text-[var(--fg-mute)] uppercase tracking-[0.12em]">
              {device.shortLabel} · exact export {device.width}×{device.height} · proj:{projectId.slice(0, 8)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" type="button" onClick={() => applyTheme(THEME_PRESETS[0]!.id)}>
              <Wand2 size={14} className="mr-2" /> Reset theme
            </Button>
            <Button variant="accent" type="button" disabled={busy} onClick={exportCurrent}>
              <Download size={14} className="mr-2" /> {busy ? "Exporting…" : "Export exact PNG"}
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 xl:p-10 space-y-6">
          <div className="border border-[var(--line-strong)] bg-[var(--bg)] overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3">
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Preview node</div>
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">{PREVIEW_W}px wide on-screen · exact pixels on export</div>
            </div>
            <div className="flex justify-center p-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] overflow-auto">
              <div style={{ width: PREVIEW_W, height: previewH, position: "relative" }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: CANVAS_BASE_WIDTH }}>
                  <StudioPanel design={design} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-px border border-[var(--line)] bg-[var(--line)]">
            <InfoCell label="Engine" value="ASOForge-style Studio" sub="Constrained composition, not a blank canvas" icon={<Wand2 size={14} />} />
            <InfoCell label="Device contract" value={`${device.width}×${device.height}`} sub="Exact App Store export target" icon={<ImageIcon size={14} />} />
            <InfoCell label="Export" value={log ? (log.ok ? "Verified exact" : "Mismatch") : "Ready"} sub={log ? `${log.actual} vs expected ${log.expected}` : "Run export to verify output dims"} icon={<Download size={14} />} />
            <InfoCell label="Persistence" value={saveLabel(saveState)} sub={saveHelp(saveState)} icon={<Save size={14} />} />
          </div>

          {log && (
            <div className={`border px-4 py-3 ${log.ok ? "border-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_8%,transparent)]" : "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"}`}>
              <div className="t-mono-sm uppercase tracking-[0.12em]">Last export</div>
              <div className="text-[14px] text-[var(--fg)] mt-2">{log.file}</div>
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">Expected {log.expected} · got {log.actual}</div>
            </div>
          )}

          <div className="border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
            <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Phase B note</div>
            <p className="t-prose mt-2 text-[13px] text-[var(--fg-dim)] max-w-[68ch]">
              Studio state now persists into the project payload, and `/editor` is being converted into a studio-first path. Server-authoritative render, screenshot seeding, and multi-panel filmstrip are next.
            </p>
          </div>
        </div>

        <div style={{ position: "fixed", left: "-99999px", top: 0, pointerEvents: "none" }} aria-hidden>
          <StudioPanel ref={captureRef} design={design} />
        </div>
      </section>
    </div>
  );
}

function StudioField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] mb-2">{label}</div>
      {children}
    </div>
  );
}

function InfoCell({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg)] p-4 min-h-[118px] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">{label}</div>
        <div className="text-[var(--accent)]">{icon}</div>
      </div>
      <div>
        <div className="t-display text-[clamp(1.1rem,2vw,1.35rem)] leading-[0.95] tracking-[-0.02em] normal-case">{value}</div>
        <div className="text-[12px] text-[var(--fg-mute)] mt-2">{sub}</div>
      </div>
    </div>
  );
}

function saveLabel(state: SaveState): string {
  switch (state) {
    case "saved": return "Saved";
    case "dirty": return "Unsaved";
    case "saving": return "Saving";
    case "error": return "Retry needed";
  }
}

function saveHelp(state: SaveState): string {
  switch (state) {
    case "saved": return "Persisted into the project payload";
    case "dirty": return "Waiting for the autosave debounce";
    case "saving": return "Writing studio state to the project";
    case "error": return "Save failed — next edit retries automatically";
  }
}
