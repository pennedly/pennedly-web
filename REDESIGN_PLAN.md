# Pennedly — Redesign Plan (Phase 7) · живой трекер

> **Назначение.** Это рабочий файл-чеклист редизайна. По нему сверяемся и
> отмечаем сделанное, чтобы ничего не потерять. Обновляем **по ходу**: меняем
> статус у пунктов, дописываем заметки и решения. Источник правды по приоритетам —
> этот файл; источник правды по проекту в целом — `../pennedly-backend/SPEC.md`.
>
> **Как пользоваться:** закончил кусок → поставь `[x]`, впиши дату и коммит в
> колонку «заметки». Нашёл новую деталь по экрану → допиши в его блок. Возникло
> решение → в «Журнал решений».

## Суть редизайна (одной фразой)

Визуальный рестайл всего веб-приложения под дизайн из `design-export/PennedlyDesign`
(эталон «ink on paper»). **Палитра НЕ меняется** (токены уже в `globals.css`,
идентичны эталону) — меняется **проработка компонентов и раскладок** до уровня
одобренного Studio. Логику, API, роуты, i18n-систему не трогаем — это
presentation-слой.

## Источники правды (читать перед куском)

1. `design-export/PennedlyDesign/` — эталон вида. Для экрана X смотри `X-app.jsx`
   (экран), `X-parts.jsx` (части), `X.css` (точные отступы/радиусы/анимации),
   `X.html` (рендер), `screenshots/` (как должно выглядеть).
2. `design-export/PennedlyDesign/Pennedly Design System.html` — **рецепты
   компонентов** (точные Tailwind-строки) + правила.
3. `SCREEN_MAP.md` — структура/данные/состояния каждого экрана.
4. `DESIGN_PROMPTS.md` — замысел каждого экрана.
5. `REDESIGN_BRIEF.md` — жёсткие правила фазы.

## Легенда статусов

`[ ]` не начато · `[~]` в работе · `[x]` готово · `[!]` блок/вопрос

## Общий прогресс

- **Фаза 0 — Фундамент:** `[~]` (0a+0b готовы; 0c сайдбар готов и **проверен визуально light+dark**; Topbar → Фаза 1; build+smoke зелёные)
- **Mock-auth harness:** `[x]` готов — `tests/visual/screens.spec.ts` (route-mock + light/dark снимки)
- **Фаза 1 — Studio:** `[x]` основное на проде (топбар, тема, композер, табы, карточки, тосты, диалог публикации); опц. скелетоны/first-run позже
- **Фаза 2 — Контент:** `[x]` Лента ✅ + Упоминания ✅ + Ответы ✅ — всё на проде
- **Содержимое-колонка расширена до 900px** (Захар: 712 узко на широких мониторах) — применять везде
- **Studio-композер** = свободный текст + чипы (бэкенд `prompt` добавлен, 303 теста ✅); карточки 1:1 с дизайном
- **Фаза 3 — Рост (stats/audits/patterns/autopilot):** `[x]` Stats ✅ + Audits ✅ + Patterns ✅ + Autopilot ✅ — вся фаза на проде
- **Фаза 4 — Голос (voice/style-rules):** `[x]` Voice ✅ + Style rules ✅ — вся фаза на проде
- **Фаза 5 — Аккаунт+публичное (settings/onboarding/login/landing/legal):** `[x]` ✅ ЗАВЕРШЕНА — Settings · Onboarding · Login · Landing · Legal (+новый `/data-deletion`) на проде
- **Фаза 6 — Закрытие (скриншот-тесты, обе темы, SPEC):** `[ ]`

---

## Жёсткие правила (не нарушать)

- **Только семантические токены**, не хардкод цветов. Новый цвет → токен в
  `globals.css`, иначе ломается тёмная тема.
- **Две темы всегда** — проверять светлую и тёмную на каждом экране.
- **8 языков** — весь текст из `src/lib/i18n`. Новый текст → ключ в `en` + `ru`,
  остальные 6 в shrink-only baseline (`npm run check:i18n -- --update`). RU/DE на
  ~30% длиннее EN — раскладка не должна ломаться.
