import { expect, test } from "@playwright/test";

// Component-state + public-page smoke. The big win over pages-smoke.spec.ts
// (which only checks that auth-gated /app routes redirect to login without
// crashing) is the dev-only **/gallery** route: it renders the REAL media
// components — FeedMedia (images / carousel / video), ReplyImage, the Studio
// DraftCard composer, LinkPreviewCard — with NO auth and NO backend. That's
// exactly where a silent component-render regression (a collapsing picker, a
// broken video tile, a bad import in a parts file) gets caught before prod.
//
// /gallery is 404 in production but served under `next dev` (which CI boots),
// so it works here. No backend is needed: the gallery uses data-URI
// placeholders and the controlled (offline) LinkPreviewCard mode.

// Console/resource noise that is expected and must NOT fail the run: the
// gallery intentionally references non-existent media (the "broken image →
// fallback" tile, a sample.mp4 that never loads), and dev mode emits HMR +
// third-party (PostHog/Sentry without keys) chatter.
const IGNORED_ERROR = /posthog|sentry|favicon|HMR|hot-update|Failed to load resource|net::ERR|ERR_|^Warning:|sample\.mp4|does-not-exist/i;

// Public + dev-gallery routes that render with no auth and no backend.
const RENDER_PAGES = [
  "/privacy",
  "/terms",
  "/data-deletion",
  "/gallery",
  "/gallery/account",
  "/gallery/account-empty",
  "/gallery/account-history",
  "/gallery/media",
  "/gallery/overview",
  "/gallery/advisor",
  "/gallery/engagement",
  "/gallery/scenarios",
  "/gallery/studio-publish",
  "/gallery/studio-composer",
];

for (const path of RENDER_PAGES) {
  test(`renders without crashing: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !IGNORED_ERROR.test(msg.text())) {
        errors.push(`console.error: ${msg.text()}`);
      }
    });

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res, `no response for ${path}`).not.toBeNull();
    expect(res!.status(), `bad status for ${path}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();

    // Uncaught exceptions are never OK; console errors are filtered for the
    // expected dev/no-backend noise above.
    expect(errors, `client errors on ${path}:\n${errors.join("\n")}`).toEqual([]);
  });
}

test("gallery/media renders the key media component states", async ({ page }) => {
  await page.goto("/gallery/media", { waitUntil: "domcontentloaded" });

  // The gallery's English section headings are locale-stable (the components
  // inside localize, but these <h2>/<h3> labels are hard-coded).
  await expect(page.getByRole("heading", { name: "Feed media" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Composer (Studio draft card)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Link preview" })).toBeVisible();

  // Feed/image states paint real <img> (data-URI placeholders).
  expect(await page.locator("img").count()).toBeGreaterThan(3);
  // The composer's attached-video state renders a <video> preview.
  await expect(page.locator("video").first()).toBeVisible();
  // The link-preview card renders its domain.
  await expect(page.getByText("example.com").first()).toBeVisible();
});

test("gallery dark toggle flips the theme (a real click works)", async ({ page }) => {
  await page.goto("/gallery/media", { waitUntil: "domcontentloaded" });
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: /^Dark$/ }).click();
  await expect(html).toHaveClass(/\bdark\b/);
});
