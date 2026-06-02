import type { Metadata } from "next";

import LandingView from "./landing-view";

// Server wrapper for the public landing (root of app.pennedly.com). It exists
// only to carry the route's metadata + Open Graph card (the card itself is
// generated in ./opengraph-image.tsx) — `metadata` can only be exported from a
// Server Component, while the page UI is a client component in ./landing-view.
// Copy follows the honest-positioning line (Q1/Q2/Q4): a drafting partner where
// you keep the final say, never "Threads on autopilot".

const TITLE = "Pennedly — your drafting partner for Threads";
const DESCRIPTION =
  "Pennedly drafts posts and replies in your voice, then waits for you. By default, nothing publishes until you approve it — you keep the final say.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pennedly",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Page() {
  return <LandingView />;
}