- **Структуру экранов не менять** — те же роуты, данные, состояния. Меняется вид.
- **API-контракты не трогать** — хуки/клиенты (`src/lib/api.ts`) как есть.
- **Каркас один раз** — все `/app/*` в общем shell (`src/app/app/layout.tsx` +
  `Sidebar`); экран = только контентная область.

## Гардрейлы (не сломать)

- CI-паритет i18n: `scripts/check-i18n-parity.mjs` + workflow.
- Smoke-тесты: `tests/pages-smoke.spec.ts` (Playwright) — каждый экран рендерится.
- Сборка: `npm run build` зелёная. Тесты: `npm run test:e2e`.

## Ритуал «готовности» на каждый кусок (Definition of Done)

1. Рестайл по эталону (`X-app.jsx`/`X.css`/скриншот).
2. Светлая **и** тёмная тема — обе ок.
3. Новые строки — в i18n (`en`+`ru`), остальные в baseline.
4. Длинные строки (RU/DE) не ломают раскладку.
5. Smoke-тест экрана зелёный.
6. `npm run build` зелёный.
7. Коммит.

---

## Ключевые находки (учесть при вёрстке)

- **Палитра уже на месте.** `src/app/globals.css` == эталонный `globals.css`
  (та же «ink on paper», тёмная тема переворачивает токены). Перекрашивать нечего.
- **Активный пункт навигации СМЯГЧИТЬ.** В дизайне active = `bg-surface-2 text-text
  font-semibold` (мягкий). В текущем коде — залит чернилами (`bg-primary
  text-primary-foreground`). Поправить на дизайн-вариант.
- **Иконография.** Линейные иконки, штрих ~1.8px, круглые концы/соединения, сетка
  24px, один вес; без заливок/дуотона. Берём иконки из `*-icons.jsx` дизайна.
- **Зачистить хардкод цветов** (остатки старого стиля): `grep` по `#`-hex,
  `bg-green-*`, `bg-red-*`, `border-red-*`, `text-white`, `focus:ring-zinc-*`,
  `shadow-[` → заменить на токены (`success`/`danger`/`accent`/`surface`).
- **Размеры каркаса:** sidebar 248px (→72px при ≤880px), topbar 60px (sticky,
  backdrop-blur). Контент-колонка по экранам: **712** (feed/replies/mentions/
  audits) · **760** (voice/style-rules) · **680** (settings) · **1060** (stats,
  replies-split). Брейкпоинты 880 / 560. Density-тоггл (`data-density`).
- **Артефакты дизайн-инструмента — НЕ переносить:** `tweaks-panel.jsx`,
  `*-data.jsx` (мок-данные), `window.*`-обёртки. Иконки переносим (как чистые SVG).
- **Юр-страницы:** `data-deletion` **нужна** (Meta App Review + ссылки из футера
  лендинга и Политики). Дизайн **уже есть** — `legal-data.jsx` → `DATA_DELETION`
  (шаблон легала рассчитан на 3 дока). В коде сейчас только `privacy`+`terms` →
  добавить роут `/data-deletion` в Фазе 5e. Бэкенд-колбэки готовы (SPEC §7.2b);
  отдельный user-action — перенаправить callback-URL в Meta-консоли на бэкенд.

## Журнал решений

- **2026-06-01** — Иконки: переносим из дизайна (`*-icons.jsx`), без новой
  зависимости. (Подтверждено Захаром.)
- **2026-06-01** — Повторяющиеся элементы: делаем **слой компонентов**
  (`Button/Card/Badge/Switch/Dialog/Toast/...`) и переиспользуем на всех экранах.
  (Подтверждено Захаром.)
- **2026-06-01** — Палитра не меняется; редизайн = компоненты+раскладки.
- **2026-06-01** — `data-deletion` нужна и **уже нарисована** в дизайне
  (`legal-data.jsx` → `DATA_DELETION`). Новый дизайн не требуется — реализуем роут
  `/data-deletion` в Фазе 5e из готового легал-шаблона.

