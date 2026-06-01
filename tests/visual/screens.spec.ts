import { test, type Page } from "@playwright/test";

// ── Mock-auth visual harness ─────────────────────────────────────────────────
// Renders auth-gated /app screens with mocked backend data so the redesign can
// be verified visually (and, later, as Phase 6 visual-regression). Every
// backend call is intercepted (the real API is never hit); a fake token is
// seeded so the app doesn't bounce to /app/login.
//
// Run just this file:  npx playwright test tests/visual/screens.spec.ts
// Output:              test-results/visual/<name>-{light,dark}.png
//
// Add per-screen fixtures to `route()` below as each screen is restyled.

const ME = {
  user_id: 1,
  email: "mara@pennedly.app",
  display_name: "Mara Lin",
  tenant: { id: 1, name: "Mara Lin", slug: "mara", plan_tier: "free", accounts_limit: 3 },
  is_tester: true,
  locale: "en",
};

const ACCOUNTS = [
  {
    id: 1,
    tenant_id: 1,
    threads_user_id: "t_1",
    username: "mara.lin",
    display_name: "Mara Lin",
    profile_picture_url: null,
    connected_at: "2026-05-01T00:00:00Z",
    disconnected_at: null,
  },
  {
    id: 2,
    tenant_id: 1,
    threads_user_id: "t_2",
    username: "mara.writes",
    display_name: "Mara — side account",
    profile_picture_url: null,
    connected_at: "2026-05-10T00:00:00Z",
    disconnected_at: null,
  },
];

async function setup(page: Page): Promise<void> {
  // Seed a token + selected account + locale before any app code runs.
  await page.addInitScript(() => {
    localStorage.setItem(
      "pennedly.tokens",
      JSON.stringify({
        access_token: "mock",
        refresh_token: "mock",
        refresh_expires_at: "2099-01-01T00:00:00Z",
      }),
    );
    localStorage.setItem("pennedly.selectedAccountId", "1");
    localStorage.setItem("pennedly.locale", "en");
  });

  // Intercept every backend call with a fixture; real API is never reached.
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (p.endsWith("/api/me")) return json(ME);
    if (p.endsWith("/api/me/accounts")) return json({ accounts: ACCOUNTS });
    if (p.includes("/onboarding")) return json({ needs_onboarding: false, has_role_book: true });
    if (p.includes("/drafts")) return json({ drafts: [] });
    // Safe default — most list endpoints tolerate an empty array.
    return json([]);
  });
}

async function shoot(page: Page, name: string): Promise<void> {
  // Hide Next.js dev overlays so they don't sit on top of the UI in shots.
  await page
    .addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" })
    .catch(() => {});
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.screenshot({ path: `test-results/visual/${name}-light.png` });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({ path: `test-results/visual/${name}-dark.png` });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
}

test("shell — Studio", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app");
  // Shell renders once the (mocked) account-presence check resolves.
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "shell-studio");
});
