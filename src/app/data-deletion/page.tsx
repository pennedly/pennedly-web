import type { Metadata } from "next";

import { LegalLayout, type LegalDoc } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Data Deletion — Pennedly",
  description: "How to remove your data from Pennedly, what gets deleted, and when.",
};

// New route (Meta App Review requires a reachable data-deletion page). Content
// mirrors the real backend behaviour: in-app disconnect/delete, the Meta
// deauthorize + data-deletion callbacks (cascade-delete + confirmation code),
// and the 30-day account-deletion window — see SPEC §7.2b.
const DOC: LegalDoc = {
  key: "dataDeletion",
  title: "Data Deletion",
  updated: "Last updated 1 June 2026",
  intro:
    "You can remove your data from Pennedly whenever you like. Here's exactly how to do it, what gets removed, and when.",
  sections: [
    {
      id: "how",
      h: "1. How to delete your data",
      blocks: [
        { t: "p", text: "There are three ways to remove your data:" },
        {
          t: "ul",
          items: [
            "In the app — open Settings, disconnect your connected Threads accounts, then choose to delete your account.",
            "From Threads / Meta — remove Pennedly in your Threads account's app settings. Meta notifies us automatically and we delete the data tied to that connected account.",
            "By email — write to support@pennedly.com from your account's email address and ask us to delete your data.",
          ],
        },
      ],
    },
    {
      id: "what",
      h: "2. What gets removed",
      blocks: [
        {
          t: "p",
          text: "We delete your profile, the drafts and voice profile Pennedly built, your topics and rules, your connected-account access tokens, and the posts, comments, mentions, metrics, and analytics we stored for you. Disconnecting an account immediately stops all activity for that handle.",
        },
      ],
    },
    {
      id: "timing",
      h: "3. Timing & confirmation",
      blocks: [
        {
          t: "p",
          text: "Account deletion completes within 30 days. Deletion triggered from Threads/Meta runs immediately — every record for that connected account is cascade-deleted, and Meta gives you a confirmation code and a status link. We keep only minimal records where the law requires it, and backups are purged on their normal rotation.",
        },
      ],
    },
    {
      id: "contact",
      h: "4. Need help?",
      blocks: [
        { t: "p", text: "Tell us and we'll take care of it." },
        { t: "contact", email: "support@pennedly.com", text: "Pennedly — Data Protection" },
      ],
    },
  ],
};

export default function DataDeletionPage() {
  return <LegalLayout doc={DOC} />;
}
