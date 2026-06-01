# Pennedly — готовые промты для Claude Design

**Studio готов и одобрен** — он задал фирменный стиль (сайдбар + верхняя панель, композер-герой, статус-табы со счётчиками и цветными точками, карточки с шапкой/телом/футером и инлайн-действиями). Ниже — **остальные 14 экранов в том же формате и стиле.**

**Как пользоваться:**

1. Делай это **в том же проекте Claude Design**, где лежат система, логотипы и готовый Studio — тогда Claude будет переиспользовать реальные компоненты, общий каркас и паттерны Studio.
2. Иди по списку. Каждый промт — законченный текст: **копируй блок целиком** (всё между ` ``` `) и вставляй. Один промт = один экран = один файл.
3. **Ничего собирать вручную не нужно** — токены, стиль и бриф уже внутри каждого промта.
4. Каждый промт **даёт Claude свободу по UX** (раскладку он придумывает сам, как продуктовый дизайнер) и **жёстко держит вид** (твоя система + паттерны Studio). Это то, что сработало на Studio.
5. Накопишь экраны — пришли мне, вкручу в код.

Порядок: 1) Лента · 2) Ответы · 3) Упоминания · 4) Статистика · 5) Аудиты · 6) Паттерны · 7) Автопилот · 8) Голос · 9) Правила стиля · 10) Настройки · 11) Онбординг · 12) Вход · 13) Лендинг · 14) Юр. страницы.

> Промты на английском намеренно — Claude Design так выдаёт заметно лучший результат. Тебе достаточно копировать.

---

## 1 — Лента (My Feed, /app/feed)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (drafts posts + replies in the user's voice; the user approves before publishing; NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX completely. You decide the layout, hierarchy, and interactions that make this genuinely useful and beautiful for a creator checking how their posts land. Think about what matters most here and design around it. Surprise me with the strongest version you can.

THE SCREEN — My Feed (/app/feed)
Goal: see how your published posts are performing, and manage them.
What the user must be able to do (these are the jobs — NOT a layout; arrange them however works best):
- Orient instantly with a reference baseline: the account's average views / likes / comments.
- Browse their published posts with real performance (views, likes, comments, reposts) and, for each, how it compares to their own baseline ("3× your average"; or "still settling" while a post is fresh).
- See a single post's views-over-time trend on demand (a small inline chart).
- Manage a post: toggle whether it receives auto-replies; open it on Threads; and (for testers) delete it via a safe confirm.
Design EVERY state: loading; empty (no posts yet); a post with its trend expanded.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, a small status pill where relevant, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered single content column, generous margins, calm density, lots of whitespace.
- Cards: surface card, soft border, generous radius; a header row (avatar + name + @handle + a "·" relative time + an optional small status/virality badge at the top-right); a body; a footer row with quiet meta on the left and an action cluster on the right — ghost/outline buttons for secondary actions and at most ONE ink-filled button for the primary action.
- Status = quiet colored dots/badges (blue/green/red), never loud fills. Primary action = ink-filled; secondary = ghost/outline. Charts = lightweight inline CSS/SVG, on-token, no chart library.

Use realistic Threads-style post text and realistic metric numbers — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 2 — Ответы (Reply queue, /app/replies)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX completely. This is a triage-and-respond surface a creator works through quickly; optimise for momentum and low friction. You decide the layout, hierarchy, and interactions. Surprise me with the strongest version you can.

THE SCREEN — Reply queue (/app/replies)
Goal: answer comments under your posts, in your voice, efficiently.
What the user must be able to do (jobs — NOT a layout):
- Triage comments by status (all / needs reply / draft / replied / skipped) with counts.
- Choose which post's comments to work through, seeing how many are still unanswered per post.
- On a comment: read it (translate it if it's in another language), see the post + context it sits under, then generate a reply in the user's voice, edit it, approve it, and publish it (threaded under the comment) — or skip / remove it.
Design EVERY state: loading; empty queue; a comment in each state (new / drafted / approved / replied / skipped).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, a small status pill where relevant, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Cards: surface card, soft border, generous radius; a header row (avatar + name + @handle + a "·" relative time + an optional small status badge at the top-right); a body; a footer row with quiet meta on the left and an action cluster on the right — ghost/outline buttons for secondary actions and at most ONE ink-filled button for the primary action. A quoted/inset block (surface-2) is the pattern for showing the comment being replied to.
- Filters/tabs: a segmented pill row with inline counts and small colored status dots (blue/green/red). Primary action = ink-filled; secondary = ghost/outline; status = quiet colored dots, never loud fills.

Use realistic comment + reply text — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 3 — Упоминания (Mentions, /app/mentions)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. This is a lighter, read-only monitoring screen; make it calm and scannable. You decide the layout and interactions.

THE SCREEN — Mentions (/app/mentions)
Goal: keep an eye on posts elsewhere on Threads that @-mention the account.
What the user must be able to do (jobs — NOT a layout):
- Browse mentions (author, the mention's text, when, and a link to open it on Threads).
- Filter by status.
This screen is read-only — there is no reply workflow here.
Design EVERY state: loading; empty (no mentions).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, a small status pill where relevant, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Cards: surface card, soft border, generous radius; a header row (avatar + name + @handle + a "·" relative time); a body; quiet meta + an "open in Threads" affordance.
- Filters: a segmented pill row with small colored status dots. Status = quiet colored dots, never loud fills.

Use realistic author handles and mention text — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 4 — Статистика (Stats, /app/stats)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. Make the numbers feel meaningful and scannable at a glance, not a wall of stats. You decide the layout and hierarchy.

THE SCREEN — Stats (/app/stats)
Goal: understand aggregate performance over time.
What the user must be able to do (jobs — NOT a layout):
- See totals + averages (posts, views, likes, comments) with a week-over-week change.
- See how their posts spread across performance tiers (the distribution).
- See weekly trends (average views per week; posts per week).
Charts are lightweight CSS bars (no chart library) — keep them clean and on-token.
Design EVERY state: loading; empty (not enough data yet).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Summary numbers in surface cards with quiet captions; week-over-week deltas shown with the status colors (green up / red down), used sparingly. Bars/charts on-token, minimal, no library. The ink-blue accent appears rarely, for emphasis only.

Use realistic numbers — never placeholders. After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 5 — Аудиты (список + детальная, /app/audits)

```
ROLE: You are a senior product designer designing two related screens of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Pennedly's weekly "coach" reviews the account and proposes changes to the user's voice/strategy that the user approves or rejects. Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of these screens FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. Approving/rejecting a coach's suggestion is a thoughtful decision; make it feel considered and trustworthy, never noisy. You decide the layout, hierarchy, and interactions.

THE SCREENS — Audits
Screen A — Audits list (/app/audits): browse past audits, newest first (each: date, number of suggestions, status); open one.
Screen B — Audit detail (/app/audits/[id]):
What the user must be able to do (jobs — NOT a layout):
- Read the audit's narrative (the coach's reasoning).
- For each proposed change (it has a kind, a title, a detail): approve or reject it.
- After deciding, see its status (approved / applied / rejected / rolled-back) and, where available, the measured effect on engagement (a %).
- Optionally view the raw diff and add a personal note.
Design EVERY state: loading; empty (no audits yet); change cards in each decision state (undecided / approved+applied with a positive effect % / rejected / rolled-back).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, a small status pill where relevant, ghost icon buttons for theme + settings). Reuse this exact shell; both screens render in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Change cards: a surface card with a soft border and generous radius; a header (a "kind" badge pill + the title + a decision status badge at the top-right); the detail; a footer with quiet meta on the left and the actions on the right — Approve = the one ink-filled button, Reject = ghost/outline. A positive effect % shown in the success color, a rollback in danger — quietly.
- Primary action = ink-filled; secondary = ghost/outline; status = quiet colored dots/badges, never loud fills.

