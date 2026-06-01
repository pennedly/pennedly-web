# Pennedly — design → dev HANDOFF

This is the **index a developer reads first** before porting `design-export/PennedlyDesign`
into the real app. It records the system-wide decisions (§3) and tracks the
status of every screen. Each screen also carries its own `DEV HANDOFF` comment
block at the top of its `<name>-app.jsx` — read that for screen-specific detail.

> **Ground rules (apply to everything).** Reference only the semantic tokens in
> `ds/tokens.css` — no hardcoded hex. Dark = the same tokens re-pointed via
> `.dark`; every screen must be correct in both themes. No lorem, no invented
> features; match what the backend can actually do.

---

## System decisions (§3) — the shared layer

These live in `ds/tokens.css`, `ds/components.css`, and the shell (`studio.css`).
They are **additive and backward-compatible**: a screen keeps working until it
opts in, so the rework can proceed screen-by-screen.

| # | Decision | Where it lives | How a screen adopts it |
|---|----------|----------------|------------------------|
| 3.1 | **Topbar ↔ content alignment.** The bar is full-width (border + frosted bg); its inner row is centered to the same column width as the content, so the title sits above the content's left edge and the actions above its right edge. | `ds/components.css` → `.topbar-inner`, gated by `.topbar:has(> .topbar-inner)` (collapses the outer padding automatically). | Wrap the topbar row in `<div className="topbar-inner">…</div>`. Add `topbar-inner--wide` (or `.topbar--wide`) for data screens. |
| 3.2 | **Content widths are tokens.** `--content-reading` (720px, text screens) and `--content-wide` (960px, data screens). One per screen; the topbar aligns to the same one. | `ds/tokens.css`; `.content` defaults to reading, `.content--wide` opts wider (`studio.css`). | Reading screens: nothing. Wide screens: add `.content--wide` **and** `.topbar--wide`. |
| 3.3 | **Standardized status pill.** dot + label, three tones (`--success` / `--warning` / `--accent`). Studio shows the voice-state pill ("Voice active" / "Voice not set up"). | `ds/components.css` → `.status-pill` + tone modifiers. | `<span class="status-pill status-pill--success"><i class="pill-dot"/>…</span>`. Replaces the old per-screen `.topbar-pill`. |
| 3.4 | **Real avatars.** Anywhere an account/author appears (sidebar foot, account menu, draft cards, feed, replies, mentions, settings, publish dialog), show a real profile photo with the initials monogram as fallback only. | Shared `<Avatar>` block (to be added to a shared parts module). | Use `<Avatar src={…} initials={…} size={…}/>`; mockups currently pass no `src`, so they render the monogram fallback — wire `src` to the real photo URL. |
| 3.5 | **Canonical animations.** `nib-write`, `card-in`, `dot-pulse`, `shake`, `ripple`, `ping` (plus `spin`). Reference these names everywhere. | `ds/components.css`. Legacy `nibwrite`/`dotpulse`/`shimmer` remain defined locally in older screens **only** until migrated. | Use the hyphenated canonical name. |
| 3.6 | **Button sizes** sm / md (default) / **lg**. lg is the hero/auth CTA. | `ds/components.css` → `.btn--lg`. | `class="btn btn--primary btn--lg"`. |
| 3.7 | **Localization-ready layout.** App ships 8 UI locales (en/ru/uk/de/es/fr/it/pt); DE/RU/UK run longer. Don't pin widths to English label lengths — let labels wrap/truncate. Language switcher: top-right on Login, language section in Settings. Public marketing/legal stay English (no switcher). | layout discipline + Login/Settings switchers | per screen |
| 3.8 | **Loading / empty / error for every data screen.** A skeleton/loading state, a friendly empty state (mark + title + sub), and an inline error banner on `--color-danger`. Draw all three. | per screen | per screen |
| 3.9 | **Mobile shell.** Desktop = fixed left sidebar; mobile = top bar + hamburger drawer (same nav). The per-screen sticky topbar stacks under the mobile bar; secondary sticky rows (e.g. Studio status tabs) offset below the topbar. | `studio.css` responsive layer | per screen |
| 3.10 | **Timestamps + timezone.** Show date **and** time in the viewer's local timezone (feed, replies, mentions). Autopilot post-hours picked/shown in local time with a `UTC±N` hint. | data + formatting | feed / replies / mentions / autopilot |

### Shell / sidebar (§4) — ✅ built as a shared module
One canonical shell now lives in **`shell-data.jsx`** (nav + accounts + identity),
**`shell-parts.jsx`** (`Avatar`, `Sidebar`, `AccountMenu`), and **`shell.css`**.
Every screen renders `<window.Sidebar active="<id>" />` instead of hand-rolling
its own — load `shell-data.jsx` + `shell-parts.jsx` after `studio-icons.jsx`,
and `shell.css` after `studio.css`. Adopted on Explore as the live reference;
other screens swap their local `Sidebar` for it during their §6 pass.
- **Consolidated bottom control** = the active Threads account (real avatar +
  display name + @handle + chevron) opening an **upward menu**: switch between
  connected accounts (avatar + check on active), "connect another", a quiet
  signed-in-user header (email + plan), **Settings**, **Log out** (danger tone).
  Closes on outside-click (scrim). Settings + Log out live HERE, not on the
  Settings screen.
