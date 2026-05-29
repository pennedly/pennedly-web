// Українська — повний переклад. Стиль збігається з EN/RU: технічно
// щільний, без зайвої маркетингової води, без емодзі.

import type { MessageKey } from "./en";

export const uk: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Допомагає писати у твоєму голосі на Threads.",
  "common.loading": "завантаження…",
  "common.saving": "зберігаю…",
  "common.save": "зберегти",
  "common.cancel": "скасувати",
  "common.hide": "сховати",
  "common.translate_content": "Перекласти вміст",
  "common.translating": "Перекладаю…",
  "common.hide_translation": "Сховати переклад",
  "common.translation": "Переклад",
  "common.view_original": "Переглянути оригінал",
  "common.view_translation": "Показати переклад",
  "common.revert": "повернути",
  "common.signed_in_as": "увійшов як",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Запросити ранній доступ",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "ти@example.com",
  "login.submit": "надіслати посилання для входу",
  "login.sending": "надсилаю…",
  "login.no_password":
    "Надішлемо одноразове посилання на email. Пароль не потрібен.",
  "login.signing_in": "Авторизую…",
  "login.sent_title": "Перевір пошту",
  "login.sent_to": "Надіслали посилання для входу на",
  "login.sent_validity":
    "Посилання діє 15 хвилин і спрацьовує один раз.",
  "login.use_different_email": "інший email",
  "login.link_invalid":
    "Це посилання більше не діє. Запроси нове нижче.",
  "login.signin_failed": "Вхід не вдався",
  "login.rate_limited":
    "Забагато спроб входу — спробуй через годину.",
  "login.email_down":
    "Доставка листів зараз недоступна. Спробуй за хвилину.",
  "login.dev_toggle_show": "режим розробника",
  "login.dev_toggle_hide": "сховати режим розробника",
  "login.dev_explainer":
    "Без перевірки email. Працює лише коли на беку ALLOW_DEV_LOGIN=true.",
  "login.dev_submit": "увійти (dev)",
  "login.dev_signing_in": "вхід…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "голос",
  "dashboard.nav.audits": "аудити",
  "dashboard.nav.logout": "вийти",
  "dashboard.generate.title": "Згенерувати пост",
  "dashboard.generate.subtitle":
    "У твоєму голосі. Тема обирається по колу з твоїх тем.",
  "dashboard.generate.button": "згенерувати пост",
  "dashboard.generate.generating": "генерую…",
  "dashboard.generate.no_topic": "без теми",
  "dashboard.feed.title": "Останні чернетки",
  "dashboard.feed.empty": "Чернеток поки немає. Тисни",
  "dashboard.feed.empty_cta": "згенерувати пост",
  "dashboard.feed.empty_after": "зверху, щоб почати.",
  "dashboard.feed.draft_singular": "чернетка",
  "dashboard.feed.draft_plural": "чернеток",
  "dashboard.draft.edited": "відредаговано",
  "dashboard.draft.approve": "схвалити",
  "dashboard.draft.approve_edited": "схвалити з правкою",
  "dashboard.draft.reject": "відхилити",
  "dashboard.draft.publish": "опублікувати у Threads",
  "dashboard.draft.refine_placeholder":
    "уточнити: «коротше», «менш формально», «додай питання»…",
  "dashboard.draft.refine": "уточнити",
  "dashboard.draft.refining": "уточнюю…",
  "dashboard.draft.refine_preset_shorter": "коротше",
  "dashboard.draft.refine_preset_informal": "менш формально",
  "dashboard.draft.refine_preset_question": "додай питання",
  "dashboard.draft.refine_preset_punchier": "яскравіший початок",
  "dashboard.toast.generated": "згенеровано",
  "dashboard.toast.approved_as_is": "схвалено як є",
  "dashboard.toast.approved_edited": "схвалено з правкою",
  "dashboard.toast.rejected": "відхилено",
  "dashboard.toast.refined": "уточнено",
  "dashboard.toast.published": "опубліковано",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← дашборд",
  "rolebook.version_label": "голос v",
  "rolebook.parent_label": "попередня v",
  "rolebook.title": "Голос",
  "rolebook.subtitle":
    "Керуй тим, що пише AI і як. Зміни застосуються до наступної генерації.",
  "rolebook.intro.label": "Опис",
  "rolebook.intro.helper": "хто пише",
  "rolebook.intro.placeholder":
    "Один абзац своїми словами: хто ти, про що пишеш.",
  "rolebook.themes_exclude.label":
    "Теми, про які AI НІКОЛИ не має писати",
  "rolebook.themes_exclude.helper":
    "Якщо запитана тема потрапляє сюди — AI мовчки перемикається на дозволену.",
  "rolebook.themes_exclude.placeholder": "наприклад, розробка додатків",
  "rolebook.themes_include.label": "Теми, про які AI пише",
  "rolebook.themes_include.helper":
    "Конкретно — «провали на кухні» краще ніж «лайфстайл».",
  "rolebook.themes_include.placeholder":
    "наприклад, кулінарні провали та шорткати",
  "rolebook.voice_characteristics.label": "Характеристики голосу",
  "rolebook.voice_characteristics.helper":
    "Конкретні спостереження: «маленька i», «короткі речення».",
  "rolebook.voice_characteristics.placeholder":
    "наприклад, скрізь малі літери",
  "rolebook.do_list.label": "Робити",
  "rolebook.do_list.helper": "Конкретні прийоми, які підсилювати.",
  "rolebook.do_list.placeholder":
    "наприклад, починати з «what's a...» питань",
  "rolebook.dont_list.label": "Не робити",
  "rolebook.dont_list.helper": "Конкретні прийоми, яких уникати.",
  "rolebook.dont_list.placeholder": "наприклад, без хештегів та емодзі",
  "rolebook.examples.label": "Приклади голосу",
  "rolebook.examples.helper":
    "Характерні фрази у твоєму реальному голосі.",
  "rolebook.examples.placeholder":
    "наприклад, i have burned water before. not metaphorically",
  "rolebook.extract.button": "витягти заново з постів",
  "rolebook.extract.extracting": "витягую…",
  "rolebook.extract.confirm_title": "Витягти голос заново з останніх постів?",
  "rolebook.extract.confirm_body":
    "Проаналізую твої найбільш переглядувані недавні пости й заміню поточний голос свіжим витягом. Поточна версія збережеться як попередня — можна відкотити. Ручні правки поточної версії не перенесуться.",
  "rolebook.extract.confirm_cta": "витягти заново",
  "rolebook.extract.toast_done": "голос заново витягнуто з твоїх постів",
  "rolebook.lint.button": "перевірити конфлікти",
  "rolebook.lint.checking": "перевіряю…",
  "rolebook.lint.section_title": "Перевірка конфліктів",
  "rolebook.lint.no_conflicts": "конфліктів не знайдено",
  "rolebook.save.helper":
    "Нова активна версія при збереженні · стара стає попередньою",
  "rolebook.save.toast_saved_clean": "збережено · без конфліктів",
  "rolebook.save.toast_saved_check_unavailable":
    "збережено · перевірка недоступна",
  "rolebook.transparency.title": "Що AI насправді бачить",
  "rolebook.transparency.subtitle": "· зібрано з секцій вище",
  "rolebook.items_count_singular": "елемент",
  "rolebook.items_count_plural": "елементів",
  "rolebook.translated_empty":
    "Поки порожньо — відкрий оригінал, щоб заповнити голос.",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← дашборд",
  "audits.runs_at": "Понеділки 09:00 UTC",
  "audits.title": "Аудити",
  "audits.subtitle":
    "Щотижня коуч аналізує, як спрацювали твої пости, і пропонує правки голосу. Схвалюй або відхиляй кожну пропозицію окремо.",
  "audits.empty":
    "Аудитів поки немає. Перший запуститься в понеділок після того, як накопиться хоча б тиждень опублікованих постів з метриками.",
  "audits.posts_analyzed": "постів проаналізовано",
  "audits.decided_of_total": "вирішено",
  "audits.pending_review": "чекають твого рішення",
  "audits.detail.back": "← аудити",
  "audits.detail.proposed_changes": "Запропоновані зміни",
  "audits.detail.no_changes":
    "Коуч не запропонував змін за цей період.",
  "audits.detail.reasoning": "Чому коуч запропонував ці зміни",
  "audits.detail.suggested_fix": "Запропоноване виправлення",
  "audits.detail.your_note": "Твоя нотатка",
  "audits.detail.note_placeholder":
    "Опціональна нотатка до цього рішення…",
  "audits.detail.approve": "схвалити",
  "audits.detail.reject": "відхилити",
  "audits.detail.clear": "скинути",
  "audits.detail.submit": "надіслати рішення",
  "audits.detail.submitting": "надсилаю…",
  "audits.detail.ready_to_submit": "готові до надсилання",
  "audits.detail.applied": "застосовано",
  "audits.detail.rejected_label": "відхилено",
  "audits.detail.rolled_back": "відкочено",
  "audits.detail.effect": "ефект",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Опублікувати у Threads",
  "publish.subtitle":
    "Це точний текст, який з'явиться на твоєму акаунті Threads. Після публікації редагувати або видалити звідси неможливо.",
  "publish.char_count": "симв.",
  "publish.over_limit":
    "Threads не прийме текстовий пост понад ліміт.",
  "publish.cancel": "скасувати",
  "publish.confirm": "опублікувати у Threads",
  "publish.publishing": "публікую…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "перекласти",
  "translate.cached": "з кешу",
  "translate.fresh": "свіже",
};
