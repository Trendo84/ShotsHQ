import { describe, expect, it } from "vitest";
import {
  evaluatePanel,
  evaluatePanelById,
  evaluateStudio,
  describeIssues,
  statusOf,
  statusLabel,
  statusHelp,
} from "@/lib/studio/readiness";
import {
  cloneStudioDesign,
  defaultStudioDesign,
  defaultStudioDesignSet,
  type StudioDesign,
  type StudioDesignSet,
} from "@/components/studio/types";

/**
 * Browser audit (2026-05-23) found Studio claiming "EXPORT READY" on
 * a fresh project with zero uploaded screenshots, with the export CTAs
 * enabled and producing nothing on click. The fix introduces a single
 * readiness reducer that both Studio and /exports derive from. These
 * specs pin the contract so future regressions are loud.
 */

function readyPanel(overrides: Partial<StudioDesign> = {}): StudioDesign {
  return {
    ...defaultStudioDesign("iphone_69"),
    headline:      "App that ships clean",
    screenshotUrl: "https://example.test/upload.png",
    screenshotRemote: true,
    ...overrides,
  };
}

describe("evaluatePanel()", () => {
  it("flags a default-seeded panel as not-ready (no screenshot)", () => {
    // defaultStudioDesign seeds a headline but NO screenshot. That
    // matches the live-audit symptom: a freshly opened Studio panel
    // is not exportable yet.
    const panel = defaultStudioDesign("iphone_69");
    const r = evaluatePanel(panel);
    expect(r.ready).toBe(false);
    expect(r.issues).toContain("no-screenshot");
    expect(r.issues).not.toContain("no-headline");
  });

  it("flags a panel with no headline as not-ready", () => {
    const panel = { ...readyPanel(), headline: "" };
    const r = evaluatePanel(panel);
    expect(r.ready).toBe(false);
    expect(r.issues).toContain("no-headline");
  });

  it("treats a whitespace-only headline as missing", () => {
    const panel = { ...readyPanel(), headline: "   \n\t" };
    expect(evaluatePanel(panel).issues).toContain("no-headline");
  });

  it("accepts a blob: screenshot URL (just-uploaded panel)", () => {
    const panel = readyPanel({ screenshotUrl: "blob:http://localhost/abc-123", screenshotRemote: false });
    expect(evaluatePanel(panel).ready).toBe(true);
  });

  it("accepts a remote https screenshot URL (post-reload panel)", () => {
    const panel = readyPanel({ screenshotUrl: "https://cdn.example.test/a.png", screenshotRemote: true });
    expect(evaluatePanel(panel).ready).toBe(true);
  });

  it("returns multi-issue arrays when both headline + screenshot are missing", () => {
    const panel = { ...defaultStudioDesign(), headline: "" };
    const r = evaluatePanel(panel);
    expect(r.ready).toBe(false);
    expect(r.issues).toEqual(expect.arrayContaining(["no-screenshot", "no-headline"]));
  });
});

describe("evaluateStudio()", () => {
  it("treats a default-seeded design set as not exportable (blocked)", () => {
    const set = defaultStudioDesignSet("iphone_69");
    const r = evaluateStudio(set);
    expect(r.exportable).toBe(false);
    expect(r.fullyReady).toBe(false);
    expect(r.readyPanels).toBe(0);
    expect(statusOf(r)).toBe("blocked");
  });

  it("flips to exportable when one panel becomes ready", () => {
    const base = defaultStudioDesignSet("iphone_69");
    const set: StudioDesignSet = {
      ...base,
      panels: [readyPanel({ panelId: base.panels[0]!.panelId })],
    };
    const r = evaluateStudio(set);
    expect(r.exportable).toBe(true);
    expect(r.fullyReady).toBe(true);
    expect(statusOf(r)).toBe("ready");
  });

  it("reports partial when some panels ready, some not (Export ready (X/N) territory)", () => {
    const a = readyPanel();
    const b = defaultStudioDesign("iphone_67"); // no screenshot
    const c = readyPanel({ panelId: "panel-c", deviceId: "ipad_13" });
    const set: StudioDesignSet = { version: "2", activePanelId: a.panelId, panels: [a, b, c] };
    const r = evaluateStudio(set);
    expect(r.exportable).toBe(true);
    expect(r.fullyReady).toBe(false);
    expect(r.readyPanels).toBe(2);
    expect(r.totalPanels).toBe(3);
    expect(statusOf(r)).toBe("partial");
  });

  it("returns the empty status for an empty panels array (defensive)", () => {
    const set: StudioDesignSet = { version: "2", activePanelId: "x", panels: [] };
    const r = evaluateStudio(set);
    expect(r.empty).toBe(true);
    expect(r.exportable).toBe(false);
    expect(statusOf(r)).toBe("empty");
  });

  it("preserves panel order in perPanel", () => {
    const a = defaultStudioDesign("iphone_69");
    const b = cloneStudioDesign(readyPanel());
    const c = cloneStudioDesign(defaultStudioDesign("ipad_13"));
    const set: StudioDesignSet = { version: "2", activePanelId: a.panelId, panels: [a, b, c] };
    const r = evaluateStudio(set);
    expect(r.perPanel.map((p) => p.panelId)).toEqual([a.panelId, b.panelId, c.panelId]);
  });
});

describe("evaluatePanelById()", () => {
  it("returns readiness for an existing panel", () => {
    const set = defaultStudioDesignSet("iphone_69");
    const r = evaluatePanelById(set, set.activePanelId);
    expect(r).not.toBeNull();
    expect(r!.ready).toBe(false);
  });

  it("returns null when the panelId is missing", () => {
    const set = defaultStudioDesignSet("iphone_69");
    expect(evaluatePanelById(set, "no-such-panel")).toBeNull();
  });
});

describe("describeIssues()", () => {
  it("maps issue keys to human copy", () => {
    expect(describeIssues(["no-screenshot"])).toEqual(["missing app screenshot"]);
    expect(describeIssues(["no-headline"])).toEqual(["missing headline"]);
    expect(describeIssues([])).toEqual([]);
  });
});

describe("statusLabel() / statusHelp()", () => {
  it("produces consistent labels for all four states", () => {
    expect(statusLabel("empty")).toBe("Empty");
    expect(statusLabel("blocked")).toBe("Blocked");
    expect(statusLabel("partial")).toBe("Partial");
    expect(statusLabel("ready")).toBe("Ready");
  });

  it("statusHelp for blocked tells the user to upload screenshots", () => {
    const set = defaultStudioDesignSet("iphone_69");
    const r = evaluateStudio(set);
    expect(statusHelp(r)).toMatch(/upload/i);
  });

  it("statusHelp for partial includes the X/N progress", () => {
    const a = readyPanel();
    const b = defaultStudioDesign("iphone_67");
    const set: StudioDesignSet = { version: "2", activePanelId: a.panelId, panels: [a, b] };
    const r = evaluateStudio(set);
    expect(statusHelp(r)).toMatch(/1 of 2/);
  });

  it("statusHelp for ready confirms the export contract", () => {
    const a = readyPanel();
    const set: StudioDesignSet = { version: "2", activePanelId: a.panelId, panels: [a] };
    const r = evaluateStudio(set);
    expect(statusHelp(r)).toMatch(/exact/i);
  });
});
