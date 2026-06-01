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

const DRAFTS = [
  {
    id: 142,
    account_id: 1,
    content_type: "post",
    status: "approved",
    generated_text:
      "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
    llm_model: "claude",
    topic_label: "Writing",
    is_skip: false,
    created_at: "2026-05-31T19:30:00Z",
    published: false,
    threads_url: null,
  },
  {
    id: 141,
    account_id: 1,
    content_type: "post",
    status: "approved",
    generated_text:
      "Nobody tells you that consistency beats intensity until you've burned out twice trying to prove otherwise. Three small posts a week out-compound one viral month.",
    llm_model: "claude",
    topic_label: "Habits",
    is_skip: false,
    created_at: "2026-05-31T16:10:00Z",
    published: false,
    threads_url: null,
  },
];

const FEED = {
  count: 3,
  reference: {
    window_days: 7,
    posts_counted: 24,
    avg_views: 1850,
    avg_likes: 95,
    avg_comments: 12,
    median_views: 1600,
  },
  posts: [
    {
      id: 9001,
      threads_post_id: "t_9001",
      threads_url: "https://www.threads.net/@mara.lin/post/9001",
      text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's.",
      published_at: "2026-05-30T14:00:00Z",
      views: 8420,
      likes: 540,
      reposts: 38,
      comments_count: 47,
      viral_tier: "viral",
      viral_score: 0.92,
      vs_avg_views: 4.5,
      is_fresh: false,
      auto_reply: true,
    },
    {
      id: 9002,
      threads_post_id: "t_9002",
      threads_url: "https://www.threads.net/@mara.lin/post/9002",
      text: "Just shipped something I've been sitting on for two weeks. Posting before I talk myself out of it.",
      published_at: "2026-05-31T20:30:00Z",
      views: 410,
      likes: 22,
      reposts: 1,
      comments_count: 3,
      viral_tier: null,
      viral_score: null,
      vs_avg_views: null,
      is_fresh: true,
      auto_reply: false,
    },
    {
      id: 9003,
      threads_post_id: "t_9003",
      threads_url: "https://www.threads.net/@mara.lin/post/9003",
      text: "Consistency beats intensity. Three small posts a week out-compound one viral month — every single time.",
      published_at: "2026-05-29T09:15:00Z",
      views: 1620,
      likes: 88,
      reposts: 9,
      comments_count: 11,
      viral_tier: "good",
      viral_score: 0.6,
      vs_avg_views: 0.9,
      is_fresh: false,
      auto_reply: false,
    },
  ],
};

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
    if (p.includes("/feed")) return json(FEED);
    if (p.includes("/drafts")) return json({ drafts: DRAFTS, count: DRAFTS.length });
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

test("Feed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await setup(page);
  await page.goto("/app/feed");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "feed");
});
