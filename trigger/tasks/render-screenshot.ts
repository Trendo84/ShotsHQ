import { task } from "@trigger.dev/sdk/v3";
import { renderFromShotsCanvas } from "@/lib/render/shots-renderer";
import { uploadRender } from "@/lib/render/sharp";
import { db } from "@/lib/db";
import { projects, screenshots, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { STORE_DIMENSIONS } from "@/lib/utils/store-dimensions";
import { canBypassWatermark } from "@/lib/auth/permissions";
import { defaultCanvas } from "@/lib/canvas/defaults";
import type { ShotsCanvas, DeviceId } from "@/lib/canvas/schema";

type Payload = {
  userId:         string;
  projectId:      string;
  device:         keyof typeof STORE_DIMENSIONS;
  locale:         string;
  idempotencyKey: string;
};

export const renderScreenshotTask = task({
  id:          "render-screenshot",
  maxDuration: 240,
  run: async (payload: Payload) => {
    const [user]    = await db.select().from(users).where(eq(users.id, payload.userId));
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, payload.projectId), eq(projects.userId, payload.userId)),
    );
    if (!user || !project) throw new Error("project_not_found");

    // Use saved canvas JSON or fall back to the default template for the device.
    const canvas: ShotsCanvas =
      (project.polotnoJson as ShotsCanvas | null) ??
      defaultCanvas(payload.device as DeviceId);

    const png = await renderFromShotsCanvas(canvas, !canBypassWatermark(user));

    const key = `users/${payload.userId}/projects/${payload.projectId}/${payload.device}/${payload.locale}/${payload.idempotencyKey}.png`;
    const out = await uploadRender(key, png);

    const dim = STORE_DIMENSIONS[payload.device];
    await db.insert(screenshots).values({
      projectId: payload.projectId,
      device:    payload.device,
      locale:    payload.locale,
      r2Key:     out.key,
      width:     dim.width,
      height:    dim.height,
    });

    return { ok: true as const, key: out.key, url: out.url };
  },
});
