/**
 * Same-origin R2 read proxy.
 *
 * Why this exists:
 *   ShotsHQ's R2 bucket (`shotshq-exports`) is served via a public
 *   `*.r2.dev` URL that returns image bytes correctly but does NOT
 *   include `Access-Control-Allow-Origin` headers on GET, and 403s
 *   OPTIONS preflights. When Studio's browser-side exporter
 *   (`html-to-image → canvas.drawImage`) loads a remote screenshot
 *   with `<img crossOrigin="anonymous">`, the browser taints the
 *   canvas because the CORS contract isn't satisfied. `toDataURL`
 *   then throws and the export silently fails — verified against
 *   the live bucket on 2026-05-23 (cycle #6).
 *
 *   Operator-side fix is to configure the bucket's CORS rule (see
 *   docs/ops/overnight-browseros-status.md cycle #3). Until that
 *   lands, this proxy is the code-side workaround: the browser
 *   fetches `/api/r2-proxy?key=...` (same origin → no CORS check
 *   at all), the Node server fetches the upstream R2 URL, streams
 *   the bytes back. The exporter's canvas stays clean and the
 *   PNG download lands at exact dimensions.
 *
 * Security
 * --------
 *   - Open to unauthenticated reads. The R2 public URL is itself
 *     unauthenticated; the proxy doesn't expose anything that
 *     wasn't already public.
 *   - `key` must match a strict regex: only paths under
 *     `users/<uuid>/projects/<uuid>/<nanoid>.<ext>` or
 *     `users/<uuid>/uploads/<nanoid>.<ext>` are allowed. This
 *     prevents SSRF — even though R2 is the only upstream, an
 *     attacker can't probe arbitrary R2 keys or trick us into
 *     fetching paths that don't exist.
 *   - Only known image content-types (PNG/JPEG/WEBP).
 *   - Hard cap on response size (12 MB — matches the
 *     /api/upload/direct cap with a small margin).
 *
 * Caching
 * -------
 *   R2-served images are content-addressed by nanoid, so the path
 *   itself is the cache key. Set `Cache-Control: public, max-age=
 *   31536000, immutable` — once a key exists, its bytes never
 *   change.
 */

import { NextRequest } from "next/server";
import { R2_PUBLIC_URL } from "@/lib/storage/r2";
import { logError } from "@/lib/observability/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_KEY_RE =
  /^users\/[0-9a-fA-F-]{36}\/(?:projects\/[0-9a-fA-F-]{36}|uploads)\/[A-Za-z0-9_-]{12,32}\.(png|jpe?g|webp)$/;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export async function GET(req: NextRequest): Promise<Response> {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return Response.json({ ok: false, error: "missing_key" }, { status: 400 });
  if (!ALLOWED_KEY_RE.test(key)) {
    return Response.json({ ok: false, error: "invalid_key" }, { status: 400 });
  }

  // R2_PUBLIC_URL is configured per environment. If it's missing
  // (e.g. a misconfigured deployment), fail loud rather than blank.
  if (!R2_PUBLIC_URL) {
    logError("[r2-proxy] R2_PUBLIC_URL not configured", new Error("config_missing"), { key });
    return Response.json({ ok: false, error: "proxy_unconfigured" }, { status: 500 });
  }

  const upstream = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      // Bypass any local caches — keys are immutable so this only
      // ensures the first hit is fresh; subsequent hits are served
      // from CDN via our own Cache-Control header below.
      cache: "no-store",
    });
  } catch (err) {
    logError("[r2-proxy] upstream fetch failed", err, { key });
    return Response.json({ ok: false, error: "upstream_fetch_failed" }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    return Response.json(
      { ok: false, error: "upstream_status", upstreamStatus: upstreamRes.status },
      { status: upstreamRes.status === 404 ? 404 : 502 },
    );
  }

  const contentType = upstreamRes.headers.get("Content-Type")?.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return Response.json(
      { ok: false, error: "unsupported_upstream_content_type", contentType },
      { status: 415 },
    );
  }

  const contentLength = Number(upstreamRes.headers.get("Content-Length") ?? "0");
  if (contentLength > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "upstream_too_large", maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }

  // Stream bytes back. We don't need to read into memory — pipe the
  // upstream body through to the client.
  const buf = await upstreamRes.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "upstream_too_large", maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }

  return new Response(buf, {
    status:  200,
    headers: {
      "Content-Type":  contentType,
      // Immutable cache: R2 keys are nanoid-suffixed, so identical
      // URLs always return identical bytes.
      "Cache-Control": "public, max-age=31536000, immutable",
      // Defense-in-depth: even though same-origin doesn't require
      // it, expose ACAO so a future cross-origin caller is happy.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
