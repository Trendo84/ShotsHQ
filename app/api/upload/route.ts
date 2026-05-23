/**
 * Legacy presigned-PUT upload route.
 *
 * `/api/upload/direct` is the canonical path today because it avoids
 * the Cloudflare R2 bucket-CORS dependency. Keep this route for the
 * future browser-direct path once operator-side CORS is configured.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireUser } from "@/lib/auth/clerk";
import { presignUpload } from "@/lib/storage/presign";

export const runtime = "nodejs";

const Body = z.object({
  filename:    z.string().max(120),
  contentType: z.string().regex(/^image\/(png|jpeg|webp)$/),
  projectId:   z.string().uuid().optional(),
});

const ALLOWED_BYTES = 30 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return Response.json({ ok: false, error: "unauthorized" }, { status: 401 }); }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const ext = parsed.data.contentType.split("/")[1] ?? "png";
  const path = parsed.data.projectId ? `users/${user.id}/projects/${parsed.data.projectId}` : `users/${user.id}/uploads`;
  const key  = `${path}/${nanoid()}.${ext}`;

  const out = await presignUpload({ key, contentType: parsed.data.contentType, expiresIn: 300 });
  return Response.json({
    ok: true,
    data: { ...out, maxBytes: ALLOWED_BYTES },
  });
}
