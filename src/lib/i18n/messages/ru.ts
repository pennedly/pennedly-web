// Русский — полный перевод. Тон совпадает с EN: технически плотный,
// без лишней маркетинговой воды, без эмодзи. Команды кнопок в
// нижнем регистре чтобы совпадать с визуальным стилем lowercase EN.

import type { MessageKey } from "./en";

export const ru: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Помогает писать в твоём голосе на Threads.",
  "common.loading": "загружаю…",
  "common.saving": "сохраняю…",
  "common.save": "сохранить",
  "common.cancel": "отмена",
  "common.hide": "скрыть",
  "common.translate_content": "Перевести содержимое",
  "common.translating": "Перевожу…",
  "common.hide_translation": "Скрыть перевод",
  "common.translation": "Перевод",
  "common.view_original": "Посмотреть оригинал",
  "common.view_translation": "Показать перевод",
  "common.revert": "вернуть",
  "common.signed_in_as": "вошёл как",

  // ── Accounts / connect ─────────────────────────────────────────
  "accounts.connect": "Подключить аккаунт Threads",
  "accounts.connect_another": "Подключить ещё аккаунт",
  "accounts.connecting": "Подключаю…",
  "accounts.connect_error": "Не удалось подключить. Попробуй ещё раз.",
  "accounts.connect_limit":
    "Достигнут лимит подключённых аккаунтов. Отключи один или повысь тариф.",
  "accounts.connected": "подключён",
  "accounts.connect_cta_body":
    "Pennedly пишет в твоём голосе — подключи аккаунт Threads, чтобы начать.",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Запросить ранний доступ",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "ты@example.com",
  "login.submit": "отправить ссылку для входа",
  "login.sending": "отправляю…",
  "login.no_password":
    "Пришлём одноразовую ссылку на email. Пароль не нужен.",
  "login.signing_in": "Авторизую…",
  "login.sent_title": "Проверь почту",
  "login.sent_to": "Отправили ссылку для входа на",
  "login.sent_validity":
    "Ссылка действует 15 минут и срабатывает один раз.",
  "login.use_different_email": "другой email",
  "login.link_invalid":
    "Эта ссылка больше не действует. Запроси новую ниже.",
  "login.signin_failed": "Вход не удался",
  "login.rate_limited":
    "Слишком много попыток входа — попробуй через час.",
  "login.email_down":
    "Доставка писем сейчас недоступна. Попробуй через минуту.",
  "login.dev_toggle_show": "режим разработчика",
  "login.dev_toggle_hide": "скрыть режим разработчика",
  "login.dev_explainer":
    "Без проверки email. Работает только если на бэке ALLOW_DEV_LOGIN=true.",
  "login.dev_submit": "войти (dev)",
  "login.dev_signing_in": "вход…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "голос",
  "dashboard.nav.audits": "аудиты",
  "dashboard.nav.logout": "выйти",
  "dashboard.voice_setup_title": "Сначала настройте голос",
  "dashboard.voice_setup_body":
    "Pennedly пишет в вашем голосе — настройте его, чтобы мы знали вашу манеру, прежде чем генерировать посты.",
  "dashboard.voice_setup_cta": "Настроить голос",
  "dashboard.generate.title": "Сгенерировать пост",
  "dashboard.generate.subtitle":
    "В твоём голосе. Тема выбирается по кругу из твоих тем.",
  "dashboard.generate.button": "сгенерировать пост",
  "dashboard.generate.generating": "генерирую…",
  "dashboard.generate.no_topic": "без темы",
  "dashboard.feed.title": "Последние черновики",
  "dashboard.feed.empty": "Черновиков пока нет. Жми",
  "dashboard.feed.empty_cta": "сгенерировать пост",
  "dashboard.feed.empty_after": "сверху чтобы начать.",
  "dashboard.feed.draft_singular": "черновик",
  "dashboard.feed.draft_plural": "черновиков",
  "dashboard.draft.edited": "отредактирован",
  "dashboard.draft.approve": "одобрить",
  "dashboard.draft.approve_edited": "одобрить с правкой",
  "dashboard.draft.reject": "отклонить",
  "dashboard.draft.publish": "опубликовать в Threads",
  "dashboard.draft.refine_placeholder":
    "уточнить: «покороче», «менее формально», «добавь вопрос»…",
  "dashboard.draft.refine": "уточнить",
  "dashboard.draft.refining": "уточняю…",
  "dashboard.draft.refine_preset_shorter": "покороче",
  "dashboard.draft.refine_preset_informal": "менее формально",
  "dashboard.draft.refine_preset_question": "добавь вопрос",
  "dashboard.draft.refine_preset_punchier": "ярче открытие",
  "dashboard.draft.tweak": "доработать",
  "dashboard.draft.published": "опубликовано",
  "dashboard.draft.open_threads": "открыть в Threads ↗",
  "dashboard.tab.pending": "черновики",
  "dashboard.tab.approved": "готово к публикации",
  "dashboard.tab.published": "опубликовано",
  "dashboard.tab.rejected": "отклонённые",
  "dashboard.tab.empty": "Здесь пусто.",
  "dashboard.toast.generated": "сгенерировано",
  "dashboard.toast.approved_as_is": "одобрено как есть",
  "dashboard.toast.approved_edited": "одобрено с правкой",
  "dashboard.toast.rejected": "отклонено",
  "dashboard.toast.refined": "уточнено",
  "dashboard.toast.published": "опубликовано",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← дашборд",
  "rolebook.version_label": "голос v",
  "rolebook.parent_label": "предыдущая v",
  "rolebook.title": "Голос",
  "rolebook.subtitle":
    "Управляй тем, что пишет AI и как. Изменения применятся к следующей генерации.",
  "rolebook.intro.label": "Описание",
  "rolebook.intro.helper": "кто пишет",
  "rolebook.intro.placeholder":
    "Один абзац своими словами: кто ты, о чём пишешь.",
  "rolebook.themes_exclude.label":
    "Темы, о которых AI НИКОГДА не должен писать",
  "rolebook.themes_exclude.helper":
    "Если запрошенная тема попадает сюда — AI молча переключится на разрешённую.",
  "rolebook.themes_exclude.placeholder": "например, разработка приложений",
  "rolebook.themes_include.label": "Темы, о которых AI пишет",
  "rolebook.themes_include.helper":
    "Конкретно — «провалы на кухне» лучше чем «лайфстайл».",
  "rolebook.themes_include.placeholder":
    "например, кулинарные провалы и шорткаты",
  "rolebook.voice_characteristics.label": "Характеристики голоса",
  "rolebook.voice_characteristics.helper":
    "Конкретные наблюдения: «строчная i», «короткие предложения».",
  "rolebook.voice_characteristics.placeholder":
    "например, везде строчные буквы",
  "rolebook.do_list.label": "Делать",
  "rolebook.do_list.helper": "Конкретные приёмы, которые усиливать.",
  "rolebook.do_list.placeholder":
    "например, начинать с «what's a...» вопросов",
  "rolebook.dont_list.label": "Не делать",
  "rolebook.dont_list.helper": "Конкретные приёмы, которых избегать.",
  "rolebook.dont_list.placeholder": "например, без хештегов и эмодзи",
  "rolebook.examples.label": "Примеры голоса",
  "rolebook.examples.helper": "Характерные фразы в твоём реальном голосе.",
  "rolebook.examples.placeholder":
    "например, i have burned water before. not metaphorically",
  "rolebook.extract.button": "извлечь заново из постов",
  "rolebook.extract.extracting": "извлекаю…",
  "rolebook.extract.confirm_title": "Извлечь голос заново из последних постов?",
  "rolebook.extract.confirm_body":
    "Проанализирую твои самые просматриваемые недавние посты и заменю текущий голос свежим извлечением. Текущая версия сохранится как предыдущая — можно откатить. Ручные правки текущей версии не перенесутся.",
  "rolebook.extract.confirm_cta": "извлечь заново",
  "rolebook.extract.toast_done": "голос заново извлечён из твоих постов",
  "rolebook.lint.button": "проверить конфликты",
  "rolebook.lint.checking": "проверяю…",
  "rolebook.lint.section_title": "Проверка конфликтов",
  "rolebook.lint.no_conflicts": "конфликтов не найдено",
  "rolebook.save.helper":
    "Новая активная версия при сохранении · старая становится предыдущей",
  "rolebook.save.toast_saved_clean": "сохранено · без конфликтов",
  "rolebook.save.toast_saved_check_unavailable":
    "сохранено · проверка недоступна",
  "rolebook.transparency.title": "Что AI на самом деле видит",
  "rolebook.transparency.subtitle": "· собрано из секций выше",
  "rolebook.items_count_singular": "элемент",
  "rolebook.items_count_plural": "элементов",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← дашборд",
  "audits.runs_at": "Понедельники 09:00 UTC",
  "audits.title": "Аудиты",
  "audits.subtitle":
    "Каждую неделю коуч анализирует как сработали твои посты и предлагает правки голоса. Одобряй или отклоняй каждое предложение по отдельности.",
  "audits.empty":
    "Аудитов пока нет. Первый запустится в понедельник после того как накопится хотя бы неделя опубликованных постов с метриками.",
  "audits.posts_analyzed": "постов проанализировано",
  "audits.decided_of_total": "решено",
  "audits.pending_review": "ждут твоего решения",
  "audits.detail.back": "← аудиты",
  "audits.detail.proposed_changes": "Предложенные изменения",
  "audits.detail.no_changes":
    "Коуч не предложил изменений за этот период.",
  "audits.detail.reasoning": "Почему коуч предложил эти изменения",
  "audits.detail.suggested_fix": "Предлагаемое исправление",
  "audits.detail.your_note": "Твоя заметка",
  "audits.detail.note_placeholder":
    "Опциональная заметка к этому решению…",
  "audits.detail.approve": "одобрить",
  "audits.detail.reject": "отклонить",
  "audits.detail.clear": "сбросить",
  "audits.detail.submit": "отправить решения",
  "audits.detail.submitting": "отправляю…",
  "audits.detail.ready_to_submit": "готовы к отправке",
  "audits.detail.applied": "применено",
  "audits.detail.rejected_label": "отклонено",
  "audits.detail.rolled_back": "откачено",
  "audits.detail.effect": "эффект",
  "audits.detail.title": "Еженедельный аудит",
  "audits.detail.changes_count": "предложений",
  "audits.detail.status_label": "статус",
  "audits.detail.view_diff": "Показать diff",
  "audits.detail.approved": "одобрено",
  "audits.detail.toast_nothing":
    "нечего отправлять — одобри или отклони хотя бы одно",
  "audits.detail.toast_submitted": "решения отправлены",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Опубликовать в Threads",
  "publish.subtitle":
    "Это точный текст, который появится на твоём аккаунте Threads. После публикации редактировать или удалить отсюда нельзя.",
  "publish.char_count": "симв.",
  "publish.over_limit":
    "Threads не примет текстовый пост сверх лимита.",
  "publish.cancel": "отмена",
  "publish.confirm": "опубликовать в Threads",
  "publish.publishing": "публикую…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "перевести",
  "translate.cached": "из кэша",
  "translate.fresh": "свежий",

  // ── Pattern Study ───────────────────────────────────────────────
  "dashboard.nav.patterns": "паттерны",
  "patterns.back": "← дашборд",
  "patterns.title": "Изучение паттернов",
  "patterns.subtitle":
    "Вставь ТЕКСТ постов которые тебе нравятся — Pennedly вытащит переиспользуемые приёмы (как построен хук, ритм, структура), чтобы ты мог применить ходы в своём голосе.",
  "patterns.disclaimer_title": "Вставляй текст, а не ссылки",
  "patterns.disclaimer_body":
    "Скопируй сами слова поста который изучаешь. Ссылки и @профили не сработают — Pennedly никогда не открывает ссылки и не читает чужие аккаунты. И извлекает приём, а не копирует контент.",
  "patterns.input_placeholder":
    "Вставь текст поста сюда. Несколько постов — разделяй пустой строкой.\n\nнапр. i have burned water before. not metaphorically. actual water in a pot",
  "patterns.analyze": "разобрать паттерны",
  "patterns.analyzing": "разбираю…",
  "patterns.empty_warning": "сначала вставь текст хотя бы одного поста",
  "patterns.link_warning":
    "Похоже на ссылку или профиль. Вставь ТЕКСТ поста — сами слова которые ты видишь.",
  "patterns.summary_label": "Что у них общего",
  "patterns.why_label": "почему работает",
  "patterns.example_label": "свежий пример",
  "patterns.add_to_voice": "добавить в мой голос",
  "patterns.added": "добавлено в твой do-list",

  // ── Style rules ────────────────────────────────────────────────
  "dashboard.nav.style_rules": "стиль",
  "style_rules.back": "← дашборд",
  "style_rules.title": "Правила стиля",
  "style_rules.subtitle":
    "Встроенные правила, чтобы AI не писал как AI. Все включены по умолчанию — выключи те, что не нужны для этого аккаунта.",
  "style_rules.count_on": "включено",
  "style_rules.kind.post": "только посты",
  "style_rules.kind.reply": "только ответы",
  "style_rules.on": "вкл",
  "style_rules.off": "выкл",
  "style_rules.defaults_title": "Встроенные правила",
  "user_rules.title": "Твои правила",
  "user_rules.subtitle":
    "Твои собственные инструкции поверх встроенных правил ниже. Применяются каждый раз при генерации.",
  "user_rules.empty": "Своих правил пока нет.",
  "user_rules.kind_post": "для постов",
  "user_rules.kind_reply": "для ответов",
  "user_rules.add": "+ добавить правило",
  "user_rules.placeholder":
    "напр. всегда называй конкретный инструмент или цифру; не начинай с вопроса",
  "user_rules.delete": "удалить",
  "user_rules.confirm_delete": "Удалить?",
  "style_rules.punctuation_note":
    "Пока включено, длинные тире и кавычки-ёлочки заменяются на обычный дефис и прямые кавычки — и в подсказке для AI, и при автоматической чистке текста. Выключи, чтобы оставить привычную типографику.",
  "style_rules.toast.enabled": "правило включено",
  "style_rules.toast.disabled": "правило выключено",

  // ── Replies ────────────────────────────────────────────────────
  "dashboard.nav.replies": "ответы",
  "replies.back": "← дашборд",
  "replies.title": "Ответы",
  "replies.subtitle":
    "Комментарии под твоими постами. Сгенерируй ответ в своём голосе, проверь и опубликуй.",
  "replies.empty":
    "Комментариев пока нет. Очередь наполняется раз в час из твоих недавних постов.",
  "replies.on_post": "под твоим постом",
  "replies.under_post": "Под твоим постом:",
  "replies.open_thread": "открыть в Threads ↗",
  "replies.replied_on": "отвечено",
  "replies.view_comment": "открыть в Threads",
  "replies.dismiss": "убрать из очереди",
  "replies.confirm_dismiss": "Убрать?",
  "replies.toast_dismissed": "Убрано из очереди",
  "replies.generate": "сгенерировать ответ",
  "replies.skipped":
    "пропущено — AI решил, что на этот комментарий отвечать не стоит",
  "replies.replied": "отвечено",
  "replies.filter_all": "Все",
  "replies.filter_new": "Нужен ответ",
  "replies.filter_drafted": "Черновик",
  "replies.filter_replied": "Отвечено",
  "replies.filter_skipped": "Пропущено",
  "replies.posts_column": "Посты",
  "replies.select_post": "Выбери пост слева, чтобы увидеть ответы к нему.",
  "replies.no_posts": "Пока нет постов с комментариями.",

  // ── Mentions ───────────────────────────────────────────────────
  "dashboard.nav.mentions": "упоминания",
  "mentions.back": "← дашборд",
  "mentions.title": "Упоминания",
  "mentions.subtitle":
    "Посты в Threads, где тебя упоминают (@). Обновляется раз в час.",
  "mentions.empty": "Упоминаний пока нет.",
  "mentions.view": "открыть в Threads",

  // ── Posts (published) ──────────────────────────────────────────
  "dashboard.nav.posts": "посты",
  "posts.back": "← дашборд",
  "posts.title": "Опубликованные посты",
  "posts.subtitle":
    "Твои посты в Threads. Удаление убирает пост из Threads — отменить нельзя.",
  "posts.empty": "Опубликованных постов пока нет.",
  "posts.delete": "удалить",
  "posts.deleting": "удаляю…",
  "posts.confirm_title": "Удалить этот пост из Threads?",
  "posts.confirm_body":
    "Пост будет навсегда удалён из твоего аккаунта Threads. Отменить нельзя.",
  "posts.confirm_cta": "удалить из Threads",
  "posts.toast_deleted": "пост удалён",

  // ── Autopilot ──────────────────────────────────────────────────
  "dashboard.nav.autopilot": "автопилот",
  "autopilot.back": "← дашборд",
  "autopilot.title": "Автопилот",
  "autopilot.subtitle":
    "По умолчанию выключен. Включай только то, что хочешь — Pennedly постит и отвечает в твоём голосе, на твоих условиях. Паузу можно в любой момент.",
  "autopilot.master": "Автопилот включён",
  "autopilot.posts_title": "Авто-постинг",
  "autopilot.post_enabled": "Генерировать и публиковать посты автоматически",
  "autopilot.posts_per_day": "Постов в день",
  "autopilot.quiet_hours": "Тихие часы (не постить)",
  "autopilot.quiet_off": "выкл",
  "autopilot.replies_title": "Авто-ответы на комментарии",
  "autopilot.replies_subtitle":
    "Автоматически отвечать на комментарии под твоими постами — в твоём голосе.",
  "autopilot.replies_policy_hint":
    "Настройки действуют на все авто-ответы аккаунта. На какие именно посты отвечать — переключай у каждого поста в Ленте.",
  "autopilot.reply_enabled": "Отвечать на комментарии автоматически",
  "autopilot.reply_audience": "Кому отвечать",
  "autopilot.audience_fans": "только фанаты / позитив",
  "autopilot.audience_all_except_trolls": "всем, кроме троллей",
  "autopilot.audience_questions": "только на вопросы",
  "autopilot.replies_per_day": "Ответов в день",
  "autopilot.uses_voice": "Автопилот следует твоему «Голосу» и правилам стиля.",
  "autopilot.safety":
    "Публикуется только то, что прошло проверку качества; действуют дневные лимиты; всё логируется и обратимо.",
  "autopilot.saved": "автопилот сохранён",
  "autopilot.objects_title": "Объекты автопостинга",
  "autopilot.objects_subtitle":
    "Каждый постит раз в день в своё время. Больше постов в день — больше объектов.",
  "autopilot.add_object": "+ добавить объект",
  "autopilot.no_objects": "Объектов пока нет. Добавь первый, чтобы начать.",
  "autopilot.activity_title": "Активность",
  "autopilot.activity_empty": "Автопилот пока ничего не публиковал.",
  "autopilot.activity_today": "сегодня",
  "autopilot.activity_posts": "постов",
  "autopilot.activity_replies": "ответов",
  "autopilot.activity_last_post": "последний пост",
  "autopilot.activity_recent": "Недавние авто-посты",
  "autopilot.object_name_ph": "название (необязательно)",
  "autopilot.object_topic": "Тема",
  "autopilot.any_topic": "любая (по очереди)",
  "autopilot.object_time": "Постить в",
  "autopilot.object_autoreply": "Авто-ответы на его комментарии",
  "autopilot.object_autoreply_hint":
    "Новые посты этого объекта будут отвечать на комментарии (если авто-ответы аккаунта включены ниже). Кому и сколько — в общих настройках авто-ответов.",
  "autopilot.delete_object": "удалить",
  "autopilot.confirm_delete_object": "Удалить этот объект?",

  // ── Моя лента (посты + аналитика) ─────────────────────────────
  "dashboard.nav.feed": "лента",
  "nav.studio": "Студия",
  "nav.group.content": "Контент",
  "nav.group.growth": "Рост",
  "nav.group.voice": "Голос",
  "feed.back": "← дашборд",
  "feed.title": "Моя лента",
  "feed.subtitle":
    "Твои посты — у каждого видно, насколько он зашёл относительно твоего среднего.",
  "feed.empty":
    "Постов пока нет. Как опубликуешь в Threads — появятся здесь с аналитикой.",
  "feed.ref_week": "Твоё среднее за неделю",
  "feed.ref_30d": "Твоё среднее за 30 дней",
  "feed.ref_none":
    "Пока мало постов, чтобы сравнивать со средним — продолжай постить.",
  "feed.posts_word": "постов",
  "feed.views": "просмотры",
  "feed.likes": "лайки",
  "feed.comments": "комментарии",
  "feed.reposts": "репосты",
  "feed.vs_avg": "× от среднего",
  "feed.fresh": "ещё набирает",
  "feed.open": "открыть в Threads ↗",
  "feed.growth": "рост",
  "feed.growth_none": "пока мало замеров для графика",
  "feed.autoreply_on": "автоответы вкл",
  "feed.autoreply_off": "автоответы выкл",
  "feed.autoreply_hint":
    "Когда включено, Pennedly сам отвечает на новые комментарии под этим постом (по вашей аудитории и дневному лимиту).",
  "feed.autoreply_toast_on": "Автоответы включены для этого поста",
  "feed.autoreply_toast_off": "Автоответы выключены для этого поста",

  // ── Онбординг ─────────────────────────────────────────────────
  "onboarding.title": "Настроим твой голос",
  "onboarding.subtitle":
    "Pennedly пишет в твоём голосе. Давай его зададим — выбери, с чего начать.",
  "onboarding.connect_title": "Сначала подключи аккаунт Threads",
  "onboarding.connect_body":
    "Pennedly создаёт черновики для подключённого аккаунта. Подключи один, чтобы начать.",
  "onboarding.analyze_title": "Разобрать мои посты",
  "onboarding.analyze_body":
    "Pennedly прочитает твои недавние посты в Threads и соберёт твой голос автоматически.",
  "onboarding.analyze_cta": "Разобрать мои посты",
  "onboarding.analyze_count": "постов готово к разбору",
  "onboarding.analyze_none": "Постов пока нет — начни с нуля.",
  "onboarding.analyzing": "Разбираю твои посты…",
  "onboarding.scratch_title": "Создать с нуля",
  "onboarding.scratch_body":
    "Новый аккаунт? Опиши свой голос и темы — и сразу начинай постить.",
  "onboarding.scratch_cta": "Создать с нуля",
  "onboarding.skip": "Пропустить — настрою голос позже",
  "onboarding.form_intro_label": "Опиши свой голос",
  "onboarding.form_intro_ph":
    "Кто ты, о чём твой аккаунт, какой у тебя тон. Пиши на том языке, на котором постишь.",
  "onboarding.form_themes_label": "Темы, о которых хочешь писать",
  "onboarding.form_themes_ph": "добавь тему и нажми enter",
  "onboarding.form_exclude_label": "Темы, которых избегать (необязательно)",
  "onboarding.form_exclude_ph": "добавь нежелательную тему",
  "onboarding.create_cta": "Создать мой голос",
  "onboarding.creating": "Создаю…",
  "onboarding.back": "← назад",
  "onboarding.error_empty": "Добавь хотя бы описание голоса или одну тему.",

  // ── Статистика ────────────────────────────────────────────────
  "dashboard.nav.stats": "статистика",
  "stats.title": "Статистика",
  "stats.subtitle": "Как идут дела у аккаунта за последние недели.",
  "stats.empty": "Постов пока нет. Статистика появится здесь, как начнёшь публиковать.",
  "stats.card_posts": "Постов",
  "stats.card_views": "Всего просмотров",
  "stats.card_avg_views": "Просмотров на пост",
  "stats.card_avg_likes": "Лайков на пост",
  "stats.card_avg_comments": "Комментариев на пост",
  "stats.vs_last_week": "к прошлой неделе",
  "stats.tiers_title": "Насколько вирусными были посты",
  "stats.tier_viral": "вирусные",
  "stats.tier_good": "хорошие",
  "stats.tier_mid": "средние",
  "stats.tier_flop": "слабые",
  "stats.weekly_views_title": "Средние просмотры по неделям",
  "stats.weekly_posts_title": "Постов по неделям",
  "stats.period.today": "Сегодня",
  "stats.period.yesterday": "Вчера",
  "stats.period.7d": "7 дней",
  "stats.period.30d": "Месяц",
  "stats.period.90d": "3 месяца",
  "stats.period.all": "Всё время",
  "stats.vs_prev": "к прошлому периоду",
  "stats.chart_avg_views": "Средние просмотры на пост",
  "stats.chart_posts": "Посты",
  "stats.chart_avg_line": "среднее",
  "stats.chart_above_avg": "выше среднего",
  "stats.chart_below_avg": "ниже среднего",
  "stats.gran_day": "по дням",
  "stats.gran_week": "по неделям",
  "stats.gran_month": "по месяцам",

  // ── Виджет перевода (button/cached/fresh уже заданы выше) ──────
  "translate.translating": "перевожу…",
  "translate.translated": "переведено",
  "translate.hide": "скрыть",

  // ── Статус черновика ──────────────────────────────────────────
  "dashboard.status.pending": "черновик",
  "dashboard.status.approved": "одобрено",
  "dashboard.status.rejected": "отклонено",
  "dashboard.status.published": "опубликовано",
  "dashboard.draft.refine_empty": "сначала впиши, что доработать",
  "dashboard.draft.delete": "удалить",
  "dashboard.draft.confirm_delete": "Удалить этот черновик?",
  "dashboard.draft.toast_deleted": "черновик удалён",

  // ── Низ сайдбара + Настройки ──────────────────────────────────
  "nav.settings": "Настройки",
  "settings.title": "Настройки",
  "settings.account": "Аккаунт",
  "settings.plan": "Тариф",
  "settings.language": "Язык интерфейса",
  "settings.accounts": "Подключённые аккаунты Threads",
  "settings.disconnect": "отключить",
  "settings.disconnect_confirm": "Отключить?",
  "settings.disconnect_yes": "Да, отключить",
  "settings.disconnecting": "отключаю…",
  "settings.disconnect_hint":
    "Отключение удаляет сохранённый токен доступа; твои посты и статистика остаются. Переподключиться можно в любой момент через OAuth.",
  "settings.logout": "Выйти",
  "settings.voice_setup": "Настройка голоса",
  "settings.voice_setup_cta": "Открыть настройку",
  "settings.voice_preview_cta": "Режим просмотра (без сохранения)",
  "onboarding.already_setup":
    "Твой голос уже настроен — повторная настройка заменит его (старая версия сохранится).",
  "onboarding.preview_banner":
    "Режим просмотра — в аккаунт ничего не сохраняется. Прогон настоящий, результат показывается и сбрасывается.",
  "onboarding.preview_result_title": "Предпросмотр голоса",
  "onboarding.preview_not_saved":
    "Это только предпросмотр — в аккаунт ничего не сохранилось.",
  "onboarding.preview_posts_analyzed": "Проанализировано постов:",
  "onboarding.preview_would_topics": "Будут созданы темы:",
  "onboarding.preview_full_rolebook":
    "Полный роль-бук (что использует генерация)",
  "onboarding.preview_back": "← Назад / прогнать снова",
  "onboarding.exit": "Назад",
  "onboarding.sec_intro": "Вступление",
  "onboarding.sec_themes": "Темы",
  "onboarding.sec_exclude": "Избегать",
  "onboarding.sec_voice": "Голос",
  "onboarding.sec_do": "Делать",
  "onboarding.sec_dont": "Не делать",
  "onboarding.sec_examples": "Примеры",
};
