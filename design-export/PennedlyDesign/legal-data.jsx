// legal-data.jsx — content for the reusable legal-page template.
// Realistic Privacy Policy as the sample; Terms + Data Deletion included so the
// one template can be reused for /privacy, /terms, /data-deletion.
//
// Block shapes a section can hold:
//   { t: "p",  text }            paragraph
//   { t: "h3", text }            sub-heading
//   { t: "ul", items: [..] }     bullet list
//   { t: "dl", items: [{term, def}] }  definition rows
//   { t: "contact", email, text } a quiet contact block with a mailto link

const PRIVACY = {
  key: "privacy",
  label: "Privacy Policy",
  title: "Privacy Policy",
  updated: "Last updated 1 June 2026",
  intro:
    "Pennedly is a drafting partner for Threads creators. This policy explains what we collect, why we collect it, and the control you have over it. We've kept it as plain as a legal document can reasonably be.",
  sections: [
    {
      id: "summary",
      h: "The short version",
      blocks: [
        { t: "ul", items: [
          "We collect only what we need to draft in your voice and run your account.",
          "We never publish anything to Threads without your explicit approval.",
          "We don't sell your personal information, and we don't train shared models on your private content.",
          "You can export or delete your data, and disconnect any account, at any time.",
        ] },
      ],
    },
    {
      id: "collect",
      h: "1. Information we collect",
      blocks: [
        { t: "h3", text: "Account information" },
        { t: "p", text: "When you create an account, we store your email address and basic profile details. Pennedly is passwordless, so we never see or store a password." },
        { t: "h3", text: "Connected Threads accounts" },
        { t: "p", text: "When you connect a Threads account, we receive an access token and read public profile details (handle, display name, follower count) and your recent posts. We request read and draft permissions — not the ability to publish on our own." },
        { t: "h3", text: "Content and drafts" },
        { t: "p", text: "We store the drafts Pennedly generates, your edits, your voice profile, and any rules you set. This is the material that lets drafts sound like you." },
        { t: "h3", text: "Usage data" },
        { t: "p", text: "We collect limited diagnostic and usage data — device type, pages viewed, and errors — to keep the product working and improve it. Where required, we ask for consent before non-essential analytics." },
      ],
    },
    {
      id: "use",
      h: "2. How we use your information",
      blocks: [
        { t: "ul", items: [
          "To generate drafts and replies in your voice and present them for your approval.",
          "To analyse your past posts so your voice profile stays accurate.",
          "To show you analytics about how your published posts performed.",
          "To operate, secure, and support your account.",
          "To send you essential service messages (such as your sign-in codes).",
        ] },
      ],
    },
    {
      id: "autopilot",
      h: "3. We are a partner, not an autopilot",
      blocks: [
        { t: "p", text: "Pennedly does the legwork — drafting, organising, and surfacing — but you stay in control. Nothing is posted, replied, or sent to Threads until you review it and approve it. We do not auto-publish, and we do not act on your account without an explicit action from you." },
      ],
    },
    {
      id: "sharing",
      h: "4. How we share information",
      blocks: [
        { t: "p", text: "We do not sell your personal information. We share it only in these limited cases:" },
        { t: "ul", items: [
          "Service providers who process data on our behalf (hosting, email delivery, model inference) under contract and only as needed.",
          "Threads / Meta, to the extent required to read your posts and submit content you have approved.",
          "Legal requirements, when we are compelled by valid legal process, or to protect rights and safety.",
          "A business transfer, if Pennedly is acquired, with notice to you and continued protection of your data.",
        ] },
      ],
    },
    {
      id: "retention",
      h: "5. Data retention",
      blocks: [
        { t: "p", text: "We keep your information for as long as your account is active. If you delete your account, we remove your personal data and content within 30 days, except where we must retain limited records to meet legal obligations." },
      ],
    },
    {
      id: "rights",
      h: "6. Your rights and choices",
      blocks: [
        { t: "p", text: "Depending on where you live, you may have the right to access, correct, export, or delete your personal information, and to object to or restrict certain processing. You can exercise these directly in the app:" },
        { t: "ul", items: [
          "Disconnect any Threads account from Settings at any time.",
          "Export your data, or request deletion, from the Data Deletion page.",
          "Withdraw analytics consent in your settings without affecting core features.",
        ] },
      ],
    },
    {
      id: "security",
      h: "7. Security",
      blocks: [
        { t: "p", text: "We protect your information with encryption in transit and at rest, scoped access tokens, and least-privilege access controls. No system is perfectly secure, but we work to hold ourselves to a high standard and to notify you promptly of any incident that affects you." },
      ],
    },
    {
      id: "transfers",
      h: "8. International transfers",
      blocks: [
        { t: "p", text: "Pennedly is operated from the European Union. If you access it from elsewhere, your information may be processed in countries with different data-protection laws. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses." },
      ],
    },
    {
      id: "children",
      h: "9. Children's privacy",
      blocks: [
        { t: "p", text: "Pennedly is not intended for anyone under 16, and we do not knowingly collect information from children. If you believe a child has provided us information, contact us and we will remove it." },
      ],
    },
    {
      id: "changes",
      h: "10. Changes to this policy",
      blocks: [
        { t: "p", text: "We may update this policy as the product evolves. When changes are material, we'll let you know in the app or by email before they take effect. The date at the top always reflects the latest version." },
      ],
    },
    {
      id: "contact",
      h: "11. Contact us",
      blocks: [
        { t: "p", text: "Questions about this policy or your data? We read every message." },
        { t: "contact", email: "privacy@pennedly.app", text: "Pennedly — Data Protection" },
      ],
    },
  ],
};