Use realistic coaching suggestions — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 6 — Паттерны (Patterns, /app/patterns)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. A "study" is an insight moment; make the findings feel earned and evidence-backed, not a dump. You decide the layout, hierarchy, and interactions.

THE SCREEN — Pattern study (/app/patterns)
Goal: learn what actually drives performance in this account's posts.
What the user must be able to do (jobs — NOT a layout):
- Trigger a fresh study (with a clear running state).
- Read the patterns found, each backed by evidence (e.g. "posts that open with a question get 2× more comments", with example posts).
Design EVERY state: idle (before any study); running; results; empty (not enough posts to study).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Each pattern in a surface card; the headline finding prominent, the evidence (numbers + example posts) quietly supporting it; example posts shown like small quoted/inset blocks (surface-2). The run-study trigger = the one ink-filled button. Primary action = ink-filled; secondary = ghost/outline.

Use realistic pattern findings and example posts — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 7 — Автопилот (Autopilot, /app/autopilot)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators. Autopilot is an OPT-IN feature for scheduled auto-posting + auto-replies; the product stance is "you stay in control", so OFF must feel like the safe, natural default — never aggressive. Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. This screen hands over some control, so it must feel deliberate, legible, and reassuring. You decide the layout, hierarchy, and interactions.

THE SCREEN — Autopilot (/app/autopilot)
Goal: opt into scheduled auto-posting + an auto-reply policy, safely.
What the user must be able to do (jobs — NOT a layout):
- Turn the whole feature on/off with a clear master switch (off is the default).
- Define auto-post "objects": each has a name, a daily post time (in the user's local timezone), an optional ± jitter in minutes, a topic, an on/off, and whether its posts seed auto-replies — add / remove them.
- Set the account-level auto-reply policy: on/off, who it replies to (the audience), and a daily cap.
- Review what autopilot has done: per-object counters, recent auto-posts, and recent auto-replies (each showing the original comment + the bot's reply).
Design EVERY state: loading; empty (no auto-post objects yet); empty activity.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, a small status pill where relevant, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Group settings into surface cards (master switch card; auto-post objects; auto-reply policy; activity). Switches/toggles quiet and clear. Recent auto-replies shown with a quoted/inset (surface-2) comment + the reply, like the Studio cards. Activity is read-only.
- Primary action = ink-filled; secondary = ghost/outline; status = quiet colored dots, never loud fills.

Use realistic schedules, topics, and reply content — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 8 — Голос (Voice / role-book, /app/role-book)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). The "voice" is the heart of the product: it captures how the user writes, so drafts sound like them. Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. Editing your "voice" should feel like shaping something personal and valuable. You decide the layout, hierarchy, and interactions.

THE SCREEN — Voice (/app/role-book)
Goal: view and shape the account's voice.
What the user must be able to do (jobs — NOT a layout):
- Read and edit the voice in sections: intro, themes, voice traits, example posts.
- Re-extract the voice from the account's posts (a regenerate action).
- Lint the voice for conflicts and apply suggested fixes — the lint shows severity, conflict cards (e.g. two rules that contradict), and one-click "Apply" fixes.
Design EVERY state: loading; editing a section; re-extracting (in progress); lint results with a couple of conflicts + suggested fixes.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Each voice section in a surface card with clear edit affordances; example posts shown as quoted/inset (surface-2) blocks. Lint conflicts as cards with a severity dot + the conflict + an ink-filled "Apply" for the fix. Re-extract = a clear but secondary action.
- Primary action = ink-filled; secondary = ghost/outline; severity/status = quiet colored dots, never loud fills.

Use realistic voice content (themes, traits, example posts) — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 9 — Правила стиля (Style & reply rules, /app/style-rules)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. This is a list of writing rules to toggle and a place to add your own; make it feel tidy and controllable. You decide the layout and interactions.

THE SCREEN — Style & reply rules (/app/style-rules)
Goal: control the writing rules that shape every generation.
What the user must be able to do (jobs — NOT a layout):
- Toggle the built-in "anti-AI-tell" rules on/off — each has a title, a short description, and a "kind".
- Add / edit / remove their own freeform (plain-text) rules.
Design EVERY state: loading; a rule toggled off vs on; the freeform-rules section empty vs with a few rules; the add-a-rule input.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Each rule as a row/card: a quiet toggle, the title, a muted description, a small "kind" chip. The user's freeform rules in their own grouped section with an add input. Toggles quiet and clear.
- Primary action = ink-filled; secondary = ghost/outline.

Use realistic rule titles + descriptions — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 10 — Настройки (Settings, /app/settings)

```
ROLE: You are a senior product designer designing one screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. Settings should be calm, well-grouped, and easy to scan. You decide the layout and interactions.

THE SCREEN — Settings (/app/settings)
Goal: manage the account and its connected Threads accounts.
What the user must be able to do (jobs — NOT a layout):
- See their account email + current plan.
- Pick the interface language (8 languages).
- Manage connected Threads accounts: see each one, disconnect any (via a safe confirm), and connect another.
- Jump to voice setup; and (for testers) a preview-mode link.
Design EVERY state: loading; one connected account vs several; the inline confirm for "disconnect".

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — reuse the patterns from the Studio screen already in this project so this feels like the same app:
- The shared shell: left sidebar (Pennedly mark + "Drafting partner"; a WORKSPACE group of icon nav items, the current one subtly active, with right-aligned counts where they help; an account switcher pinned at the bottom) + a top bar (screen title, ghost icon buttons for theme + settings). Reuse this exact shell; this screen renders in the content area.
- A centered content column, generous margins, calm density, lots of whitespace.
- Group settings into clearly-labelled surface cards. Language picker as flag buttons. Connected accounts as rows with an avatar + handle + a quiet "disconnect" (ghost, danger on confirm). "Connect another" is a clear secondary action.
- Primary action = ink-filled; secondary = ghost/outline; destructive confirm uses the danger color, quietly.

Use realistic account handles — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 11 — Онбординг (Onboarding, /app/onboarding) — полноэкранный, без каркаса

```
ROLE: You are a senior product designer designing the first-run onboarding of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). This is a brand-new user's first impression: warm, simple, trustworthy. Tone: calm, craft-like, confident.

