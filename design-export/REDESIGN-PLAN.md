# Pennedly — план редизайна по фазам

Источник: `DECISIONS-LOG.md` (82 принятых решения). 
**Правила:** дизайн = эталон; деплой = `git push origin main` (оба репо авто-деплоят); SPEC обновляем в тех же коммитах, что и фичу.
**Ритм переноса экрана:** верстать по DEV HANDOFF дизайна → проверить свет/тьму → новые i18n (en+ru, потом `npm run check:i18n -- --update`) → `npx tsc --noEmit` → mock-harness `tests/visual/screens.spec.ts` (таргет+фикстуры, читать PNG) → `npm run build` → коммит → push → ✅ в `HANDOFF.md`.

---

## Фаза 0 — Фундамент эталона + позиционирование
_Быстрые общие правки. Без них перенос экранов потащит кривые значения и рассогласованный SPEC._

- [x] **Q43** — ✅ ГОТОВО. Гигиена CSS эталона одним проходом (только `design-export/`, живой `src/` не затронут): `.btn--lg` сведён к единому DS-канону 46/22/`radius-lg` (удалены 4 локальных drift — login 18px, landing 48px, onboarding/patterns md/дубль); `@keyframes dialog-in` → только transform в `ds/components.css` (убран opacity «never-visible» риск, удалены 5 override-дублей studio/login/voice/onboarding/stylerules); `@keyframes shimmer` → DS §3.7 (убрана cross-screen зависимость voice/settings↔studio); удалены мёртвые `.topbar-voice/.topbar-pill` (есть DS `.status-pill`); коллизия `.acct-*` разведена — Settings-список → `.cxn-*` (settings.css + settings-parts.jsx), sidebar в shell остался `.acct-*`. Проверено: grep-чистота + визуал Settings/Login в HTML-эталоне + `npm run build`.
- [x] **Q17 (+Q36)** — ✅ ГОТОВО. `Sidebar.tsx`: группы Workspace / Insight / Voice & automation (было Content/Growth/Voice), Autopilot → Voice & automation, Explore (`/app/patterns/explore`, `IcCompass`) видим в Insight (patterns стал `exact`, чтобы не подсвечивались оба); дубль Log out убран из Settings footer (+ осиротевшие `signOut`/`IcLogout`). `nav.group.*` переименованы в 8 локалях + `dashboard.nav.explore`. SPEC §6.1 nav-шапка. Проверено: check:i18n 8×769, tsc, harness 18/18, build.
- [x] **Q73** — ✅ ГОТОВО. Создан общий i18n-`ErrorBanner` (`ui/error-banner.tsx`, design §3.8 — title/subtitle/Retry из `error.*`, EN fallback, override пропсами) для миграции экранов; зашитые shell-строки локализованы: avatar `alt` (AccountSwitcher) + aria-labels «Settings»/«Toggle theme» (AppTopbar) → `shell.*`/`nav.settings`. «Connect another / Log out» уже были локализованы. 5 новых ключей × 8 локалей. SPEC §6.2. Проверено: check:i18n 8×774, tsc, harness, build.

> **✅ ФАЗА 0 ЗАКРЫТА** (2026-06-02) — все 5 пунктов сделаны и задеплоены. Дальше: Фаза 1 (бэкенд под экраны, репо `pennedly-backend`) или Фаза 2 (перенос 16 экранов по одному).
- [x] **Позиционирование (Q1/Q2/Q4/Q72)** — ✅ ГОТОВО. Landing: своя `metadata` + OG-карточка (`opengraph-image.tsx`), client-вьюха за server-обёрткой, `metadataBase=app.pennedly.com` (web `fa12535`). Onboarding: trust-копия смягчена с абсолютов (`never/ever`) на «by default» во всех 8 локалях (web `d61953f`). SPEC: §6.1 landing+opengraph (backend `4228a02`), §1 датированная оговорка Q72 + §13-строка + bump (backend `7b66aab`). Глобальный meta почищен ранее (cf4a8cc). **Имя «Autopilot» оставлено — тихая опция.**
- [x] **Q74** — ✅ ГОТОВО. SPEC §6.1 сверено с кодом: `/app/patterns` = детерминированный самоанализ (self-study), paste-discovery → новая строка `/app/patterns/explore`, login = 6-cell OTP + Google + magic-link (dev-login скрыт), stats «Growth group»→«Insight». §7.5: voice extraction теперь в onboarding-визарде, не laptop-CLI. + bump «Last updated».

## Фаза 1 — Бэкенд (данные и эндпоинты под экраны) · репо `pennedly-backend`
_Гейты: `uv run pytest` + `uv run ruff check`. SPEC §6/§7/§13/§14 — в тех же коммитах. Многое блокирует экраны Фазы 2._

