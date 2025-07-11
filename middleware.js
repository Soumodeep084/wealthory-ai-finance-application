// middleware.ts  (or middleware.js – root of the repo)
import arcjet, { createMiddleware }   from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// ----- Arcjet setup -------------------------------------------------
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: 'LIVE',
    }),
    detectBot({
      mode:'LIVE',
      allow: ["CATEGORY:SEARCH_ENGINE" , "GO_HTTP"],
    })
  ],
});
const arcjetMiddleware = createMiddleware(aj);

// ----- Clerk route guard -------------------------------------------
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/transaction(.*)',
]);

// 🟢 1) wrap everything in clerkMiddleware()  -------------------------
export default clerkMiddleware(async (auth, req) => {
  // your own auth logic
  const { userId, redirectToSignIn } = await auth();
  if (!userId && isProtected(req)) return redirectToSignIn();

  // 🟢 2) hand the request to Arcjet after Clerk has run -------------
  return arcjetMiddleware(req);
});

// ----- Matcher shared by Clerk & Arcjet ----------------------------
export const config = {
  matcher: [
    // run for all pages + api/trpc but skip _next & static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};


