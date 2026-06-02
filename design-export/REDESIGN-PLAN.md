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

**🚨 Блокер Meta / запуска**
- [ ] **Q52** — `DELETE /api/me` (каскадное удаление tenant) + переуказать Meta callback-URL.

**Профиль голоса (блокирует Voice / Studio / Replies / Autopilot)**
- [ ] **Q60** — типизировать секции role-book (JSONB: label/note · label/text · context/stat/text) + переписать `assemble_prompt`. Делать рано.

**Данные под конкретные экраны**
- [ ] **Q54** — `self_studies` + `GET /patterns/study/latest` (Patterns).
- [ ] **Q3** — `auto_replied` в SELECT `comments` + `CommentSummary` (Replies).
- [ ] **Q51 / Q75** — diff `old_text/new_text` + display-`category` от coach (Audits).
- [ ] **Q50 / Q59** — 3 audience-фильтра (тёплые имена) + post-time целый час (Autopilot).
- [ ] **Q53** — `MIN_POSTS_TO_ANALYZE=15` + вывести в `OnboardingStatus` (Onboarding).
- [ ] **Q56 / Q58 / Q64 / Q65** — метрики примеров по виду · Stats today/yesterday по постам · `avg_reposts` · числовая дельта Feed.
- [ ] **Q61 / Q62 / Q63** — `both` в user_rules · `reply_to` в GET /drafts · (опц.) `reopen` эндпоинт.
- [ ] **Q67 / Q49** — колонка `posts_analyzed` · style-rules i18n по `key`.
- [ ] **Q57** — 🔍 разведка: отдаёт ли Threads conversation API автора (фото/имя) → решит аватары комментаторов.
- [ ] **Q28** — (отложено) счётчик `ready_to_publish` для Studio-бейджа.
- [ ] **Q48** — подтвердить, что `rolled_back` пишется (показ — на фронте в Audits).

## Фаза 2 — Перенос экранов (по одному, по ритму) · репо `pennedly-web`
_На КАЖДОМ экране — общие паттерны: общий shell · аватары (Q26/Q38/Q57) · перевод в ⋯-меню (Q21/Q10) · loading/empty/error (Q22/Q23) · оптимистичность + Undo (Q24/Q25) · абсолютное локальное время (Q40) · status-pills (Q41/Q14)._

| # | Экран | Ключевые решения |
|---|-------|------------------|
| 1 | **Explore** | re-sync с новым shell/ds (мелочь) + i18n-хвост уже добит |
| 2 | **Studio** | Q25 (⋯-overflow) · Q62 (reply-черновики) · Q14 (pill) · Q9 (chips) · Q24 |
| 3 | **Feed** | Q26 (шапка автора) · Q13 (сортировка) · Q64/Q65 (baseline) · Q37 (badge/empty) |
| 4 | **Replies** | **Q18 (master-detail!)** · Q3 (auto-replied badge) · Q10 (перевод ответа) · Q77 · Q37 |
| 5 | **Mentions** | Q15 (read-only) · Q22 (error) · Q57 |
| 6 | **Stats** | Q19 (6 периодов) · Q39 (chart) · Q31 (подпись) · Q47 (тиры) · Q80 · Q12 |
| 7 | **Audits** | Q48 (откат) · Q51 (diff) · Q27 (note) · Q75 (category) · Q78 (empty) · Q7 |
| 8 | **Patterns** | Q54 (saved) · Q55 (поэтапно) · Q42 (×) · Q45 (зелёный) · Q82 · Q56 |
| 9 | **Autopilot** | Q5 (trust-текст) · Q6 (иконка-часы) · Q50 · Q59 · Q34 (темы) · Q66 (cap) |
| 10 | **Voice/role-book** | Q60 (структура) · Q8 (перевод секций) · Q16 (Post/Reply) · Q67 (hero) · Q23 |
| 11 | **Style rules** | Q29 (порядок) · Q30 (группы) · Q11 (toggle) · Q44 (демо) · Q49 · Q81 |
| 12 | **Settings** | Q33 (две строки voice) · Q36 (без Log out) · Q38 (фото) · Q46 (флаги) · Q68 |
| 13 | **Onboarding** | Q23 (empty/locked) · Q32 (возврат connect) · Q53 (порог) |
| 14 | **Login** | Q20 (абс. ссылки) · Q79 (чистка ключей) |
| 15 | **Landing** | Q1/Q2/Q4 (позиционирование) · Q20 (ссылки) |
| 16 | **Legal** | Q70 (настоящий текст + оболочка) · Q71 (data-deletion 2 уровня) |

## Фаза 3 — Meta App Review + финальная сборка
- [ ] **Q52 / Q71 / Q76** — Danger Zone в Settings · callback-URL в Meta-консоли (/deauthorize, /data-deletion) · Feed Delete tester-only · обрезать `THREADS_SCOPES` под round-1.
- [ ] Meta: бизнес-верификация (Twój StartUp — письмо куратору уже подготовлено) + скринкаст.
- [ ] i18n — добить все новые ключи, накопленные по ходу, во все 8 локалей; `check:i18n` зелёный.
- [ ] Финальный прогон mock-harness + `build` обоих репо.

---

_82 решения · 6 тематических блоков · 4 фазы. Детали и обоснование каждого решения — в `REDESIGN-DECISIONS.md`; принятые ответы — в `DECISIONS-LOG.md`._
