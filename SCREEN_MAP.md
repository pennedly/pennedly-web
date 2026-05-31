# Pennedly — Screen Map (for the redesign)

Inventory of every screen, for feeding one-screen-at-a-time prompts to a design
tool. Structure is **stable** — Phases 4–6 are backend/code, they don't add or
restructure screens. The redesign is a *visual* restyle of these same screens.
(Phase 5 will later add **one** new screen — billing/upgrade — design it then.)

## Global rules for every screen (give these to the design tool each time)

- **Two themes, always.** Light + dark. Today driven by a Tailwind-v4 `@theme`
  token layer in `globals.css`: `bg-bg`, `bg-surface`, `bg-surface-2`,
  `text-text`, `text-text-muted`, `border-border`, `bg-primary` /
  `text-primary-foreground`. The redesign should keep using **semantic tokens**,
  not hardcoded colors, so dark mode keeps working.
- **8 languages.** All copy comes from the i18n catalog (`lib/i18n`), so text
  length varies (RU/DE run ~30% longer than EN). Layouts must not break on long
  strings.
- **Current aesthetic** (the thing being replaced): warm-paper + ink, minimal,
  zinc-ish. The redesign ("cold design") replaces the *look*, not the structure.
- **Authenticated screens share a shell** (left sidebar + top bar) — see "App
  shell" below; design it once, then each screen is the content area.

---

## Public (pre-login)

### `/` — Landing
- **Purpose:** marketing page; positioning = *drafting partner for Threads, not
  automation*.
- **Layout:** centered single column. "In development" badge → big "Pennedly"
  wordmark → tagline "Your drafting partner for Threads." → one paragraph of
  value prop (drafts in your voice, you approve before publishing, multi-account,
  analytics; "you stay in control") → contact email → "Sign in" button.
- **Footer:** © Pennedly · Privacy Policy · Terms of Service · Data Deletion.

### `/app/login` — Sign in (also where sign-up happens — passwordless)
- **Purpose:** the single door in. Sign-in = sign-up (first email/Google creates
  the account).
