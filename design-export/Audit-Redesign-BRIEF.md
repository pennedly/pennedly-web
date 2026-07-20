# Claude Design brief — «Аудит роста» (Audit redesign)

Paste this whole brief into Claude Design. Goal: a `Audit-Redesign-SPEC.html`
(all states, web + mobile) for the redesigned Audit screens, matching the
existing Pennedly design system (tokens, components, the spec-driven workflow).

---

## 1. Context — what's changing and why

Pennedly already has a weekly **Audit** («Аудит»), but it's weak: it only ever
proposes ~3 small prompt-text tweaks (voice wording + a posting-hours change).
The founder wants it to become a **professional, extensive weekly growth
review** — one that analyzes the account from many angles and proposes **varied,
evidence-backed, one-click improvements**.

The backend is being rebuilt to feed the audit far richer data and to let it
propose changes across **7 dimensions** (not just voice text). **This brief is
the UI** for that: the redesigned **audit detail screen** (`/app/audits/[id]`)
plus a light update to the **audit list** (`/app/audits`).

Positioning: this should read like **a real growth strategist's report** — "here
is what worked and what didn't this week, with the numbers, and here are N
specific, prioritized improvements you can apply in one click." Calm,
data-forward, professional. NOT a chatbot, NOT vague advice.

## 2. The 7 dimensions (proposals are grouped by these)

Each proposal belongs to one dimension. The screen groups proposals under these,
in impact order. Give each a small icon + label:

1. **Темы** (Topics) — which topics over/under-performed → "lean into X / drop Y"
2. **Сценарии** (Scenarios/automation) — enable a dormant one, disable a weak one,
   retime, edit its topic/instruction, change its reply audience, or "it keeps
   getting skipped because of your reply limit"
3. **Тайминг** (Timing) — your peak hours vs when you actually post → shift a
   scenario/post time into the peak window
4. **Голос** (Voice) — voice tweaks: do/don't rules, the "in-a-sentence", examples
5. **Правила** (Rules) — add/edit a discrete writing rule
6. **Ответы** (Replies) — reply audience / frequency / coverage; reply-craft
   ("your replies inform but don't warm up the reader")
7. **Формат** (Format) — text vs carousel vs video vs thread performance

## 2b. Screen 0 — «Аудит выключен» / opt-in (THE DEFAULT — design this first)

