// Playwright config — single-browser smoke suite against the local
// dev server. Aim is to catch the common breaks (typo / missing
// import / wrong route) without a heavyweight CI test matrix.
//
// `npm run test:e2e` boots `next dev` on port 3000 and runs the
// specs in tests/. To run against an already-running server, pass
// PW_BASE_URL=http://localhost:3000 and skip webServer.

import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = process.env.PW_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  // Smoke specs are fast — fail-fast on first error is better than
  // racing the whole suite when something obvious breaks.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Don't block on slow LLM calls — smoke shouldn't be hitting
    // the real backend anyway.
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Auto-boot `next dev` when not testing against an external URL.
  ...(process.env.PW_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
