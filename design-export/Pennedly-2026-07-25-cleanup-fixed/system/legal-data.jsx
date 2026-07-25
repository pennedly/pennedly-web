// legal-data.jsx — content for the reusable legal-page template.
//
// IMPORTANT: this is a TEMPLATE. Every doc below is PLACEHOLDER scaffolding, not
// authoritative legal text — the operator must replace each section with reviewed
// copy before launch. The block bodies are fill-in GUIDANCE (bracketed), not policy.
//
// Block shapes a section can hold:
//   { t: "p",  text }                  paragraph (real, factual sentences only)
//   { t: "h3", text }                  sub-heading
//   { t: "ul", items: [..] }           bullet list
//   { t: "placeholder", text }         a "fill this in" prompt for the developer
//   { t: "operator" }                  the operator-of-record identity card
//   { t: "contact", email, text }      a quiet contact block with a mailto link

// The real operator of record (factual legal-entity disclosure — keep verbatim).
const OPERATOR = {
  name: "Fundacja Rozwoju Przedsi\u0119biorczo\u015bci \u201eTw\u00f3j StartUp\u201d",
  regs: ["KRS 0000442857", "NIP 5213641211", "REGON 14643346700000"],
  city: "Warszawa, Poland",
};

// Shown once near the top of every doc so no one mistakes the scaffold for final copy.
const TEMPLATE_NOTICE =
  "Template — placeholder copy. The operator replaces every section below with reviewed legal text before launch. The headings are a starting structure, not legal advice.";

const PRIVACY = {
  key: "privacy",
  label: "Privacy Policy",
  title: "Privacy Policy",
  updated: "Template · not yet published",
  notice: TEMPLATE_NOTICE,
  intro:
    "How Pennedly handles personal data. This page is the structure a finished Privacy Policy should follow — the operator fills in the reviewed wording.",
  sections: [
    { id: "operator", h: "Who operates Pennedly", blocks: [
      { t: "p", text: "Pennedly is operated by the entity below, the operator of record and data controller:" },
      { t: "operator" },
    ] },
    { id: "collect", h: "1. Information we collect", blocks: [
      { t: "placeholder", text: "[List each category of personal data and its legal basis (GDPR Art. 6). For example:]" },
      { t: "ul", items: [
        "[Account — email address; sign-in is passwordless, so no password is stored.]",
        "[Connected Threads accounts — access token, handle, public profile, recent posts.]",
        "[Content — generated drafts, your edits, your voice profile and rules.]",
        "[Usage — diagnostics and analytics, with consent where the law requires it.]",
      ] },
    ] },
    { id: "use", h: "2. How the data is used", blocks: [
      { t: "placeholder", text: "[Explain each processing purpose: drafting in the user's voice, voice analysis, performance analytics, account operation and security, and essential service messages such as sign-in codes.]" },
    ] },
    { id: "sharing", h: "3. Sharing & processors", blocks: [
      { t: "placeholder", text: "[Name the categories of recipients — hosting, email delivery, model-inference providers — and the Threads / Meta integration. State plainly whether personal data is sold (it should not be).]" },
    ] },
    { id: "retention", h: "4. Retention & deletion", blocks: [
      { t: "placeholder", text: "[State how long each category is kept and that account-deletion completes within 30 days. Link to the Data Deletion page for the mechanism.]" },
    ] },
    { id: "rights", h: "5. Your rights", blocks: [
      { t: "placeholder", text: "[Describe GDPR rights — access, rectification, erasure, portability, objection, restriction — how to exercise them in-app, and the right to complain to the Polish DPA (UODO).]" },
    ] },
    { id: "security", h: "6. Security", blocks: [
      { t: "placeholder", text: "[Describe the technical and organisational measures: encryption in transit and at rest, scoped access tokens, least-privilege access, and how breaches are handled and notified.]" },
    ] },
    { id: "contact", h: "7. Contact", blocks: [
      { t: "placeholder", text: "[Confirm the data-protection contact and any representative. Reach the operator at:]" },
      { t: "contact", email: "privacy@pennedly.com", text: "Pennedly — Data Protection" },
    ] },
  ],
};

