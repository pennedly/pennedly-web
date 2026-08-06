import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Your drafting partner for Threads — write in your own voice, and you keep the final say.";

export const metadata: Metadata = {
  // Resolves relative URLs (incl. the opengraph-image card and every public
  // page's canonical) to absolute ones. pennedly.com is the marketing domain —
  // the public pages (landing, terms, privacy, data-deletion) canonicalize
  // there, not to app.pennedly.com, so the two hosts (same Next app, served by
  // hostname) don't split ranking signal between them. The /app and /gallery
  // trees opt out of indexing entirely (see their own layouts), so they never
  // need a canonical of their own.
  metadataBase: new URL("https://pennedly.com"),
  title: "Pennedly",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Pennedly",
    locale: "en_US",
    title: "Pennedly",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pennedly",
    description: DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The per-request CSP nonce minted in proxy.ts. Next applies it to its own
  // scripts automatically; we hand it to our inline theme <script> below so it
  // survives the strict script-src. (Reading headers() opts the app into
  // dynamic rendering — expected with a nonce-based CSP.)
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      // The no-FOUC theme script (in <body>) sets `.dark` on <html> before
      // hydration, so the class intentionally differs from SSR — suppress
      // the expected hydration warning on this element only.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* No-FOUC theme: set `.dark` before paint, from a saved choice or
            the OS preference. Runs synchronously during HTML parse. */}
        <script
          nonce={nonce}
          // React blanks the nonce attribute on the client for security, so the
          // SSR'd nonce vs the empty client value is a benign, expected
          // mismatch on this element — suppress it (the script already ran
          // during HTML parse, allowed by its matching CSP nonce).
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <AnalyticsProvider>{children}</AnalyticsProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