- **Layout:** narrow centered card. Brand + tagline + language switcher (top
  right). Then: **"Continue with Google"** button → "or" divider → email input →
  "Email me a code" button. After requesting: a **code-entry** form (6-digit
  input + "Sign in"). **Consent line** under the options ("By continuing you
  agree to the Terms and Privacy Policy"). A collapsed "developer mode" drawer at
  the bottom (dev-login, hidden).
- **States:** email form · code-entry form · "signing in…" spinner (during
  Google handoff / link consume) · error (rate-limited / invalid code / Google
  error).

### `/privacy`, `/terms`, `/data-deletion` — Legal
- **Purpose:** static legal pages. Centered article, headings + prose, back-to-
  home link. Low design priority but should match the brand.

---

## App shell (wraps every `/app/*` screen) — `app/app/layout.tsx` + `Sidebar`
- **Left sidebar:** brand; nav grouped into **Content** (Studio, Feed, Replies,
  Mentions) and **Growth** (Stats, Audits, Patterns, Autopilot) + **Voice**
  (Voice/role-book, Style rules); a bottom **account/profile** area with the
  **account switcher** (multi-account dropdown + "connect another") and a profile
  menu (Settings, Language, theme toggle, Log out).
- **Zero-account gate:** with no connected Threads account the shell renders bare
  and redirects to onboarding's connect step (no usable sidebar).
- **Account switcher** (`AccountSwitcher`): current account avatar/handle →
  dropdown of accounts + "connect another account".

---

## Content screens

### `/app` — Dashboard ("Studio")
- **Purpose:** generate drafts + review the draft queue.
- **Layout:** generate panel (topic/prompt input → "generate" → spinner) on top;
  below, the **draft feed split into status tabs**: **Ready to publish**
  (default) · Drafts · Published · Rejected (each with a count).
- **Draft card:** text, relative time, status; per state — editable textarea +
  Approve / Reject / Tweak (tweak controls collapsed behind a toggle); approved →
  Publish button (→ confirm modal → routes to Feed); published → "✓ published ·
  open in Threads" link.
- **States:** loading · empty per tab · "set up your voice first" prompt (if the
  account has no voice yet and onboarding was skipped) · publish confirm modal.

### `/app/feed` — My Feed (main analytics + management tab)
- **Purpose:** the account's own published posts with performance.
- **Layout:** a **reference-baseline header** (avg views/likes/comments) then a
  list of **Threads-style post cards**.
- **Post card:** text, published date+time, metric counts (views / ♥ likes /
  💬 comments / reposts), a **virality badge** ("N× your average", "🕐 still
  settling" while fresh), a **per-post auto-reply toggle** (`↩︎ auto-replies on/
  off`), an **"open in Threads"** link, a **"growth"** toggle that expands an SVG
  sparkline of views-over-time, and (for testers) a **delete** action (confirm
  modal).
- **States:** loading · empty (no posts yet) · growth-expanded.

### `/app/replies` — Reply queue (master-detail)
- **Purpose:** answer comments under your posts in your voice.
- **Layout:** filter tabs (All / Needs reply / Draft / Replied / Skipped, with
  counts). Below, a **two-column master-detail**: **left** = a post picker (each
  post that has comments: text, date+time, comment count, an unanswered-count
  badge); **right** = the selected post's context header (text + time + open-in-
  Threads) followed by that post's **comment cards**.
- **Comment card:** author + date+time, the comment text (+ translate), then the
  reply workflow — generate → editable draft → approve → publish; states for
  new / drafted / approved / replied / skipped; a "remove from queue" ✕.

### `/app/mentions` — Mentions
- **Purpose:** posts elsewhere that @-mention the account (read-only list).
- **Layout:** list of mention cards (author, text, link to Threads, time),
  status filter. (Lighter screen — confirm exact controls in
  `app/app/mentions/page.tsx` when designing.)

---

## Growth screens

### `/app/stats` — Stats dashboard
- **Purpose:** aggregate performance over time.
- **Layout:** summary cards (posts, total/avg views·likes·comments + week-over-
  week), a viral-tier distribution bar, weekly trend bar charts (avg views,
  posts/week). Charts are hand-rolled CSS bars (no chart lib).

### `/app/audits` + `/app/audits/[id]` — Coach audits
- **List:** weekly audits (date, # suggestions, status), newest first.
- **Detail:** the audit narrative + a list of **proposed-change cards**
  (`ChangeCard`: kind badge, title, detail, Approve / Reject); per decision a
  status line (approved/applied/rejected/rolled-back + measured effect %). "View
  raw diff", "your note".

### `/app/patterns` — Pattern study
- **Purpose:** analyze what patterns drive performance in the account's posts.
- **Layout:** a study trigger + results (patterns found, with evidence). (Confirm
  exact layout in `app/app/patterns/page.tsx` when designing.)

### `/app/autopilot` — Autopilot
- **Purpose:** opt-in auto-posting + auto-reply policy.
- **Layout:** **master switch** card; **autopost objects** list (each: name,
  post hour [local tz], ± jitter, topic, on/off, an auto-reply seed toggle; add/
  delete); an **account-level "Auto-reply" policy** card (on/off + audience +
  daily cap); a read-only **Activity** section (per-object counters + recent
  auto-posts + **recent auto-replies** with the comment + the bot's reply).
- **States:** loading · empty (no objects) · activity empty.

---

## Voice screens

### `/app/role-book` — Voice
- **Purpose:** view/edit the account's "voice" (the role-book): intro, themes,
  voice traits, examples; re-extract; lint for conflicts (`LintResults`: severity
  dots, conflict cards, suggested fixes with an Apply button).

### `/app/style-rules` — Style & reply rules
- **Purpose:** toggle the built-in anti-AI-tell rules (one switch per rule, each
  with title + description + kind chip) and edit the user's own freeform rules.

---

## Settings & onboarding

### `/app/settings` — Settings
- **Purpose:** account email + plan, **Language** picker (flag buttons), the
  connected Threads accounts (each with a **disconnect** control + "connect
  another"), a Voice-setup link, (tester) preview-mode link. Log out is in the
  sidebar profile menu.

### `/app/onboarding` — First-run wizard
- **Purpose:** opt-out-of-shell full-screen wizard. Steps: **connect** a Threads
  account (the dedicated zero-account screen) → **choose** "analyze my posts" vs
  "build from scratch" (voice description + topics to write / avoid) → done →
  `/app`. Has a "skip for now" link on genuine first-run.

### `/app/posts` — (likely legacy)
- Superseded by **My Feed** (which folded in post management/delete). Confirm
  whether it still routes or should be removed before designing — probably skip
  it in the redesign.

---

## Shared components to design once (reused across screens)
- `Sidebar` / app shell · `AccountSwitcher` · `ConnectThreadsButton` ·
  `LanguageSwitcher` (flag buttons) · `PublishConfirmModal` (text preview + char
  count vs 500 + two-click confirm) · `TranslateButton` · `TagInput` (topic
  chips) · `LintResults` (conflict cards) · toast notifications (bottom-right) ·
  loading spinners · empty-state cards (dashed border) · error banners.

---

*Maintainer note: when a screen's structure changes, update its entry here so
the redesign prompts stay accurate.*
