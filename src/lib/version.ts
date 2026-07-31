// What build the user was actually running, for bug reports.
//
// The deploy commit beats a package.json version number here: `0.1.0` has been
// true for months and tells you nothing, while a SHA points at the exact code
// the reporter had on screen. `NEXT_PUBLIC_GIT_SHA` is already published by
// next.config.ts (Railway injects it at build time) for Sentry release tagging;
// this reuses it rather than adding a second version source that can disagree.
//
// Empty on a local dev run → "dev", which is itself the useful answer.

const SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "";

export const APP_VERSION = SHA ? SHA.slice(0, 7) : "dev";
