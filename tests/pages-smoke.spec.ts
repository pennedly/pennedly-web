import { test, expect } from "@playwright/test";

// Render-smoke for the previously-untested /app pages (ROADMAP Phase 3).
//
// These run WITHOUT a backend. Every /app route is auth-gated, so an
// unauthenticated visit resolves to the login screen — that's fine: the
// point of a render-smoke is "the route's bundle compiles and loads and
// nothing throws at module/render time," which is exactly the class of
// breakage a refactor introduces (a bad import, a top-level throw, a
// renamed export). We therefore assert, per route:
//   • the document is served (HTTP < 400 — not a 404/500), and
//   • the page produces no uncaught client error, and
//   • we end up on the route itself OR bounced to /app/login (the gate),
//     never on a Next.js error overlay.
//
// A deeper, authenticated end-to-end pass against a seeded tenant is a
// separate (non-autonomous) task — see ROADMAP Phase 6 / BACKLOG.

const APP_PAGES = [
  "/app/feed",
  "/app/stats",
  "/app/replies",
  "/app/autopilot",
  "/app/patterns",
  "/app/onboarding",
  "/app/settings",
];

for (const path of APP_PAGES) {
  test(`renders without crashing: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    // The Next route must serve a document, not a 404/500.
    expect(res, `no response for ${path}`).not.toBeNull();
    expect(res!.status(), `bad status for ${path}`).toBeLessThan(400);

    // Body paints (either the page or the login gate it redirects to).
    await expect(page.locator("body")).toBeVisible();

    // Auth gate sends us to login, or the page renders in place — both OK.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 10_000 })
      .toMatch(new RegExp(`^(${path}|/app/login)$`));

    // No uncaught client-side exception during load/redirect.
    expect(errors, `client errors on ${path}: ${errors.join("; ")}`).toHaveLength(0);
  });
}
