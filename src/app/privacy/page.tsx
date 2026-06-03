import type { Metadata } from "next";

import { LegalLayout, type LegalDoc } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — Pennedly",
  description: "How Pennedly collects, uses, and protects your data.",
};

// Real, reviewed privacy content rendered through the design's legal template.
// English (the lingua-franca for SaaS legal); the in-app consent line is
// localized. A solid starting point — have it reviewed by counsel before
// public launch.
const DOC: LegalDoc = {
  key: "privacy",
  title: "Privacy Policy",
  updated: "Last updated 1 June 2026",
  intro:
    'This Privacy Policy explains how Pennedly ("we", "us") collects, uses, and protects personal data when you use the Pennedly web application and related services (the "Service"). We are committed to handling your data lawfully and transparently under the EU General Data Protection Regulation (GDPR) and Polish law.',
  sections: [
    {
      id: "controller",
      h: "1. Who we are (data controller)",
      blocks: [
        {
          t: "p",
          text: 'The Service is operated under Fundacja Rozwoju Przedsiębiorczości "Twój StartUp" (the "Foundation"), a foundation registered in Poland, which acts as the data controller:',
        },
        { t: "operator" },
        { t: "contact", text: "Contact", email: "support@pennedly.com" },
      ],
    },
    {
      id: "data",
      h: "2. What data we collect",
      blocks: [
        {
          t: "ul",
          items: [
            "Account data — your email address (used to sign you in) and, if you sign in with Google, the basic profile (name) Google shares.",
            "Threads data (only with your authorization) — when you connect a Threads account via Meta OAuth, we access and store your posts, the comments and mentions under them, and their public metrics, to power analytics and draft generation, and we publish posts/replies on your behalf at your instruction. Your Threads access token is stored encrypted.",
            "Content you create — the voice profile, topics, rules, and AI-generated drafts you produce in the Service.",
            "Usage & technical data — product-analytics events, error reports, and standard server logs (e.g. IP address, timestamps) used to operate and improve the Service.",
          ],
        },
      ],
    },
    {
      id: "use",
      h: "3. How we use your data",
      blocks: [
        {
          t: "p",
          text: "To provide and operate the Service — generate drafts in your voice, show your analytics, publish content you approve, send sign-in codes and service notifications, secure the Service, and improve it. We do not sell your personal data.",
        },
      ],
    },
    {
      id: "legal-basis",
      h: "4. Legal basis (GDPR)",
      blocks: [
        {
          t: "p",
          text: "We process your data to perform our contract with you (providing the Service), on the basis of your consent (e.g. connecting a Threads account, sign-in), and our legitimate interests in securing and improving the Service. You can withdraw consent at any time.",
        },
      ],
    },
    {
      id: "providers",
      h: "5. Service providers we share data with",
      blocks: [
        {
          t: "p",
          text: "We use trusted processors strictly to run the Service: Meta / Threads (the platform you connect), Google (sign-in), an LLM provider via OpenRouter (draft generation), Resend (email), Railway and Vercel (hosting), and PostHog and Sentry (analytics and error monitoring). Each processes data only on our instructions. Some providers operate outside the EEA; transfers rely on appropriate safeguards (e.g. Standard Contractual Clauses).",
        },
      ],
    },
    {
      id: "retention",
      h: "6. Data retention",
      blocks: [
        {
          t: "p",
          text: "We keep your data for as long as your account is active and as needed to provide the Service. Sign-in tokens are short-lived. Disconnecting a Threads account removes its stored credentials. You can request deletion of your account and associated data at any time (see Section 8 and the Data Deletion page).",
        },
      ],
    },
    {
      id: "security",
      h: "7. Security",
      blocks: [
        {
          t: "p",
          text: "We apply reasonable technical and organizational measures, including encryption of stored Threads access tokens and encrypted transport (HTTPS). No method of transmission or storage is perfectly secure, but we work to protect your data.",
        },
      ],
    },
    {
      id: "rights",
      h: "8. Your rights & data deletion",
      blocks: [
        {
          t: "p",
          text: "Under the GDPR you have the right to access, correct, export, or delete your personal data, to restrict or object to processing, and to withdraw consent. You can disconnect a Threads account in Settings at any time, and you may request full account deletion by emailing support@pennedly.com or via the Data Deletion page. If you remove the app from your Threads/Meta account, Meta notifies us and we delete the associated data. You may also lodge a complaint with your local data-protection authority.",
        },
      ],
    },
    {
      id: "children",
      h: "9. Children",
      blocks: [
        {
          t: "p",
          text: "The Service is not directed to children under 16, and we do not knowingly collect their data.",
        },
      ],
    },
    {
      id: "changes",
      h: "10. Changes to this policy",
      blocks: [
        {
          t: "p",
          text: 'We may update this policy; we will revise the "Last updated" date and, for material changes, notify you in the app or by email.',
        },
      ],
    },
    {
      id: "contact",
      h: "11. Contact",
      blocks: [
        { t: "p", text: "Questions about this policy or your data? We read every message." },
        { t: "contact", email: "support@pennedly.com", text: "Pennedly — Privacy" },
      ],
    },
  ],
};

export default function PrivacyPage() {
  return <LegalLayout doc={DOC} />;
}
