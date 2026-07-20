# CD brief — profile breadcrumb «Аккаунт › [Бренд ›] Профиль» in the REAL profile topbar

Context: Navigation-SPEC.html (#7) is implemented except its breadcrumb. The
"back to the account dashboard" control shipped as the first sidebar row
(Navigation-SPEC §3.2). What's missing is placement guidance for the **breadcrumb
inside the real profile app-topbar**, because the Navigation-SPEC mock uses a
simplified profile shell (`.psh-top`) that shows ONLY the crumb — while the real
profile topbar already carries more.

## The real profile topbar (what actually exists)
Every profile screen (Studio, Replies, Mentions, Stats, Audits, Voice, …) renders
a shared sticky `AppTopbar` with, left→right:
- **desktop (>880):** screen title (e.g. «Студия», «Ответы», «Статистика») ·
  optional status pill (e.g. role-book's «N of M on», «обновлено ежедневно») ·
  flexible spacer · right actions: theme toggle + Settings icon.
- **mobile (≤600):** hamburger (opens the nav drawer) · screen title · right
  actions (theme). Space is tight.

The breadcrumb «Аккаунт › [Бренд ›] Профиль» from Navigation-SPEC §2 needs to live
in this bar. The design question is HOW it coexists with the existing screen
title + pill + actions.

## Please specify (a short Navigation-SPEC addendum + a `-Topbar` frame is enough)
1. **Desktop placement.** Does the crumb (a) replace the screen title, (b) sit as
   a small line ABOVE the title, (c) sit left of the title with a separator, or
   (d) something else? If the title stays, show the crumb + title + pill + actions
   together at a realistic width (test with «Статистика» + a status pill).
2. **Mobile placement (≤600).** The bar is hamburger + title + theme — very tight.
   Where does the compact crumb go (a second line under the bar? a truncated
   inline crumb? only the marks)? Navigation-SPEC §4 shows a compact mobile crumb
   under the top bar — confirm that's the intent alongside the screen title.
3. **Marks + segments.** Keep the level-shape language (Account = filled square →
   links to /app/account, Brand = outlined square, Profile = round, current).
   Brand segment hidden at 1 brand (today's default for every user), so the common
   case is «Аккаунт › @профиль».
4. **Relationship to the back control.** The «← Аккаунт» return already lives as
   the first sidebar row (§3.2), so the topbar needs the crumb for orientation
   only, not the back-pill. Confirm that split (crumb = passive orientation in the
   topbar; back = sidebar row) or adjust.
5. States/locales as usual: light + dark, RU review + DE length, truncation rule 1
   (leading segments truncate before the current one).

Deliver: a `Navigation-Topbar-SPEC.html` (or an addendum section in Navigation-SPEC)
with the crumb rendered in the REAL AppTopbar context, desktop + mobile.
