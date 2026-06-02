Каждый блок ``` ``` ниже — самодостаточный промт для одного экрана. Копируй блок целиком и отправляй клод-дизайну (по одному экрану за раз, в любом порядке). Всё общее уже вшито в каждый блок.

---

### 1. Studio

```
Rework ONE screen of the Pennedly design project: Studio (studio-*.jsx / studio.css / Studio.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark (.dark re-points the tokens). Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete this screen's local sidebar/account/monogram code; render <window.Sidebar active="studio" />. This is a WIDE data screen: wrap the topbar row in <div className="topbar-inner topbar--wide"> and give the body .content--wide. Any topbar status uses .status-pill status-pill--<tone>; any account/author avatar uses <window.Avatar src initials size/> (real photo, monogram fallback); use canonical animation names (nib-write / card-in / dot-pulse / spin). Draw ALL states: loading (skeleton cards), empty, error (banner on --color-danger). No lorem, no invented features — only what the backend does. At the very top of studio-app.jsx add a filled DEV-HANDOFF comment block covering: route/shell · purpose · content width · topbar · sections top→bottom · states + what triggers each · data each block shows · interactions (optimistic? confirm? toast?) · which strings localize · backend gotchas · what changed in this rework.

This screen: a composer + a draft feed. COMPOSER: a free-text brief ("what do you want to write about? a topic, a hot take, a link"), quick-start chips, and on the right a "1–N drafts" count select + a Generate button. The count select and the Generate button MUST be the SAME height and aligned on one baseline, sitting as a tidy paired control — right now the Generate button looks vague and floats above/misaligned with the count select, which reads as awkward; make it a clean, confident primary button level with the select. FEED: status tabs (ready to publish / drafts / published / rejected, each with a count; ready-to-publish default). Topbar shows the voice-state pill ("Voice active" success / "Voice not set up" warning). Each draft CARD: account avatar + name + @handle + relative time + a status badge; the body text; then a footer — on the LEFT the char count ("95 / 500") and the status label ("✓ Ready to publish") must sit on ONE aligned baseline, same vertical centre (right now they look crooked / misaligned); on the RIGHT the actions. Keep ONLY the primary action as a visible button (Publish to Threads for ready, Approve for pending); collapse EVERY secondary action — Send back, Edit, Translate, Delete — into a single "⋯" overflow MENU per card, so cards stay clean and calm. EVERY card must offer a TRANSLATE action (globe → the 8 UI languages → inline translation) inside that menu — it's currently missing. Redraw the "Send back" icon: the current one is crooked — make it a clean single-weight glyph (a curved left/undo arrow) in the 24-grid, 1.8px-stroke, round-cap style. GOTCHA: there is NO "last generated" preview card (it duplicates the draft already in the feed); after generating, the feed switches to the "drafts" tab so the new drafts are visible. Show the "drafting… N posts in your voice" animation (nib-write).
```

---

### 2. Feed

```
Rework ONE screen of the Pennedly design project: My Feed (feed-*.jsx / feed.css / Feed.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="feed" />. WIDE data screen: topbar row in <div className="topbar-inner topbar--wide">, body .content--wide. Topbar status (if any) = .status-pill; account/author avatars = <window.Avatar src initials size/>; canonical animation names. Draw ALL states: loading / empty / error. No lorem, no invented features. At the top of feed-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data shown · interactions · localize · backend gotchas · what changed).

This screen: Threads-style cards of the user's OWN posts — inline metrics (views / likes / comments / reposts), a virality badge ("N× your average", and "still settling" while fresh), and a reference-baseline header at the top ("your weekly average · N posts"). Each card has: a per-post AUTO-REPLY toggle + indicator ("↩︎ auto-replies on" accent / "○ off"), a "growth" toggle that draws a small views-over-time sparkline, a "translate" affordance, and a tester-only delete (behind a confirm). Show each post's date AND time in the viewer's local timezone.
```

---

### 3. Replies