YOUR JOB: Design the best possible version of this flow FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. First-run is about momentum and reassurance; make each step feel effortless and inviting. You decide the layout, the step pacing, and interactions.

THE SCREEN — Onboarding (/app/onboarding) — a FULL-SCREEN wizard, NOT inside the app shell (no sidebar). Centered, focused, one step at a time.
Goal: get a brand-new user from zero to a working setup.
Steps / what the user must be able to do (jobs — NOT a layout):
1. Connect a Threads account (a friendly, single-primary-action step).
2. Choose how to build their voice: "analyze my posts" OR "build from scratch" — the from-scratch path collects a short voice description + topics to write about / topics to avoid.
3. Finish → continue into the app.
A "skip for now" option exists on genuine first-run.
Design EVERY state: each step; a progress indicator across steps; the choose step (both options); the from-scratch inputs; the done state.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — match the visual language, components, and logo of the rest of the app (the Studio screen + design system in this project), even though this flow has NO sidebar:
- Centered card(s) on the paper background; the Pennedly mark present; generous whitespace; calm.
- The same buttons, inputs, chips, and quoted/inset (surface-2) blocks as the app. The "choose" options as two clear, equal-weight choice cards. Primary action = ink-filled; secondary / "skip for now" = ghost/quiet.

Use realistic copy — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 12 — Вход (Login / sign-up, /app/login) — отдельная страница, без каркаса

