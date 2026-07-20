# Pennedly — Visual Fidelity Audit (live code vs design эталон)

**Date:** 2026-06-03 · **Scope:** all 16 redesign screens + design system + app shell.
**Rule:** design = canon. Where live code diverges from `design-export/PennedlyDesign/`, the design is right.
**This pass = audit only. No code was changed.** The only new file is this one. Fixes are a separate step.

**Method:** (1) `ast-index rebuild`; (2) correspondence map below; (3) design-system + shell audit (done by hand — it's the root of most drift); (4) fresh screenshots of current code via `npx playwright test tests/visual/screens.spec.ts` → `test-results/visual/<name>-{light,dark}.png` (18/18 passed, mocked API, viewport 1280); (5) per-screen deep-dive (8 parallel Explore agents over 2 screens each), then every load-bearing finding re-verified against source + screenshots before being written here.

**Headline result:** the design **tokens are already 1:1** in the live code (colours, ink scale, semantic light/dark, radii, shadows, type scale, motion — see [§A](#a-design-system-cross-cutting)). So almost nothing is "wrong colour value". The drift is concentrated in **(a) two missing/incorrect shared components, (b) a missing content-width/topbar-alignment system in the shell, (c) a recurring habit of using accent-blue where the design uses success-green or ink, and (d) the Landing hero.** Fix those four roots and most screens fall into line.

**Tally:** ~58 distinct findings — **1 blocker, 14 major, ~43 minor**. Start at Wave 1 (design system) and go top-down; see [§D](#d-prioritised-fix-plan-waves).

---

## Correspondence map (the костяк)

| # | Screen | Design files (`design-export/PennedlyDesign/`) | Live file(s) (`src/`) | Width |
|---|---|---|---|---|
| — | **Design system** | `Pennedly Design System.html`, `globals.css`, `ds/tokens.css`, `ds/components.css` | `app/globals.css`, `components/ui/*` | — |
| — | **Shell** | `shell-parts.jsx`, `shell.css`, `shell-data.jsx`, shell rules in `studio.css:21-158` | `app/app/layout.tsx`, `components/{Sidebar,AppTopbar,AccountSwitcher}.tsx` | — |
| 1 | **Studio** | `Studio.html`, `studio-{app,parts,data,icons}.jsx`, `tweaks-panel.jsx`, `studio.css` | `app/app/page.tsx` | wide 960 |
| 2 | **Feed** | `Feed.html`, `feed-{app,parts,card,data}.jsx`, `feed.css` | `app/app/feed/page.tsx` | wide 960 |
| 3 | **Replies** | `Replies.html`, `replies-{app,parts,card,postselect,data}.jsx`, `replies.css` | `app/app/replies/page.tsx` | wide 960 |
| 4 | **Mentions** | `Mentions.html`, `mentions-{app,parts,data}.jsx`, `mentions.css` | `app/app/mentions/page.tsx` | wide 960 |
| 5 | **Stats** | `Stats.html`, `stats-{app,parts,data}.jsx`, `stats.css` | `app/app/stats/page.tsx` | wide 960 |
| 6 | **Audits** | `Audits.html`, `audits-{app,parts,change,data}.jsx`, `audits.css` | `app/app/audits/page.tsx` + `audits/[id]/page.tsx` | reading 720 |
| 7 | **Patterns** | `Patterns.html`, `patterns-{app,parts,data}.jsx`, `patterns.css` | `app/app/patterns/page.tsx` | reading 720 |
| 8 | **Explore** | `Explore.html`, `explore-{app,parts,data,icons}.jsx`, `explore.css` | `app/app/patterns/explore/page.tsx` | reading 720 |
| 9 | **Voice** | `Voice.html`, `voice-{app,parts,data,icons}.jsx`, `voice.css` | `app/app/role-book/page.tsx` | reading 720 |
| 10 | **Style rules** | `Style Rules.html`, `stylerules-{app,parts,data,icons}.jsx`, `stylerules.css` | `app/app/style-rules/page.tsx` | reading 720 |
| 11 | **Settings** | `Settings.html`, `settings-{app,parts,data,icons}.jsx`, `settings.css` | `app/app/settings/page.tsx` | reading 720 |
| 12 | **Autopilot** | `Autopilot.html`, `autopilot-{app,parts,data}.jsx`, `autopilot.css` | `app/app/autopilot/page.tsx` | reading 720 |
| 13 | **Onboarding** | `Onboarding.html`, `onboarding-{app,parts,data,icons}.jsx`, `onboarding.css` | `app/app/onboarding/page.tsx` | full-screen |
| 14 | **Login** | `Login.html`, `login-{app,parts,data,icons}.jsx`, `login.css` | `app/app/login/page.tsx` | full-screen |
| 15 | **Landing** | `Landing.html`, `landing-{app,parts,data,icons}.jsx`, `landing.css` | `app/page.tsx` (+ `landing-view.tsx`) | wrap 1080 |
| 16 | **Legal** | `Legal Template.html`, `legal-{app,parts,data,icons}.jsx`, `legal.css` | `app/{privacy,terms,data-deletion}/page.tsx` + `components/legal/*` | wrap 720 / bar 980 |

Design width canon (from the `-app.jsx` headers + `ds/tokens.css:64-67`): **reading = 720px, wide = 960px**; a screen's topbar inner row must be centered to the *same* width as its content column (design `.topbar-inner` / `.content` system, `ds/components.css:208-221`).

---

## A. Design system (cross-cutting)

Tokens verified 1:1 (`app/globals.css` ≡ design `globals.css`/`ds/tokens.css`): ink scale, semantic light+dark roles, radius (6/10/14/20/28), shadows, type scale (display/h1/h2/h3/body/small/caption with line-height + weight + tracking), motion. The only intentional diff is `--font-sans: var(--font-geist-sans)` (next/font wiring) — **not** a drift. The findings below are in the **components**, not the tokens.

- **[major]** Button › missing `lg` size — DESIGN: `.btn--lg` = h 46px / px 22px / `text-body` / `radius-lg` (`ds/components.css:184`), the canonical hero & auth CTA (login, landing, onboarding, idle "run" actions). CODE: `SIZES` only defines `md`/`sm` ([`components/ui/button.tsx:17-20`](src/components/ui/button.tsx)); screens hand-roll `h-12` (48px) instead. FIX: add `lg: "h-[46px] px-[22px] rounded-lg text-body"` and use `<Button size="lg">` on those CTAs.
- **[major]** ErrorBanner › not danger-tinted — DESIGN: `.error-banner` = bg `color-mix(danger 9%, surface)`, border `color-mix(danger 32%, border)`, round 34px danger mark, gap 14 / pad 16-18 (`shell.css:93-106`). CODE: neutral `bg-surface` + `border-border` + a 28px **square** `bg-surface-2` mark ([`components/ui/error-banner.tsx:22-27`](src/components/ui/error-banner.tsx)). FIX: rebuild ErrorBanner to the danger-tinted recipe with a round 34px danger chip. Affects every data-screen error state.
- **[major]** Select › no chevron — DESIGN: `select.field` ships a built-in SVG down-chevron at right 12px (`ds/components.css:59-61`). CODE: `appearance-none pr-8` reserves the gap but renders no arrow ([`components/ui/field.tsx:51-55`](src/components/ui/field.tsx)). FIX: add the design's `background-image` chevron (or an absolutely-positioned `IcChevDown`).
- **[minor]** Skeleton › pulse not shimmer — DESIGN: `.skel-*` shimmer gradient + `@keyframes shimmer` (`ds/components.css:190`, added on purpose at §3.7). CODE: `animate-pulse` opacity fade ([`components/ui/feedback.tsx:22,33`](src/components/ui/feedback.tsx)). FIX: add a shimmer utility and use it for skeletons.
- **[minor]** Switch › knob doesn't flip in dark — DESIGN: checked knob = `--color-primary-foreground` (dark in dark mode) (`ds/components.css:116`). CODE: knob is always `bg-white` ([`components/ui/switch.tsx:42`](src/components/ui/switch.tsx)). FIX: `peer-checked:bg-primary-foreground`.
- **[minor]** Avatar › missing inset ring — DESIGN: `.avatar` has `box-shadow: inset 0 0 0 1px color-mix(text 8%)` (`shell.css:12`). CODE: `<img>`/Mono have no inset ring ([`components/ui/avatar.tsx:42`](src/components/ui/avatar.tsx), `mono.tsx`). FIX: add `ring-1 ring-text/[0.08]`.
- **[minor]** Button/Badge/Toast/Dialog micro-drift — `:active translateY(0.5px)` missing; primary hover `/90` vs design `mix 88%`; Badge `px-2.5` (10px) vs design 9px; Toast missing `min-w-[280px]`; Dialog `max-w-md` (448) vs design 420. All trivial; batch-fix when touching each primitive.

---

## B. App shell (cross-cutting)

### B.1 — Content width + topbar↔content alignment (the big one)

There is **no shared content-width token** in live; each page invented its own number, so **none matches the design's 720/960**, and several topbars don't match their own content column (the design's whole `.topbar-inner`/`.content` alignment system is reimplemented ad-hoc and broken on some screens).

- **[major]** Topbar↔content misalignment — the sticky header title/actions don't sit over the content column edges:
  - **Feed**: content `max-w-[900px]` ([`feed/page.tsx:197,223`](src/app/app/feed/page.tsx)) but `AppTopbar` sets **no** `maxW` → default **760px** → header ~140px narrower than content.
  - **Replies**: content `max-w-[1040px]` ([`replies/page.tsx:407,429`](src/app/app/replies/page.tsx)) but topbar default **760px** → ~280px off (worst case).
  - **Settings**: content `max-w-[680px]` ([`settings/page.tsx:124`](src/app/app/settings/page.tsx)) but topbar default 760 → ~80px off.
  - **Style rules**: content 740 vs topbar 760 → 20px off.
  FIX: every screen must pass `AppTopbar maxW` equal to its content `max-w`.
- **[major]** Width values off canon — reading screens should be **720** (live: Voice/Patterns/Explore/Audits/Autopilot 760, Style 740, Settings 680); wide screens should be **960** (live: Studio 900, Feed 900, Mentions 900, Stats 928, Replies 1040). FIX: add `--content-reading: 720px` + `--content-wide: 960px` to the `@theme`; default `AppTopbar maxW` to 720; wide screens pass 960; each `<main>` uses the matching value. This single change fixes both alignment and width everywhere.
- **[minor]** Content bottom padding — DESIGN: `.content { padding: 28px 24px 96px }` (`studio.css:153`) — a generous 96px tail. CODE: pages use `py-7` (28px top **and** bottom). FIX: `pb-24` on the content `<main>`.
- **[minor]** Content vertical gap — DESIGN: `.content { gap: 20px }`. CODE: mixed `space-y-5` (20 ✓), `space-y-4` (16 — audits/replies/mentions/feed), `space-y-[18px]` (voice). FIX: standardize on 20px.

### B.2 — Sidebar / topbar

- **[minor]** Nav icons 18px vs design 16px — `Sidebar.tsx:154` (`<Icon size={18}>`) vs design `.nav-item .nav-ico { 16px }` + `shell-parts.jsx` `size={16}`. FIX: `size={16}`.
- **[minor]** Nav labels shortened — design `shell-data.jsx:11-31`: **"My Feed", "Pattern study", "Explore patterns", "Style rules"**; live i18n renders "Feed", "Patterns", "Explore", "Style". FIX: align the i18n strings to the design labels.
- **[minor]** Nav `capitalize` — `Sidebar.tsx:148` adds `capitalize`; design labels are sentence case (e.g. "Pattern study" would become "Pattern Study"). FIX: drop `capitalize`.
- **[minor]** Nav count badges absent — design has live counts: Studio `badge:4`, Replies `badge:3`, Audits `badge:1` (`shell-data.jsx:11,13,21`) rendered as `.nav-badge` pills; live `NavItem` has no badge support. FIX: add an optional count badge (needs counts wired — may be deferred; flag as data-driven).
- **[minor]** Sidebar icon mismatches — Autopilot: design **IcBolt** (`shell-data.jsx:31`) vs live **IcClock** (`Sidebar.tsx:70`); Style rules: design **IcPencil** (`shell-data.jsx:30`) vs live **IcTweak** (`Sidebar.tsx:69`). FIX: swap to bolt / pencil.
- **[minor]** Topbar + brand over-tightened — `AppTopbar.tsx:97` and `Sidebar.tsx:119` use `tracking-tight` (-0.025em), overriding the h3 token's built-in -0.006em (and brand's -0.01em). FIX: remove `tracking-tight` (let the token win).
- **[minor]** Topbar frosted bg — design `backdrop-filter: saturate(1.1) blur(8px)`, bg `bg 86%` (`studio.css:128-129`); live `bg-bg/85 backdrop-blur-md` (12px, no saturate) (`AppTopbar.tsx:92`). Negligible; align if convenient.
- **[minor]** Account menu — design opens with a **"Switch account"** caption on top and the signed-in identity near the **bottom** (above Settings/Log out) (`shell-parts.jsx:30-54`); live puts the email/plan on **top** and drops the caption ([`AccountSwitcher.tsx:79-84`](src/components/AccountSwitcher.tsx)). Also: row avatar 26 vs design 30; plan row missing the accent dot; Log out missing its `IcLogout`. FIX: reorder to match `shell-parts.jsx`, restore caption + dot + logout icon.

---

## C. Per-screen findings

### C.0 — Recurring theme: accent-blue used where design uses success-green / ink

A pattern across screens: the design reserves **success-green** for "top / viral / strong / positive" and **ink** for "selected/active", and uses **accent-blue** only as the single sparing accent. Live repeatedly substitutes accent-blue (or grey). Fixing each instance below (Stats, Patterns, Settings, Onboarding) restores the intended palette discipline.

### 1. Studio  *(wide 960; live 900)*
Largely faithful (composer card, topic chips, status tabs with counts, draft cards, ⋯ overflow, Undo toast, account popover all render close to design — see `shell-studio-*`, `studio-generated-*`).
- **[major]** Width — DESIGN: wide **960** (`studio-app.jsx:7`, `content content--wide`). CODE: `max-w-[900px]` + `maxW="900px"` ([`page.tsx:561,571`](src/app/app/page.tsx)). FIX: 960 via the shared token (§B.1).
- **[minor]** Composer/draft micro-spacing — re-check against `studio.css` once §B.1 width lands (a few card paddings differ by 1-2px; not visible-level).

### 2. Feed  *(wide 960; live 900 + topbar 760)*
- **[major]** Topbar misaligned + width — see §B.1 (content 900 / topbar default 760; both should be 960).
- **[minor]** Content gap `space-y-4` (16) vs design 20 (`feed/page.tsx:223`).
- Post cards (metrics row, viral-tier badge, vs-avg, fresh pill, auto-reply) otherwise read faithfully.

### 3. Replies  *(wide 960; live 1040 + topbar 760)*
- **[major]** Topbar misaligned + width — content `max-w-[1040px]` vs topbar default 760 (~280px off); both should be **960** (§B.1).
- **[minor]** Master-detail grid gap — DESIGN: `.rq-layout { grid-template-columns: 300px 1fr; gap: 22px }` (`replies.css:21`). CODE: `grid-cols-[300px_minmax(0,1fr)] gap-4` (16px) ([`replies/page.tsx:449`](src/app/app/replies/page.tsx)). FIX: `gap-[22px]`.
- **[minor]** Post-rail sticky height — DESIGN: `.rq-master { max-height: calc(100vh - 132px) }` (`replies.css:29`); live left rail has no max-height/sticky constraint. FIX: add `sticky top-… max-h-[calc(100vh-132px)] overflow-auto`.

### 4. Mentions  *(wide 960; live 900, topbar aligned)*
- **[major]** Width — content + topbar both `900` but design wide is **960** (`mentions/page.tsx:90,98`). FIX: 960 (§B.1). (Aligned, just undersized.)
- **[minor]** Content gap `space-y-4` (16) vs 20.

### 5. Stats  *(wide 960; live 928 aligned)* — **colour drift confirmed in code + screenshot**
- **[major]** Column-chart above-average bars — DESIGN: `.colbar--above { background: var(--color-accent) }` (blue) (`stats.css:67`). CODE: `above ? "var(--color-success)"` (green) ([`stats/page.tsx:391`](src/app/app/stats/page.tsx)). FIX: above = accent, not success.
- **[major]** Viral-tier distribution colours — DESIGN: `tier-viral = success`, `tier-good = accent` (`stats.css:95-97`). CODE: `viral = accent`, `good = text 52%` (grey) ([`stats/page.tsx:135-136`](src/app/app/stats/page.tsx)). FIX: viral = success (green), good = accent (blue). (mid/flop opacities 32/16 vs design 30/15 — trivial.)
- **[minor]** Below-bar tint `text 16%` vs design `text 18%` (`stats/page.tsx:392`). Trivial.

### 6. Audits  *(reading 720; live 760)*
List + coach narrative + change cards + decision states (undecided/applied/rejected) all render faithfully (`audits-list-*`, `audits-detail-*`).
- **[major]** Width 760 → 720 (§B.1) on both `audits/page.tsx` and `audits/[id]/page.tsx`.
- **[minor]** Change-card / diff inner spacing — confirm against `audits.css` after width fix.
- ⚠️ **NOT a bug (see §E):** the before/after diff appears blank in the screenshot only because the *visual-test fixture* uses stale `before/after` keys; the live render correctly reads `diff.old_text/new_text` per backend contract Q51 ([`types.ts:609`](src/lib/types.ts)). Real app renders diffs fine.

### 7. Patterns  *(reading 720; live 760)* — **evidence section reworked + colour drift**
- **[major]** Evidence bars — DESIGN: `.ev-track { height: 22px; border-radius: radius-sm }` rectangular, in an open section under a top-border divider (`patterns.css:48-56`). CODE: `h-2.5` (10px) `rounded-full` pill bars wrapped in a `bg-surface-2 rounded-md p-3.5` panel ([`patterns/page.tsx:411,424`](src/app/app/patterns/page.tsx)). FIX: 22px tall, `rounded-sm`, open section (border-top divider, no surface-2 box).
- **[major]** Strength badge colour — DESIGN: `.strength--strong = success` (green). CODE: `text-accent`/`bg-accent` (blue) ([`patterns/page.tsx:384,390`](src/app/app/patterns/page.tsx)). FIX: success for "strong".
- **[minor]** Evidence row label width — DESIGN: fixed `168px` grid column (`patterns.css:51`); CODE: `w-[40%]`. FIX: `w-[168px]`.
- **[minor]** Example inset padding `px-3 py-2` (12/8) vs design `.ex-inset { padding: 11px 14px }` (`patterns.css:68`).

### 8. Explore  *(reading 720; live 760)*
Faithful: input state, sample-set/analyze CTAs, result cards (kind tag, `spotted` source line, technique, voice example) verified close. Source/example box padding `px-3.5 py-[11px]` matches design `.xc-source`.
- **[major]** Width 760 → 720 (§B.1).
- **[minor]** Re-check kind-tag pill + read-steps spacing after width fix.

### 9. Voice (role-book)  *(reading 720; live 760)* — **high fidelity**
Verified faithful (`voice-*`, `voice-check-*`, `voice-translated-*`): section editor (intro/themes/characteristics/do/don't/examples), Check-voice / Re-extract, the lint panel (red **CONFLICT** = `.sev--conflict`/danger, amber **CAUTION** = `.sev--caution`/warning, accent-tinted Suggested-fix box = `.conflict-fix`), the globe `LangMenu`, and the read-only translated banner (`.tbanner`, accent 8% bg) with «…»-wrapped items all match. *(Agent's earlier "major" flags here were false positives — discarded after direct verification.)*
- **[major]** Width 760 → 720 (§B.1).
- **[minor]** Confirm section count-badge + topbar status-pill styling against `voice.css` (cosmetic only).

### 10. Style rules  *(reading 720; live 740)* — **faithful (screenshot was stale)**
Live's category-header grouping (PUNCTUATION 1/1, DICTION 2/2, …) is **correct** — `stylerules-app.jsx:38-39`: "Built-ins are now GROUPED BY CATEGORY (replaced the flat filter bar)". The `rules-ready.png` filter-chip screenshot is an older iteration; ignore it. Your-rules CRUD, kind segmented selector, punctuation demo all present.
- **[major]** Width/alignment 740 → 720 + topbar must match (§B.1).
- **[minor]** Confirm `.cat-group { border-top: 1px solid border }` dividers and `.kind-chip` (post/reply-only applies chip) styling against `stylerules.css:46-83`.

### 11. Settings  *(reading 720; live 680 + topbar 760)*
- **[major]** Topbar misaligned + width — content 680 / topbar 760 (~80px off); both → 720 (§B.1).
- **[major]** Language tile active state — DESIGN: `.lang--active { border-color: var(--color-text); box-shadow: 0 0 0 1px text }` (ink outline + ink ring) (`settings.css:50`). CODE: `border-accent/55 bg-surface-2` (blue border + fill) ([`settings/page.tsx:189`](src/app/app/settings/page.tsx)). FIX: ink border + ink ring (theme §C.0).
- **[minor]** Language flag — DESIGN: flag inside a 34×34 bordered `.lang-flag` box + name + region sub (`settings.css:51-59`). CODE: bare emoji. FIX: wrap in the bordered container; add region sub-label.

### 12. Autopilot  *(reading 720; live 760 aligned)* — faithful
Master ON card (success-tint), rule rows, reply policy, activity log all read close (`autopilot-*`, cf. `ap-live*`).
- **[major]** Width 760 → 720 (§B.1).
- **[minor]** Master-card icon — DESIGN: `IcBolt size={24}` (`autopilot-parts.jsx:45`). CODE: `IcClock` ([`autopilot/page.tsx:289`](src/app/app/autopilot/page.tsx)). FIX: IcBolt (same as nav, §B.2).
- **[minor]** Master border `success/30` vs design `success/32` — trivial.

### 13. Onboarding  *(full-screen)*
Step rail, connect/analyze/done steps, and the `?threads_connected=1` confirmation card all render (`onboarding-*`).
- **[minor]** CTA size — uses `h-12` (48px) vs design `.btn--lg` 46px (resolved by §A Button-lg).
- **[minor]** Stepper current-step dot — DESIGN: `var(--color-text)` (ink) (`onboarding.css:68`). CODE: `text-accent` ([`onboarding/page.tsx:131`](src/app/app/onboarding/page.tsx)). FIX: ink (theme §C.0).
- **[minor]** Completed step-line — DESIGN: `var(--color-success)` (`onboarding.css:74`). CODE: `bg-accent` (`onboarding/page.tsx:118`). FIX: success.

### 14. Login  *(full-screen)*
Centered card, email step, 6-cell OTP, consent all render (`login-*`).
- **[minor]** OTP cell width — DESIGN: `.otp-box` 46×56 (`login.css:101`). CODE: `h-14 w-11` = 56×**44** ([`login/page.tsx:122`](src/app/app/login/page.tsx)). FIX: `w-[46px]`.
- **[minor]** Card width `max-w-[400px]` vs design 408 (`login/page.tsx:326`).
- **[minor]** Error alert tint — DESIGN: `.alert` danger 9% bg / 28% border, text `color-mix(danger 70%, text)` (`login.css:133-138`). CODE: `bg-danger/[0.08] border-danger/30 text-danger` (`login/page.tsx:41-43`). FIX: align to the alert recipe (and/or §A ErrorBanner). Shake duration 0.35 vs 0.4 — trivial.

### 15. Landing  *(wrap 1080)* — **least faithful screen**
- **[blocker]** Hero structurally off — DESIGN: `.hero` fills the viewport (`flex:1; align-items:center; padding:40px 0 64px`), `.hero .wrap` is a **2-col grid `1.05fr / 0.95fr`, gap 64px**, with a **large** `.hero-title` (`landing.css:42-43,56`) and a specimen card tilted **-2.5deg** (`.specimen-tilt`, straightens on hover). CODE: hero is small, **top-left** (not centered/full-height), headline at a much smaller scale, specimen card **not tilted** and undersized ([`app/page.tsx`](src/app/page.tsx) / `landing-view.tsx`). FIX: rebuild hero to the 2-col centered grid in a 1080 wrap, large hero-title, tilted specimen.
- **[minor]** Hero CTA size — `h-12` vs `.btn--lg` 46 (§A).
- Feature grid (4 cards w/ bordered icon chips) + top bar are close.

### 16. Legal  *(wrap 720 / bar 980)* — mostly faithful (prose 1.72, TOC 2-col, 60px bars verified)
- **[major]** Missing block types — DESIGN: `legal-parts.jsx` Block supports `operator` (entity-info card: name + KRS/NIP/REGON mono + city) and `placeholder` (dashed italic callout); plus a top **"Template" notice** callout (`.legal-notice`). CODE: `components/legal/LegalLayout.tsx` only handles `h3/p/ul/contact`; privacy hardcodes operator info in a `<p>` ([`privacy/page.tsx:25-28`](src/app/privacy/page.tsx)). FIX: add `operator` + `placeholder` block renderers and an optional `notice` callout to `LegalLayout`/`LegalDoc`.
- **[minor]** Verify `operator` card styling (surface, border, mono regs) once the block type exists.

---

## D. Prioritised fix plan (waves)

Do top-down — earlier waves erase findings in later ones.

**Wave 1 — Design system (fixes many screens at the root)** → `components/ui/*`, `app/globals.css`
1. Add Button `lg` size (§A). 2. Rebuild ErrorBanner danger-tinted (§A). 3. Add Select chevron (§A). 4. Add `--content-reading:720` / `--content-wide:960` tokens (§B.1). 5. Skeleton shimmer, Switch dark knob, Avatar ring (§A, minor).

**Wave 2 — Shell** → `components/{AppTopbar,Sidebar,AccountSwitcher}.tsx`, `app/app/layout.tsx`
6. Default `AppTopbar maxW` to the reading token; make every page pass `maxW` = its content width (kills all topbar misalignment). 7. Nav: icons 16px, drop `capitalize`, design labels, IcBolt/IcPencil icons, count badges (data-permitting). 8. Remove `tracking-tight` on topbar/brand. 9. Account-menu order + caption + dot + logout icon. 10. Content `pb-24` + 20px gaps.

**Wave 3 — Per-screen major/blocker**
11. **Landing hero** rebuild (blocker, §15). 12. **Stats** colours — viral=success, good=accent, above-bar=accent (§5). 13. **Patterns** evidence bars 22px + open section + strong=success (§7). 14. **Widths to 720/960** on every screen + Replies/Feed/Settings alignment (§B.1 applied per screen). 15. **Settings** language active = ink ring + flag box (§11). 16. **Legal** operator/placeholder/notice block types (§16).

**Wave 4 — Minor polish**
17. Autopilot master IcBolt; Onboarding stepper ink + step-line success; Login OTP 46px + card 408 + alert tint; Replies grid gap 22 + sticky rail; per-screen gaps/paddings (§ each); remaining DS micro-drift (§A last bullet).

---

## E. Mock / harness artifacts & visual↔logic conflicts (NOT code gaps)

- **Audits diff "missing"** — the visual-test fixture (`tests/visual/screens.spec.ts` `AUDIT_DETAIL`) uses stale `diff: { before, after }`, but the live render + backend contract use `diff.old_text/new_text` (Q51, `types.ts:609`). The blank diff in `audits-detail-*.png` is a **fixture bug**, not an app bug. *Optional test-data fix:* update the fixture to `old_text/new_text` so the visual test actually exercises diff rendering. **Do not change the app to read `before/after` — that would break production.**
- **Counts/labels in screenshots** — "8 of 9 rules", "2 to resolve", account names, «…» translations, tier numbers etc. come from the mock fixtures; not fidelity issues.
- **Stale design screenshots** — `screenshots/rules-ready.png` shows a filter-chip Style-rules layout that the **final design replaced** with category groups (`stylerules-app.jsx:38`). Where a `screenshots/*.png` disagrees with the `-app.jsx`/`.css`, trust the JSX/CSS.
- **1280 viewport** — all generated shots are at width 1280; responsive breakpoints (≤900/640/560) aren't exercised here. Verify mobile separately.
- **No genuine visual↔SPEC conflict found** — the one suspected conflict (Audits diff) resolved in the backend's favour above.

---

*Gates before any fix PR (for context): `npx tsc --noEmit` · `npm run check:i18n` · `npx playwright test tests/visual/screens.spec.ts` (18/18) · `npm run build`.*