> **✅ ФАЗА 1 БЭКЕНД ЗАКРЫТА (2026-06-02)** — все backend-задачи сделаны, протестированы и задеплоены в прод (health 200, 346 тестов). Осталось НЕ-бэкендовое: переуказать Meta callback-URL в консоли Meta (Закхар, Q52); фронтовые хвосты Q49/Q63/Q65 (делаются на экранах Фазы 2); Q28 отложен. Backend-коммиты: `1e6c10f`(Q52) `3b92705`(Q3/Q53/Q61/Q62/Q64) `9d88e56`(Q54) `c85fda9`(Q67) `389acad`(Q51/Q75) `74cc4a8`(Q56/Q58) `00c7633`(Q57); Q60 — `e701953`.

**🚨 Блокер Meta / запуска**
- [x] **Q52** — ✅ `DELETE /api/me` (каскадное удаление tenant + user + magic-link-токены, изоляция чужих тенантов, DB-тест) задеплоен. ⏳ Осталось **переуказать Meta callback-URL в консоли Meta** — это Закхар.

**Профиль голоса (блокирует Voice / Studio / Replies / Autopilot)**
- [x] **Q60** — ✅ ГОТОВО (`e701953`). Секции role-book — типизированные объекты с `id`; рендер промпта обратно-совместим (мигрированные плоские данные дают идентичный `prompt_text` — прод-генерация не сдвинулась, проверено на живой БД); lint чинит по `id`+`field`; экстрактор отдаёт объекты; render-neutral Alembic-бэкфилл. _Исходный план разведки ниже — для истории:_
  - **Цель (эталон `voice-data.jsx`):** каждый элемент секции — объект с `id`. `themes_include`/`themes_exclude` → `{id,label,note}`; `voice_characteristics` → `{id,label,text}`; `do_list`/`dont_list` → `{id,text}`; `examples` → `{id,context,text}` (context=Post/Reply; **stat (лайки) убрать — Q16**); `intro` остаётся `str`.
  - **7 точек, один коммит:** (1) `onboarding/role_book_sections.py` — типы элементов по секции + переписать `assemble_prompt`/`normalize_sections`/`merge_sections`; `id` генерить для новых, **сохранять существующие** (lint targeting); рендер промпта: exclude→`- {label}`, include→`- {label}: {note}`, traits→`- {label}: {text}`, do/dont→`- {text}`, examples→`- {text}`. (2) `onboarding/voice_extractor.py` — `VOICE_EXTRACTOR_SYSTEM_PROMPT` отдаёт объекты. (3) `role_book_lint.py` — fix-модель `text`→`id`+`field` (эталон `VOICE_CONFLICTS.fix={section,id,field,value}`); переписать `FIX_KINDS`/`validate_fix`/`apply_fix_to_sections`/system-prompt + `_format_sections_for_llm`. (4) `api/role_book.py` GET/PATCH типы. (5) `api/onboarding.py` потребление. (6) **Alembic** data-migration: строка → `{id,label:строка,note:""}` (themes), `{id,label:"",text:строка}` (traits), `{id,text:строка}` (do/dont), `{id,context:"post",text:строка}` (examples); intro как есть. (7) тесты `test_role_book_sections.py` (FULL_VOICE → объекты, сохранить data-loss инвариант) + lint-тесты + SPEC §5.3/§7.6/§13. ⚠️ Открывает Q8 (перевод по пунктам) и Q16 (Post/Reply context).

**Данные под конкретные экраны**
- [x] **Q54** — ✅ `self_studies` (UNIQUE/аккаунт, UPSERT) + `GET /patterns/study/latest` (`{computed_at, study}`); `POST /study` пишет. DB-тест.
- [x] **Q3** — ✅ `auto_replied` в SELECT `comments` + `CommentSummary` (бейдж «Auto-replied by Pennedly»).
- [x] **Q51 / Q75** — ✅ coach отдаёт `category` (Voice/Cadence/Topic/Format); `GET /audits/{id}` обогащает каждое решение `category`(fallback на kind) + `old_text/new_text/change_type/title/detail` из `proposed_change.diff` (чистый diff вместо сырого JSON). Без миграции.
- [x] **Q50 / Q59** — ✅ NO-OP: бэкенд уже имеет 3 валидируемых фильтра `{all_except_trolls, fans, questions}` на уровне аккаунта (тёплые имена — фронт) и целый час `post_hour` 0-23 (минуты отложены). Кода не нужно.
- [x] **Q53** — ✅ `MIN_POSTS_TO_ANALYZE=15` + `min_posts_to_analyze` в `OnboardingStatus`.
- [x] **Q56 / Q58 / Q64** — ✅ примеры self-study несут метрику под паттерн (question→comments, emoji→likes, length/structure→views; ранжирование по ней) · Stats today/yesterday = разбивка по постам (бар/пост с label) · `avg_reposts` в feed baseline. **Q65** = фронт (числовая дельта выводится из `vs_avg_views`, фейк-спарклайн — на экране Feed).
- [x] **Q61 / Q62** — ✅ `both` в user_rules (читают и post-, и reply-генерация) · `reply_to {who,text}` в `GET /drafts` (DB-тест). **Q63** = фронт (Undo-тост, без эндпоинта).
- [x] **Q67** — ✅ колонка `posts_analyzed` (ставит экстрактор, переносят PATCH/apply-fix/coach), в `GET /role-book` для Voice-героя. **Q49** = бэкенд уже отдаёт `key`; i18n встроенных правил — фронт.
- [x] **Q57** — ✅ разведка: Threads `/conversation` отдаёт только `@username` (нет фото/имени; `threads_profile_picture_url` только у `/me`, юзер-лукапа нет) → аватары комментаторов невозможны, везде `@username` + монограмма. Зафиксировано в SPEC §14 (закрывает Q26/Q38/Q57).
- [ ] **Q28** — (отложено) счётчик `ready_to_publish` для Studio-бейджа.
- [x] **Q48** — ✅ подтверждено: `effect_tracker` пишет `rolled_back = TRUE` + PostHog-событие (показ — фронт в Audits).