```
ROLE: You are a senior product designer designing the sign-in screen of Pennedly — a *drafting partner* web app for Threads creators (NOT an autopilot). Sign-in IS sign-up: it's passwordless, so the first sign-in with email or Google creates the account. Tone: calm, craft-like, minimal.

YOUR JOB: Design the best possible version of this screen FROM SCRATCH. Do NOT replicate a wireframe — rethink the UX. A sign-in should be the calmest, most confidence-inspiring screen in the product. You decide the layout and interactions.

THE SCREEN — Sign in (/app/login) — a standalone page, NOT inside the app shell. A narrow, centered card on the paper background.
Goal: one calm, passwordless door in.
What the user must be able to do (jobs — NOT a layout):
- Continue with Google; OR enter an email and request a 6-digit code, then type the code to sign in.
- See a consent line (links to Terms + Privacy) and switch the interface language.
- A hidden/collapsed "developer mode" drawer at the very bottom (normally not noticeable).
Design EVERY state: the email form; the code-entry form (6-digit); a "signing in…" spinner (during the Google handoff); and an error (rate-limited / invalid code / Google error).

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — match the visual language, components, and logo of the rest of the app (the Studio screen + design system in this project), even though this page has NO sidebar:
- A centered card on the paper background; the Pennedly mark + a short tagline; a language switcher top-right.
- "Continue with Google" as a clear button → an "or" divider → an email input → a primary "Email me a code" button; then the code-entry form. Consent line quiet, beneath. The 6-digit input feels deliberate. Primary action = ink-filled; secondary = ghost/outline.

Use realistic copy — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 13 — Лендинг (Landing, /) — отдельная маркетинговая страница

```
ROLE: You are a senior product designer designing the public landing page of Pennedly — a *drafting partner* web app for Threads creators. Positioning is critical: a partner that does the legwork, NOT an autopilot that posts for you — the user stays in control. Tone: calm, craft-like, confident; not hypey.

