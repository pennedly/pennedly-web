// Landing page — pennedly.com root.
// Ported from the original static index.html but as a real Next.js
// component so it benefits from font preloading, route prefetching for
// /app, and the same Tailwind tokens the dashboard uses.

import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 antialiased">
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-12 flex-1 flex flex-col justify-center">
        <span className="inline-block self-start px-3 py-1 mb-8 rounded-full bg-zinc-100 text-sm text-zinc-500">
          In development
        </span>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          Pennedly
        </h1>

        <p className="text-xl text-zinc-500 mb-8">
          Your drafting partner for Threads.
        </p>

        <p className="text-base text-zinc-700 leading-relaxed mb-8 max-w-prose">
          Pennedly drafts posts in your voice and suggests replies — you review,
          edit, and decide what goes live. It also helps creators and agencies
          run several Threads accounts and see what actually resonates. A
          partner that does the legwork, not an autopilot that posts for you.
          You stay in control. Always.
        </p>

        <p className="text-base text-zinc-500">
          Questions?{" "}
          <a
            href="mailto:hi@pennedly.com"
            className="text-blue-600 hover:underline"
          >
            hi@pennedly.com
          </a>
        </p>

        <div className="mt-10">
          <Link
            href="/app/login"
            className="inline-block px-5 py-2.5 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </main>

      <footer className="max-w-2xl mx-auto w-full px-6 py-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
        <div>&copy; 2026 Pennedly</div>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-zinc-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900">
            Terms of Service
          </Link>
          <Link href="/data-deletion" className="hover:text-zinc-900">
            Data Deletion
          </Link>
        </nav>
      </footer>
    </div>
  );
}