```
Rework ONE screen of the Pennedly design project: Replies (replies-*.jsx / replies.css / Replies.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="replies" />. WIDE data screen: topbar row in <div className="topbar-inner topbar--wide">, body .content--wide. Topbar status = .status-pill; avatars = <window.Avatar src initials size/>; canonical animations. Draw ALL states: loading / empty (per status) / error. No lorem, no invented features. At the top of replies-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a MASTER-DETAIL layout. A left post-picker lists each post that has comments (post text + publish date·time + comment count + an unanswered-count badge, newest first); selecting one shows that post's context header (text + date·time + "open in Threads") above ONLY that post's comments. Per-comment states: new / drafted (pending | approved | rejected) / replied / skipped. Status filter tabs with per-status counts (All / Needs reply / Draft / Replied / Skipped). Flow: generate a reply in the user's voice → edit → approve → publish threaded under the comment (confirm dialog). A translate affordance on BOTH the comment and the drafted reply. A "remove from queue" (✕) control per comment. Avatars on comment authors; all timestamps show date AND time, local. GOTCHA: Threads' API does NOT return per-reply likes — do not show any like counts on replies.
```

---

### 4. Mentions

```
Rework ONE screen of the Pennedly design project: Mentions (mentions-*.jsx / mentions.css / Mentions.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="mentions" />. WIDE data screen: topbar row in <div className="topbar-inner topbar--wide">, body .content--wide. Avatars = <window.Avatar src initials size/>; canonical animations. Draw ALL states: loading / empty / error. No lorem, no invented features. At the top of mentions-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a read-only list of posts elsewhere on Threads that @-mention the account, newest first. Each row: author avatar + handle, the mention text, a link to open it in Threads, and a translate affordance. Date AND time in the viewer's local timezone. Updated hourly (note this in the empty/intro copy).
```

---

### 5. Stats

```
Rework ONE screen of the Pennedly design project: Statistics (stats-*.jsx / stats.css / Stats.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="stats" />. WIDE data screen: topbar row in <div className="topbar-inner topbar--wide">, body .content--wide. Topbar status = .status-pill; canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of stats-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a period selector whose options MATCH the backend exactly — today / yesterday / 7 days / month / 3 months / all time. Below it: summary cards (posts, total/avg views·likes·comments) each with a "vs previous period" delta; a viral-tier distribution bar (viral / good / average / weak); and a trend chart (avg views per bucket) — a HAND-ROLLED chart with CSS/SVG, NO chart library — with localized date labels, a dashed period-average line, and bars colour-coded above/below that average. Don't invent ranges the backend can't compute.
```

---

### 6. Audits

```
Rework ONE screen of the Pennedly design project: Audits — both the list and the detail (audits-*.jsx / audits.css / Audits.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="audits" />. READING-width screen: wrap the topbar row in <div className="topbar-inner"> (no --wide); body stays .content. Topbar status = .status-pill; avatars = <window.Avatar/>; canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of audits-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a weekly-coach review. LIST: each row = a status pill, the period range, posts analyzed, "N of M decided", and a week-over-week delta. DETAIL: the coach's narrative reasoning, then EACH proposed change as its own card with approve / reject + an optional note; already-decided changes render read-only with applied / effect% / rejected badges; an autopilot_config change additionally shows its proposed posting hours in the viewer's LOCAL time. GOTCHA: the backend is APPEND-ONLY — a change is decided once, immediately; there is NO user rollback / reconsider, so don't draw any "undo decision" affordance.
```

---

### 7. Pattern study

```
Rework ONE screen of the Pennedly design project: Pattern study (patterns-*.jsx / patterns.css / Patterns.html) — the SELF-study (the account's OWN posts), NOT Explore (which is already done). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="patterns" />. READING-width screen: topbar row in <div className="topbar-inner"> (no --wide); body .content. Topbar status = .status-pill; canonical animations (nib-write for the running state). No lorem, no invented features. At the top of patterns-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a DETERMINISTIC study of the user's own posts + their own metrics (no LLM). States: idle → running → results, plus an empty/insufficient state ("needs at least N published posts", with progress toward that floor). Each result pattern shows evidence sides — a lead group vs a base group, each with a number, a display value, and a sample size — and a couple of example posts from the user's history. Backed entirely by the user's own numbers.
```