---

# ФАЗА 0 — Фундамент

Порядок внедрения по дизайн-системе: примитивы → поверхности → оверлеи → зачистка.
Складываем в `src/components/ui/` (новый слой), иконки в `src/components/icons/`.

### 0a. Примитивы — `[x]` готовы (в `src/components/ui/`, `tsc` зелёный)
- [x] `Button` (+`buttonClasses`) — primary/secondary/ghost/danger; md/sm; loading
- [x] `Field` — `Input`/`Textarea`/`Select`/`FieldLabel`/`FieldHint` (focus+error)
- [x] `Card` / `Panel`
- [x] `Badge` (good/neutral/bad/accent) + `StatusDot`
- [x] `Tag` (удаляемый чип)
- [x] `Switch` (headless checkbox-peer)
- [x] `TextLink` (+`linkClasses`)
- [x] `Table` / `Th` / `Td` / `Tr`
- [x] `Spinner`, `Skeleton` / `SkeletonText`, `EmptyState`
- [x] `Dialog` (+`DialogTitle`/`Description`/`Actions`)
- [x] `Toast` + `ToastHost` (низ-центр) + «отменить»
- [x] `Mono` — монограмма-аватар
- _Барель: `src/components/ui/index.ts`. Shimmer пока через `animate-pulse` —
  апгрейд до градиента при полировке._

### 0b. Иконки — `[x]` готовы (`src/components/icons.tsx`)
- [x] Линейный набор (~40 иконок) из `studio-icons.jsx` — `<IcX size>` на `currentColor`
- [x] `BrandMark` — марка-перо на CSS-переменных (сама переворачивается по теме)
- _Доп. иконки login/settings добавлю по мере экранов._

### 0c. Каркас (shell) — `[~]` сайдбар готов, Topbar → Фаза 1
- [x] `Sidebar`: перо (`BrandMark`) + «Drafting partner»; иконки-навигация;
      **мягкий** активный пункт (`bg-surface-2`); группы; tester-гейтинг сохранён
- [x] `AccountSwitcher` (Mono + имя/хэндл + шеврон), `LanguageSwitcher` (бордерная
      пилюля), `ConnectThreadsButton` (на `Button`)
- [x] `layout.tsx` — ширина 248px (`md:w-62`/`md:pl-62`), лоадер на `Spinner`
- [x] Mobile-драуэр в новом стиле
- [ ] **Topbar** (заголовок + статус-пилюля + тема/настройки) — делаю в Фазе 1
      (Studio), где он впервые рендерится; тема-тоггл переедет туда
- [ ] Счётчики на пунктах навигации (нужны данные) — добавлю позже
- _Лейблы навигации пока через `capitalize`; точную копию («My Feed»/«Rules») —
  отдельным копи-проходом._
- [x] **Проверено визуально** (light+dark) через mock-harness: марка, иконки,
  мягкий active, account switcher — ок в обеих темах

### 0d. Зачистка — идёт по ходу + финальный свип
- [x] Зачищены shell-файлы: `zinc`/`▾`/`✓`/`bg-black` → токены/иконки
- [ ] Остальные stragglers чистим при рестайле каждого экрана; финальный `grep`-свип
      в Фазе 6 (как советует rollout-план дизайн-системы)
- [x] Build зелёный; login + `LanguageSwitcher` проверены в браузере

---

# ФАЗА 1 — Studio (эталонный экран)

**Роут:** `/app` → `src/app/app/page.tsx` · **Эталон:** `studio-app.jsx`,
`studio-parts.jsx`, `studio.css`, `Studio.html` · **Ширина:** 712

- [x] **Верхняя панель** `AppTopbar` (заголовок + тумблер темы + настройки)
- [x] Композер-hero (Mono + счётчик ×N + Generate + «drafting» перо/точки). **Авто-тема
  сохранена** — бэкенд принимает только `topicId`, свободного поля темы нет (не добавляю)
- [ ] Липкие таб-фильтры (Drafts/Ready/Published/Rejected) с цветными точками+счётчиками
- [ ] Карточка-черновик: head (моно+имя+время+бейдж) / body / footer-действия;
      анимация входа `card-in`
