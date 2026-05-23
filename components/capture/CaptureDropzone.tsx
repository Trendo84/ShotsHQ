"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload, FileImage, AlertTriangle, Check } from "lucide-react";
import {
  pickDeviceByDimensions,
  summarizeBucketing,
} from "@/lib/devices/match";
import {
  findStoreTargetByDimensions,
  type StoreTarget,
} from "@/lib/utils/store-dimensions";
import { DEVICES_BY_ID } from "@/lib/devices/catalog";

/**
 * CaptureDropzone — drag-drop intake for Step 03 of /projects/new.
 *
 * Replaces the prior "Drop here · soon" placeholder with the actual
 * capability. Three phases:
 *
 *   1. Empty — drop target + file picker. Tells the user what dims
 *      we accept (1290×2796, 1320×2868, 2064×2752).
 *   2. Preview — shows how the dropped files bucket per device.
 *      Unrecognized files are flagged but don't block the rest.
 *   3. Uploading / Done — progress ticker, then "→ Open editor" CTA.
 *
 * Pipeline (per file):
 *   - read width/height via `createImageBitmap` (browser-native,
 *     no library)
 *   - match dim → marketing device (`pickDeviceByDimensions`) for
 *     display + → StoreTarget (`findStoreTargetByDimensions`) for DB
 *   - same-origin multipart POST to `/api/upload/direct`
 *   - server PUTs bytes to R2 and returns the durable `key`
 *   - batch register all uploads via /api/screenshots/register
 *
 * Brand styling: rigid 90° corners (no border-radius per CLAUDE.md);
 * Tactical accent on dragover; JetBrains Mono labels everywhere.
 */

type FileRow = {
  /** Raw browser File. */
  file:    File;
  /** Pixel dims read on drop. `null` while loading; never re-read. */
  width:   number | null;
  height:  number | null;
  /** Marketing device (e.g. "iPhone 17 Pro Max") or null if unmatched. */
  deviceId: string | null;
  /** DB enum for register call, or null if unmatched (file is excluded). */
  storeTarget: StoreTarget | null;
  /** R2 key after presign+PUT, or null until uploaded. */
  r2Key: string | null;
  /** Error message if upload failed (per-file fault tolerance). */
  error: string | null;
};

type Phase = "empty" | "preview" | "uploading" | "done" | "error";

