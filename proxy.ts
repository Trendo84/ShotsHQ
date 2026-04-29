import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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

export default HAS_CLERK ? protectedMiddleware : noopMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
