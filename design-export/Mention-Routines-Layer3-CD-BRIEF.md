# CD brief — Mention routine constructor: Layer 3 «Только для этой рутины»

**What:** Replace the «Скоро» placeholder in the mention-routine constructor's
third layer with a real per-routine reply-override panel. The backend already
executes these overrides for `on_mention` routines (verified in the worker); this
is the missing UI. Design it in the mention constructor's own visual language
(the `mr-*` recipe-card + inline-drawer system), NOT the full scenarios editor's
look.

**Where it lives:** inside the existing collapsible layer in
`mention-routines-constructor.tsx` (the `<Layer title="mrc.layer3.title" pro>` at
the bottom, currently a dashed box with a lock badge + «Скоро»). The layer header,
the `pro` chip, and the collapse behaviour stay; only the body changes.

**Why it matters:** a routine («на все вопросы с фото отвечать») may want its own
cadence or quiet hours or daily cap, different from the account-wide «Правила
дома». Today the only options are the account defaults.

---

## The model: inherit by default, override per field

Every knob has two states, and **inherit is the default**:

- **«Как в Правилах дома»** (inherit) — the routine uses the account-wide value.
  Show the current account value inline so the user sees what they're inheriting,
  e.g. a soft chip «из Правил дома · каждый час». This is the resting state; a
  fresh routine has every field inherited.
- **«Своё значение»** (override) — the user opts this ONE field out of inheritance
  and picks a value. Clearing it returns to inherit.

Make «inherit» visually calm and «override» a deliberate, opt-in act (a small
toggle/segment per row, or a per-row «Настроить» that reveals the control). A row
in override state should read clearly as "this routine differs here" (e.g. an
accent left-edge or an «своё» tag), so the user can tell at a glance which knobs
diverge from «Правила дома».

The layer summary line (collapsed state) should reflect this: «Всё как в Правилах
дома» when nothing is overridden, or «N настроек своих» when some are.

## The four knobs (mirror the scenarios editor's Layer 3 semantics)

1. **Как часто отвечать** (`frequency`) — how often this routine's sweep runs.
   Values: сразу · каждые 30 мин · раз в час · несколько раз в день · раз в день.
   (Same set as «Правила дома» reply frequency.)

2. **Тихие часы** (`quiet_start_hour` + `quiet_end_hour`) — a per-routine quiet
   window in the account's LOCAL time. **Set as a pair** (both bounds or neither —
   one alone is invalid). Support the explicit «без тихих часов» form (start ==
   end). Inherit ⇒ the account window.

3. **Дневной лимит ответов** (`max_per_day`) — how many replies this routine may
   send per day (a number stepper, bounded; the account ceiling is the max).
   Inherit ⇒ the account daily reply ceiling.

4. **Кому отвечать** (`audience` + optional `audience_prompt`) — a secondary
   filter on top of the routine's intent. Values: болельщикам · всем, кроме
   троллей · тем, кто задаёт вопросы · свой вариант (a text description, required
   when «свой»). Inherit ⇒ the account audience. Treat this as the LOWEST-priority
   knob for mentions (the routine's intent already scopes most of the targeting);
   place it last and keep it visually secondary. Reuse the same «Кому отвечать»
   copy/preset language the main scenarios editor already uses so the two match.

## States to design

- **All inherited** (default / fresh routine) — the resting state, four calm
  inherit rows showing the account values.
- **One or more overridden** — the diverging rows visibly marked; the collapsed
  layer summary shows the count.
- **Quiet-hours pair** — mid-edit with only one bound set is invalid; show the
  pairing requirement inline (don't allow save with a half-set window).
- **Custom audience** — «свой вариант» selected reveals a required description
  field (empty is invalid).
- **Master-off context** — if the account autopilot / reply master is off, these
  overrides still save but won't fire; a soft note is enough (don't block editing).

## Consistency + reuse

- Mirror the **scenarios editor's Layer 3** (`scenarios-editor.tsx`, «Слой 3 ·
  Только для этого сценария») for the inherit-vs-override SEMANTICS and the
  «Кому отвечать» presets, but render it in the mention constructor's `mr-*`
  recipe-card / inline-drawer style (see `mention-routines.css` + the existing
  drawers in `mention-routines-constructor.tsx`).
- Values shown as "inherited" must match what «Правила дома» actually holds, so the
  user isn't surprised. If the account value is unknown at render, show a neutral
  «как в Правилах дома» without a fabricated number.
- Light + dark, web + mobile (the constructor already stacks ≤ its breakpoint).
- Localizable copy (en + ru authored, the other 6 fall back). Reuse existing
  `mrc.*` / «Правила дома» / «Кому отвечать» strings where they exist; only add new
  keys for the four knob labels + the inherit/override affordances.

## Out of scope

- No new backend fields — the four above are the complete, already-executing set.
- No account-level «Правила дома» editing from here (this panel is per-routine
  only; the account defaults live on `/app/scenarios`).

## Deliverables

A `Mention-Routine-Layer3-SPEC.html` (+ mobile) in the same export style as the
other mention-routine SPECs, showing the four knobs in all states (all-inherited,
mixed-override, custom-audience open, quiet-hours pair), plus the collapsed layer
summary in both «всё как в Правилах дома» and «N своих» forms.
