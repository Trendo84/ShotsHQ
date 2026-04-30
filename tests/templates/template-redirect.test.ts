import { describe, it, expect } from "vitest";
import { templateHref, validateRedirectUrl } from "@/lib/templates/redirect";

/**
 * Regression tests for the auth-aware template redirect helpers. These
 * back the fix for docs/audits/2026-04-30-comet-sonnet-editor.md #1
 * (signed-in users were being dumped on /sign-up; signed-up users
 * weren't returning to the seeded wizard) and the open-redirect
 * defense added during triage.
 */

describe("templateHref()", () => {
  const slug = "mono-punch";

  it("returns the wizard path for a signed-in, loaded user", () => {
    expect(templateHref({ slug, isLoaded: true, isSignedIn: true }))
      .toBe("/projects/new?template=mono-punch");
  });

  it("returns the sign-up path for an anonymous, loaded user", () => {
    const url = templateHref({ slug, isLoaded: true, isSignedIn: false });
    expect(url).toMatch(/^\/sign-up\?redirect_url=/);
    expect(url).toContain(encodeURIComponent("/projects/new?template=mono-punch"));
  });

  it("treats !isLoaded as anonymous (avoids hydration flash)", () => {
    const url = templateHref({ slug, isLoaded: false, isSignedIn: false });
    expect(url).toMatch(/^\/sign-up\?redirect_url=/);
  });

  it("URL-encodes the slug if it contains special chars", () => {
    const url = templateHref({ slug: "space slug & co", isLoaded: true, isSignedIn: true });
    expect(url).toBe("/projects/new?template=space%20slug%20%26%20co");
  });
});

describe("validateRedirectUrl() — open-redirect defense", () => {
  const ORIGIN = "https://shotshq.com";

  it("accepts a same-origin path", () => {
    expect(validateRedirectUrl("/projects/new?template=foo", ORIGIN))
      .toBe("/projects/new?template=foo");
    expect(validateRedirectUrl("/dashboard", ORIGIN)).toBe("/dashboard");
    expect(validateRedirectUrl("/billing#section", ORIGIN)).toBe("/billing#section");
  });

  it("REJECTS protocol-relative URLs (//evil.com/...)", () => {
    expect(validateRedirectUrl("//evil.com/path", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("//evil.com", ORIGIN)).toBeNull();
  });

  it("REJECTS backslash-prefixed paths (/\\evil.com)", () => {
    expect(validateRedirectUrl("/\\evil.com/path", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("/\\\\evil.com", ORIGIN)).toBeNull();
  });

  it("REJECTS absolute URLs (https://, http://)", () => {
    expect(validateRedirectUrl("https://evil.com/path", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("http://evil.com", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("https://shotshq.com/dashboard", ORIGIN)).toBeNull();
    // Even same-origin absolute URLs are rejected — we only allow paths
    // (forces the calling code to think in same-origin terms always).
  });

  it("REJECTS javascript: and data: URLs", () => {
    expect(validateRedirectUrl("javascript:alert(1)", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("data:text/html,<script>alert(1)</script>", ORIGIN)).toBeNull();
  });

  it("REJECTS empty / null / non-string values", () => {
    expect(validateRedirectUrl("", ORIGIN)).toBeNull();
    expect(validateRedirectUrl(null, ORIGIN)).toBeNull();
    expect(validateRedirectUrl(undefined, ORIGIN)).toBeNull();
  });

  it("REJECTS strings that don't start with /", () => {
    expect(validateRedirectUrl("dashboard", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("?foo=bar", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("#fragment", ORIGIN)).toBeNull();
    expect(validateRedirectUrl(" /dashboard", ORIGIN)).toBeNull();
  });

  it("REJECTS strings containing colons (catches scheme injections)", () => {
    expect(validateRedirectUrl("/path:foo", ORIGIN)).toBeNull();
    expect(validateRedirectUrl("/?x=https://evil.com", ORIGIN)).toBeNull();
  });

  it("preserves query string and hash on accepted paths", () => {
    expect(validateRedirectUrl("/dashboard?tab=stats#top", ORIGIN))
      .toBe("/dashboard?tab=stats#top");
  });

  it("returns the path-only form even when the candidate had no query/hash", () => {
    expect(validateRedirectUrl("/", ORIGIN)).toBe("/");
  });
});