- [ ] Инлайн-edit (textarea + счётчик символов), tweakbar с чипами-подсказками
- [ ] Скелетоны при генерации, пустые состояния по табам
- [ ] Диалог публикации, тосты с «отменить», состояние «first-run / set up voice»
- **Состояния:** loading · empty(по табам) · needs-voice · publish-confirm

---

# ФАЗА 2 — Контент

### 2a. My Feed
**Роут:** `/app/feed` → `feed/page.tsx` · **Эталон:** `feed-app.jsx`,
`feed-parts.jsx`, `feed-card.jsx`, `feed.css` · **Ширина:** 712
- [x] Baseline-шапка (3 стата views/likes/comments — reposts/спарклайн/дельта бэкенд не отдаёт)
- [x] PostCard: hero-метрики + иконки, virality-бейдж (over/settling/on-par),
      авто-reply `Switch`, «open in Threads», delete (тестер), `card-in`
- [x] TrendChart (area+линия+пунктир-базлайн «your average») по кнопке growth
- [x] Delete-диалог + тосты `ToastHost`; пустое/loading состояния
- [ ] _Sort-бар (Recent/Top) пропущен (это +фича/+i18n) — добавить позже client-side_
- **Проверено:** harness light+dark ✓

### 2b. Reply queue — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/replies` → `replies/page.tsx` · **Эталон:** `replies-app.jsx`,
`replies-parts.jsx`, `replies-card.jsx`, `replies-postselect.jsx`, `replies.css` ·
**Ширина:** 900 (как Лента/Упоминания). **Выбран вариант rail** (как в эталонном app).
- [x] Status-фильтры (All/Needs/Drafts/Replied/Skipped) — сегмент-бар с точками+счётчиками
- [x] Селектор поста = горизонтальная **рельса** карточек-постов (All posts + по постам), счётчик-пилюля
- [x] CommentCard: контекст-пост (inset «on your post»), translate коммента, reply-тред
      с коннектором (generate-шиммер → edit+счётчик 500 → approve/reject → publish → open)
- [x] `postFilter` заменил master-detail split; вся логика/API без изменений (рестайл)
- [x] **Полный набор действий по эталону** (2-й проход, по решению Захара «доделать по дизайну»):
      edit-toggle (текст ответа + «edit» → поле; только на pending — `approve` даёт 409 на повторное),
      **Regenerate** (повторная генерация), **Skip/Restore** (новые бэкенд-эндпоинты
      `POST /comments/{id}/skip|restore` + 5 тестов + SPEC §5.2/§14), per-status пустые состояния
- [x] harness: фикстура `COMMENTS` (6 комментов, 2 поста, все статусы вкл. skipped) + таргет Replies, light+dark ✓ (тёмная сверена замером вычисленных цветов)
- **Состояния:** loading · empty(по статусу) · comment: new/drafted(pending)/approved/replied/skip ✓
- _Лайки коммента **не показываем** — Threads API не отдаёт счётчик лайков для ответов
  (`threads_api.REPLY_FIELDS`); зафиксировано в SPEC §14. reply-translate убран (эталон
  переводит только входящий коммент)._

### 2c. Mentions
**Роут:** `/app/mentions` → `mentions/page.tsx` · **Эталон:** `mentions-app.jsx`,
`mentions-parts.jsx`, `mentions.css` · **Ширина:** 712
- [ ] Фильтр-бар (All/New/Saved/Archived) + «Mark all seen»
- [ ] MentionCard (read-only): автор, текст (@-mention акцентом), время, open-in-Threads,
      иконки save/archive; accent-бар у новых
- **Состояния:** loading · empty

---

# ФАЗА 3 — Рост

### 3a. Stats — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/stats` → `stats/page.tsx` · **Эталон:** `stats-app.jsx`,
`stats-parts.jsx`, `stats.css` · **Ширина:** 928 (как в эталоне, не 1060)
- [x] Range-сегмент (4/8/12 **недель**) — заменил старый набор периодов; под него
      добавлен бэкенд-параметр `?weeks=N` (`stats.py` + тест + SPEC §5.2), деплой ✅