YOUR JOB: Design the best possible version of this page FROM SCRATCH. Do NOT replicate a wireframe — rethink it. This is the first thing a stranger sees; it should feel calm, confident, and crafted, and land the positioning fast. You decide the layout and composition.

THE SCREEN — Landing (/) — a standalone marketing page, NOT inside the app shell.
Goal: communicate the positioning and get the visitor to sign in.
What the page must convey / let the user do (jobs — NOT a layout):
- An "in development" signal.
- The Pennedly mark + the tagline "Your drafting partner for Threads."
- One tight value-prop paragraph: drafts in your voice, you approve before publishing, multi-account, analytics — "a partner that does the legwork, not an autopilot. You stay in control."
- A contact email.
- A "Sign in" button.
- A footer (© Pennedly · Privacy Policy · Terms of Service · Data Deletion).
Design it for BOTH light and dark.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — match the visual language, components, and logo of the rest of the app (the Studio screen + design system in this project), even though this page has NO sidebar:
- Use the display type for the hero, generous whitespace, the Pennedly mark, and the same buttons. The ink-blue accent appears rarely, for emphasis. Make the hero feel calm, craft-like, and confident — not a loud SaaS landing.

After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

## 14 — Юридические страницы (Privacy / Terms / Data Deletion) — отдельные страницы

```
ROLE: You are a senior product designer designing the static legal pages of Pennedly — a *drafting partner* web app for Threads creators. Simple content pages, but they should still feel on-brand and read cleanly. Tone: calm, professional.

YOUR JOB: Design ONE reusable legal-page template (then it's reused for /privacy, /terms, /data-deletion with different content). Prioritise readability: comfortable measure, clear hierarchy, easy scanning.

THE SCREEN — Legal pages (/privacy, /terms, /data-deletion) — standalone pages, NOT inside the app shell.
Goal: readable static legal content.
What the page needs (jobs — NOT a layout):
- A clear page title; well-spaced headings + prose; a comfortable reading width and line length.
- A "back to home" link.
Build it as one template; show a realistic Privacy Policy as the sample content.

THE LOOK — FIXED (match the existing Pennedly "ink on paper" design system + the Studio screen already in this project; reuse their components, type ramp, and logo — do not invent a new visual language):
- Tokens (LIGHT / DARK, dark flips): bg #efedea/#0a0a0a · surface #ffffff/#171717 · surface-2 #f6f5f2/#201f1d · border #dcd9d2/#2b2a27 · text #171717/#ededed · text-muted #565550/#a2a19c · text-subtle #6f6e69/#898882 · primary #171717/#ededed (fg #ededed/#171717) · accent #2f4cc4/#9aacff · success #2c7350/#5fbf8d · warning #8a5b16/#d8a754 · danger #b23b30/#ef8a80.
- Type (px): display 48 / h1 32 / h2 24 / h3 19 / body 15 / small 13 / caption 12 — Geist sans. Radius 6–28px (generous, soft). Shadows: soft, low, inky. Aesthetic: near-black warm ink on warm off-white paper; calm, craft-like, confident; monochrome with one quiet ink-blue accent.
- Stack: Next.js (App Router) + React 19 + Tailwind v4; React + Tailwind on semantic tokens, no hardcoded hex; correct in light + dark; 8 languages (RU/DE ~30% longer — never break on long strings).

HOUSE STYLE — match the visual language, type ramp, and logo of the rest of the app (the Studio screen + design system in this project), even though these pages have NO sidebar:
- A centered article column with a comfortable reading measure; clear heading hierarchy off the type ramp; quiet links in the ink-blue accent; a simple back-to-home link. Calm and legible.

Use a realistic Privacy Policy as sample content — never "Lorem ipsum". After the design, briefly list the 2-3 key UX decisions you made and why.
```

---

*Заметка: если структура экрана изменится — обнови `SCREEN_MAP.md` и соответствующий промт здесь. Studio уже готов (отдельный промт ему больше не нужен).*
