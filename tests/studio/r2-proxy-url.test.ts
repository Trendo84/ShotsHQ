import { describe, expect, it } from "vitest";
import { isR2PublicUrl, rewriteR2ToProxy } from "@/lib/studio/r2-proxy-url";

/**
 * Pin the contract of the R2 → same-origin proxy URL rewriter.
 *
 * Used in `components/studio/DeviceFrame.tsx` (and indirectly by the
 * export path) to swap remote R2 URLs for same-origin proxy URLs at
 * render time, so `html-to-image`'s canvas drawImage doesn't taint
 * on cross-origin reads against the not-yet-CORS-configured R2
 * bucket.
 */

describe("isR2PublicUrl()", () => {
  it("matches a typical pub-XYZ.r2.dev URL", () => {
    expect(
      isR2PublicUrl(
        "https://pub-c1ffb868554d437eb7d020286345facf.r2.dev/users/abc/projects/def/x.png",
      ),
    ).toBe(true);
  });

  it("rejects http://, blob:, data: and same-origin URLs", () => {
    expect(isR2PublicUrl("http://pub-x.r2.dev/foo.png")).toBe(false);
    expect(isR2PublicUrl("blob:http://localhost/abc-123")).toBe(false);
    expect(isR2PublicUrl("data:image/png;base64,iVBOR...")).toBe(false);
    expect(isR2PublicUrl("/static/foo.png")).toBe(false);
    expect(isR2PublicUrl("/api/r2-proxy?key=foo")).toBe(false);
  });

  it("rejects unrelated https URLs (defensive against SSRF if the helper is reused)", () => {
    expect(isR2PublicUrl("https://evil.example.com/foo.png")).toBe(false);
    expect(isR2PublicUrl("https://r2.dev.evil.com/x.png")).toBe(false);
  });

  it("handles null / undefined / empty string", () => {
    expect(isR2PublicUrl(null)).toBe(false);
    expect(isR2PublicUrl(undefined)).toBe(false);
    expect(isR2PublicUrl("")).toBe(false);
  });
});

describe("rewriteR2ToProxy()", () => {
  it("rewrites a typical R2 public URL to a same-origin proxy URL", () => {
    const out = rewriteR2ToProxy(
      "https://pub-c1ffb868554d437eb7d020286345facf.r2.dev/users/abc-uuid/projects/def-uuid/luZKmhNthL2T.png",
    );
    expect(out).toBe(
      "/api/r2-proxy?key=" +
        encodeURIComponent("users/abc-uuid/projects/def-uuid/luZKmhNthL2T.png"),
    );
  });

  it("rewrites an /uploads/ path (non-project upload)", () => {
    const out = rewriteR2ToProxy(
      "https://pub-x.r2.dev/users/abc-uuid/uploads/xyz_token.jpg",
    );
    expect(out).toBe(
      "/api/r2-proxy?key=" + encodeURIComponent("users/abc-uuid/uploads/xyz_token.jpg"),
    );
  });

  it("returns blob: / data: URLs unchanged (already same-origin-equivalent)", () => {
    expect(rewriteR2ToProxy("blob:http://localhost/abc")).toBe("blob:http://localhost/abc");
    expect(rewriteR2ToProxy("data:image/png;base64,xx")).toBe("data:image/png;base64,xx");
  });

  it("returns non-R2 https URLs unchanged", () => {
    expect(rewriteR2ToProxy("https://example.test/foo.png")).toBe("https://example.test/foo.png");
  });

  it("passes through null / undefined / empty without throwing", () => {
    expect(rewriteR2ToProxy(null)).toBe(null);
    expect(rewriteR2ToProxy(undefined)).toBe(undefined);
    expect(rewriteR2ToProxy("")).toBe("");
  });

  it("returns the original URL when the path doesn't match the expected R2 layout", () => {
    // Some pub-X.r2.dev URL that isn't shaped like ours — leave alone
    // rather than silently rewriting into a broken proxy key.
    expect(
      rewriteR2ToProxy("https://pub-x.r2.dev/some/other/layout.png"),
    ).toBe("https://pub-x.r2.dev/some/other/layout.png");
  });
});
