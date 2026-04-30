/**
 * Editor viewport sync helpers.
 *
 * Why this file exists
 * --------------------
 * Fabric maintains an internal `_offset` cache (the page coords of the
 * `<canvas>` element) that it uses to map mouse events into canvas
 * coordinates. The cache is computed once at mount and never refreshed
 * automatically. When the wrapping `<div>` shifts position in the DOM
 * — window resize, sidebar collapse, scrollbar appearance/disappearance,
 * tool-tab reflow, parent flex-child width change — the cache goes
 * stale. Layers continue to render at correct PIXELS (the visible
 * canvas looks fine) but mouse-to-canvas mapping is off, so clicks
 * land at the wrong canvas coords. User-visible symptom: "I can't grab
 * the backdrop."
 *
 * The fix is small and proportional: subscribe to ResizeObserver on
 * the canvas wrapper and call `canvas.calcOffset()` on every entry.
 * We deliberately do NOT touch `viewportTransform` (preserves user
 * pan), `setZoom` (preserves user zoom), or `setDimensions` (canvas
 * pixel size is fixed at DISPLAY_W × shots.height per the existing
 * zoom-sync effect). `calcOffset` is the single corrective operation.
 *
 * This helper is extracted from `components/editor/FabricCanvas.tsx`
 * so the wiring contract is unit-testable without booting jsdom or a
 * real Fabric instance. See `tests/editor/viewport-resize.test.ts`
 * for the call-count contract assertions.
 *
 * See also: docs/audits/2026-05-01-internal-team-editor-viewport.md
 * → finding #1.
 */

/**
 * Minimal contract this helper requires of the Fabric canvas. Typed
 * structurally so tests can pass `{ calcOffset: vi.fn() }` without
 * pulling in the whole Fabric package.
 */
export type CalcOffsetCanvas = {
  calcOffset: () => unknown;
};

/**
 * Subscribe a Fabric canvas to its wrapper element's resize events.
 * Returns a `disconnect` function that cancels the subscription —
 * call it from the React `useEffect` cleanup.
 *
 * Semantic chosen here: setup is a pure subscription. We do NOT call
 * `calcOffset()` eagerly on attach. The existing mount effect in
 * `FabricCanvas.tsx` already computes the correct offset at mount via
 * the canvas constructor; this helper only patches the *reflow gap*.
 * If you want a manual recalc-now trigger, call `canvas.calcOffset()`
 * directly at the call site.
 *
 * One observer is created per call; it observes `wrapper` exactly
 * once. ResizeObserver coalesces multiple synchronous size changes
 * into a single batched callback invocation, so an N-pixel reflow
 * fires the callback once, not N times.
 */
export function recalcOffsetOnResize(
  canvas:  CalcOffsetCanvas,
  wrapper: Element,
): () => void {
  // SSR / test-without-DOM guard: ResizeObserver is a browser API.
  // The helper is meant to be called from inside `useEffect`, which
  // already implies a browser context — but a defensive check keeps
  // the helper safe to import from places that might pre-render.
  if (typeof ResizeObserver === "undefined") {
    return () => { /* no-op disconnect */ };
  }

  const observer = new ResizeObserver(() => {
    // One call per ResizeObserver fire, regardless of entry count.
    // Multiple entries in the same fire = the same wrapper resizing
    // along multiple axes; one calcOffset is enough.
    canvas.calcOffset();
  });
  observer.observe(wrapper);

  return () => observer.disconnect();
}
