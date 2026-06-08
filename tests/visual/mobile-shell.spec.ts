import { test, type Page } from "@playwright/test";

// ── Mobile shell visual harness (≤ md / phone) ───────────────────────────────
// Verifies the phone shell — a single slim top bar (hamburger + screen title +
// theme) and the slide-in nav drawer (brand + grouped nav + account foot) — at
// an iPhone-class 390px viewport, both themes. The desktop harness lives in
// screens.spec.ts (1280px, waits on `aside`); at 390px the desktop `aside` is
// hidden, so we wait on the top bar instead.
//
// Run:  npx playwright test tests/visual/mobile-shell.spec.ts
// Out:  test-results/visual/mobile-*-{light,dark}.png

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
    profile_picture_url:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%234f46e5'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%23fff'/%3E%3Crect x='12' y='40' width='40' height='22' rx='11' fill='%23fff'/%3E%3C/svg%3E",
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
  await page.addInitScript(() => {
    localStorage.setItem(
      "pennedly.tokens",
      JSON.stringify({ access_token: "mock", refresh_token: "mock", refresh_expires_at: "2099-01-01T00:00:00Z" }),
    );
    localStorage.setItem("pennedly.selectedAccountId", "1");
    localStorage.setItem("pennedly.locale", "en");
  });
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (p.endsWith("/api/me")) return json(ME);
    if (p.endsWith("/api/me/accounts")) return json({ accounts: ACCOUNTS });
    if (p.includes("/onboarding"))
      return json({ needs_onboarding: false, has_role_book: true, post_count: 47, can_analyze: true });
    return json([]); // demo content is local; everything else tolerates []
  });
}

async function shoot(page: Page, name: string): Promise<void> {
  await page
    .addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" })
    .catch(() => {});
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(260);
  await page.screenshot({ path: `test-results/visual/${name}-light.png` });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(260);
  await page.screenshot({ path: `test-results/visual/${name}-dark.png` });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
}

test("mobile shell — hamburger drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14/15
  await setup(page);
  await page.goto("/app?demo=1");
  // Phone: no persistent sidebar/tab bar — wait on the single top bar.
  await page.waitForSelector("header", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(500);
  await shoot(page, "mobile-shell-studio"); // single top bar (hamburger + title), no bottom tab bar

  // Hamburger (aria-label = nav.more) → slide-in nav drawer (brand + grouped nav
  // + account foot).
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.waitForTimeout(450);
  await shoot(page, "mobile-shell-drawer");
});
