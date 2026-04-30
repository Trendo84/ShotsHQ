import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recalcOffsetOnResize } from "@/lib/editor/viewport";

/**
 * Contract test for `recalcOffsetOnResize` — the ResizeObserver wiring
 * extracted from `FabricCanvas.tsx` so we can verify call-count
 * behavior without booting jsdom or a real Fabric instance.
 *
 * Per audit triage 2026-05-01 finding #1, the spec emphasises CALL
 * COUNTS rather than just signature/no-throw. A "mock everything,
 * call helper, assert no throw" test catches no regressions. The six
 * assertions below catch:
 *
 *   1. Mount-time stray calls (helper should subscribe, not fire eagerly)
 *   2. Missing-fire regressions (one observer fire = one calcOffset)
 *   3. Multi-fire correctness (N fires = N calls; no debounce loss)
 *   4. Disconnect-leak regressions (cleanup actually unsubscribes)
 *   5. Multi-instantiation regressions (one observer per helper call)
 *   6. Wrong-target regressions (observe gets the wrapper, not a child)
 *
 * Implementation note: vitest `vi.fn()` mock counters + a hand-rolled
 * MockResizeObserver class are sufficient — no jsdom polyfill needed.
 * We install the mock onto `globalThis.ResizeObserver` for the duration
 * of each test and restore afterwards.
 */

type RoCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

class MockResizeObserver {
  /** All callbacks captured across instantiations, in construction order. */
  static callbacks: RoCallback[] = [];
  /** All instances created across instantiations, in construction order. */
  static instances: MockResizeObserver[] = [];

  static reset(): void {
    MockResizeObserver.callbacks = [];
    MockResizeObserver.instances = [];
  }

  cb:         RoCallback;
  connected:  boolean;
  observe:    ReturnType<typeof vi.fn>;
  unobserve:  ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;

  constructor(cb: RoCallback) {
    this.cb        = cb;
    this.connected = true;
    this.observe   = vi.fn();
    this.unobserve = vi.fn();
    // Real ResizeObserver.disconnect() stops the browser from delivering
    // callbacks. Mirror that here so manual fire() after disconnect()
    // becomes a no-op — otherwise the disconnect-leak test can't tell
    // whether the helper or the mock failed.
    this.disconnect = vi.fn(() => { this.connected = false; });
    MockResizeObserver.callbacks.push(cb);
    MockResizeObserver.instances.push(this);
  }

  /**
   * Test helper: synthetically fire the captured callback, but only
   * while the observer is still connected. After `disconnect()` this
   * is a no-op, matching the browser semantic.
   */
  fire(): void {
    if (!this.connected) return;
    // We don't need real ResizeObserverEntry payloads — the helper
    // ignores them — but pass an empty array to match the contract.
    this.cb([], this as unknown as ResizeObserver);
  }
}

describe("recalcOffsetOnResize()", () => {
  let originalRO: typeof ResizeObserver | undefined;

  beforeEach(() => {
    originalRO = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    (globalThis as { ResizeObserver: unknown }).ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    MockResizeObserver.reset();
  });

  afterEach(() => {
    (globalThis as { ResizeObserver: unknown }).ResizeObserver =
      originalRO as unknown as typeof ResizeObserver;
  });

  // ── 1. Setup-time call count ───────────────────────────────────────────
  it("does NOT call calcOffset eagerly at setup (subscribe, don't fire)", () => {
    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    recalcOffsetOnResize({ calcOffset }, wrapper);

    // Documents the chosen semantic: only resize events trigger recalc;
    // mount-time recalc is the responsibility of the existing mount
    // effect in FabricCanvas.tsx (the Fabric constructor already
    // computes the correct offset at mount).
    expect(calcOffset).toHaveBeenCalledTimes(0);
  });

  // ── 2. One fire = one call ─────────────────────────────────────────────
  it("calls calcOffset exactly once per ResizeObserver fire", () => {
    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    recalcOffsetOnResize({ calcOffset }, wrapper);

    const observer = MockResizeObserver.instances[0];
    expect(observer).toBeDefined();
    observer!.fire();

    expect(calcOffset).toHaveBeenCalledTimes(1);
  });

  // ── 3. N fires = N calls ───────────────────────────────────────────────
  it("calls calcOffset once per fire across multiple resize events", () => {
    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    recalcOffsetOnResize({ calcOffset }, wrapper);

    const observer = MockResizeObserver.instances[0]!;
    observer.fire();
    observer.fire();
    observer.fire();
    observer.fire();

    // Catches debounce/throttle regressions where someone might wrap
    // calcOffset in requestAnimationFrame and lose calls.
    expect(calcOffset).toHaveBeenCalledTimes(4);
  });

  // ── 4. Disconnect cancels future calls ─────────────────────────────────
  it("disconnects cleanly — no calcOffset after disconnect()", () => {
    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    const disconnect = recalcOffsetOnResize({ calcOffset }, wrapper);

    const observer = MockResizeObserver.instances[0]!;
    observer.fire(); // 1 call
    observer.fire(); // 2 calls
    expect(calcOffset).toHaveBeenCalledTimes(2);

    disconnect();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);

    observer.fire();          // would have been 3
    observer.fire();          // would have been 4
    expect(calcOffset).toHaveBeenCalledTimes(2); // unchanged → cleanup wired
  });

  // ── 5. One observer instance per helper call ───────────────────────────
  it("creates exactly one ResizeObserver per call (no per-entry loops)", () => {
    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    recalcOffsetOnResize({ calcOffset }, wrapper);

    // Catches regressions where someone re-instantiates per resize
    // entry or wraps the constructor in a loop.
    expect(MockResizeObserver.instances).toHaveLength(1);
  });

  // ── 6. observe() receives the exact wrapper, not a child ───────────────
  it("observes the exact wrapper element passed in", () => {
    const calcOffset = vi.fn();
    const wrapper   = { id: "WRAPPER-SENTINEL" } as unknown as Element;

    recalcOffsetOnResize({ calcOffset }, wrapper);

    const observer = MockResizeObserver.instances[0]!;
    expect(observer.observe).toHaveBeenCalledTimes(1);
    expect(observer.observe).toHaveBeenCalledWith(wrapper);
    // Strict identity — catches regressions where the wrapper gets
    // confused with the inner <canvas> element.
    expect(observer.observe.mock.calls[0]?.[0]).toBe(wrapper);
  });

  // ── SSR / no-DOM guard ────────────────────────────────────────────────
  it("returns a no-op disconnect when ResizeObserver is undefined (SSR safety)", () => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = undefined;

    const calcOffset = vi.fn();
    const wrapper   = {} as Element;

    const disconnect = recalcOffsetOnResize({ calcOffset }, wrapper);

    // Helper must not throw and must return a callable cleanup.
    expect(typeof disconnect).toBe("function");
    expect(() => disconnect()).not.toThrow();
    expect(calcOffset).toHaveBeenCalledTimes(0);
  });
});