**The audit is OFF by default for every account** (it runs a weekly LLM analysis,
so we don't burn tokens for users who don't want it — it's opt-in). So the FIRST
thing most users see at `/app/audits` is **not** a list — it's an **explainer +
enable screen**. Design this as a primary, polished state (it's the front door):

- A warm headline + 1–2 sentence explanation of **what the audit is** («раз в
  неделю Pennedly разбирает твой аккаунт как профессиональный стратег и
  предлагает конкретные улучшения»).
- **Why turn it on / value props** — 3–4 compact benefit points tied to the 7
  dimensions (e.g. «находит твои выигрышные темы», «подсказывает, какие сценарии
  починить», «ловит лучшее время для постинга», «учится на прошлых правках»).
  Make it concrete and confidence-building, not generic marketing.
- A clear note that **nothing changes automatically** — the audit only *proposes*,
  you approve each change in one click. (Reassurance.)
- A primary **«Включить аудит»** CTA. On enable: the screen flips to the normal
  list/empty state and the first audit is generated (or "первый разбор будет в
  понедельник / запустить сейчас" for testers).
- A subtle line that it can be turned off anytime.

Tone: inviting, honest, makes the user *want* it on. This screen sells the
feature — give it real care. (When audit IS enabled, `/app/audits` shows the list
per §5; this Screen 0 is what shows when it's off.)

## 3. Screen 1 — Audit detail (`/app/audits/[id]`) — THE redesign

Top → bottom:

### 3.1 Header
- Account avatar + name, the period (e.g. «23–30 июня»), status pill.
- A one-line **verdict** + a direction signal (growing / flat / declining), e.g.
  «Неделя ровная: охваты держатся, но разговор просел».
- A small **data-confidence** chip (high / medium / low) — the audit is honest
  when a week had too few posts to be sure.

### 3.2 «Разбор недели» (the week review)
A section ABOVE the proposals (this data exists but is currently thrown away):
- **Что зашло** (wins): 2–3 standout posts/things, each with a number
  («пост про утренние ритуалы — 4.1k просмотров, 2.4× твоего среднего»).
- **Что не зашло** (losses): same shape.
- An **honest caveat** line when data is thin («постов мало — выводы осторожные»).
Design these as compact, scannable rows with the number as a first-class,
tabular element — not prose paragraphs.

### 3.3 Предложения (proposals) — grouped by dimension — THE CORE
- Grouped under the 7 dimension headers (§2), groups + cards sorted by **impact**
  (most impactful first). Groups are **collapsible**; a header counter shows
  «12 предложений · 7 одобрено».
- Design for **MANY** proposals (7 groups, ~10–15 cards total) without
  overwhelming: collapsible groups, a clear priority order, maybe a subtle
  "high impact" marker on the top ones.
- **Each proposal CARD must handle TWO shapes** (this is the key design problem):
  - **Diff-style** (an edit): a crisp **before → after** (we already have a diff
    renderer — reuse that visual). E.g. a voice rule, a topic, a scenario
    instruction.
  - **Action-style** (do X): a labeled action with no before/after. E.g.
    «Включить сценарий „Дежурство"», «Сдвинуть „Утренний пост" на 19:00»,
    «Добавить правило: …», «Поднять лимит ответов 10 → 25».
- Every card has, regardless of shape:
  - **Title** in plain language.
  - **Evidence line** — the numbers + which posts drove it
    («3 поста по теме: медиана 4.1k vs твои 1.7k»). **No number → no card.**
  - **Expected impact** + **confidence** (small, honest).
  - **Approve / Reject** controls (per card).
  - After approval: an **effect chip** that later shows the measured outcome
    («+18% вовлечённость» / «измеряем…») — design both states.

### 3.4 «Что дали прошлые правки» (optional strip, near the top or bottom)
A small self-feedback strip: «За месяц аудит дал +N% вовлечённости · 2 правки
откатились как неудачные». The audit now learns from its own past decisions.

## 4. States to design (all needed)
- **OFF / opt-in** (§2b) — the DEFAULT for most accounts; the explainer + «Включить аудит». Design this first.
- **Loading** (skeleton).
- **Thin data** — the week had too few posts: a calm «сигнала пока мало, дай
  накопиться данным» state. NO fake suggestions.
- **Populated** — the full rich state above (design with ~12 proposals across 7
  groups so we see it under load).
- **All decided** — every proposal approved/rejected (show the effect chips).
- **Empty** — no audits yet for this account.

## 5. Screen 2 — Audit list (`/app/audits`) — light update
Keep the existing rows (status pill · period · posts analyzed · #decided/total ·
week-over-week delta). **Add**: a compact **dimension-coverage** indicator
(which of the 7 areas this audit touched — e.g. small dimension dots/chips) so a
user scanning the list sees «this week's audit covered Topics, Scenarios, Timing».

## 6. Tone, visual, system
- Professional, data-forward, calm — a strategist's report. Numbers are
  first-class and **tabular** (`tabular-nums`). Avoid chatbot/“AI assistant” vibe.
- **Reuse existing Pennedly design tokens + components** (cards, pills, the
  before→after diff renderer, the effect chip, badges). Light + dark.
- **8 locales** — all copy localizes to the user's UI language; design must
  tolerate longer strings (de/uk).
- Mobile: the grouped proposals should stack cleanly; collapsible groups matter
  more on mobile.

## 7. Deliverable
`Audit-Redesign-SPEC.html` per our spec-driven workflow — every state, web +
mobile, on the real design system, with the two card shapes (diff + action)
clearly specified so the implementation can render both from one proposal list.