---

### 8. Autopilot

```
Rework ONE screen of the Pennedly design project: Autopilot (autopilot-*.jsx / autopilot.css / Autopilot.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="autopilot" />. READING-width screen: topbar row in <div className="topbar-inner"> (no --wide); body .content. Topbar status = .status-pill; avatars = <window.Avatar/>; canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of autopilot-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a global master switch (OFF by default; a confirm dialog when turning it ON) + a list of AUTOPOST OBJECTS you add/edit/delete — each with a name, a topic, a post-hour, an optional ± jitter (random minute spread, 0 = exact), on/off, and a per-object "new posts from this object start with auto-reply ON" seed. A SEPARATE account-level Auto-reply policy card (master on/off + audience + replies-per-day) — THIS is what the worker actually honors (the old per-object audience/cap controls were vestigial no-ops; do not include them). A read-only Activity section: per-object counters, the recent posts autopilot published, and the recent auto-replies it sent (the comment + the bot's reply text + a link). Post hours are shown and picked in the viewer's LOCAL timezone (with a UTC±N hint).
```

---

### 9. Voice / role-book

```
Rework ONE screen of the Pennedly design project: Voice (voice-*.jsx / voice.css / Voice.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="voice" />. READING-width screen: topbar row in <div className="topbar-inner"> (no --wide); body .content. Topbar status = .status-pill; canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of voice-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: SEVEN editable section cards — intro; themes include; themes exclude (a red "won't write about this" zone); voice characteristics; do; don't; examples. A translated read-only view (each item translated into the current UI locale) that flips to the editable original. A voice-check (lint) that lists conflicts between rules/examples, each with a one-click fix. A re-extract panel (re-derive the voice from recent posts). And a "what the AI actually sees" assembled-prompt preview with a translate button. GOTCHA: there is NO "voice match %" anywhere — do not invent or show one.
```

---

### 10. Style rules

```
Rework ONE screen of the Pennedly design project: Style rules (stylerules-*.jsx / stylerules.css / Style Rules.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="style" />. READING-width screen: topbar row in <div className="topbar-inner"> (no --wide); body .content. Canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of stylerules-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: TWO sections. (1) The account's own freeform USER RULES — full CRUD: add (body + kind post/reply), edit body, toggle enabled, delete (inline confirm). (2) The built-in ANTI-AI-TELL rules — a fixed catalog grouped by category, one switch per rule, with a post/reply-only kind chip where relevant; the "human punctuation" rule carries a note that its toggle also drives a deterministic typographic stripper (em-dashes/guillemets → plain).
```

---

### 11. Settings

```
Rework ONE screen of the Pennedly design project: Settings (settings-*.jsx / settings.css / Settings.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. Adopt the shared shell: load shell-data.jsx + shell-parts.jsx (after studio-icons.jsx) and shell.css (after studio.css); delete local sidebar code; render <window.Sidebar active="settings" />. READING-width screen: topbar row in <div className="topbar-inner"> (no --wide); body .content. Avatars = <window.Avatar/>; canonical animations. Draw ALL states: loading / empty. No lorem, no invented features. At the top of settings-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · width · topbar · sections · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: an account card (avatar + email + plan); a LANGUAGE picker (the 8 UI locales, flag buttons); the connected Threads accounts, each with a disconnect action (inline two-step confirm) plus "connect another"; and a Voice-setup section linking to onboarding (testers also see a preview-mode link). NOTE: Log out lives in the sidebar account menu (§4), NOT on this screen.
```

---

### 12. Onboarding