- [x] 4 summary-карты (Posts/Views/Likes/Comments) с иконкой, sub и дельтой (период vs прошлый)
- [x] Column-chart «avg views/week» (hero) + «posts/week», последний столбец — акцент;
      distribution по тирам (CSS-бары, ink-ramp). Бар графика — **непрозрачный** color-mix
      (иначе невидим в тёмной теме — поймал на сверке dark)
- [x] harness: фикстура `STATS` (8 недель + summary + deltas + тиры) + таргет Stats, light+dark ✓
- **Состояния:** loading(скелетон) ✅ · empty(мало данных) ✅
- _Тиры — **реальные бэкендовые** (viral/good/mid/flop с настоящими порогами), не
  выдуманные имена дизайна (breakout/strong/onpar/quiet). Старый набор периодов
  (today/7d/all) убран — если нужен, верну отдельной кнопкой._

### 3b. Audits — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/audits` + `/app/audits/[id]` → `audits/page.tsx`,
`audits/[id]/page.tsx` · **Эталон:** `audits-app.jsx`, `audits-parts.jsx`,
`audits-change.jsx`, `audits.css` · **Ширина:** 760 (как в эталоне)
- [x] Список: audit-row (диапазон дат, meta suggestions/to-review/posts, wow-дельта,
      стрелка; accent-бар у новых) + плашка «N to review» в топбаре
- [x] Деталь: back-link, head+статус-бейдж, ad-stats (точки-счётчики), coach-нарратив
      (BrandMark + параграфы из `llm_reasoning`)
- [x] ChangeCard: kind-бейдж, статус-бейдж, detail, «view change» (diff before/after
      или JSON-fallback), «add note», effect-чип (±%/«measuring»), автопилот-часы в
      локальном TZ, approve/reject
- [x] harness: фикстуры `AUDITS_LIST` + `AUDIT_DETAIL` (все статусы) + 2 таргета, light+dark ✓
- **Состояния:** loading · list · detail ✓
- _**Фронт-онли** (бэкенд не трогал). Решения в бэкенде **append-only** (одно на change,
  повтор → 409): сделал **немедленные** approve/reject по карточке (вместо старого batch
  «submit all»), а design-only **Roll back / Reconsider убрал** — пользовательского отката
  в API нет (откат делает авто-трекер эффекта). Заметка уходит как `user_comment` решения._

### 3c. Patterns — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/patterns` → `patterns/page.tsx` · **Эталон:** `patterns-app.jsx`,
`patterns-parts.jsx`, `patterns.css` · **Ширина:** 760
- [x] **Новая фича по дизайну: «изучи МОИ посты»** (решение Захара). Состояния:
      empty(мало постов, прогресс have/need) / idle(«Run a study» + чипы LOOKS_FOR) /
      running(шаги-прогресс с тиками/спиннером) / results(pattern-карточки)
- [x] Pattern-карточка: kind-тег, сила сигнала, «+N%»-стат, headline, **evidence**-полоски
      (lead акцент / base серый), примеры из твоих постов с просмотрами
- [x] **Бэкенд:** новый `POST /patterns/study` — **детерминированный** анализ твоих постов
      (split по длине/вопросу/эмодзи/структуре → avg views, ≥3 в каждой группе, топ-4),
      без LLM; тексты заголовков локализую на фронте через i18n-шаблоны. + тест + SPEC
- [x] **Старый флоу «вставь чужой текст» НЕ удалён** — переехал на `/app/patterns/explore`
      (по решению Захара: отдельный дизайн под него — позже)
- [x] harness: фикстура `STUDY` + таргет (idle → запуск → results), light+dark ✓
- **Состояния:** loading · empty · idle · running · results ✓

### 3d. Autopilot — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/autopilot` → `autopilot/page.tsx` · **Эталон:** `autopilot-app.jsx`,
`autopilot-parts.jsx`, `autopilot.css` · **Ширина:** 760
- [x] Master-card (иконка-молния + статус-строка + большой свитч; зелёный тинт когда on)
      + reassurance-баннер когда off + **confirm-диалог при включении**
