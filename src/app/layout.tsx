import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AnalyticsProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pennedly",
  description:
    "Your drafting partner for Threads — write in your own voice, and you keep the final say.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
