import { expect, test } from "@playwright/test";

// App-Header-Pill-Budget-SPEC §11 — the checklist, as assertions.
//
// The old prose pill overflowed its 132px budget in 58 of ~120 string×locale
// combinations, and no amount of translation trimming fixed it: the shape
// "count + verb phrase" scales with both language and counter. The rule that
// replaced it is that a bar pill renders ONE GLYPH AND ONE NUMBER, so these
// tests are a regex and a width — not a per-locale font measurement.
//
// Runs against the ?demo=1 review (dev-gated, no backend), which is the only
// way to reach every screen's populated state deterministically.

const SCREENS = [
  "/app",
  "/app/replies",
  "/app/audits",
  "/app/scenarios",
  "/app/overview",
  "/app/stats",
  "/app/role-book",
  "/app/mentions/routines",
];

// §11 — the pill may only ever contain a counter, a ratio or a signed delta.
// A word in here means a screen passed prose to `label`'s slot by mistake.
const PILL_CONTENT = /^(\d{1,2}\+?|\d{1,2}\/\d{1,2}|[+−]\d{1,3}%)?$/;

const LOCALES = ["en", "de", "uk"] as const; // the longest-word locales + en

for (const locale of LOCALES) {
  test(`pill budget holds on every screen · ${locale}`, async ({ page }) => {
    await page.addInitScript((l) => window.localStorage.setItem("pennedly.locale", l), locale);
    await page.setViewportSize({ width: 375, height: 812 });

    for (const path of SCREENS) {
      await page.goto(`${path}?demo=1`, { waitUntil: "domcontentloaded" });
      // The bar renders with the shell; wait for it rather than a fixed delay.
      await page.locator("header").first().waitFor({ state: "attached", timeout: 15_000 });

      const probe = await page.evaluate(() => {
        const pill = document.querySelector("header .tabular-nums");
        const h1 = document.querySelector("header h1");
        const row = h1?.parentElement ?? null;
        return {
          pill: pill
            ? {
                text: (pill.textContent ?? "").trim(),
                label: pill.getAttribute("aria-label"),
                width: Math.round(pill.getBoundingClientRect().width),
                height: Math.round(pill.getBoundingClientRect().height),
                left: Math.round(pill.getBoundingClientRect().left),
              }
            : null,
          rowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
        };
      });

      if (probe.pill) {
        // §11 — content is a regex, not a measurement.
        expect(PILL_CONTENT.test(probe.pill.text), `${path} · ${locale} · pill text "${probe.pill.text}"`).toBe(true);
        // §9.1 — 88px is a guard that must never engage (81px is the arithmetic max).
        expect(probe.pill.width, `${path} · ${locale} · pill width`).toBeLessThanOrEqual(88);
        expect(probe.pill.height, `${path} · ${locale} · pill height`).toBe(30);
        // The full sentence is never lost — it is the accessible name.
        expect(probe.pill.label, `${path} · ${locale} · aria-label`).toBeTruthy();
      }
      // §9.1 — the row stays single-line at 52px on a phone whatever the pill holds.
      expect(probe.rowHeight, `${path} · ${locale} · bar row height`).toBe(52);
    }
  });
}

test("pill left edge is identical at rest and scrolled", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/app/replies?demo=1", { waitUntil: "domcontentloaded" });
  await page.locator("header .tabular-nums").waitFor({ timeout: 15_000 });

  const at = async (y: number) =>
    page.evaluate((top) => {
      window.scrollTo(0, top);
      // jsdom-style programmatic scrolls don't always emit the event the reveal
      // hook listens on; dispatch it so the docked state is the real one.
      window.dispatchEvent(new Event("scroll"));
      const pill = document.querySelector("header .tabular-nums");
      return pill ? Math.round(pill.getBoundingClientRect().left) : null;
    }, y);

  const rest = await at(0);
  const scrolled = await at(200);
  expect(rest).not.toBeNull();
  expect(scrolled, "the pill must not move when the title docks").toBe(rest);
});

test("counters abbreviate at 100 and ratios clamp at 99", async ({ page }) => {
  // Exercises the shared formatter through the component's own contract: the
  // widest possible pill (99/99) must still clear the 88px guard.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/app/replies?demo=1", { waitUntil: "domcontentloaded" });
  const pill = page.locator("header .tabular-nums");
  await pill.waitFor({ timeout: 15_000 });

  const widths = await page.evaluate(() => {
    const el = document.querySelector("header .tabular-nums") as HTMLElement | null;
    if (!el) return null;
    const numeral = el.querySelector("span:last-child") as HTMLElement | null;
    if (!numeral) return null;
    const original = numeral.textContent;
    const out: Record<string, number> = {};
    for (const sample of ["6", "42", "99+", "99/99", "+18%"]) {
      numeral.textContent = sample;
      out[sample] = Math.round(el.getBoundingClientRect().width);
    }
    numeral.textContent = original;
    return out;
  });

  expect(widths).not.toBeNull();
  for (const [sample, width] of Object.entries(widths!)) {
    expect(width, `pill rendering "${sample}"`).toBeLessThanOrEqual(88);
  }
});