- [x] Scheduled posts: карточки-объекты (имя/время-в-локальном-TZ/jitter/topic/on-off/seed;
      add/delete с inline-подтверждением) + пустое состояние
- [x] Reply-policy карта (свитч + 2 policy-row: audience + daily cap; диммится когда off)
- [x] Activity: табы Posts/Replies + счётчики по объектам + авто-посты / авто-реплаи + пусто
- [x] **Фронт-онли** — бэкенд (autopost-rules CRUD + /autopilot + /autopost-activity) уже готов
- [x] harness: фикстуры (rules/config/activity) + таргет, light+dark ✓
- **Состояния:** loading · master off/on · empty-objects · empty-activity ✓
- _Поймал артефакт harness: `shoot()` снимал дарк **сразу** после переключения `.dark`, и
  элементы с `transition-colors` попадали в кадр посветлевшими (на проде не баг — тема до
  отрисовки). Добавил паузу 260мс после смены темы — теперь все дарк-снимки точные._

---

# ФАЗА 4 — Голос

### 4a. Voice (role-book) — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/role-book` → `role-book/page.tsx` · **Эталон:** `voice-app.jsx`,
`voice-parts.jsx`, `voice.css` · **Ширина:** 760
- [x] Voice-hero (eyebrow + заголовок + версия v{id}·parent + «Check voice» + «Re-extract»)
- [x] **Все 7 реальных секций** (решение Захара) в стиле дизайн-карт с inline-Edit/Save:
      intro / themes_include / themes_exclude(danger) / voice_characteristics / do / dont(danger) / examples
- [x] Voice-check: conflict-карточки из бэкенд-lint (severity high→Conflict/medium→Caution,
      rules, why, suggested fix → Apply (если есть fix) / Ignore) + clear-состояние + Re-check
- [x] Re-extract: панель прогресса (перо + шаги) + confirm-диалог с предупреждением
- [x] Перенёс недостающие иконки из `voice-icons.jsx` (Scan/Refresh/Shield/Alert/Tags/List/Quote)
- [x] harness: фикстуры `ROLE_BOOK` + `VOICE_LINT` + таргет (загрузка + проверка), light+dark ✓
- **Состояния:** boot-loading · ready · busy(re-extract) · conflicts ✓
- _**Фронт-онли** (бэкенд role-book/lint/apply-fix/extract готов). «Совпадение %» — нет такой
  метрики в бэкенде, не показываю. Тяжёлый «translated/original» вид убран; перевод —
  через прозрачность-блок (TranslateButton снизу)._

### 4b. Style rules — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/style-rules` → `style-rules/page.tsx` · **Эталон:**
`stylerules-app.jsx`, `stylerules-parts.jsx`, `stylerules.css` · **Ширина:** 740
- [x] Intro (eyebrow + заголовок + lead + счётчики active/total + own)
- [x] Built-in: фильтр-чипы **по категориям** + Switch на правило (title + category-бейдж + desc),
      примечание у `human_punctuation`
- [x] Freeform: свои правила (bullet + текст + inline-edit/remove, hover-иконки) + композер
      (kind-селектор post/reply + поле + «Add rule») + пустое состояние с hint-чипами
- [x] **Бэкенд:** добавил display-поле `category` каждому встроенному правилу
      (`default_rules._RULE_CATEGORY` + `category_for`, в `GET /style-rules`) — только для
      чипов-фильтра, генерация его игнорирует. + тест + SPEC
- [x] Перенёс иконки из `stylerules-icons.jsx` (Sliders/Filter/PenLine)
- [x] harness: фикстуры `STYLE_RULES` + `USER_RULES` + таргет, light+dark ✓
- **Состояния:** boot-loading · ready ✓

---

# ФАЗА 5 — Аккаунт и публичное

