"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveStudio } from "@/app/actions/studio";
import { applyDeviceToActivePanel } from "@/lib/studio/device-switch";
import { StudioPanel } from "./StudioPanel";
import {
  CANVAS_BASE_WIDTH,
  DEVICE_FRAMES,
  DEVICE_SIZES,
  LAYOUT_PRESETS,
  THEME_PRESETS,
  cloneStudioDesign,
  defaultStudioDesignSet,
  deviceById,
  themeById,
  type BackgroundKind,
  type StudioDesign,
  type StudioDesignSet,
} from "./types";
import type { DeviceId } from "@/lib/canvas/schema";
import {
  downloadDataUrl,
  measurePng,
  renderPanelToPng,
  seqName,
} from "./export";

type Props = {
  projectId: string;
  projectName: string;
  appName: string;
  appDescription: string;
  initialStudio?: StudioDesignSet | null;
};

type ExportResult = {
  file: string;
  expected: string;
  actual: string;
  ok: boolean;
  panelLabel: string;
};

type SaveState = "saved" | "dirty" | "saving" | "error";

const PREVIEW_W = 264;
const FILMSTRIP_W = 92;
const ALIGNMENTS: StudioDesign["align"][] = ["left", "center", "right"];
const FONT_CHOICES: StudioDesign["fontFamily"][] = ["display", "sans", "mono"];
const BACKGROUND_KINDS: BackgroundKind[] = ["radial", "linear", "solid"];

function buildInitialSet(
  appName: string,
  appDescription: string,
  initialStudio?: StudioDesignSet | null,
): StudioDesignSet {
  if (initialStudio) return initialStudio;
  const seeded = defaultStudioDesignSet();
  const panel = seeded.panels[0]!;
  return {
    ...seeded,
    panels: [
      {
        ...panel,
        headline: appName ? `${appName}\nthat ships clean.` : panel.headline,
        subhead: appDescription || panel.subhead,
      },
    ],
  };
}

function panelLabel(index: number): string {
  return `Panel ${String(index + 1).padStart(2, "0")}`;
}

function panelSummary(panel: StudioDesign): string {
  return panel.headline.replace(/\n/g, " ").trim() || "Untitled panel";
}

