// Smoke tests for the polished UI.
//
// Intent: catch typos, missing imports, wrong routes, broken bundle
// — the failures that take down a working page after a refactor.
// NOT a full E2E suite — no real backend, no real LLM calls.
//
// We mock the API responses our pages hit on mount so the tests are
// hermetic (network failure or backend downtime won't fail the run).
// Each page should:
//   • render without throwing
//   • show some recognizable text
//   • not have console errors in the page
//
// To run: `npm run test:e2e`.

import { expect, test } from "@playwright/test";

// ── Test fixtures ───────────────────────────────────────────────

const FAKE_TOKEN_PAIR = {
  access_token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.smoke.test.token.payload",
  refresh_token: "fake-refresh-token",
  refresh_expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
};

const FAKE_ME = {
  user_id: 99,
  email: "smoke@example.com",
  display_name: "smoke",
  tenant: {
    id: 99,
    name: "smoke's workspace",
    slug: null,
    plan_tier: "trial",
    accounts_limit: 3,
  },
};

const FAKE_ACCOUNTS = {
  accounts: [
    {
      id: 999,
      tenant_id: 99,
      threads_user_id: "smoke-id",
      username: "smoke_threads",
      display_name: "Smoke Test",
      profile_picture_url: null,
      connected_at: new Date().toISOString(),
      disconnected_at: null,
    },
  ],
};

const FAKE_ROLE_BOOK = {
  role_book_id: 1,
  name: "Smoke voice",
  sections: {
    intro: "I write smoke-test posts.",
    themes_include: ["smoke testing"],
    themes_exclude: [],
    voice_characteristics: ["lowercase"],
    do_list: ["keep it short"],
    dont_list: ["no emoji"],
    examples: [],
  },
  prompt_text: "I write smoke-test posts.\n\nVOICE:\n- lowercase",
  created_by: "user_edit",
  parent_id: null,
  activated_at: new Date().toISOString(),
};

const FAKE_DRAFTS = {
  drafts: [
    {
      id: 1,
      account_id: 999,
      content_type: "threads_post",
      status: "pending",
      generated_text: "smoke test draft text",
      llm_model: "anthropic/claude-sonnet-4",
      topic_label: "smoke topic",
      is_skip: false,
      created_at: new Date().toISOString(),
    },
  ],
  count: 1,
};

const FAKE_AUDITS = {
  audits: [],
  count: 0,
};

// ── Hooks ────────────────────────────────────────────────────────

test.beforeEach(async ({ page, context }) => {
  // Hermetic: every backend call returns canned JSON.
  await context.route(/\/api\/me$/, async (route) => {
    await route.fulfill({ status: 200, json: FAKE_ME });
  });
  await context.route(/\/api\/me\/accounts$/, async (route) => {
    await route.fulfill({ status: 200, json: FAKE_ACCOUNTS });
  });
  await context.route(/\/api\/accounts\/\d+\/role-book$/, async (route) => {
    await route.fulfill({ status: 200, json: FAKE_ROLE_BOOK });
  });
  await context.route(/\/api\/accounts\/\d+\/drafts/, async (route) => {
    await route.fulfill({ status: 200, json: FAKE_DRAFTS });
  });
  await context.route(/\/api\/audits(\?|$)/, async (route) => {
    await route.fulfill({ status: 200, json: FAKE_AUDITS });
  });

  // Pre-seed both localStorage keys so the app boots straight into
  // an authenticated state without going through /login.
  await page.addInitScript(
    ([tokens, accountId]) => {
      window.localStorage.setItem("pennedly.tokens", tokens);
      window.localStorage.setItem("pennedly.selectedAccountId", accountId);
    },
    [JSON.stringify(FAKE_TOKEN_PAIR), String(FAKE_ACCOUNTS.accounts[0].id)],
  );
});

// ── Specs ────────────────────────────────────────────────────────

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  // Generic check — the landing should mention the brand somewhere.
  await expect(page.locator("body")).toContainText(/Pennedly/i);
});

test("login page renders the magic-link form", async ({ page }) => {
  // Don't auto-auth this one — explicitly clear so we see the form.
  await page.addInitScript(() => {
    window.localStorage.removeItem("pennedly.tokens");
  });
  await page.goto("/app/login");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: /send sign-in link/i })).toBeVisible();
});

test("dashboard loads with seeded auth", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /generate a post/i })).toBeVisible();
  await expect(page.getByText(/smoke test draft text/)).toBeVisible();
});

test("role-book editor loads sections", async ({ page }) => {
  await page.goto("/app/role-book");
  await expect(page.getByRole("heading", { name: /^voice$/i })).toBeVisible();
  // The themes_include pill should show our smoke item.
  await expect(page.getByText("smoke testing")).toBeVisible();
  // The save button is there.
  await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible();
});

test("audits index renders empty state", async ({ page }) => {
  await page.goto("/app/audits");
  await expect(page.getByRole("heading", { name: /audits/i })).toBeVisible();
  await expect(page.getByText(/no audits yet/i)).toBeVisible();
});

test("no console errors on dashboard mount", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /generate a post/i })).toBeVisible();
  // Filter out third-party noise (PostHog without key, Sentry without DSN, etc).
  const ourErrors = errors.filter(
    (e) =>
      !/posthog/i.test(e) &&
      !/sentry/i.test(e) &&
      !/favicon/i.test(e) &&
      !/HMR/i.test(e),
  );
  expect(ourErrors, `unexpected console errors: ${ourErrors.join("\n")}`).toEqual([]);
});