### 5a. Settings — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/settings` → `settings/page.tsx` · **Эталон:** `settings-app.jsx`,
`settings-parts.jsx`, `settings.css` · **Ширина:** 680
- [x] Intro (eyebrow «Account» + h1 + lead), Account-карта (аватар + имя/email + план-бейдж ★ + kv Email/Plan)
- [x] Language-карта (сетка 2×4 локалей: код-бейдж + имя + галочка у активной)
- [x] Connected accounts (список с тегом «Active» у выбранного + disconnect-confirm + ConnectThreadsButton)
- [x] Shortcuts (Голос → /role-book; tester «Preview mode» → онбординг-превью) + футер (sign out + «Pennedly»)
- [x] Перенёс иконки `settings-icons.jsx` (Unlink/Logout/Flask)
- [x] harness: таргет Settings (фикстуры me/accounts уже были), light+dark ✓
- **Состояния:** loading · ready ✓
- _Фронт-онли. Опущено как невыстроенное в бэкенде: смена email, биллинг «Manage plan»,
  счётчик подписчиков, номер версии._

### 5b. Onboarding — `[x]` готово на проде (2026-06-01)
**Роут:** `/app/onboarding` → `onboarding/page.tsx` · **Эталон:**
`onboarding-app.jsx`, `onboarding-parts.jsx`, `onboarding.css` · полноэкранный
(вне shell, layout SHELL_EXEMPT)
- [x] Topbar (марка + «Skip for now» + язык + тема), степпер ①Connect ②Voice ③Done
- [x] Шаги: connect (hero + 3 reassurance-строки + ConnectThreadsButton) → choose
      (2 карты analyze[recommended если can_analyze] / from-scratch) → analyze(прогресс с
      шагами+пером) / scratch(форма: описание + темы-писать + темы-избегать) → done (recap + Go to Studio)
- [x] **Сохранён tester-режим `?preview=1`** (запуск без сохранения → restyled preview-панель)
- [x] Перенёс иконки `onboarding-icons.jsx` (Lock/ArrowRight; Scan/Pen уже были)
- [x] harness: таргет (choose → Continue → done), light+dark ✓ (ждёт header, не aside — экран вне сайдбара)
- **Состояния:** connect · choose · analyze · scratch · done ✓
- _Фронт-онли. Connect использует реальный OAuth-редирект (нет in-page «connecting»-анимации —
  после возврата load видит аккаунт → choose). Стартеры/подсказки-чипы из дизайна упростил
  (TagInput без suggestions) — декоративные хелперы, добавить позже._

### 5c. Login ✅ (на проде)
**Роут:** `/app/login` → `login/page.tsx` · **Эталон:** `login-app.jsx`,
`login-parts.jsx`, `login.css` · центр-карта (rounded-2xl), радиальный фон
- [x] LanguageSwitcher (верх-право), брендовая шапка карты
- [x] Google-кнопка (монохромный «G» как в эталоне) → «OR» → email-форма → OTP
      (6 ячеек, auto-advance/paste, shake при ошибке) → «signing in» лоадер;
      consent-строка (Terms/Privacy); dev-drawer (скрытый)
- **Состояния:** email · code · signing-in · error — все по эталону
- _Логика сохранена 1:1: magic-link (?token), Google-handoff (?handoff),
  email-code, dev-login. Keyframes `shake`+`nibwrite` добавлены в globals.css
  (последний оживил перья на Patterns/Voice/Onboarding — раньше no-op)._

### 5d. Landing ✅ (на проде)
**Роут:** `/` → `src/app/page.tsx` · **Эталон:** `landing-app.jsx`,
`landing-parts.jsx`, `landing.css`, `screenshots/02-landing-final.png`
- [x] Topbar (марка + тема + «Sign in»)
- [x] Hero (2 колонки): pill «In development» + display-заголовок + value-копия
      (акцент-предложение) + «Sign in →» + email; справа плавающая карточка-черновик
      («призрак» позади для глубины)