## Фаза 2 — Перенос экранов (по одному, по ритму) · репо `pennedly-web`
_На КАЖДОМ экране — общие паттерны: общий shell · аватары (Q26/Q38/Q57) · перевод в ⋯-меню (Q21/Q10) · loading/empty/error (Q22/Q23) · оптимистичность + Undo (Q24/Q25) · абсолютное локальное время (Q40) · status-pills (Q41/Q14)._

> **📋 АУДИТ 2026-06-02 (4 агента, все 16 экранов).** Ключевой вывод: **общий shell + design-system уже стоят на всех экранах** — осталась не верстка с нуля, а **поведение + подключение полей бэка** (Фаза 1 уже их отдаёт, фронт их ещё не читает). **Готово 11/16** (Explore, Landing, Legal, Audits, Patterns, Onboarding, Mentions, Autopilot, Login, Feed, Settings). Подключённые поля: `avg_reposts`(Q64✅) · `min_posts_to_analyze`(Q53✅) · `category`+`old_text/new_text`(Q51/Q75✅) · `SelfStudyExample.metric`(Q56✅) · `GET /study/latest`(Q54✅) · Patterns ×N+Topics-chip(Q42/Q55✅). Осталось подтянуть: `auto_replied`(Q3, Replies) · `posts_analyzed`(Q67, Voice) · **`RoleBookSections` flat→typed objects(Q60, Voice — полный редактор)**.
>
> **✅ Q60-регрессия закрыта (интерим):** живой `/app/role-book` снова работает — `flattenSections` коэрсит объекты бэка обратно в строки на чтении (`eb05773`). Полный типизированный редактор (ids, перевод по пунктам, контекст примеров, hero) — оставшаяся задача Voice.

