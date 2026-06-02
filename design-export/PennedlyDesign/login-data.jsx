// login-data.jsx — copy + data for the passwordless sign-in screen (/app/login).
// Realistic copy — no lorem.

// the 8 interface locales the app ships in (matches the in-app language set).
const LOGIN_LANGS = [
  { code: "EN", name: "English" },
  { code: "ES", name: "Espa\u00f1ol" },
  { code: "DE", name: "Deutsch" },
  { code: "FR", name: "Fran\u00e7ais" },
  { code: "IT", name: "Italiano" },
  { code: "PT", name: "Portugu\u00eas" },
  { code: "RU", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "UK", name: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430" },
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

// developer sign-in (the REAL dev path): email-only, gated behind a build-time
// env flag. Never available in production.
const DEV_LOGIN = { flag: "DEV_LOGIN", enabled: true, email: "dev@pennedly.test", build: "2.4.1 · a31f9c2" };

Object.assign(window, { LOGIN_LANGS, LOGIN_COPY, LOGIN_ERRORS, DEV_LOGIN });
