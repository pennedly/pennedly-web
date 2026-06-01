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
  {
    id: 143,
    account_id: 1,
    content_type: "post",
    status: "pending",
    generated_text:
      "I used to think discipline was the hard part. Turns out the hard part is deciding what's actually worth being disciplined about.",
    llm_model: "claude",
    topic_label: "Discipline",
    is_skip: false,
    created_at: "2026-06-01T08:00:00Z",
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

const MENTIONS = {
  count: 3,
  mentions: [
    {
      id: 501,
      account_id: 1,
      threads_mention_id: "m1",
      author_username: "devon.writes",
      text: "Just read @mara.lin's thread on finding your voice — required reading for anyone starting out.",
      permalink: "https://www.threads.net/@devon.writes/post/1",
      status: "new",
      published_at: "2026-06-01T09:30:00Z",
      created_at: "2026-06-01T09:30:00Z",
    },
    {
      id: 502,
      account_id: 1,
      threads_mention_id: "m2",
      author_username: "ana.k",
      text: "honestly @mara.lin nailed it here. consistency > intensity, every time.",
      permalink: "https://www.threads.net/@ana.k/post/2",
      status: "new",
      published_at: "2026-05-31T18:00:00Z",
      created_at: "2026-05-31T18:00:00Z",
    },
    {
      id: 503,
      account_id: 1,
      threads_mention_id: "m3",
      author_username: "buildinpublic",
      text: "shoutout to @mara.lin for the nudge to ship before you're ready. did it. terrifying. worth it.",
      permalink: "https://www.threads.net/@buildinpublic/post/3",
      status: "seen",
      published_at: "2026-05-30T12:00:00Z",
      created_at: "2026-05-30T12:00:00Z",
    },
  ],
};

// Reply queue — comments across two posts in every card state (new / pending
// draft / approved / replied / skipped), so the redesign's status filter,
// post-rail and per-state cards all render. `status_counts` drives the tabs.
const COMMENTS = {
  count: 6,
  status_counts: { new: 2, drafted: 2, replied: 1, skipped: 1 },
  comments: [
    {
      id: 701,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_701",
      author_username: "devon.makes",
      text: "this hit me at exactly the right time. how do you actually decide what to cut?",
      comment_url: "https://www.threads.net/@devon.makes/post/701",
      status: "new",
      published_at: "2026-06-01T07:30:00Z",
      created_at: "2026-06-01T07:30:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: null,
      draft_text: null,
      draft_status: null,
      draft_is_skip: null,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 702,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_702",
      author_username: "theo.writes",
      text: "“the 400 that survived” ok this is calling me OUT",
      comment_url: "https://www.threads.net/@theo.writes/post/702",
      status: "drafted",
      published_at: "2026-06-01T05:00:00Z",
      created_at: "2026-06-01T05:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8021,
      draft_text:
        "ha — the survivors are always the ones that scared me a little. those are usually the keepers.",
      draft_status: "pending",
      draft_is_skip: false,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 703,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_703",
      author_username: "marina.k",
      text: "do you write longhand first or go straight to a doc?",
      comment_url: "https://www.threads.net/@marina.k/post/703",
      status: "drafted",
      published_at: "2026-05-31T22:00:00Z",
      created_at: "2026-05-31T22:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8022,
      draft_text:
        "straight to a doc, always — I type faster than I can second-guess. longhand is only for when I'm truly stuck.",
      draft_status: "approved",
      draft_is_skip: false,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 704,
      account_id: 1,
      post_id: 9001,
      threads_comment_id: "tc_704",
      author_username: "paul.writes",
      text: "saving this. genuinely needed the permission to cut today.",
      comment_url: "https://www.threads.net/@paul.writes/post/704",
      status: "replied",
      published_at: "2026-05-31T12:00:00Z",
      created_at: "2026-05-31T12:00:00Z",
      post_text:
        "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.",
      post_published_at: "2026-05-30T14:00:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9001",
      ai_draft_id: 8023,
      draft_text:
        "cut freely — you can always paste it back later, but you almost never want to.",
      draft_status: "approved",
      draft_is_skip: false,
      replied_at: "2026-05-31T13:00:00Z",
      reply_threads_post_id: "t_reply_704",
    },
    {
      id: 705,
      account_id: 1,
      post_id: 9003,
      threads_comment_id: "tc_705",
      author_username: "lucia.r",
      text: "Esto es justo lo que necesitaba leer hoy. ¡Mil gracias por compartirlo! 🙏",
      comment_url: "https://www.threads.net/@lucia.r/post/705",
      status: "new",
      published_at: "2026-06-01T06:15:00Z",
      created_at: "2026-06-01T06:15:00Z",
      post_text:
        "Consistency beats intensity. Three small posts a week out-compound one viral month.",
      post_published_at: "2026-05-29T09:15:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9003",
      ai_draft_id: null,
      draft_text: null,
      draft_status: null,
      draft_is_skip: null,
      replied_at: null,
      reply_threads_post_id: null,
    },
    {
      id: 706,
      account_id: 1,
      post_id: 9003,
      threads_comment_id: "tc_706",
      author_username: "growthhacks.io",
      text: "🚀 amazing post!! check out my page for DAILY writing hacks and follow back 🔥🔥 link in bio",
      comment_url: "https://www.threads.net/@growthhacks.io/post/706",
      status: "skipped",
      published_at: "2026-05-31T20:00:00Z",
      created_at: "2026-05-31T20:00:00Z",
      post_text:
        "Consistency beats intensity. Three small posts a week out-compound one viral month.",
      post_published_at: "2026-05-29T09:15:00Z",
      post_threads_url: "https://www.threads.net/@mara.lin/post/9003",
      ai_draft_id: 8024,
      draft_text: null,
      draft_status: "pending",
      draft_is_skip: true,
      replied_at: null,
      reply_threads_post_id: null,
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
    if (p.includes("/mentions")) return json(MENTIONS);
    if (p.includes("/comments")) return json(COMMENTS);
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
  // Pending-tab card (full action set: reject / tweak / edit / approve).
  await page.getByRole("button", { name: /drafts/i }).first().click();
  await page.waitForTimeout(400);
  await shoot(page, "shell-studio-drafts");
});

test("Feed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await setup(page);
  await page.goto("/app/feed");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "feed");
});

test("Mentions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setup(page);
  await page.goto("/app/mentions");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "mentions");
});

test("Replies", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 });
  await setup(page);
  await page.goto("/app/replies");
  await page.waitForSelector("aside", { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(700);
  await shoot(page, "replies");
});
