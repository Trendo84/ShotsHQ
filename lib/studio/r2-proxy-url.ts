/**
 * Rewrite an R2 public URL into a same-origin proxy URL.
 *
 * Studio persists R2 public URLs (e.g.
 *   https://pub-c1ffb868554d437eb7d020286345facf.r2.dev/users/.../abc.png
 * ) inside `polotnoJson.studio.panels[].screenshotUrl`. The browser
 * exporter (`html-to-image`) needs these images loaded same-origin
 * (or with full CORS headers) to avoid tainting the canvas. The
 * bucket isn't CORS-configured today (cycle #6, 2026-05-23 audit),
 * so we route remote images through `/api/r2-proxy?key=...` — the
 * Node server fetches upstream and streams bytes back.
 *
 * For non-R2 URLs (blob:, data:, or images already on the same
 * origin), we return the URL unchanged.
 *
 * Pure function. Lives in lib/ so both client (DeviceFrame) and
 * server (export.ts, server-rendered surfaces) can call it.
 */

/**
 * R2 path component pattern — keep loose enough to accept any of
 * our upload routes (`users/<uid>/projects/<pid>/...` from Studio,
 * `users/<uid>/uploads/...` from anon dropzones).
 *
 * NOTE: this regex is intentionally a superset of the strict regex
 * in `app/api/r2-proxy/route.ts`. The proxy validates strictly when
 * actually fetching; the rewriter just identifies "this looks like
 * an R2 URL we own — route it through the proxy."
 */
const R2_PATH_RE = /\/(users\/[A-Za-z0-9-]+\/(?:projects\/[A-Za-z0-9-]+|uploads)\/[A-Za-z0-9_.-]+)$/;

/**
 * Check whether a URL is one of our R2 public URLs that should
 * be proxied.
 */
export function isR2PublicUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  // R2.dev public buckets always serve from `*.r2.dev` (sub-domain
  // varies per account). Cloudflare-customer custom domains can
  // also point at R2, but for ShotsHQ we use the default r2.dev
  // host — gating on that keeps the rewrite scoped to ours.
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".r2.dev");
  } catch {
    return false;
  }
}

/**
 * If `url` is one of our R2 public URLs, return the same-origin
 * proxy URL that yields identical bytes via /api/r2-proxy. Otherwise
 * return the URL unchanged.
 *
 * Output is a relative path (`/api/r2-proxy?key=...`) so it's
 * portable across environments without baking the host in.
 */
export function rewriteR2ToProxy(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (!isR2PublicUrl(url)) return url;

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return url;
  }

  const match = pathname.match(R2_PATH_RE);
  if (!match || !match[1]) return url;

  return `/api/r2-proxy?key=${encodeURIComponent(match[1])}`;
}
