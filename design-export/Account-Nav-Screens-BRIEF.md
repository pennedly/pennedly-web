# CD brief — Account-level screens + Account↔Profile navigation

Context: Pennedly's **account dashboard** (`/app/account`, Account → Brands →
Profiles) is live. Its own sidebar has nav rows **Дашборд · Советник ·
Настройки аккаунта** and a login control; but «Советник» and «Настройки
аккаунта» currently open the PROFILE-level screens (there are no account-level
ones yet), and once you drop into a profile there's no way back to the account
dashboard. This brief designs the missing account-level surfaces + the nav that
ties Account ↔ Profile together. Match the existing design system 1:1 (the same
tokens/type/spacing as the account dashboard + the app; `design-export/
PennedlyDesign/account.css` + the app's globals). Deliver desktop + mobile, ALL
states, copy for all 8 locales (en source, ru review, de length-эталон), the two
layout rules (single-line elements truncate not wrap; design so wraps never
occur), and a `<Screen>-SPEC.html` per screen like the other screens.

## Screen 1 — Account Settings (`/app/account/settings`)
Account-LEVEL settings, distinct from the per-profile Settings. It shares the
account dashboard's chrome (the account sidebar + a breadcrumb «Аккаунт ›
Настройки»). Sections (reuse the app's Settings visual language — see
`design-export/PennedlyDesign/Settings.html`):
- **Аккаунт**: display name, email (read-only), language, plan/tier (a calm
  «PRO» badge; billing is a placeholder for now — no payments yet).
- **Профили**: a compact list of all connected profiles across brands with a
  «подключить профиль» CTA (mirrors the dashboard switcher; per-profile deep
  settings stay on the profile Settings screen — link out).
- **Данные и приватность**: export my data, and the **danger zone** (delete the
  whole account + all data). These already exist in the app; this screen is
  their proper account-level home.
Empty/loading/error states. Mobile = the account dashboard's mobile chrome
(top bar + drawer), content stacked.

## Screen 2 — Portfolio Advisor chat (`/app/account/advisor`)
A full CHAT with the **portfolio advisor** — the account-scope sibling of the
existing per-profile advisor chat (`/app/advisor`). Reuse that chat's UX 1:1
(message list, the grounded «Основано на:» line, data chips, suggestion cards,
the composer) but scoped to the WHOLE portfolio: the advisor reasons across all
profiles/brands. The account dashboard's advisor HERO (verdict + recos) is the
entry point — its «Открыть чат» + composer open THIS screen. Show: the hero
verdict pinned at top, the chat thread, an empty/first-run state («спросите про
портфель…»), a thinking state, and the honest thin-data state (not enough data
yet). Mobile: the same, in the account mobile chrome.

## Nav — Account ↔ Profile (the missing links)
- **Breadcrumb**: on the account-level screens + when a profile is open,
  a breadcrumb «Аккаунт › [Бренд ›] Профиль» whose «Аккаунт» segment returns to
  the dashboard. Variable segments (1 brand hides the brand segment, matching
  the adaptive dashboard).
- **Back to the account dashboard from a profile**: a clear affordance (top-right
  «Аккаунт»/home control, or a first item in the app's profile sidebar) so a user
  in a profile screen (Studio / Replies / Stats / profile Settings / profile
  Advisor) can jump back to `/app/account` in one click. Design where it lives so
  it reads as «up a level», consistent on desktop + mobile.

Level shape language stays the dashboard's: Account = filled square, Brand =
outlined square, Profile = round.
