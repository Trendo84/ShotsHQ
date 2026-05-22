/**
 * Server-side proxied upload to R2.
 *
 * Why this exists alongside /api/upload:
 *   The existing /api/upload returns a presigned PUT URL that the
 *   browser uploads to directly. That requires CORS to be configured
 *   on the R2 bucket; if it isn't, the browser's preflight OPTIONS
 *   request is blocked and the upload fails (verified 2026-05-23
 *   against the shotshq-exports bucket — no Access-Control-Allow-
 *   Origin header on the cross-origin PUT).
 *
 *   This route is the CORS-free alternative: the browser POSTs the
 *   file body to our own origin (no preflight needed for our own
 *   /api/* routes) and the Node server PUTs to R2 with the AWS
 *   credentials we already hold. Slightly more egress on our end,
 *   but it works without operator-side bucket-CORS config.
 *
 * Used by Studio (`components/studio/StudioClient.tsx`) for
 * screenshot uploads. CaptureDropzone keeps using the presigned
 * path — when R2 CORS is configured operator-side, both paths
 * become available; until then this is the reliable one.
 *
 * Request shape: multipart/form-data with:
 *   file       — the image bytes (image/png, image/jpeg, image/webp)
 *   projectId  — optional uuid; scopes the storage key
 *
 * Response: `{ ok: true, data: { publicUrl, key } }`
 *
 * Limits:
 *   - 10 MB body cap (typical iPhone screenshot at 1290×2796 is
 *     ~1-5 MB; comfortable headroom)
 *   - PNG / JPEG / WEBP only (mirrors the existing presigned route)
 *
 * Idempotency: each upload gets a fresh nanoid; duplicate POSTs
 * create two R2 objects. The caller (Studio) is responsible for
 * de-duping via blob URL identity if it cares.
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireUser } from "@/lib/auth/clerk";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const UUID_RE   = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function extFromContentType(ct: string): string | null {
  if (ct === "image/png")           return "png";
  if (ct === "image/jpeg")          return "jpg";
  if (ct === "image/jpg")           return "jpg";
  if (ct === "image/webp")          return "webp";
  return null;
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // ── Parse multipart ──────────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form_data" }, { status: 400 });
  }

  const file      = form.get("file");
  const projectId = form.get("projectId");

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const ext = extFromContentType(file.type);
  if (!ext) {
    return Response.json(
      { ok: false, error: "unsupported_content_type" },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "file_too_large", maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }

  // Project scoping is optional but if present must be a real UUID
  // — defensive against `users/<uid>/projects/p_01/...` cruft.
  let projectSegment: string;
  if (typeof projectId === "string" && projectId.length > 0) {
    if (!UUID_RE.test(projectId)) {
      return Response.json({ ok: false, error: "invalid_project_id" }, { status: 400 });
    }
    projectSegment = `projects/${projectId}`;
  } else {
    projectSegment = "uploads";
  }

  const key = `users/${user.id}/${projectSegment}/${nanoid()}.${ext}`;

  // ── PUT to R2 ────────────────────────────────────────────────────────
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         key,
        Body:        bytes,
        ContentType: file.type,
      }),
    );
  } catch (err) {
    logError("[upload.direct] R2 PUT failed", err, { userId: user.id, key });
    return Response.json({ ok: false, error: "upload_failed" }, { status: 502 });
  }

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  return Response.json({
    ok:   true,
    data: { publicUrl, key },
  }, { status: 201 });
}
