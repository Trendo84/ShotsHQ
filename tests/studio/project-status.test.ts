import { describe, expect, it } from "vitest";
import {
  projectStatus,
  projectStatusDisplay,
  nextActionFor,
} from "@/lib/studio/project-status";
import {
  defaultStudioDesign,
  type StudioDesign,
  type StudioDesignSet,
} from "@/components/studio/types";

/**
 * Pin the shared project-status contract — the same source three
 * surfaces will derive their status from. If any of these specs
 * regress, /dashboard, /projects, and /projects/[id] will all start
 * drifting back into lies. Loud tests, on purpose.
 */

function readyPanel(panelId = "ready-panel"): StudioDesign {
  return {
    ...defaultStudioDesign("iphone_69"),
    panelId,
    headline:         "Ship App Store screenshots faster.",
    screenshotUrl:    "https://example.test/r2/abc.png",
    screenshotRemote: true,
  };
}

function studioSet(panels: StudioDesign[], activePanelId?: string): StudioDesignSet {
  return {
    version:       "2",
    activePanelId: activePanelId ?? panels[0]?.panelId ?? "",
    panels,
  };
}

describe("projectStatus()", () => {
  it("returns status='empty' + 0 panels for a project with null polotnoJson", () => {
    const s = projectStatus(null);
    expect(s.status).toBe("empty");
    expect(s.studio.panels).toEqual([]);
    expect(s.readiness.totalPanels).toBe(0);
    expect(s.readiness.readyPanels).toBe(0);
  });

  it("returns status='empty' for a polotnoJson with no .studio key", () => {
    expect(projectStatus({ device: "iphone_69" }).status).toBe("empty");
    expect(projectStatus({}).status).toBe("empty");
  });

  it("returns status='empty' for malformed studio state (does NOT default-seed a phantom panel)", () => {
    // Defensive: we must NOT call defaultStudioDesignSet() here.
    // Returning "empty" beats lying about a panel that doesn't exist.
    const s = projectStatus({ studio: { not: "a real shape" } });
    expect(s.status).toBe("empty");
    expect(s.studio.panels).toEqual([]);
  });

  it("returns status='blocked' when a panel exists but has no screenshot", () => {
    const drafting = { ...defaultStudioDesign("iphone_69"), headline: "test" };
    const s = projectStatus({ studio: studioSet([drafting]) });
    expect(s.status).toBe("blocked");
    expect(s.readiness.totalPanels).toBe(1);
    expect(s.readiness.readyPanels).toBe(0);
  });

  it("returns status='partial' when some panels are ready and some aren't", () => {
    const set = studioSet([readyPanel("a"), { ...defaultStudioDesign("iphone_67"), panelId: "b", headline: "x" }]);
    const s = projectStatus({ studio: set });
    expect(s.status).toBe("partial");
    expect(s.readiness.readyPanels).toBe(1);
    expect(s.readiness.totalPanels).toBe(2);
  });

  it("returns status='ready' when every panel is ready", () => {
    const s = projectStatus({ studio: studioSet([readyPanel("a"), readyPanel("b")]) });
    expect(s.status).toBe("ready");
    expect(s.readiness.readyPanels).toBe(2);
    expect(s.readiness.totalPanels).toBe(2);
  });
});

describe("projectStatusDisplay()", () => {
  it("renders DRAFT (default) for empty projects, with the operator's next action pointing at Studio", () => {
    const d = projectStatusDisplay(projectStatus(null), "abc-123");
    expect(d.label).toBe("DRAFT");
    expect(d.variant).toBe("default");
    expect(d.next.id).toBe("add-targets-in-studio");
    expect(d.next.href).toBe("/projects/abc-123/studio");
  });

  it("renders DRAFT (default) for blocked projects, next.id='upload-in-studio'", () => {
    const drafting = { ...defaultStudioDesign("iphone_69"), headline: "x" };
    const d = projectStatusDisplay(
      projectStatus({ studio: studioSet([drafting]) }),
      "abc-123",
    );
    expect(d.label).toBe("DRAFT");
    expect(d.variant).toBe("default");
    expect(d.next.id).toBe("upload-in-studio");
    expect(d.next.href).toBe("/projects/abc-123/studio");
  });

  it("renders IN PROGRESS (warn) for partial projects, next.id='prepare-in-studio'", () => {
    const set = studioSet([readyPanel("a"), { ...defaultStudioDesign("iphone_67"), panelId: "b", headline: "x" }]);
    const d = projectStatusDisplay(projectStatus({ studio: set }), "abc-123");
    expect(d.label).toBe("IN PROGRESS");
    expect(d.variant).toBe("warn");
    expect(d.next.id).toBe("prepare-in-studio");
  });

  it("renders READY (live) for fully-ready projects, next.id='open-exports' pointing at /exports", () => {
    const d = projectStatusDisplay(
      projectStatus({ studio: studioSet([readyPanel("a")]) }),
      "abc-123",
    );
    expect(d.label).toBe("READY");
    expect(d.variant).toBe("live");
    expect(d.next.id).toBe("open-exports");
    expect(d.next.href).toBe("/projects/abc-123/exports");
  });

  it("help copy is non-empty for every status (no silent gaps on the dashboard)", () => {
    for (const polotno of [
      null,
      { studio: studioSet([{ ...defaultStudioDesign("iphone_69"), headline: "x" }]) },
      { studio: studioSet([readyPanel("a"), { ...defaultStudioDesign("iphone_67"), panelId: "b", headline: "x" }]) },
      { studio: studioSet([readyPanel("a")]) },
    ]) {
      const d = projectStatusDisplay(projectStatus(polotno), "p");
      expect(d.help.length).toBeGreaterThan(0);
      expect(d.next.label.length).toBeGreaterThan(0);
    }
  });

  it("partial-status help copy includes the X / Y progress count", () => {
    const set = studioSet([
      readyPanel("a"),
      readyPanel("b"),
      { ...defaultStudioDesign("iphone_67"), panelId: "c", headline: "x" },
    ]);
    const d = projectStatusDisplay(projectStatus({ studio: set }), "p");
    expect(d.help).toMatch(/2 of 3/);
  });
});

describe("nextActionFor()", () => {
  it("links to /studio for empty / blocked / partial; /exports for ready", () => {
    expect(nextActionFor("p", "empty").href).toBe("/projects/p/studio");
    expect(nextActionFor("p", "blocked").href).toBe("/projects/p/studio");
    expect(nextActionFor("p", "partial").href).toBe("/projects/p/studio");
    expect(nextActionFor("p", "ready").href).toBe("/projects/p/exports");
  });

  it("returns distinct action ids per status", () => {
    const ids = new Set([
      nextActionFor("p", "empty").id,
      nextActionFor("p", "blocked").id,
      nextActionFor("p", "partial").id,
      nextActionFor("p", "ready").id,
    ]);
    expect(ids.size).toBe(4);
  });
});