```
Rework ONE screen of the Pennedly design project: Onboarding (onboarding-*.jsx / onboarding.css / Onboarding.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. This screen is FULL-SCREEN and opts OUT of the sidebar shell (like Login) — do NOT render <Sidebar>; it has its own focused full-screen layout (a stepper). Use .status-pill where relevant; avatars = <window.Avatar/>; canonical animations (nib-write for the analyzing state). Draw ALL states. No lorem, no invented features. At the top of onboarding-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · stepper steps · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: the first-run flow — connect an account (if none) → CHOOSE between "analyze my posts" (offered when there are enough posts) and "build from scratch" (a voice description + topics to write / topics to avoid) → an analyze progress state → done. Plus: a "skip for now" link on a genuine first-run; a "← Back to Settings" link when NOT a forced first-run (already set up); and a tester PREVIEW mode (?preview=1) that runs for real but saves nothing and renders the would-be voice on screen.
```

---

### 13. Login

```
Rework ONE screen of the Pennedly design project: Login (login-*.jsx / login.css / Login.html). Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. This screen is FULL-SCREEN and opts OUT of the sidebar shell — do NOT render <Sidebar>. Canonical animations (shake on a wrong code). Draw the states below. No lorem, no invented features. At the top of login-app.jsx add a filled DEV-HANDOFF comment (route/shell · purpose · states+triggers · data · interactions · localize · backend gotchas · what changed).

This screen: a centered card on a soft radial background; a language switcher top-right; flow = Continue with Google → "or" → email field → a 6-cell OTP code input (shake on error) → a brief "signing in" state; a consent line linking Terms + Privacy. States: email · code · signing-in · error. Keep the MONOCHROME Google "G" tile — it's a deliberate trademark-safe choice, not a missing logo. The real dev path is a simple EMAIL-ONLY dev-login gated by an env flag — model that, or mark the "Developer mode" drawer clearly as a mock (its environment / mock-auth / API-base-URL fields are fictional).
```

---

### 14. Landing

```
Rework ONE screen of the Pennedly design project: Landing (landing-*.jsx / landing.css / Landing.html) — the public marketing page at /. Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. This is a PUBLIC page — NO app shell, NO sidebar, NO language switcher; copy is the English baseline. Canonical animations. No lorem. At the top of landing-app.jsx add a filled DEV-HANDOFF comment (route · purpose · sections · interactions · what changed).

This screen: a calm marketing page — a top bar (brand · theme toggle · Sign in), a hero with a tilted "draft specimen" card beside the value copy, a four-up feature row, and a legal footer (Privacy / Terms / Data Deletion). The contact email is on the real domain (pennedly.com). Public/pre-auth.
```

---

### 15. Legal (template)

```
Rework ONE screen of the Pennedly design project: the Legal template (legal-*.jsx / legal.css / Legal Template.html) used for /privacy, /terms, /data-deletion. Reference ONLY the ds/tokens.css semantic tokens — no hardcoded hex; correct in BOTH light and dark. PUBLIC page — no app shell, no sidebar. Canonical animations. No lorem. At the top of legal-app.jsx add a filled DEV-HANDOFF comment (routes · purpose · sections · what changed).

This screen: ONE reusable template — a sticky top bar (brand + theme toggle), a 720px readable article column with a "back to home" link, an eyebrow/title/intro, an auto-generated table of contents, typed prose blocks (paragraph / sub-heading / bullet list / a quiet contact block), and a footer cross-linking the three docs + home. IMPORTANT: the legal COPY is a TEMPLATE/PLACEHOLDER only — do NOT write authoritative legal text. The real operator is "Fundacja Rozwoju Przedsiębiorczości Twój StartUp" (KRS 0000442857 · NIP 5213641211 · REGON 14643346700000, Warszawa); the developer fills the real Privacy / Terms / Data-Deletion content. Include /data-deletion as a first-class doc in the footer switcher — it mirrors the Meta deauthorize/data-deletion callback (cascade-delete + a confirmation code, completes within 30 days).
```
