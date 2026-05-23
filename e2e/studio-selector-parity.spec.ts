import { test, expect, type Page } from "@playwright/test";

/**
 * Studio selector-group parity — cycle #8 (2026-05-23).
 *
 * The cycle-#1 device-class fix established a selected-state
 * contract: every selector option exposes `aria-pressed` +
 * `aria-checked` + `data-active` + `role="radio"` so the active
 * state is unambiguous in DOM and the regression net catches
 * silent drift. Cycle #8 extends that contract to every other
 * selector group on Studio's left rail:
 *
 *   - Frame style
 *   - Layout
 *   - Theme preset
 *   - Align
 *   - Font tone
 *   - Background mode
 *
 * This spec is one parameterised test per group. For each group it
 *   1. Loads /studio for a fresh project.
 *   2. Captures the initially-active option's `data-active="true"`
 *      and confirms it's the ONLY one in the group reporting active.
 *   3. Clicks every OTHER option in the group in turn and asserts:
 *        - the clicked option flips to `data-active="true"`,
 *          `aria-checked="true"`, `aria-pressed="true"`
 *        - all the other options in the group flip to
 *          `data-active="false"` / `aria-checked="false"`
 *
 * The contract is structural (data attributes + ARIA), not visual,
 * so the spec doesn't depend on theme or color tokens. Browser QA
 * separately confirms the active text-color flip is unambiguous.
 */

type SelectorGroup = {
  /** Human-readable label for test naming. */
  label:        string;
  /** Per-option data attribute the buttons expose for testability. */
  dataAttr:     string;
  /** A list of option ids we expect this group to render for a fresh
   * project. Each must be a valid CSS attribute value (no quotes /
   * weird chars — the studio types pick plain enum strings). */
  options:      readonly string[];
  /** The option that is active by default on a fresh project. */
  defaultId:    string;
  /** Optional setup hook: switch to a panel/device-class that makes
   * this group render the expected option set. Frame style is the
   * only one that varies per device family — for iPhone (default
   * fresh project) it's pro-device / flat-device / frameless. */
  setup?:       (page: Page) => Promise<void>;
};

const GROUPS: SelectorGroup[] = [
  {
    label:     "Frame style",
    dataAttr:  "data-frame-id",
    // Default project + default panel = iphone family. The catalog
    // filters DEVICE_FRAMES to frames whose families.includes("iphone"):
    // pro-device, flat-device, frameless.
    options:   ["pro-device", "flat-device", "frameless"],
    defaultId: "pro-device",
  },
  {
    label:     "Layout",
    dataAttr:  "data-layout-id",
    options:   ["text-top", "text-bottom", "device-only", "device-angled"],
    defaultId: "text-top",
  },
  {
    label:     "Theme preset",
    dataAttr:  "data-theme-id",
    options:   ["tactical-telemetry", "swiss-industrial", "signal-console", "midnight-blue"],
    defaultId: "tactical-telemetry",
  },
  {
    label:     "Align",
    dataAttr:  "data-align-id",
    options:   ["left", "center", "right"],
    defaultId: "center",
  },
  {
    label:     "Font tone",
    dataAttr:  "data-font-id",
    options:   ["display", "sans", "mono"],
    defaultId: "display",
  },
  {
    label:     "Background mode",
    dataAttr:  "data-bgkind-id",
    options:   ["radial", "linear", "solid"],
    defaultId: "radial",
  },
];

async function createProject(
  request: import("@playwright/test").APIRequestContext,
  name:    string,
): Promise<string> {
  const res = await request.post("/api/projects", {
    data: {
      name,
      appName:        "Selectors",
      appDescription: "Cycle 8 selector-parity smoke",
      category:       "",
      storeTargets:   ["iphone-16-pro-max"],
    },
  });
  const body = await res.text();
  if (!res.ok()) throw new Error(`createProject failed: HTTP ${res.status()} — ${body.slice(0, 240)}`);
  return (JSON.parse(body) as { ok: true; data: { id: string } }).data.id;
}

async function expectExactlyOneActive(
  page:    Page,
  dataAttr: string,
  expectedId: string,
): Promise<void> {
  // The active option exposes data-active="true"; every other option
  // in the group exposes data-active="false". A working selector
  // group has exactly ONE active option at all times.
  const activeButtons = page.locator(`button[${dataAttr}][data-active="true"]`);
  await expect(activeButtons).toHaveCount(1);

  const inactiveButtons = page.locator(`button[${dataAttr}][data-active="false"]`);
  // ≥1 inactive — there's always more than one option in every group.
  await expect(inactiveButtons.first()).toBeAttached();

  // The one active button must be the one we expected.
  const activeOne = page.locator(`button[${dataAttr}="${expectedId}"]`);
  await expect(activeOne).toHaveAttribute("data-active", "true");
  await expect(activeOne).toHaveAttribute("aria-checked", "true");
  await expect(activeOne).toHaveAttribute("aria-pressed", "true");
}

test.describe("Studio selector-group selected-state parity", () => {
  for (const group of GROUPS) {
    test(`${group.label}: clicking any option flips its data-active to true and peers to false`, async ({ page, request }) => {
      const projectId = await createProject(request, `selectors-${group.label.toLowerCase().replace(/\s+/g, "-")}`);
      await page.goto(`/projects/${projectId}/studio`);

      // Every group's parent wrapper has role="radiogroup" with an
      // aria-label matching the StudioField label. Verifies the
      // a11y contract surfaces it.
      const groupRoot = page.getByRole("radiogroup", { name: group.label });
      await expect(groupRoot).toBeAttached();

      if (group.setup) await group.setup(page);

      // 1. Initial state: default option is the sole active one.
      await expectExactlyOneActive(page, group.dataAttr, group.defaultId);

      // 2. Click every OTHER option and assert the active-set
      //    follows the click. We start at the default, then visit
      //    each non-default in order. The cycle ends back at the
      //    default to leave the panel in a clean state.
      const visitOrder = [
        ...group.options.filter((id) => id !== group.defaultId),
        group.defaultId,
      ];

      for (const id of visitOrder) {
        const button = page.locator(`button[${group.dataAttr}="${id}"]`).first();
        await expect(button).toBeAttached();
        await button.click();

        // The clicked option flipped to active.
        await expect(button).toHaveAttribute("data-active",  "true",  { timeout: 3_000 });
        await expect(button).toHaveAttribute("aria-checked", "true");
        await expect(button).toHaveAttribute("aria-pressed", "true");

        // Every other option in the group flipped to inactive.
        for (const otherId of group.options) {
          if (otherId === id) continue;
          const other = page.locator(`button[${group.dataAttr}="${otherId}"]`).first();
          await expect(other).toHaveAttribute("data-active",  "false");
          await expect(other).toHaveAttribute("aria-checked", "false");
          await expect(other).toHaveAttribute("aria-pressed", "false");
        }

        // Sanity: still exactly one active in the whole group.
        await expectExactlyOneActive(page, group.dataAttr, id);
      }
    });
  }
});
