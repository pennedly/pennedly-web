import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// Dev-only "state gallery" — renders the real presentational components in every
// state (loaded / loading / empty / error / variants) so a change can be
// self-verified against the design `*-SPEC.html` mockups WITHOUT auth, a
// backend, or real data. Lives outside `/app` so the app shell's account
// gating doesn't apply. 404s in production (the whole `/gallery` tree), and
// carries its own noindex as a second layer — belt-and-suspenders in case the
// prod gate above it ever changes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