- [x] Сетка 4 фич (иконка-тайл + title + desc), футер (© + Privacy/Terms/Data Deletion)
- **Состояния:** —
- _Публичный pre-auth экран без I18nProvider → копия = EN baseline (в эталоне
  нет переключателя языка). Контакт-email: `hi@pennedly.com` (наш домен; в
  эталоне `hello@pennedly.app` — плейсхолдер). Keyframe `ripple` добавлен._

### 5e. Legal ✅ (на проде)
**Роут:** `/privacy`, `/terms`, **`/data-deletion`** (новый роут) →
`privacy/page.tsx`, `terms/page.tsx`, `data-deletion/page.tsx` · **Эталон:**
`legal-app.jsx`, `legal-parts.jsx`, `legal-data.jsx` (контент 3 доков), `legal.css`,
`Legal Template.html`
- [x] Topbar + статья (читаемая колонка 720px: eyebrow/h1/intro/TOC/h2/p/списки)
- [x] Общий клиент-шаблон `components/legal/LegalLayout.tsx` (3 server-роута с
      собственным `metadata` кормят его данными); auto-TOC, блоки p/h3/ul/contact
- [x] Футер кросс-линкует 3 документа + Home (активный документ подсвечен)
- [x] Новый роут `/data-deletion` (Meta App Review требует) — контент по реальному
      бэкенду (disconnect · Meta deauth/data-deletion колбэки · confirmation_code)
- **Состояния:** privacy · terms · data-deletion
- _Дизайн = эталон **вёрстки**; контент — реальный юр-текст (фонд Twój StartUp,
  KRS/NIP/REGON, `support@pennedly.com`), НЕ плейсхолдеры дизайна. Модель данных
  дизайна (простые строки + contact-блоки) → нет JSX через RSC-границу.
  next.config/`.html`-rewrites больше нет. SPEC §6 обновлён._

---

# ФАЗА 6 — Закрытие

- [ ] Визуально-регрессионные скриншот-тесты (exit-criterion Phase 7)
- [ ] Финальный проход: обе темы на всех 15 экранах
- [ ] i18n-паритет зелёный, build зелёный, e2e зелёные
- [ ] Обновить `SPEC.md` §6/§7/§13/§14 в том же коммите

---

## Слой компонентов — инвентарь (что строим один раз в Фазе 0)

Примитивы: `Button` · `Field`(input/select/textarea) · `Card`/`Panel` · `Badge`+`StatusDot`
· `Tag` · `Switch` · `Link` · `Table` · `Spinner` · `Skeleton` · `EmptyState` ·
`Dialog`/`Overlay` · `Toast`+host · `Mono`(avatar) · `Segmented`(таб-сегмент) ·
`Menu`(дропдаун) · иконки + марка-перо.

Каркас: `Sidebar` · `Topbar` · `AccountSwitcher` · `LanguageSwitcher` ·
`ConnectThreadsButton`. Уже есть и переедут под новый вид: `PublishConfirmModal`,
`TranslateButton`, `TagInput`, `LintResults`.

## Парковка / открытые вопросы

- [x] `data-deletion` — **да, нужна**; дизайн уже есть (`legal-data.jsx`), добавляем роут в Фазе 5e (решено 2026-06-01).
- [x] **Визуальная проверка авторизованных экранов** — выбран **mock-auth harness**.
  Готов: `tests/visual/screens.spec.ts` (route-mock `**/api/**` + seeding токена,
  снимки light/dark в `test-results/visual/`). Запуск: `npx playwright test
  tests/visual/screens.spec.ts`. Сайдбар проверен в обеих темах ✓. Основа для Phase 6.
- [x] Селектор поста в Replies — **выбран rail** (как в эталонном `replies-app.jsx`); решено 2026-06-01 с Захаром.
- [ ] Перевод 6 локалей (uk/de/es/fr/it/pt) — отдельная задача с ревью Захара (вне Phase 7).
- [ ] Экран billing/upgrade — в дизайне нет, проектируем позже (Phase 5 бэкенда).
- [ ] Легаси-роут `/app/posts` — пропускаем (заменён Лентой); удалить?

---

_Обновлено: 2026-06-01. Веди статусы по ходу — это наш чеклист, чтобы ничего не потерять._