const TERMS = {
  key: "terms",
  label: "Terms of Service",
  title: "Terms of Service",
  updated: "Last updated 1 June 2026",
  intro: "These terms govern your use of Pennedly. By signing in, you agree to them. We've kept them readable.",
  sections: [
    { id: "accounts", h: "1. Your account", blocks: [
      { t: "p", text: "You're responsible for the accounts you connect and for reviewing every draft before you approve it. Keep your sign-in email secure." },
    ] },
    { id: "use", h: "2. Acceptable use", blocks: [
      { t: "p", text: "Use Pennedly to draft and manage your own content. Don't use it to harass, deceive, infringe others' rights, or break Threads' own rules." },
      { t: "ul", items: [
        "You own the content you create and approve.",
        "You're responsible for what you publish through Pennedly.",
        "We may suspend accounts that abuse the service or its integrations.",
      ] },
    ] },
    { id: "approval", h: "3. You approve everything", blocks: [
      { t: "p", text: "Pennedly drafts on your behalf but never publishes without your approval. You are the publisher of anything you choose to post." },
    ] },
    { id: "availability", h: "4. Availability", blocks: [
      { t: "p", text: "Pennedly is in active development. Features may change, and we provide the service \u201cas is\u201d while we build toward general availability." },
    ] },
    { id: "contact", h: "5. Contact", blocks: [
      { t: "contact", email: "legal@pennedly.app", text: "Pennedly — Legal" },
    ] },
  ],
};

const DATA_DELETION = {
  key: "dataDeletion",
  label: "Data Deletion",
  title: "Data Deletion",
  updated: "Last updated 1 June 2026",
  intro: "You can remove your data from Pennedly whenever you like. Here's exactly what happens and how to do it.",
  sections: [
    { id: "how", h: "1. How to delete your data", blocks: [
      { t: "ul", items: [
        "In the app: open Settings, disconnect your accounts, then choose \u201cDelete account.\u201d",
        "By email: write to privacy@pennedly.app from your account address and ask us to delete your data.",
      ] },
    ] },
    { id: "what", h: "2. What gets removed", blocks: [
      { t: "p", text: "We delete your profile, drafts, voice profile, rules, connected-account tokens, and analytics tied to you. Disconnecting an account immediately stops all activity for that handle." },
    ] },
    { id: "when", h: "3. Timing", blocks: [
      { t: "p", text: "Deletion completes within 30 days. We may keep minimal records where the law requires it, and backups are purged on their normal rotation." },
    ] },
    { id: "contact", h: "4. Need help?", blocks: [
      { t: "contact", email: "privacy@pennedly.app", text: "Pennedly — Data Protection" },
    ] },
  ],
};

const LEGAL_DOCS = { privacy: PRIVACY, terms: TERMS, dataDeletion: DATA_DELETION };

Object.assign(window, { LEGAL_DOCS, PRIVACY, TERMS, DATA_DELETION });
