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
  "common.revert": "вернуть",
  "common.signed_in_as": "вошёл как",

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
};
