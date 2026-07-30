import { expect, test, type Route } from "@playwright/test";

// Hermetic AUTHENTICATED end-to-end. Seeds a fake session + selected account in
// localStorage and mocks every backend call the /app shell + Studio dashboard
// make, so the logged-in dashboard renders deterministically with NO real
// backend. This is the "real user" path the render-smoke can't reach (the auth
// gate bounces it to /login).
//
// Why the prior attempt (smoke.spec.ts `test.fixme`) was flaky and how this
// fixes it:
//   1. The Studio boot calls GET /api/accounts/{id}/onboarding and waits on it
//      before loading drafts — that endpoint was NOT mocked, so the page hung
//      on the loading gate. Mocked here.
//   2. The selected account is persisted under `pennedly.selectedAccountId`
//      (not `pennedly.account.selected`); seeding the wrong key left accountId
//      unresolved. Seeded with the correct key here.

const TOKENS = {
  access_token: "eyJ.fake.e2e.token",
  refresh_token: "fake-refresh",
  refresh_expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
};

const ME = {
  user_id: 7,
  email: "owner@example.com",
  display_name: "Owner Person",
  tenant: { id: 7, name: "workspace", slug: null, plan_tier: "trial", accounts_limit: 3 },
  is_tester: true,
  locale: "en",
  avatar_url: "https://example.test/owner.png",
};

const ACCOUNT = {
  id: 42,
  tenant_id: 7,
  threads_user_id: "th-42",
  username: "mara_threads",
  display_name: "Mara Lin",
  profile_picture_url: "https://example.test/mara.png",
  connected_at: new Date().toISOString(),
  disconnected_at: null,
  // First-connect backfill fields (GET /api/me/accounts). A settled account →
  // 'complete' so the import banner stays hidden and the normal flow renders.
  sync_status: "complete",
  sync_summary: { posts: 20, history_posts: 20, followers_snapshot: 1, new_comments: 0, new_mentions: 0, errors: [] },
  sync_started_at: new Date(Date.now() - 9e5).toISOString(),
  sync_completed_at: new Date(Date.now() - 6e5).toISOString(),
};

const ONBOARDING = {
  needs_onboarding: false,
  has_role_book: true,
  post_count: 20,
  can_analyze: true,
  min_posts_to_analyze: 15,
};

function draft(over: Record<string, unknown>) {
  return {
    id: 0,
    account_id: 42,
    content_type: "threads_post",
    status: "pending",
    generated_text: "",
    llm_model: "anthropic/claude-sonnet-4",
    topic_label: null,
    is_skip: false,
    created_at: new Date().toISOString(),
    published: false,
    threads_url: null,
    scheduled_at: null,
    schedule_failed: false,
    reply_to: null,
    media: [],
    video: null,
    ...over,
  };
}

// One approved draft (→ the default "Ready to publish" tab) and one pending
// draft (→ the "Drafts" tab).
const READY = draft({ id: 1, status: "approved", generated_text: "Ready draft about coffee rituals" });
const PENDING = draft({ id: 2, status: "pending", generated_text: "Pending draft about morning routines" });