const TERMS = {
  key: "terms",
  label: "Terms of Service",
  title: "Terms of Service",
  updated: "Template · not yet published",
  notice: TEMPLATE_NOTICE,
  intro:
    "The agreement between Pennedly and the people who use it. This page is the structure a finished Terms of Service should follow — the operator fills in the reviewed wording.",
  sections: [
    { id: "operator", h: "Who you're contracting with", blocks: [
      { t: "p", text: "These terms are an agreement between you and the operator of record:" },
      { t: "operator" },
    ] },
    { id: "account", h: "1. Your account", blocks: [
      { t: "placeholder", text: "[State eligibility, that the user is responsible for the accounts they connect and for reviewing every draft before approving it, and that sign-in credentials must be kept secure.]" },
    ] },
    { id: "use", h: "2. Acceptable use", blocks: [
      { t: "placeholder", text: "[Define acceptable use and prohibited conduct (harassment, deception, infringement, breaking Threads' own rules), and the right to suspend abusive accounts.]" },
    ] },
    { id: "approval", h: "3. You approve everything", blocks: [
      { t: "placeholder", text: "[Make explicit that Pennedly drafts on the user's behalf but never publishes without approval, and that the user is the publisher of anything they post.]" },
    ] },
    { id: "availability", h: "4. Availability & changes", blocks: [
      { t: "placeholder", text: "[Cover the \u201cas is\u201d nature during the beta, that features may change, and how material changes to the terms are communicated.]" },
    ] },
    { id: "liability", h: "5. Liability & governing law", blocks: [
      { t: "placeholder", text: "[State the limitation of liability and that these terms are governed by Polish law, with venue tied to the operator's registered seat in Warszawa.]" },
    ] },
    { id: "contact", h: "6. Contact", blocks: [
      { t: "placeholder", text: "[Confirm the legal contact for notices. Reach the operator at:]" },
      { t: "contact", email: "legal@pennedly.com", text: "Pennedly — Legal" },
    ] },
  ],
};

const DATA_DELETION = {
  key: "dataDeletion",
  label: "Data Deletion",
  title: "Data Deletion",
  updated: "Template · not yet published",
  notice: TEMPLATE_NOTICE,
  intro:
    "How a person removes their data from Pennedly — including the Meta-required deletion callback. This page is the structure the finished doc should follow; the operator fills in the reviewed wording.",
  sections: [
    { id: "request", h: "1. How to request deletion", blocks: [
      { t: "placeholder", text: "[Document both request paths so a user or Meta can trigger deletion:]" },
      { t: "ul", items: [
        "[In the app — Settings → disconnect each account → \u201cDelete account.\u201d]",
        "[By email — write from the account address to the data-protection contact.]",
      ] },
    ] },
    { id: "callback", h: "2. Meta deauthorize & data-deletion callback", blocks: [
      { t: "placeholder", text: "[Document the Meta integration: Pennedly registers a Deauthorize callback and a Data Deletion Request callback. When Meta calls either — or a user deauthorizes the app — Pennedly cascade-deletes that user's data and returns a confirmation code plus a status URL, as Meta requires.]" },
    ] },
    { id: "scope", h: "3. What the cascade-delete removes", blocks: [
      { t: "placeholder", text: "[List everything removed by the cascade so it's auditable:]" },
      { t: "ul", items: [
        "[Profile and sign-in identity.]",
        "[Drafts, voice profile, and style rules.]",
        "[Connected-account tokens (disconnecting stops all activity for that handle).]",
        "[Analytics and usage records tied to the user.]",
      ] },
    ] },
    { id: "timing", h: "4. Timing & confirmation code", blocks: [
      { t: "placeholder", text: "[State that deletion completes within 30 days, that a confirmation code is issued so the request can be tracked, and that backups are purged on their normal rotation.]" },
    ] },
    { id: "contact", h: "5. Need help?", blocks: [
      { t: "contact", email: "privacy@pennedly.com", text: "Pennedly — Data Protection" },
    ] },
  ],
};

const LEGAL_DOCS = { privacy: PRIVACY, terms: TERMS, dataDeletion: DATA_DELETION };

Object.assign(window, { LEGAL_DOCS, OPERATOR, TEMPLATE_NOTICE, PRIVACY, TERMS, DATA_DELETION });
