import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  CONSTRUCTION_COOKIE,
  hasConstructionAccess,
  isConstructionMode,
} from "@/lib/construction";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * E2E auth bypass — see `docs/issues/v1.1-playwright-auth-bypass.md`.
 * TWO gates, both must be satisfied:
 *   1. NODE_ENV !== "production" (hard gate; impossible to flip in prod)
 *   2. NEXT_PUBLIC_E2E === "1"   (soft gate; intentional opt-in)
 * Plus a build-time guard in `next.config.ts` that refuses to compile a
 * Vercel production deployment with the flag set, as belt-and-suspenders.
 */
const IS_E2E_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_E2E === "1";

if (IS_E2E_BYPASS) {
  // eslint-disable-next-line no-console
  console.warn(
    "\n\x1b[33m⚠ [proxy] E2E auth bypass active — NEXT_PUBLIC_E2E=1, NODE_ENV=" +
      process.env.NODE_ENV +
      ". Clerk middleware is disabled. NEVER set this in production.\x1b[0m\n",
  );
}

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/projects(.*)",
  "/billing(.*)",
  "/settings(.*)",
  "/api/ai/(.*)",
  "/api/stripe/checkout",
  "/api/stripe/portal",
  "/api/render",
  "/api/upload(.*)",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

// Without Clerk keys, run the app as a no-auth public preview so the
// marketing + UI scaffold can be browsed without provisioning.
const noopMiddleware = (_req: NextRequest, _event: NextFetchEvent) => NextResponse.next();

const middleware = HAS_CLERK ? protectedMiddleware : noopMiddleware;

function constructionGate(req: NextRequest) {
  if (!isConstructionMode()) return null;

  const { pathname } = req.nextUrl;

  if (
    pathname === "/under-construction" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/trpc")
  ) {
    return null;
  }

  if (hasConstructionAccess(req.cookies.get(CONSTRUCTION_COOKIE)?.value)) {
    return null;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/under-construction";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const constructionResponse = constructionGate(req);
  if (constructionResponse) return constructionResponse;

  if (IS_E2E_BYPASS) return noopMiddleware(req, event);
  return middleware(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