test.beforeEach(async ({ page, context }) => {
  const ok = (data: unknown) => (route: Route) => route.fulfill({ status: 200, json: data as object });

  // ── boot endpoints ──
  await context.route(/\/api\/me$/, ok(ME));
  await context.route(/\/api\/me\/accounts$/, ok({ accounts: [ACCOUNT] }));
  await context.route(/\/api\/accounts\/\d+\/onboarding$/, ok(ONBOARDING));
  await context.route(/\/api\/accounts\/\d+\/drafts(\?|$)/, ok({ drafts: [READY, PENDING], count: 2 }));
  // Replies screen: the post rail (one row per post-with-comments) + a post's
  // comment thread. Account-wide status_counts on both.
  await context.route(/\/api\/accounts\/\d+\/comment-posts(\?|$)/, ok({ posts: [], count: 0, status_counts: {} }));
  await context.route(/\/api\/accounts\/\d+\/comments(\?|$)/, ok({ comments: [], count: 0, status_counts: {} }));
  // Stats screen: the followers line + the engagement panel both fetch on load.
  await context.route(/\/api\/accounts\/\d+\/followers(\?|$)/, ok({ points: [], latest: null }));
  await context.route(/\/api\/accounts\/\d+\/engagement(\?|$)/, ok({ points: [], likes: null, replies: null, reposts: null, quotes: null }));
  // Scenarios screen fetches its list + preset catalog + autopilot config on
  // load (the «рутинный автопилот» control-center). Empty list = a valid state
  // (renders the discovery gallery). The literal `/scenarios/presets` path must
  // be routed BEFORE the broader `/scenarios` matcher (Playwright is last-wins,
  // so the specific one is registered after to take precedence).
  await context.route(/\/api\/accounts\/\d+\/scenarios(\?|$)/, ok({ scenarios: [] }));
  await context.route(/\/api\/scenarios\/presets(\?|$)/, ok({ locale: "en", presets: [] }));
  await context.route(/\/api\/accounts\/\d+\/autopilot(\?|$)/, ok({
    enabled: false, post_enabled: false, posts_per_day: 1, quiet_start_hour: null, quiet_end_hour: null,
    reply_enabled: false, reply_mode: "off", reply_audience: "all_except_trolls", replies_per_day: 5,
    reply_frequency: "hourly", reply_quiet_start_hour: null, reply_quiet_end_hour: null,
    reply_skip_low_value: true, reply_post_max_age_days: null, max_post_scenarios_per_day: 1,
  }));
  await context.route(/\/api\/accounts\/\d+\/role-book$/, ok({
    role_book_id: 1, name: "Voice", sections: null,
    prompt_text: "voice", created_by: "user", parent_id: null,
    activated_at: new Date().toISOString(), posts_analyzed: 20,
  }));

  // ── draft actions (return plausible success) ──
  await context.route(/\/api\/drafts\/\d+\/approve$/, ok({ draft_id: 2, status: "approved" }));
  await context.route(/\/api\/drafts\/\d+\/unapprove$/, ok({ draft_id: 1, status: "pending" }));
  await context.route(/\/api\/drafts\/\d+\/publish$/, ok({
    draft_id: 1, threads_post_id: "th-post-1", threads_url: "https://www.threads.net/@mara_threads/post/1",
  }));

  // ── seed an authenticated session + the selected account ──
  await page.addInitScript(
    ([tokens, accId]) => {
      window.localStorage.setItem("pennedly.tokens", tokens);
      window.localStorage.setItem("pennedly.selectedAccountId", accId);
    },
    [JSON.stringify(TOKENS), String(ACCOUNT.id)],
  );
});

test("logged-in dashboard boots: composer + active account + a ready draft", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/app", { waitUntil: "domcontentloaded" });

  // The composer (proof the auth/account gate resolved and we're on the board).
  const composer = page.getByPlaceholder(/what do you want to write about/i);
  await expect(composer).toBeVisible({ timeout: 15_000 });
  // The «Строка» composer discloses its shelf (with Generate) on focus/typing.
  await composer.click();
  await expect(page.getByRole("button", { name: /generate/i }).first()).toBeVisible();

  // The active Threads account's identity is on the cards (@handle / name) —
  // this is the surface that must show the account, not the Pennedly user.
  await expect(page.getByText("@mara_threads").first()).toBeVisible();

  // The seeded approved draft shows in the default "Ready to publish" tab.
  await expect(page.getByText("Ready draft about coffee rituals")).toBeVisible();

  expect(errors, `client errors:\n${errors.join("\n")}`).toHaveLength(0);
});

test("tab switch: Drafts tab shows the pending draft, Ready hides it", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });

  // Default "Ready to publish" tab: the approved draft shows, the pending one doesn't.
  await expect(page.getByText("Ready draft about coffee rituals")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Pending draft about morning routines")).toHaveCount(0);

  // Switch to "Drafts" → the pending draft appears, the approved one drops out.
  await page.getByRole("tab", { name: /Drafts/ }).click();
  await expect(page.getByText("Pending draft about morning routines")).toBeVisible();
  await expect(page.getByText("Ready draft about coffee rituals")).toHaveCount(0);
});

