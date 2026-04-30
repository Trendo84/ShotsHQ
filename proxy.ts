import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/api/upload",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

// Without Clerk keys, run the app as a no-auth public preview so the
// marketing + UI scaffold can be browsed without provisioning.
const noopMiddleware = () => NextResponse.next();

const middleware = HAS_CLERK ? protectedMiddleware : noopMiddleware;
export default IS_E2E_BYPASS ? noopMiddleware : middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
