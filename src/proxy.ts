import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Strict, nonce-based Content-Security-Policy (audit hardening — the interim
// compensating control for tokens living in localStorage). Next 16 renamed
// Middleware → Proxy; this runs before each document render.
//
// A fresh nonce is minted per request. Next.js parses it out of the CSP header
// and applies it to its own framework scripts; we hand the same nonce to our
// one inline <script> (the no-FOUC theme setter) in the root layout.
// 'strict-dynamic' lets those nonce'd scripts load the rest of the bundle, so
// scripts need no host allowlist.
//
// Deliberate choices:
//   • style-src keeps 'unsafe-inline' (NOT a nonce): React emits inline
//     style="" attributes a nonce can't cover, and a present nonce would make
//     the browser ignore 'unsafe-inline'. Style injection is low-risk; the XSS
//     protection lives in script-src.
//   • connect-src lists every origin the client talks to: the API, PostHog,
//     Sentry, plus the dev HMR websocket.
//   • A nonce forces dynamic rendering of every page (the nonce is applied at
//     SSR time) — an accepted trade-off for a strict CSP.

function buildCsp(nonce: string, isDev: boolean): string {
  let apiOrigin = "";
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) apiOrigin = new URL(api).origin;
  } catch {
    apiOrigin = "";
  }

  const connectSrc = [
    "'self'",
    apiOrigin,
    "https://*.posthog.com",
    "https://*.sentry.io",
    isDev ? "ws: wss:" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  // Next reads the nonce from the CSP on the *request* headers during SSR.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on document routes only — skip API, static assets, image
    // optimization, the favicon, and next/link prefetches (which don't need a
    // CSP and would needlessly force dynamic work).
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