test("send back: an approved draft returns to the Drafts column", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });

  // The ready card is in the default "Ready to publish" tab.
  await expect(page.getByText("Ready draft about coffee rituals")).toBeVisible({ timeout: 15_000 });

  // Open its ⋯ menu and pick «Send back to drafts» (real mode now offers it).
  await page.getByRole("button", { name: /More actions/i }).first().click();
  await page.getByRole("menuitem", { name: /Send back to drafts/i }).click();

  // Optimistically it leaves Ready; the "Restored to drafts" toast confirms.
  await expect(page.getByText("Restored to drafts")).toBeVisible();
  await expect(page.getByText("Ready draft about coffee rituals")).toHaveCount(0);

  // And it now shows under the Drafts tab.
  await page.getByRole("tab", { name: /Drafts/ }).click();
  await expect(page.getByText("Ready draft about coffee rituals")).toBeVisible();
});

// Replies: the translate row is the LIVE path (it used to be demo-only mock
// data, so «Перевести с Spanish» could never appear for a real comment). Assert
// the row calls POST /api/translate with the reading locale as target and swaps
// the comment body for what came back.
test("replies: translating a comment calls the API and swaps the body", async ({ page, context }) => {
  const COMMENT = {
    id: 501, account_id: 42, post_id: 900, threads_comment_id: "th-c-501",
    author_username: "lucia.escribe",
    text: "Esto es justo lo que necesitaba leer hoy.",
    media_url: null, media_type: null, thumbnail_url: null,
    comment_url: "https://www.threads.net/@mara_threads/post/900",
    status: "new", published_at: null, created_at: new Date().toISOString(),
    post_text: "Consistency beats talent.", post_published_at: new Date().toISOString(),
    post_threads_url: "https://www.threads.net/@mara_threads/post/900",
    ai_draft_id: null, draft_text: null, draft_status: null, draft_is_skip: null,
    draft_media: [], replied_at: null, reply_threads_post_id: null, auto_replied: false,
  };
  const okJson = (data: unknown) => (route: Route) => route.fulfill({ status: 200, json: data as object });
  await context.route(/\/api\/accounts\/\d+\/comment-posts(\?|$)/, okJson({
    posts: [{ post_id: 900, post_text: "Consistency beats talent.", post_published_at: COMMENT.created_at, post_threads_url: COMMENT.post_threads_url, total: 1, unanswered: 1 }],
    count: 1, status_counts: { new: 1 }, needs_attention: 1,
  }));
  await context.route(/\/api\/accounts\/\d+\/comments(\?|$)/, okJson({ comments: [COMMENT], count: 1, status_counts: { new: 1 } }));

  // Capture the outgoing translate request so a silently-wrong target_lang fails.
  let sent: { text?: string; target_lang?: string } = {};
  await context.route(/\/api\/translate$/, async (route) => {
    sent = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({ status: 200, json: { translated_text: "This is exactly what I needed to read today.", target_lang: "en", cached: false } });
  });

  await page.goto("/app/replies", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Esto es justo lo que necesitaba leer hoy.")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: /^translate$/i }).click();

  await expect(page.getByText("This is exactly what I needed to read today.")).toBeVisible();
  expect(sent.target_lang).toBe("en"); // ME.locale
  expect(sent.text).toBe(COMMENT.text);

  // And back: "Show original" restores the source text.
  await page.getByRole("button", { name: /Show original/i }).click();
  await expect(page.getByText("Esto es justo lo que necesitaba leer hoy.")).toBeVisible();
});

test("publish flow: open the dialog, confirm, see the success toast", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });

  // The approved draft is publishable — click its Publish button.
  await expect(page.getByText("Ready draft about coffee rituals")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Publish to Threads/i }).first().click();

  // The confirm dialog opens. "Publish now" appears twice — the mode segment
  // and the footer confirm button; the confirm is the last one.
  await expect(page.getByText("Publish to Threads?")).toBeVisible();
  await page.getByRole("button", { name: /Publish now/i }).last().click();

  // Success toast from the mocked POST /api/drafts/{id}/publish.
  await expect(page.getByText("Published to Threads")).toBeVisible();
});
