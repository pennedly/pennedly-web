# Impl notes: Post-scenario reply-audience card (Post-Reply-Audience)

Handoff for a FRESH session. Design + backend are done; this is a FE-only
integration into the scenarios editor. Fully mapped below so you don't re-derive.

## Design source (эталон)
- `design-export/Pennedly-2026-07-19/Post-Reply-Audience-SPEC.html` (narrative + all
  states + the full `postReplyAudience.*` i18n table, EN fallback + RU examples).
- `post-reply-audience.js` = the render truth (`praCard(cfg)` + `praBadge` +
  `scenarioCard`); `post-reply-audience.css` = `.pra-*` classes. Reuses `.seg` /
  `.aud-grid` / `.bigtext` (same as the mention Layer-3, already ported once).
- Brief that produced it: `pennedly-docs/REPLY-DUTY-CD-BRIEF.md` +
  `pennedly-docs/REPLY-DUTY-PLAN.md` (16 corner cases).

## What it is
For POST + «Акция» scenarios, replace the `Layer3NotApplicable` stub with a compact
"who to reply to under this scenario's posts" card. Boost scenarios KEEP the stub.
Model: **inherit «Правила дома» (mode a) vs own rules (mode b)**. Mode (b) reveals
EXACTLY two rows: the reused audience picker + a `skip_low_value` toggle. Limit /
frequency / quiet hours are account-level only (a greyed "Действует на уровне
аккаунта" block, never editable here). «Акция» adds a one-click preset chip
«Отвечать всем, кто откликнулся» (audience = all_except_trolls + skip short OFF).

## Backend contract — ALREADY DONE + TESTED (do not rebuild)
`ScenarioCreate/Update.reply_audience_override` (api/scenarios.py, `ReplyAudienceOverride`):
```jsonc
reply_audience_override: {
  audience: "fans"|"all_except_trolls"|"questions"|"custom",
  audience_prompt?: string,  // REQUIRED only when audience==="custom" (else 422)
  skip_low_value?: boolean    // optional; absent = inherit the account value
}
```
- Absent field/object = inherit (worker `_effective_audience` overlay, resolved per
  comment via `posts.scenario_id`). Mode (a) = DON'T send the key → inherit.
- Mutually exclusive with `reply_policy`/`boost` → 422 (only POST/PROMO carry it).
- Read back from `scenario.action_cfg.reply_audience_override`.
- Full worker/API design: SPEC §5.2 (the `/scenarios` row) + §13 «Layer-3 …».

## FE integration map (all sites verified)
1. **Editor swap** — `src/components/studio/scenarios-editor.tsx:1159-1175`: the
   `isReplyPolicy ? <Layer3Override…> : <Layer3NotApplicable/>` fork. Split the else:
   `isBoost ? <Layer3NotApplicable/> : <Layer title=… open=layer3Open …><PostReplyAudience …/></Layer>`.
   `isBoost`, `promoMode`, `l3Inherited`, `form`, `update`, `layer3Open` are all in
   scope in this component.
2. **New component** `src/components/studio/scenarios-post-reply-audience.tsx`
   (`PostReplyAudience({form, update, inherited, isPromo})`). Build in Tailwind
   matching `praCard` (lead → 2-mode `.seg` → inherit block OR own block[warns +
   2 rows + account-level block] + «Акция» preset chip). Reuse `ReplyAudiencePicker`
   (scenarios-recipe.tsx:1774) + `audienceInheritPhrase` (recipe:1970). Two rows:
   «Кому отвечать» (the picker, reuses `form.audience`/`audiencePrompt`) + a
   skip-short toggle.
3. **FormState** (`src/components/studio/scenarios-form.ts` ~300, defaults ~82):
   add `postReplyOwn: boolean` (mode a/b), `postSkipShort: boolean`,
   `postSkipShortOn: boolean` (overridden vs inherited). Reuse `audience` /
   `audiencePrompt` for the КОМУ row (same values as l3WhoOn).
4. **compileBody** (`scenarios-form.ts`): in the PROMO path (case 1, ~709) AND the
   free/cadence path (case 3, ~750), when NOT isBoost AND `postReplyOwn`, add
   `reply_audience_override: { audience, audience_prompt? (custom only), skip_low_value? (postSkipShortOn only) }`.
   Mode (a) / non-own ⇒ omit the key (inherit). NOTE: the editor already sends the
   full body on every save, so omitting the key on (b)→(a) clears it server-side.
5. **scenarioToForm** (wherever a Scenario → FormState is built — search
   `scenarioToForm`/the page that builds `initial`): read
   `action_cfg.reply_audience_override` → set `postReplyOwn`/`audience`/
   `audiencePrompt`/`postSkipShort`/`postSkipShortOn`.
6. **L3Inherited** (`scenarios-recipe.tsx:1948`): add `skipLowValue: boolean` +
   `replyOff: boolean`; populate in `src/app/app/scenarios/page.tsx` from the
   autopilot config (`ap.reply_skip_low_value`, `ap.reply_mode !== "off"`). Needed
   for the skip toggle's «наследуется: вкл/выкл» + the `warnAcctOff` danger warning.
   (`warnMuted` = per-post, has NO source in the scenario editor → leave false /
   don't render here; the design draws it for a possible future per-post surface.)
7. **List badge** (design §06, `praBadge`): a «Ответы: …» strip under the scenario
   card sentence in the list. Site: `scenarios-living.tsx` / `ScenariosParts.tsx`
   (the sc-card). Reads `action_cfg.reply_audience_override`. This is the one piece
   that touches the list, not the editor — can be a follow-up if time-boxed.
8. **i18n**: `postReplyAudience.*` (all keys in the SPEC's §09 table) + reuse
   `audience.*` / `scenarios.aud_phrase.*`. Author en+ru, ratchet the 6 baseline.

## Build order + gates
Component → form/compile/read-back → editor swap → L3Inherited + page wiring →
badge → i18n. Gates: `tsc` + i18n parity + Playwright + `/gallery/scenarios`
states (a; b built-in; b custom; «Акция» preset; warnAcctOff; boost stub; badge
both) web+mobile, light+dark. Then adversarial Workflow review → commit locally →
push on Zakhar's «пуш». Backend unchanged (no migration).

## Also in this drop (separate feature, promt #2)
`Applied-Changes-History-SPEC.html` (+ mobile, css, build.js) — the "what Pennedly
changed for me" history screen. Backend read endpoint done
(`GET /api/accounts/{id}/applied-changes`, `applied_changes.py`), rollback engine
NOT built (rollbackable always false → ship read-only first). Do this AFTER
Post-Reply-Audience.