- **Canonical grouped nav:** Workspace (Studio · My Feed · Replies* · Mentions*) ·
  Insight (Stats · Audits · Pattern study · Explore patterns) · Voice & automation
  (Voice · Style rules · Autopilot*). `* = tester-gated` (`tester:true` in
  `SHELL_NAV`) — shown in the mockup, hidden for non-testers in the real app.
- **Avatars (§3.4):** `<window.Avatar src initials size />` — real photo with the
  monogram as fallback only. Mockup uses placeholder photos in `assets/avatars/`;
  wire `src` to real profile URLs.
- **Still TODO (tracked):** §4.12 **zero-connected-accounts** → a full-screen
  connect flow (no half-empty shell) — entry path not yet drawn. §3.9 **mobile
  hamburger drawer** — desktop sidebar + the existing ≤880px icon-rail collapse
  are in place; the full slide-in drawer + mobile top bar is a pending shared pass.
- **Tester-gated nav** (Replies / Mentions / Autopilot, and feed delete) is hidden
  for non-testers. Mockups show everything; treat those as gated.

### Content realism (§5)
- Real domain **pennedly.com**; contacts `support@pennedly.com` / `hello@pennedly.com`.
- **Legal pages are a TEMPLATE only.** Keep layout; mark all legal copy as
  placeholder. Operator: **Fundacja Rozwoju Przedsiębiorczości "Twój StartUp"**
  (KRS 0000442857 · NIP 5213641211 · REGON 14643346700000, Warszawa). Include
  **`/data-deletion`** as a first-class doc (Meta deauthorize/data-deletion:
  cascade-delete + confirmation code, 30-day window).

---

## Screen index & status

Order follows the §6 rework pass. ✅ = reworked to the system + handoff note
written. ⬜ = not yet migrated (still renders; pre-rework).

| Screen | Route | Width | File set | Status |
|--------|-------|-------|----------|--------|
| Studio | `/app` | wide | `studio-*` / `Studio.html` | ⬜ |
| Feed | `/app/feed` | wide | `feed-*` / `Feed.html` | ⬜ |
| Replies | `/app/replies` | wide | `replies-*` / `Replies.html` | ⬜ |
| Mentions | `/app/mentions` | wide | `mentions-*` / `Mentions.html` | ⬜ |
| Stats | `/app/stats` | wide | `stats-*` / `Stats.html` | ⬜ |
| Audits | `/app/audits` | reading | `audits-*` / `Audits.html` | ⬜ |
| Pattern study | `/app/patterns` | reading | `patterns-*` / `Patterns.html` | ⬜ |
| **Explore patterns** | `/app/patterns/explore` | reading | `explore-*` / `Explore.html` | ✅ (+ shared shell) |
| Autopilot | `/app/autopilot` | reading | `autopilot-*` / `Autopilot.html` | ⬜ |
| Voice / role-book | `/app/role-book` | reading | `voice-*` / `Voice.html` | ⬜ |
| Style rules | `/app/style-rules` | reading | `stylerules-*` / `Style Rules.html` | ⬜ |
| Settings | `/app/settings` | reading | `settings-*` / `Settings.html` | ⬜ |
| Onboarding | `/app/onboarding` | full-screen | `onboarding-*` / `Onboarding.html` | ⬜ |
| Login | `/app/login` | full-screen | `login-*` / `Login.html` | ⬜ |
| Landing | `/` (public) | — | `landing-*` / `Landing.html` | ⬜ |
| Legal (template) | `/privacy` `/terms` `/data-deletion` | reading | `legal-*` / `Legal Template.html` | ⬜ |

---

## Icons (§7)
- **`IcSettings` redrawn** ✅ — was a busy 12-tooth gear, crooked at 16–18px;
  now one clean optically-balanced 6-tooth cog (24-grid, 1.8 stroke, round
  caps/joins, clear center hole), crisp at its real sizes (topbar 18, sidebar/nav
  16) in both themes. Same export name, so every screen picks it up.
- **Audit the rest** for 16px legibility; simplify any that turn to mush small,
  keeping the 24-grid / 1.8px / round style. ⬜

---

## Migration recipe (apply per screen)
1. Add the `DEV HANDOFF` comment block (format in §2 of the brief) at the top of
   `<name>-app.jsx`, filled in accurately.
2. **Adopt the shared shell:** load `shell-data.jsx` + `shell-parts.jsx` (after
   `studio-icons.jsx`) and `shell.css` (after `studio.css`); delete the screen's
   local `Sidebar`/account/monogram code; render `<window.Sidebar active="<id>" />`.
3. Wrap the topbar row in `.topbar-inner` (+ `--wide` for data screens); switch
   any local `.topbar-pill` to `.status-pill status-pill--<tone>`.
3. Pick the content width: reading screens leave `.content`; data screens add
   `.content--wide` + `.topbar--wide`.
4. Reference canonical animation names; delete the screen's local duplicate
   keyframes once nothing else uses them.
5. Use `<window.Avatar>` (real photo + monogram fallback) wherever an account/author shows.
6. Ensure loading / empty / error states all exist and are reachable via a tweak.
7. Flip the screen to ✅ in the table above.