export function StudioClient({
  projectId,
  projectName,
  appName,
  appDescription,
  initialStudio,
}: Props) {
  const [studio, setStudio] = React.useState<StudioDesignSet>(() =>
    buildInitialSet(appName, appDescription, initialStudio),
  );
  const [busy, setBusy] = React.useState(false);
  const [log, setLog] = React.useState<ExportResult[]>([]);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = React.useRef(false);
  const panelRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const blobUrls = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      for (const url of blobUrls.current) URL.revokeObjectURL(url);
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
      void saveStudio(projectId, studio)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [projectId, saveState, studio]);

  const activeIndex = React.useMemo(() => {
    const found = studio.panels.findIndex((p) => p.panelId === studio.activePanelId);
    return found >= 0 ? found : 0;
  }, [studio.activePanelId, studio.panels]);

  const activePanel = studio.panels[activeIndex] ?? studio.panels[0]!;
  const activeDevice = deviceById(activePanel.deviceId);
  const previewScale = PREVIEW_W / CANVAS_BASE_WIDTH;
  const previewHeight = Math.round((CANVAS_BASE_WIDTH * activeDevice.height) / activeDevice.width * previewScale);

  const compatibleFrames = React.useMemo(
    () => DEVICE_FRAMES.filter((f) => f.families.includes(activeDevice.family)),
    [activeDevice.family],
  );

  function updateStudio(updater: (current: StudioDesignSet) => StudioDesignSet) {
    setStudio((current) => updater(current));
    setSaveState("dirty");
  }

  function updateActivePanel(updater: (panel: StudioDesign) => StudioDesign) {
    updateStudio((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.panelId === current.activePanelId ? updater(panel) : panel,
      ),
    }));
  }

  function patch<K extends keyof StudioDesign>(key: K, value: StudioDesign[K]) {
    updateActivePanel((panel) => ({ ...panel, [key]: value }));
  }

  function selectPanel(panelId: string) {
    setStudio((current) => ({ ...current, activePanelId: panelId }));
  }

  function applyTheme(themeId: string) {
    const theme = themeById(themeId);
    updateActivePanel((panel) => ({
      ...panel,
      themeId,
      bg: theme.bg,
      bg2: theme.bg2,
      bgKind: theme.kind,
      text: theme.text,
      accent: theme.accent,
    }));
  }

  function applyDevice(nextDevice: DeviceId) {
    // Route through the pure reducer so the click-handler path and the
    // unit-test surface share one implementation. Frame compatibility
    // is enforced inside the reducer (see lib/studio/device-switch.ts).
    updateStudio((current) => {
      const next = applyDeviceToActivePanel(current, nextDevice);
      return next === current ? current : next;
    });
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    blobUrls.current.add(url);
    updateActivePanel((panel) => ({
      ...panel,
      screenshotUrl: url,
      screenshotRemote: false,
    }));
  }

  function onDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    onUpload(e.dataTransfer.files?.[0]);
  }

  function addPanel() {
    updateStudio((current) => {
      const from = current.panels.findIndex((p) => p.panelId === current.activePanelId);
      const source = current.panels[from >= 0 ? from : 0] ?? current.panels[0]!;
      const next = cloneStudioDesign(source);
      return {
        ...current,
        activePanelId: next.panelId,
        panels: [...current.panels, next],
      };
    });
  }

  function duplicatePanel() {
    updateStudio((current) => {
      const from = current.panels.findIndex((p) => p.panelId === current.activePanelId);
      const source = current.panels[from];
      if (!source) return current;
      const copy = cloneStudioDesign(source);
      return {
        ...current,
        activePanelId: copy.panelId,
        panels: [
          ...current.panels.slice(0, from + 1),
          copy,
          ...current.panels.slice(from + 1),
        ],
      };
    });
  }

  function movePanel(dir: -1 | 1) {
    updateStudio((current) => {
      const from = current.panels.findIndex((p) => p.panelId === current.activePanelId);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= current.panels.length) return current;
      const panels = [...current.panels];
      const [panel] = panels.splice(from, 1);
      if (!panel) return current;
      panels.splice(to, 0, panel);
      return { ...current, panels };
    });
  }

  function deletePanel() {
    updateStudio((current) => {
      if (current.panels.length === 1) return current;
      const from = current.panels.findIndex((p) => p.panelId === current.activePanelId);
      if (from < 0) return current;
      const panels = current.panels.filter((p) => p.panelId !== current.activePanelId);
      const fallback = panels[Math.max(0, from - 1)] ?? panels[0];
      if (!fallback) return current;
      return {
        ...current,
        activePanelId: fallback.panelId,
        panels,
      };
    });
  }

  async function exportPanel(panel: StudioDesign, index: number): Promise<ExportResult> {
    const node = panelRefs.current[panel.panelId];
    if (!node) throw new Error(`missing_panel_ref:${panel.panelId}`);
    const device = deviceById(panel.deviceId);
    const dataUrl = await renderPanelToPng(node, device);
    const dims = await measurePng(dataUrl);
    const file = seqName(index + 1, panel.deviceId, projectName);
    downloadDataUrl(dataUrl, file);
    return {
      file,
      panelLabel: panelLabel(index),
      expected: `${device.width}×${device.height}`,
      actual: `${dims.width}×${dims.height}`,
      ok: dims.width === device.width && dims.height === device.height,
    };
  }

  async function exportCurrent() {
    setBusy(true);
    setLog([]);
    try {
      const result = await exportPanel(activePanel, activeIndex);
      setLog([result]);
    } finally {
      setBusy(false);
    }
  }

  async function exportAll() {
    setBusy(true);
    setLog([]);
    try {
      const results: ExportResult[] = [];
      for (const [index, panel] of studio.panels.entries()) {
        // eslint-disable-next-line no-await-in-loop
        const result = await exportPanel(panel, index);
        results.push(result);
      }
      setLog(results);
    } finally {
      setBusy(false);
    }
  }

  const exactCount = log.filter((item) => item.ok).length;

  return (
    <div className="grid grid-cols-12 min-h-[calc(100dvh-7rem)]">
      <section className="col-span-12 xl:col-span-4 border-r border-[var(--line)] bg-[var(--bg)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="t-eyebrow t-eyebrow-accent mb-2">Studio engine · Phase C</div>
          <h1 className="t-display text-[clamp(1.75rem,4vw,3rem)] leading-[0.92] tracking-[-0.04em] normal-case text-balance">
            Constrained screenshot studio.
          </h1>
          <p className="t-prose mt-3 text-[var(--fg-dim)] max-w-[46ch]">
            The ASOForge-style engine inside ShotsHQ now behaves like a screenshot pack builder: ordered panels, filmstrip selection, duplication, reordering, deletion, and bulk export.
          </p>
        </div>

        <div className="p-5 space-y-6 max-h-[calc(100dvh-10rem)] overflow-y-auto">
          <div className="border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Filmstrip</div>
                <div className="t-display text-[1.2rem] leading-[0.95] tracking-[-0.02em] normal-case">
                  {panelLabel(activeIndex)} of {String(studio.panels.length).padStart(2, "0")}
                </div>
              </div>
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">{activePanel.deviceId.replace(/_/g, " ")}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="accent" type="button" onClick={addPanel}>
                <Plus size={14} className="mr-2" /> Add panel
              </Button>
              <Button variant="ghost" type="button" onClick={duplicatePanel}>
                <Copy size={14} className="mr-2" /> Duplicate
              </Button>
              <Button variant="ghost" type="button" disabled={activeIndex === 0} onClick={() => movePanel(-1)}>
                <ArrowLeft size={14} className="mr-2" /> Move left
              </Button>
              <Button variant="ghost" type="button" disabled={activeIndex === studio.panels.length - 1} onClick={() => movePanel(1)}>
                <ArrowRight size={14} className="mr-2" /> Move right
              </Button>
            </div>
            <Button
              variant="destructive"
              type="button"
              disabled={studio.panels.length === 1}
              onClick={deletePanel}
              className="w-full"
            >
              <Trash2 size={14} className="mr-2" /> Delete panel
            </Button>
          </div>

          <StudioField label="Headline">
            <textarea
              value={activePanel.headline}
              onChange={(e) => patch("headline", e.target.value)}
              rows={3}
              className="w-full border border-[var(--line-strong)] bg-[var(--bg-2)] px-3 py-3 text-[15px] leading-[1.15] outline-none focus:border-[var(--accent)]"
            />
          </StudioField>

          <StudioField label="Subhead">
            <textarea
              value={activePanel.subhead}
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
                    {activePanel.screenshotUrl ? "Screenshot loaded into the active panel." : "Drop a screenshot here or click to pick a file."}
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
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Device class">
              {DEVICE_SIZES.map((size) => {
                const active = size.id === activePanel.deviceId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    data-device-id={size.id}
                    data-active={active ? "true" : "false"}
                    onClick={() => applyDevice(size.id)}
                    className={`border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
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
                const active = frame.id === activePanel.frameId;
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
                const active = layout.id === activePanel.layout;
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
                const active = theme.id === activePanel.themeId;
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
                    className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${activePanel.align === align ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
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
                    className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${activePanel.fontFamily === font ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
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
                value={activePanel.headlineSize}
                onChange={(e) => patch("headlineSize", Number(e.target.value))}
                className="w-full"
              />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{activePanel.headlineSize}px</div>
            </StudioField>
            <StudioField label="Subhead size">
              <input
                type="range"
                min={11}
                max={22}
                step={1}
                value={activePanel.subheadSize}
                onChange={(e) => patch("subheadSize", Number(e.target.value))}
                className="w-full"
              />
              <div className="t-mono-xs text-[var(--fg-mute)] mt-1">{activePanel.subheadSize}px</div>
            </StudioField>
          </div>

          <StudioField label="Background mode">
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => patch("bgKind", kind)}
                  className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] ${activePanel.bgKind === kind ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]" : "border-[var(--line)]"}`}
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
            <div className="t-eyebrow t-eyebrow-accent mb-1">Filmstrip + live preview</div>
            <div className="t-mono-sm text-[var(--fg-mute)] uppercase tracking-[0.12em]">
              {panelLabel(activeIndex)} · {activeDevice.shortLabel} · exact export {activeDevice.width}×{activeDevice.height} · proj:{projectId.slice(0, 8)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" type="button" onClick={() => applyTheme(THEME_PRESETS[0]!.id)}>
              <Wand2 size={14} className="mr-2" /> Reset theme
            </Button>
            <Button variant="ghost" type="button" disabled={busy} onClick={exportAll}>
              <Download size={14} className="mr-2" /> {busy ? "Exporting…" : `Export all (${studio.panels.length})`}
            </Button>
            <Button variant="accent" type="button" disabled={busy} onClick={exportCurrent}>
              <Download size={14} className="mr-2" /> {busy ? "Exporting…" : "Export current"}
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 xl:p-10 space-y-6">
          <div className="border border-[var(--line-strong)] bg-[var(--bg)] overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3">
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Filmstrip</div>
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Ordered panels · select to edit · bulk export uses this order</div>
            </div>
            <div className="flex gap-3 overflow-x-auto p-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]">
              {studio.panels.map((panel, index) => {
                const device = deviceById(panel.deviceId);
                const scale = FILMSTRIP_W / CANVAS_BASE_WIDTH;
                const height = Math.round((CANVAS_BASE_WIDTH * device.height) / device.width * scale);
                const active = panel.panelId === studio.activePanelId;
                return (
                  <button
                    key={panel.panelId}
                    type="button"
                    onClick={() => selectPanel(panel.panelId)}
                    className={`shrink-0 border p-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] mb-2">{String(index + 1).padStart(2, "0")}</div>
                    <div style={{ width: FILMSTRIP_W, height, position: "relative", overflow: "hidden" }}>
                      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: CANVAS_BASE_WIDTH }}>
                        <StudioPanel design={panel} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="t-mono-xs text-[var(--fg)] uppercase tracking-[0.12em] truncate">{device.shortLabel}</div>
                      <div className="text-[11px] text-[var(--fg-mute)] truncate mt-1">{panelSummary(panel)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-[var(--line-strong)] bg-[var(--bg)] overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3">
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Preview node</div>
              <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">{PREVIEW_W}px wide on-screen · exact pixels on export</div>
            </div>
            <div className="flex justify-center p-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] overflow-auto">
              <div style={{ width: PREVIEW_W, height: previewHeight, position: "relative" }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: CANVAS_BASE_WIDTH }}>
                  <StudioPanel design={activePanel} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-px border border-[var(--line)] bg-[var(--line)]">
            <InfoCell label="Panels" value={String(studio.panels.length).padStart(2, "0")} sub="Ordered screenshot set" icon={<Copy size={14} />} />
            <InfoCell label="Device contract" value={`${activeDevice.width}×${activeDevice.height}`} sub="Exact App Store export target" icon={<ImageIcon size={14} />} />
            <InfoCell label="Export" value={log.length > 0 ? `${exactCount}/${log.length} exact` : "Ready"} sub={log.length > 0 ? "Current or bulk export just ran" : "Use Export current or Export all"} icon={<Download size={14} />} />
            <InfoCell label="Persistence" value={saveLabel(saveState)} sub={saveHelp(saveState)} icon={<Save size={14} />} />
          </div>

          {log.length > 0 && (
            <div className="border border-[var(--line)] bg-[var(--bg)] overflow-hidden">
              <div className="border-b border-[var(--line)] px-4 py-3">
                <div className="t-mono-sm uppercase tracking-[0.12em]">Last export run</div>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {log.map((item) => (
                  <div key={item.file} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] text-[var(--fg)]">{item.panelLabel} · {item.file}</div>
                      <div className="t-mono-xs text-[var(--fg-mute)] mt-1">Expected {item.expected} · got {item.actual}</div>
                    </div>
                    <div className={`t-mono-xs uppercase tracking-[0.14em] ${item.ok ? "text-[var(--signal)]" : "text-[var(--accent)]"}`}>
                      {item.ok ? "Exact" : "Mismatch"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
            <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em]">Phase C note</div>
            <p className="t-prose mt-2 text-[13px] text-[var(--fg-dim)] max-w-[68ch]">
              Studio now behaves like a real screenshot pack builder: ordered panels, filmstrip selection, duplication, reordering, deletion, per-panel editing, and bulk export naming. Next is screenshot seeding plus a server-authoritative studio renderer.
            </p>
          </div>
        </div>

        <div style={{ position: "fixed", left: "-99999px", top: 0, pointerEvents: "none" }} aria-hidden>
          {studio.panels.map((panel) => (
            <StudioPanel
              key={panel.panelId}
              ref={(node) => {
                panelRefs.current[panel.panelId] = node;
              }}
              design={panel}
            />
          ))}
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
    case "saved": return "Persisted panel set into the project payload";
    case "dirty": return "Waiting for the autosave debounce";
    case "saving": return "Writing the panel set to the project";
    case "error": return "Save failed — next edit retries automatically";
  }
}
