import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Pennedly",
  description: "How Pennedly collects, uses, and protects your data.",
};

// Plain static legal page. English (the lingua-franca for SaaS legal); the
// in-app consent line is localized. Reflects Pennedly's real data practices.
// A solid starting point — have it reviewed by counsel before public launch.
const UPDATED = "May 31, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Pennedly
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_a]:underline [&_a]:underline-offset-2">
          <p>
            This Privacy Policy explains how <strong>Pennedly</strong> ("we",
            "us") collects, uses, and protects personal data when you use the
            Pennedly web application and related services (the "Service"). We
            are committed to handling your data lawfully and transparently under
            the EU General Data Protection Regulation (GDPR) and Polish law.
          </p>

          <h2>1. Who we are (data controller)</h2>
          <p>
            The Service is operated under{" "}
            <strong>Fundacja Rozwoju Przedsiębiorczości "Twój StartUp"</strong>{" "}
            (the "Foundation"), a foundation registered in Poland, which acts as
            the data controller:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Registered office: ul. Żurawia 6/12 lok. 766, 00-503 Warszawa, Poland</li>
            <li>KRS 0000442857 · NIP 5213641211 · REGON 14643346700000</li>
            <li>
              Contact: <a href="mailto:support@pennedly.com">support@pennedly.com</a>
            </li>
          </ul>

          <h2>2. What data we collect</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Account data:</strong> your email address (used to sign
              you in) and, if you sign in with Google, the basic profile
              (name) Google shares.
            </li>
            <li>
              <strong>Threads data (only with your authorization):</strong> when
              you connect a Threads account via Meta OAuth, we access and store
              your posts, the comments and mentions under them, and their
              public metrics — to power analytics and draft generation — and we
              publish posts/replies on your behalf at your instruction. Your
              Threads access token is stored encrypted.
            </li>
            <li>
              <strong>Content you create:</strong> the "voice" profile, topics,
              rules, and AI-generated drafts you produce in the Service.
            </li>
            <li>
              <strong>Usage &amp; technical data:</strong> product-analytics
              events, error reports, and standard server logs (e.g. IP address,
              timestamps) used to operate and improve the Service.
            </li>
          </ul>

          <h2>3. How we use your data</h2>
          <p>
            To provide and operate the Service — generate drafts in your voice,
            show your analytics, publish content you approve, send sign-in codes
            and service notifications, secure the Service, and improve it. We do
            not sell your personal data.
          </p>

          <h2>4. Legal basis (GDPR)</h2>
          <p>
            We process your data to perform our contract with you (providing the
            Service), on the basis of your consent (e.g. connecting a Threads
            account, sign-in), and our legitimate interests in securing and
            improving the Service. You can withdraw consent at any time.
          </p>

          <h2>5. Service providers we share data with</h2>
          <p>
            We use trusted processors strictly to run the Service: Meta /
            Threads (the platform you connect), Google (sign-in), an LLM
            provider via OpenRouter (draft generation), Resend (email), Railway
            and Vercel (hosting), and PostHog and Sentry (analytics and error
            monitoring). Each processes data only on our instructions. Some
            providers operate outside the EEA; transfers rely on appropriate
            safeguards (e.g. Standard Contractual Clauses).
          </p>

          <h2>6. Data retention</h2>
          <p>
            We keep your data for as long as your account is active and as
            needed to provide the Service. Sign-in tokens are short-lived.
            Disconnecting a Threads account removes its stored credentials. You
            can request deletion of your account and associated data at any
            time (Section 8).
          </p>

          <h2>7. Security</h2>
          <p>
            We apply reasonable technical and organizational measures, including
            encryption of stored Threads access tokens and encrypted transport
            (HTTPS). No method of transmission or storage is perfectly secure,
            but we work to protect your data.
          </p>

          <h2>8. Your rights &amp; data deletion</h2>
          <p>
            Under the GDPR you have the right to access, correct, export, or
            delete your personal data, to restrict or object to processing, and
            to withdraw consent. You can disconnect a Threads account in
            Settings at any time, and you may request full account deletion by
            emailing{" "}
            <a href="mailto:support@pennedly.com">support@pennedly.com</a>. If
            you remove the app from your Threads/Meta account, Meta notifies us
            and we delete the associated data. You may also lodge a complaint
            with your local data-protection authority.
          </p>

          <h2>9. Children</h2>
          <p>
            The Service is not directed to children under 16, and we do not
            knowingly collect their data.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>
            We may update this policy; we will revise the "Last updated" date
            and, for material changes, notify you in the app or by email.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about this policy or your data:{" "}
            <a href="mailto:support@pennedly.com">support@pennedly.com</a>.
          </p>

          <p className="pt-4">
            See also our{" "}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
