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
import {
  describeIssues,
  evaluatePanel,
  evaluateStudio,
  statusHelp,
  statusLabel,
  statusOf,
} from "@/lib/studio/readiness";
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
  /** True when the row represents a blocked/skipped panel rather than a real render. */
  blocked?: boolean;
  /** Human-readable reason for blocked/skipped panels. */
  blockedReason?: string;
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

  /**
   * Per-panel upload-state, keyed by panelId. Drives the inline
   * upload progress + error UI under the upload dropzone.
   *
   *   "idle"     — no upload in flight
   *   "uploading"— presign + PUT in progress
   *   "error"    — last upload failed; user can retry
   */
  const [uploadState, setUploadState] = React.useState<Record<string, "idle" | "uploading" | "error">>({});
  const [uploadError, setUploadError] = React.useState<Record<string, string | null>>({});

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

  /**
   * Upload a screenshot for the active panel.
   *
   * Persistence design (cycle #3, 2026-05-23):
   *
   *   1. Optimistically set a `blob:` URL on the panel so the user
   *      sees their selection immediately. `screenshotRemote=false`
   *      marks the panel as not-yet-persisted; readiness reports
   *      `screenshot-uploading`.
   *   2. POST the file to `/api/upload/direct` (same-origin
   *      multipart; the server PUTs to R2 with our credentials).
   *      We deliberately avoid the presigned-URL + browser-PUT
   *      path here because the R2 bucket isn't CORS-configured
   *      yet — the browser preflight would be blocked. Server-
   *      side proxy upload sidesteps CORS entirely.
   *   3. On success: swap the blob URL with the durable `https:`
   *      URL and flip `screenshotRemote=true`. The autosave debounce
   *      then persists the durable URL into `polotnoJson.studio`
   *      and the panel survives reload. Readiness flips to ready.
   *   4. On failure: keep the blob URL (so the user can still
   *      design against their screenshot in-session) but mark
   *      uploadState=error and surface the message inline. Panel
   *      stays not-ready until a retry succeeds.
   *
   * Race-safety: between steps 1 and 3, the user can click upload
   * again with a different file. We check `panel.screenshotUrl ===
   * localUrl` before swapping, so a stale-completion swap can't
   * overwrite the user's latest selection.
   */
  const uploadScreenshotForPanel = React.useCallback(
    async (panelId: string, file: File) => {
      const localUrl = URL.createObjectURL(file);
      blobUrls.current.add(localUrl);

      // Step 1: optimistic local preview.
      updateStudio((current) => ({
        ...current,
        panels: current.panels.map((p) =>
          p.panelId === panelId
            ? { ...p, screenshotUrl: localUrl, screenshotRemote: false }
            : p,
        ),
      }));
      setUploadState((cur) => ({ ...cur, [panelId]: "uploading" }));
      setUploadError((cur) => ({ ...cur, [panelId]: null }));

      try {
        // Step 2: same-origin multipart POST → server proxies to R2.
        const form = new FormData();
        form.append("file", file);
        form.append("projectId", projectId);

        const uploadRes = await fetch("/api/upload/direct", {
          method: "POST",
          body:   form,
        });
        const uploadJson = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok || !uploadJson?.ok || !uploadJson.data?.publicUrl) {
          throw new Error(uploadJson?.error ?? `upload_http_${uploadRes.status}`);
        }
        const { publicUrl } = uploadJson.data as { publicUrl: string };

        // Step 3: swap blob → remote, but only if the user hasn't
        // since replaced the panel's screenshot with something
        // newer.
        updateStudio((current) => ({
          ...current,
          panels: current.panels.map((p) =>
            p.panelId === panelId && p.screenshotUrl === localUrl
              ? { ...p, screenshotUrl: publicUrl, screenshotRemote: true }
              : p,
          ),
        }));
        setUploadState((cur) => ({ ...cur, [panelId]: "idle" }));

        // Revoke the blob now that we've persisted; the preview
        // continues to render from the remote URL.
        URL.revokeObjectURL(localUrl);
        blobUrls.current.delete(localUrl);
      } catch (err) {
        // Step 4: keep the blob URL so the user can still design,
        // but never claim ready. Surface the error inline.
        const message = err instanceof Error ? err.message : "upload_failed";
        setUploadState((cur) => ({ ...cur, [panelId]: "error" }));
        setUploadError((cur) => ({ ...cur, [panelId]: message }));
      }
    },
    [projectId],
  );

  function onUpload(file: File | undefined) {
    if (!file) return;
    void uploadScreenshotForPanel(studio.activePanelId, file);
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
    // Defense-in-depth: even though the button is `disabled` when
    // !canExportCurrent, an operator inspecting via DevTools could
    // strip the attribute. Refuse and surface inline copy explaining
    // what's missing — never silent no-op or fake "Exporting…".
    const activeReadinessNow = evaluatePanel(activePanel);
    if (!activeReadinessNow.ready) {
      const issues = describeIssues(activeReadinessNow.issues);
      setLog([{
        file:       "—",
        panelLabel: panelLabel(activeIndex),
        expected:   `${activeDevice.width}×${activeDevice.height}`,
        actual:     "blocked",
        ok:         false,
        blocked:    true,
        blockedReason: issues.join(" · ") || "panel not ready to export",
      }]);
      return;
    }
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
    // Defense-in-depth — see exportCurrent above. We also SKIP
    // unready panels in the bulk run (instead of bailing entirely)
    // so the user gets the partial set + a clear log of what was
    // skipped and why.
    const eval0 = evaluateStudio(studio);
    if (!eval0.exportable) {
      setLog(studio.panels.map((panel, index) => ({
        file:          "—",
        panelLabel:    panelLabel(index),
        expected:      `${deviceById(panel.deviceId).width}×${deviceById(panel.deviceId).height}`,
        actual:        "blocked",
        ok:            false,
        blocked:       true,
        blockedReason: describeIssues(evaluatePanel(panel).issues).join(" · ") || "panel not ready",
      })));
      return;
    }
    setBusy(true);
    setLog([]);
    try {
      const results: ExportResult[] = [];
      for (const [index, panel] of studio.panels.entries()) {
        const panelReady = evaluatePanel(panel);
        if (!panelReady.ready) {
          results.push({
            file:          "—",
            panelLabel:    panelLabel(index),
            expected:      `${deviceById(panel.deviceId).width}×${deviceById(panel.deviceId).height}`,
            actual:        "skipped",
            ok:            false,
            blocked:       true,
            blockedReason: describeIssues(panelReady.issues).join(" · ") || "panel not ready",
          });
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const result = await exportPanel(panel, index);
        results.push(result);
      }
      setLog(results);
    } finally {
      setBusy(false);
    }
  }

  const exactCount   = log.filter((item) => item.ok).length;
  const blockedCount = log.filter((item) => item.blocked).length;
  const renderedTotal = log.length - blockedCount;
  const exportRunSummary = log.length === 0
    ? null
    : blockedCount > 0
      ? `${exactCount} exact · ${blockedCount} blocked`
      : `${exactCount}/${renderedTotal} exact`;

  /**
   * Export readiness — single source of truth driving the Export
   * buttons + InfoCell + per-panel filmstrip badges. Audit P0
   * (2026-05-23): fresh project claimed "EXPORT READY" and enabled
   * CTAs that produced nothing. See lib/studio/readiness.ts for the
   * rules + tests/studio/readiness.test.ts for the contract.
   */
  const readiness        = React.useMemo(() => evaluateStudio(studio), [studio]);
  const status           = statusOf(readiness);
  const activeReady      = evaluatePanel(activePanel).ready;
  const activeIssues     = describeIssues(evaluatePanel(activePanel).issues);
  const readyPanelCount  = readiness.readyPanels;
  const canExportCurrent = activeReady && !busy;
  const canExportAll     = readiness.exportable && !busy;

  return (
    <div className="grid grid-cols-12 min-h-[calc(100dvh-7rem)]">
      <section className="col-span-12 xl:col-span-4 border-r border-[var(--line)] bg-[var(--bg)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-2">
            Studio
          </div>
          <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-[var(--fg)] leading-tight">
            Build your screenshot pack
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--fg-dim)] mt-3 max-w-[46ch]">
            One panel per App Store screenshot. Drop the source PNG,
            write the headline, pick a layout — then reorder, duplicate,
            and export the whole pack at App Store-exact dimensions.
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
              data-active-panel-screenshot-state={
                uploadState[activePanel.panelId] ?? "idle"
              }
              data-active-panel-screenshot-remote={
                activePanel.screenshotRemote ? "true" : "false"
              }
              className="w-full border border-dashed border-[var(--line-strong)] bg-[var(--bg-2)] px-4 py-6 text-left hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-[var(--accent)]" />
                <div>
                  <div className="t-mono-sm text-[var(--fg)] uppercase tracking-[0.14em]">Upload PNG / JPG</div>
                  <div className="t-mono-xs text-[var(--fg-mute)] mt-1">
                    {uploadState[activePanel.panelId] === "uploading"
                      ? "Uploading to durable storage…"
                      : uploadState[activePanel.panelId] === "error"
                        ? `Upload failed: ${uploadError[activePanel.panelId] ?? "unknown error"}. Click to retry.`
                        : activePanel.screenshotUrl
                          ? activePanel.screenshotRemote
                            ? "Screenshot persisted — survives reload."
                            : "Screenshot loaded locally. Persisting…"
                          : "Drop a screenshot here or click to pick a file."}
                  </div>
                </div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              data-testid="studio-upload-input"
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

          {/*
            Selected-state contract (applied across every selector
            group on Studio's left rail, cycle #8):
              - role="radiogroup" on the wrapper + role="radio" on
                each button — accessibility tree exposes a real
                radio group so screen readers announce the selection.
              - aria-checked + aria-pressed reflect active state.
              - data-active="true|false" + data-<group>-id="<value>"
                on each option make the selected state directly
                testable. The cycle-#1 device-class fix established
                this contract; cycle #8 extends it everywhere.
              - Active class flips text color in addition to border +
                background, so the cue stays legible across themes
                (the cycle-#1 bug was that border-only contrast can
                read identical depending on theme + bg color).
          */}
          <StudioField label="Frame style">
            <div
              className="grid grid-cols-1 gap-2"
              role="radiogroup"
              aria-label="Frame style"
            >
              {compatibleFrames.map((frame) => {
                const active = frame.id === activePanel.frameId;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    data-frame-id={frame.id}
                    data-active={active ? "true" : "false"}
                    onClick={() => patch("frameId", frame.id)}
                    className={`border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
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
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Layout"
            >
              {LAYOUT_PRESETS.map((layout) => {
                const active = layout.id === activePanel.layout;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    data-layout-id={layout.id}
                    data-active={active ? "true" : "false"}
                    onClick={() => patch("layout", layout.id)}
                    className={`border px-3 py-2 t-mono-xs uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
                    }`}
                  >
                    {layout.label}
                  </button>
                );
              })}
            </div>
          </StudioField>

          <StudioField label="Theme preset">
            <div
              className="grid grid-cols-1 gap-2"
              role="radiogroup"
              aria-label="Theme preset"
            >
              {THEME_PRESETS.map((theme) => {
                const active = theme.id === activePanel.themeId;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    data-theme-id={theme.id}
                    data-active={active ? "true" : "false"}
                    onClick={() => applyTheme(theme.id)}
                    className={`border p-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
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
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Align"
              >
                {ALIGNMENTS.map((align) => {
                  const active = activePanel.align === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-pressed={active}
                      data-align-id={align}
                      data-active={active ? "true" : "false"}
                      onClick={() => patch("align", align)}
                      className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] transition-colors ${
                        active
                          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                          : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
                      }`}
                    >
                      {align}
                    </button>
                  );
                })}
              </div>
            </StudioField>
            <StudioField label="Font tone">
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Font tone"
              >
                {FONT_CHOICES.map((font) => {
                  const active = activePanel.fontFamily === font;
                  return (
                    <button
                      key={font}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-pressed={active}
                      data-font-id={font}
                      data-active={active ? "true" : "false"}
                      onClick={() => patch("fontFamily", font)}
                      className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] transition-colors ${
                        active
                          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                          : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
                      }`}
                    >
                      {font}
                    </button>
                  );
                })}
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
            <div
              className="grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Background mode"
            >
              {BACKGROUND_KINDS.map((kind) => {
                const active = activePanel.bgKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    data-bgkind-id={kind}
                    data-active={active ? "true" : "false"}
                    onClick={() => patch("bgKind", kind)}
                    className={`border px-2 py-2 t-mono-xs uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)] text-[var(--fg)]"
                    }`}
                  >
                    {kind}
                  </button>
                );
              })}
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
            <Button
              variant="ghost"
              type="button"
              disabled={!canExportAll}
              data-export-all-enabled={canExportAll ? "true" : "false"}
              title={
                canExportAll
                  ? (status === "partial"
                      ? `Export the ${readyPanelCount} ready panel(s); the rest stay queued until each has a screenshot + headline.`
                      : `Export all ${readyPanelCount} panels at exact App Store dimensions.`)
                  : "No panels are ready yet — upload a screenshot into each panel and write a headline before exporting."
              }
              onClick={exportAll}
            >
              <Download size={14} className="mr-2" />
              {busy
                ? "Exporting…"
                : status === "partial"
                  ? `Export ready (${readyPanelCount}/${readiness.totalPanels})`
                  : `Export all (${readyPanelCount})`}
            </Button>
            <Button
              variant="accent"
              type="button"
              disabled={!canExportCurrent}
              data-export-current-enabled={canExportCurrent ? "true" : "false"}
              title={
                canExportCurrent
                  ? "Export the active panel at its exact App Store dimensions."
                  : `Active panel not ready: ${activeIssues.join(" · ") || "no exportable content yet"}. Add what's missing in the panel above.`
              }
              onClick={exportCurrent}
            >
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
                const tileReadiness = readiness.perPanel[index];
                const tileReady = tileReadiness?.ready === true;
                return (
                  <button
                    key={panel.panelId}
                    type="button"
                    data-panel-ready={tileReady ? "true" : "false"}
                    onClick={() => selectPanel(panel.panelId)}
                    className={`shrink-0 border p-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="t-mono-xs text-[var(--fg-mute)] uppercase tracking-[0.14em] mb-2 flex items-center justify-between gap-2">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className={tileReady ? "text-[var(--signal,#7CB342)]" : "text-[var(--fg-mute)]"}>
                        {tileReady ? "● READY" : "○ DRAFT"}
                      </span>
                    </div>
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
            <InfoCell
              label="Export"
              value={
                exportRunSummary !== null
                  ? exportRunSummary
                  : statusLabel(status)
              }
              sub={
                exportRunSummary !== null
                  ? (blockedCount > 0
                      ? "Ready panels exported; blocked panels skipped."
                      : "Current or bulk export just ran.")
                  : statusHelp(readiness)
              }
              icon={<Download size={14} />}
              data-status={status}
            />
            <InfoCell label="Persistence" value={saveLabel(saveState)} sub={saveHelp(saveState)} icon={<Save size={14} />} />
          </div>

          {log.length > 0 && (
            <div className="border border-[var(--line)] bg-[var(--bg)] overflow-hidden">
              <div className="border-b border-[var(--line)] px-4 py-3">
                <div className="t-mono-sm uppercase tracking-[0.12em]">Last export run</div>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {log.map((item, idx) => (
                  <div key={`${item.panelLabel}-${idx}`} className="px-4 py-3 flex items-start justify-between gap-4" data-export-row-status={item.blocked ? "blocked" : item.ok ? "ok" : "mismatch"}>
                    <div>
                      <div className="text-[14px] text-[var(--fg)]">{item.panelLabel} · {item.file}</div>
                      <div className="t-mono-xs text-[var(--fg-mute)] mt-1">
                        {item.blocked
                          ? `Skipped — ${item.blockedReason ?? "panel not ready"}`
                          : `Expected ${item.expected} · got ${item.actual}`}
                      </div>
                    </div>
                    <div className={`t-mono-xs uppercase tracking-[0.14em] ${
                      item.blocked
                        ? "text-[var(--accent)]"
                        : item.ok
                          ? "text-[var(--signal)]"
                          : "text-[var(--accent)]"
                    }`}>
                      {item.blocked ? "Blocked" : item.ok ? "Exact" : "Mismatch"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/*
            Readiness checklist — shown when at least one panel is not
            ready. Honest about what blocks export and links the
            operator to the Exports page where the full per-panel
            checklist lives. Audit P0 (2026-05-23).
          */}
          {!readiness.fullyReady && !readiness.empty && (
            <div
              className="border border-[var(--line-strong)] bg-[var(--bg)] px-4 py-3"
              data-readiness-status={status}
            >
              <div className="t-mono-xs text-[var(--accent)] uppercase tracking-[0.14em] flex items-center gap-2">
                <span aria-hidden>○</span> Export readiness · {statusLabel(status)}
              </div>
              <p className="t-prose mt-2 text-[13px] text-[var(--fg-dim)] max-w-[68ch]">
                {statusHelp(readiness)}
              </p>
              <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {readiness.perPanel.map((p, idx) => {
                  const issues = describeIssues(p.issues);
                  return (
                    <li
                      key={p.panelId}
                      className="t-mono-xs text-[12px] text-[var(--fg-mute)] flex items-start gap-2"
                    >
                      <span className={p.ready ? "text-[var(--signal,#7CB342)]" : "text-[var(--accent)]"} aria-hidden>
                        {p.ready ? "●" : "○"}
                      </span>
                      <span className="truncate">
                        Panel {String(idx + 1).padStart(2, "0")} ·{" "}
                        <span className="text-[var(--fg-dim)]">
                          {p.ready ? "ready" : issues.join(" · ")}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 t-mono-xs text-[var(--fg-mute)]">
                Add a screenshot via the <strong>Upload PNG / JPG</strong>{" "}
                control above each panel; write a non-empty headline to
                lift a panel out of draft.
              </div>
            </div>
          )}

          {readiness.fullyReady && (
            <div
              className="border border-[var(--line)] bg-[var(--bg)] px-4 py-3"
              data-readiness-status="ready"
            >
              <div className="t-mono-xs text-[var(--signal,#7CB342)] uppercase tracking-[0.14em] flex items-center gap-2">
                <span aria-hidden>●</span> Export readiness · Ready
              </div>
              <p className="t-prose mt-2 text-[13px] text-[var(--fg-dim)] max-w-[68ch]">
                {statusHelp(readiness)} Browser exports land in your
                Downloads folder; a server-authoritative renderer + R2
                streaming is in scope for v1.1.
              </p>
            </div>
          )}
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
  ...dataAttrs
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  [dataKey: `data-${string}`]: string | undefined;
}) {
  return (
    <div
      className="bg-[var(--bg)] p-4 min-h-[118px] flex flex-col justify-between"
      {...dataAttrs}
    >
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