| # | Экран | Статус | Осталось (по аудиту) |
|---|-------|--------|----------------------|
| 1 | **Explore** | ✅ done | — совпадает с эталоном, shell+i18n есть |
| 2 | **Studio** | 🟡 M | Q62 reply-черновики read-only (контекст @who + текст + «Open Replies») ✅ · Q14 topbar voice-pill (`voiceReady`) ✅. Осталось: Q25 ⋯-overflow · Q24 optimistic+Undo (кросс-экранный паттерн Studio/Replies/Autopilot/Style). (Q9 chips ✅) |
| 3 | **Feed** | ✅ done | Q26 шапка автора (общий `<Avatar>`+имя+@handle из выбранного аккаунта) ✅ · Q13 сорт Recent/Top + счётчик постов (клиентская) ✅ · Q37 4-полосный virality-бейдж («On par» 0.85–1.5×) + тёплый empty с «Go to Studio» ✅ · Q65 ✅ — числовое vs-avg в бейдже, фейк-спарклайн [9,10,9] НЕ переносился (реальный WoW-дельта — потом, нужен бэк). +фикс: baseline-strip `grid-cols-4` (был 3 → reposts заворачивался NaN). (Q64 `avg_reposts` ✅) |
| 4 | **Replies** | 🔴 L | **Q18 master-detail (переписать, убрать PostRail)** · Q3 `auto_replied`(+тип, бейдж) · Q10 перевод ответа · Q77 бакеты. (Q37 empty ✅) |
| 5 | **Mentions** | ✅ done | Q22 общий `ErrorBanner`+Retry (ключ `mentions.error`) ✅ · «Updated hourly» pill (clock-icon, `TopbarPill icon=`) ✅ · мёртвый `new`-акцент убран (Q15) ✅. (Q57 ✅) |
| 6 | **Stats** | 🔴 L | Q19 6 периодов (сейчас weeks 4/8/12) · Q39 chart avg-line+above/below · Q12 убрать «posts/week» chart · Q80 «Updated hourly» pill. (Q47 тиры ✅) |
| 7 | **Audits** | ✅ done | Q51 diff (old_text/new_text, без JSON-dump) ✅ · Q75 `category` badge (fallback на kind) ✅. (Q48/Q27/Q78/Q7 ✅) |
| 8 | **Patterns** | ✅ done | Q42 «×N»-множитель (`1+delta_pct/100`) + маленький «+%» ✅ · Topics-chip убран (Q55) ✅. (Q54 `/study/latest` ✅ · Q56 метрика примера ✅ · Q45/Q82 ✅) |
| 9 | **Autopilot** | ✅ done | Q6 ✅ — ⚡`IcBolt`→ спокойные часы `IcClock` (мастер-карта, бейджи активности, диалог + **nav-иконка** в Sidebar), авто-ответы → `IcBubble` (чат). Q66 ✅ — cap 10/25/50 (легаси-значение сохраняется в пикере, не блэнкует). Бэк-дефолт `replies_per_day=5` оставлен (не блокирует). (Q5/Q50/Q59/Q34 ✅) |
| 10 | **Voice/role-book** | 🔴 L | Q60 **интерим-фикс ✅** (`flattenSections` коэрсит объекты→строки — прод больше НЕ ломается). Остаётся полный типизированный редактор: Q60 (ids + правка объектов) · Q67 hero «Analyzed N posts · Updated» (`posts_analyzed`) · Q8 перевод по секциям · Q16 Post/Reply context · Q23 404→EmptyVoice |
| 11 | **Style rules** | 🟡 M | Q29 порядок (Your rules ПЕРВЫМИ) · Q30 группы по категориям (не chip-фильтр) · Q44 live-демо пунктуации · Q49 i18n встроенных по `key` · Q81 toast по виду. (Q11 ✅) |
| 12 | **Settings** | ✅ done | Q33 ✅ — две строки голоса: «Open voice»→role-book + «Restart setup»→onboarding (warning-копия «заменит»). Q38 ✅ — connected-аккаунты через общий `<Avatar>` (реальное фото + монограмма-фолбэк). Q46 ✅ — флаг-эмодзи + родное+английское имя (`LOCALES.en`) вместо 2-букв. кода. (Q36/Q68 ✅) |
| 13 | **Onboarding** | ✅ done | Q32 ✅ — Connect шлёт `return_to=/app/onboarding`; по возврату (`?threads_connected=1`) — карточка-подтверждение (общий `<Avatar>` + @handle + «Connected»-пилюля + Continue→Voice), без редиректа на /app. (Q53 ✅ · Q23 ✅) |
| 14 | **Login** | ✅ done | Q20 ✅ — consent-ссылки /terms,/privacy абсолютны на `https://app.pennedly.com` (`APP_ORIGIN`). Q79 ✅ — удалены 13 осиротевших `login.*` ключей (magic-link/tab UI) во всех 8 локалях (en 790→777), `?token=` handler + `login.link_invalid` оставлены |
| 15 | **Landing** | ✅ done | Q1/Q2/Q4 ✅; Q20 — относительные ссылки ок на одном домене (опц.) |
| 16 | **Legal** | ✅ done | Q70 (Twój StartUp, реальный GDPR/ToS) ✅ · Q71 (2 уровня удаления) ✅ |

**Порядок исполнения (по риску, не по номеру):** (1) 🚨 **Voice Q60** — чинит прод-регрессию + снимает крит-риск; (2) быстрые wiring-подключения уже готового бэка — Audits(Q51/Q75), Patterns(Q54/Q56), Feed(Q64), Onboarding(Q53), Studio(Q62) — это типы+чтение полей; (3) S-экраны — Mentions, Autopilot, Login; (4) M — Style rules, Settings, Studio(остаток), Feed(остаток); (5) L-переписи — Replies (master-detail), Stats (6 периодов). После — Фаза 3 (Meta).

## Фаза 3 — Meta App Review + финальная сборка
- [ ] **Q52 / Q71 / Q76** — Danger Zone в Settings · callback-URL в Meta-консоли (/deauthorize, /data-deletion) · Feed Delete tester-only · обрезать `THREADS_SCOPES` под round-1.
- [ ] Meta: бизнес-верификация (Twój StartUp — письмо куратору уже подготовлено) + скринкаст.
- [ ] i18n — добить все новые ключи, накопленные по ходу, во все 8 локалей; `check:i18n` зелёный.
- [ ] Финальный прогон mock-harness + `build` обоих репо.

---

_82 решения · 6 тематических блоков · 4 фазы. Детали и обоснование каждого решения — в `REDESIGN-DECISIONS.md`; принятые ответы — в `DECISIONS-LOG.md`._