export function CaptureDropzone({
  projectId,
  onComplete,
}: {
  projectId: string;
  /** Fires once registration succeeds. Lets the parent show "Open editor". */
  onComplete?: (result: { inserted: number; skipped: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase]   = useState<Phase>("empty");
  const [rows, setRows]     = useState<FileRow[]>([]);
  const [hover, setHover]   = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  /** Count of rows that have completed their R2 PUT, for progress UI. */
  const [uploaded, setUploaded] = useState(0);

  // ── Read PNG dimensions per file ──────────────────────────────────────────

  async function readDims(f: File): Promise<{ w: number; h: number } | null> {
    try {
      // createImageBitmap is browser-native, decodes off the main
      // thread, doesn't require an HTML <img> tag, returns dims.
      const bmp = await createImageBitmap(f);
      const out = { w: bmp.width, h: bmp.height };
      bmp.close();
      return out;
    } catch {
      return null;
    }
  }

  function fileForDirectUpload(file: File): File {
    // Folder picks can yield a `.png` file whose browser MIME is blank.
    // The old presign path hard-coded `contentType: image/png`, so keep
    // that resilience when switching to multipart `/api/upload/direct`.
    return file.type === "image/png"
      ? file
      : new File([file], file.name, { type: "image/png" });
  }

  // ── Drop / pick → preview ─────────────────────────────────────────────────

  const handleFiles = useCallback(async (filesIn: FileList | File[]) => {
    setGlobalError(null);
    const files = Array.from(filesIn).filter(
      (f) => f.type === "image/png" || f.name.toLowerCase().endsWith(".png"),
    );
    if (files.length === 0) {
      setGlobalError("No PNG files found in the selection.");
      return;
    }
    if (files.length > 120) {
      setGlobalError(`Too many files (${files.length}). Drop ≤ 120 per batch.`);
      return;
    }

    // Hydrate dimensions in parallel.
    const newRows: FileRow[] = await Promise.all(
      files.map(async (file) => {
        const dims = await readDims(file);
        if (!dims) {
          return {
            file, width: null, height: null,
            deviceId: null, storeTarget: null,
            r2Key: null, error: "Couldn't read image dimensions.",
          };
        }
        const match = pickDeviceByDimensions({ width: dims.w, height: dims.h });
        const tgt   = findStoreTargetByDimensions({ width: dims.w, height: dims.h });
        return {
          file,
          width:  dims.w,
          height: dims.h,
          deviceId:    match?.device.id ?? null,
          storeTarget: tgt,
          r2Key: null,
          error: null,
        };
      }),
    );
    setRows(newRows);
    setPhase("preview");
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setHover(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setHover(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setHover(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  }

  // ── Confirm → upload + register ───────────────────────────────────────────

  async function uploadAndRegister() {
    const eligible = rows.filter((r) => r.storeTarget && r.width && r.height);
    if (eligible.length === 0) {
      setGlobalError("No recognised PNGs to upload — every file's dimensions were off-spec.");
      return;
    }

    setPhase("uploading");
    setUploaded(0);
    setGlobalError(null);

    // Per-file: same-origin POST → server-side R2 PUT. We mutate
    // `rows` immutably as each completes so the progress UI ticks.
    const updated: FileRow[] = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]!;
      if (!row.storeTarget || !row.width || !row.height) continue;

      try {
        // 1. Same-origin multipart upload → server proxies bytes to R2.
        const form = new FormData();
        form.append("file", fileForDirectUpload(row.file));
        form.append("projectId", projectId);

        const uploadRes = await fetch("/api/upload/direct", {
          method: "POST",
          body:   form,
        });
        const uploadJson = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok || !uploadJson?.ok || !uploadJson.data?.key) {
          throw new Error(uploadJson?.error ?? `upload_http_${uploadRes.status}`);
        }

        const { key } = uploadJson.data as { key: string };

        updated[i] = { ...row, r2Key: key, error: null };
        setUploaded((n) => n + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upload_failed";
        updated[i] = { ...row, error: msg };
      }
    }

    setRows(updated);

    // 3. Register the successfully-uploaded ones in one batch.
    const items = updated
      .filter((r) => r.r2Key && r.storeTarget && r.width && r.height)
      .map((r) => ({
        device: r.storeTarget!,
        r2Key:  r.r2Key!,
        width:  r.width!,
        height: r.height!,
        locale: "en",
      }));

    if (items.length === 0) {
      setGlobalError("All uploads failed — check the per-file errors below.");
      setPhase("error");
      return;
    }

    try {
      const registerRes = await fetch("/api/screenshots/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, items }),
      });
      const registerJson = await registerRes.json().catch(() => null);
      if (!registerRes.ok || !registerJson?.ok) {
        throw new Error(registerJson?.error ?? `register_http_${registerRes.status}`);
      }
      const { inserted, skipped } = registerJson.data as {
        inserted: number; skipped: number; ids: string[];
      };
      setPhase("done");
      onComplete?.({ inserted, skipped });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "register_failed";
      setGlobalError(`Register failed: ${msg}`);
      setPhase("error");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const summary = summarizeBucketing(
    rows
      .filter((r) => r.width && r.height)
      .map((r) => ({ width: r.width!, height: r.height! })),
  );
  const matched   = rows.filter((r) => r.storeTarget).length;
  const unmatched = summary.unmatched;

  return (
    <div
      className="space-y-4"
      data-capture-phase={phase}
      data-capture-matched={String(matched)}
    >
      {/* DROP ZONE / PREVIEW */}
      {phase === "empty" && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Drop PNG screenshots or click to pick files"
          className={`border-2 border-dashed p-8 sm:p-12 text-center min-h-[240px] sm:min-h-[280px] flex flex-col items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
            hover
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--line)] hover:border-[var(--accent)]"
          }`}
        >
          <Upload size={32} className="text-[var(--fg-mute)] mb-3" aria-hidden />
          <div className="t-display text-[28px] sm:text-[32px]">
            Drop here<span className="text-[var(--accent)]">.</span>
          </div>
          <div className="t-mono-sm text-[var(--fg-mute)] mt-2">
            .PNG · 1290×2796 · 1320×2868 · 2064×2752
          </div>
          <div className="t-mono-xs text-[var(--fg-dim)] mt-4">
            We auto-bucket by dimension. Off-spec PNGs are flagged.
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            multiple
            data-testid="capture-upload-input"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = ""; // allow re-picking the same file
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error — webkitdirectory is non-standard but supported
            webkitdirectory=""
            multiple
            data-testid="capture-upload-folder-input"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
            className="t-mono-xs text-[var(--fg-dim)] underline mt-4 hover:text-[var(--accent)]"
          >
            … or pick a whole folder
          </button>
        </div>
      )}

      {(phase === "preview" || phase === "uploading" || phase === "done" || phase === "error") && (
        <div className="border border-[var(--line)] p-5 space-y-4">
          {/* SUMMARY */}
          <div className="flex items-center justify-between">
            <div className="t-eyebrow t-eyebrow-accent">
              {phase === "preview"   && "Ready to upload"}
              {phase === "uploading" && "Uploading…"}
              {phase === "done"      && "Uploaded · ready to open editor"}
              {phase === "error"     && "Something went wrong"}
            </div>
            <div className="t-mono-xs text-[var(--fg-mute)] tabular-nums">
              {matched} ✓
              {unmatched > 0 && ` · ${unmatched} ⚠`}
            </div>
          </div>

          {/* BUCKET BREAKDOWN */}
          {summary.byDevice.size > 0 && (
            <ul className="space-y-1.5 border-t border-[var(--line)] pt-3">
              {Array.from(summary.byDevice.entries()).map(([deviceId, count]) => {
                const d = DEVICES_BY_ID[deviceId];
                if (!d) return null;
                return (
                  <li key={deviceId} className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2">
                      <Check size={12} className="text-[var(--signal,#7CB342)]" aria-hidden />
                      <span className="text-[var(--fg)]">{d.name}</span>
                      <span className="t-mono-xs text-[var(--fg-mute)]">{d.shortSpec}</span>
                    </span>
                    <span className="t-mono-sm text-[var(--fg-dim)] tabular-nums">{count}</span>
                  </li>
                );
              })}
              {unmatched > 0 && (
                <li className="flex items-center justify-between text-[13px] pt-2 border-t border-[var(--line)]">
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-[var(--accent)]" aria-hidden />
                    <span className="text-[var(--fg-dim)]">Unrecognised dimensions</span>
                  </span>
                  <span className="t-mono-sm text-[var(--accent)] tabular-nums">{unmatched}</span>
                </li>
              )}
            </ul>
          )}

          {/* PROGRESS / ERRORS */}
          {phase === "uploading" && (
            <div className="t-mono-xs text-[var(--fg-dim)] flex items-center gap-2">
              <Loader2 size={11} className="animate-spin" />
              Uploading {uploaded} / {matched} …
            </div>
          )}
          {phase === "error" && globalError && (
            <p role="alert" className="t-mono-xs text-[var(--accent)]">{globalError}</p>
          )}

          {/* PER-FILE ROWS (compact) */}
          <details className="t-mono-xs text-[var(--fg-mute)]">
            <summary className="cursor-pointer hover:text-[var(--fg-dim)]">
              View {rows.length} file{rows.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto pl-1">
              {rows.map((r, i) => (
                <li
                  key={`${r.file.name}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FileImage size={10} className="shrink-0" aria-hidden />
                    <span className="truncate">{r.file.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {r.width && r.height ? `${r.width}×${r.height}` : "?"}
                    {r.error && (
                      <span className="text-[var(--accent)] ml-2">err</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </details>

          {/* ACTIONS */}
          <div className="flex justify-between gap-3 pt-2 border-t border-[var(--line)]">
            {phase === "preview" && (
              <>
                <button
                  type="button"
                  onClick={() => { setRows([]); setPhase("empty"); }}
                  className="btn"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void uploadAndRegister()}
                  disabled={matched === 0}
                  data-capture-upload="true"
                  className="btn btn-accent"
                >
                  Upload {matched} → R2
                </button>
              </>
            )}
            {phase === "error" && (
              <>
                <button
                  type="button"
                  onClick={() => { setRows([]); setPhase("empty"); }}
                  className="btn"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void uploadAndRegister()}
                  className="btn btn-accent"
                >
                  Retry upload
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {globalError && phase !== "error" && (
        <p role="alert" className="t-mono-xs text-[var(--accent)]">
          {globalError}
        </p>
      )}
    </div>
  );
}
