// login-data.jsx — copy + data for the passwordless sign-in screen (/app/login).
// Realistic copy — no lorem.

const LOGIN_LANGS = [
  { code: "EN", name: "English" },
  { code: "DE", name: "Deutsch" },
  { code: "ES", name: "Espa\u00f1ol" },
  { code: "FR", name: "Fran\u00e7ais" },
  { code: "PT", name: "Portugu\u00eas" },
  { code: "IT", name: "Italiano" },
  { code: "RU", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "JA", name: "\u65e5\u672c\u8a9e" },
];

const LOGIN_COPY = {
  tagline: "Your drafting partner for Threads.",
  emailTitle: "Sign in to Pennedly",
  emailSub: "No password, ever. Your first sign-in creates your account.",
  google: "Continue with Google",
  emailPlaceholder: "you@example.com",
  emailCta: "Email me a code",
  codeTitle: "Enter your code",
  resend: "Resend code",
  signingGoogle: "Opening Google\u2026",
  signingCode: "Signing you in\u2026",
};

const LOGIN_ERRORS = {
  rate: "Too many requests. Wait a moment, then try again.",
  invalid: "That code didn\u2019t match. Double-check it and try again.",
  google: "We couldn\u2019t sign you in with Google. Please try again.",
};

// developer-mode drawer options (normally hidden)
const DEV_ENVS = ["Production", "Staging", "Local"];

Object.assign(window, { LOGIN_LANGS, LOGIN_COPY, LOGIN_ERRORS, DEV_ENVS });
