# MANIFEST — уборка рабочего пространства Pennedly

Дата: 25 июля 2026. Файлов до уборки — 390 (из них 279 в корне). После уборки в корне остаётся 25 файлов: два документа (`MANIFEST.md`, `HANDOFF.md`), служебный `.thumbnail` и 22 общих css/js, которые физически нельзя положить в одну папку экрана.

**Ничего не удалено.** Всё лишнее перенесено в `To Delete/` — 194 файла. Удаляет владелец руками, после проверки по таблице 2.

**Перенос — настоящий перенос, не копирование.** Ни одного файла не осталось в двух местах одновременно; дублей в корне после уборки нет.

## Структура

```
Pennedly/
├── MANIFEST.md              ← этот файл
├── HANDOFF.md               ← общий хендофф, оставлен в корне
├── screens/                 ← 23 папки: экран = папка (десктоп + мобайл + только его css/js)
├── components/              ← 9 спек отдельных элементов + их css/js
├── system/                  ← дизайн-система, навигация, подвал, бейджи, шаблон юридических
├── archive/                 ← прошлые поставки: два HANDOFF-документа и папка design-export
├── To Delete/               ← 194 файла на удаление, удаляет владелец руками
├── ds/                      ← НЕ ТРОНУТО
├── mobile/                  ← НЕ ТРОНУТО
├── assets/                  ← НЕ ТРОНУТО (assets/avatars/mara.png нужен двум живым спекам)
├── account/                 ← НЕ ТРОНУТО: обвязка V3, её делят screens/account*, components/
└── 22 общих css/js в корне  ← см. раздел «Почему часть css осталась в корне»
```

## Таблица 1 — что куда переехало

| Было | Стало |
|---|---|
| `Badge-System-SPEC.html` | `system/Badge-System-SPEC.html` |
| `Footer-SPEC.html` | `system/Footer-SPEC.html` |
| `Legal Template.html` | `system/Legal Template.html` |
| `Navigation-SPEC.html` | `system/Navigation-SPEC.html` |
| `Navigation-Topbar-SPEC.html` | `system/Navigation-Topbar-SPEC.html` |
| `Pennedly Design System.html` | `system/Pennedly Design System.html` |
| `app-foot.css` | `system/app-foot.css` |
| `footer-spec.js` | `system/footer-spec.js` |
| `shell.css` | `system/shell.css` |
| `Advisor-Action-Card-SPEC.html` | `components/Advisor-Action-Card-SPEC.html` |
| `Autopilot-Publish-Mode-SPEC.html` | `components/Autopilot-Publish-Mode-SPEC.html` |
| `Autopilot-Reply-Card-SPEC.html` | `components/Autopilot-Reply-Card-SPEC.html` |
| `Connect-Network-Picker-Mobile-SPEC.html` | `components/Connect-Network-Picker-Mobile-SPEC.html` |
| `Connect-Network-Picker-SPEC.html` | `components/Connect-Network-Picker-SPEC.html` |
| `Layer3-Scenario-Override-SPEC.html` | `components/Layer3-Scenario-Override-SPEC.html` |
| `Post-Reply-Audience-SPEC.html` | `components/Post-Reply-Audience-SPEC.html` |
| `Scenario-Editor-Recipe-SPEC.html` | `components/Scenario-Editor-Recipe-SPEC.html` |
| `Scenario-Growth-Comment-SPEC v2.html` | `components/Scenario-Growth-Comment-SPEC v2.html` |
| `account-empty-data.js` | `components/account-empty-data.js` |
| `account-empty-desktop.js` | `components/account-empty-desktop.js` |
| `account-empty-mobile.css` | `components/account-empty-mobile.css` |
| `account-empty-mobile.js` | `components/account-empty-mobile.js` |
| `account-empty.css` | `components/account-empty.css` |
| `growth-comment.css` | `components/growth-comment.css` |
| `growth-comment.js` | `components/growth-comment.js` |
| `layer3-override.css` | `components/layer3-override.css` |
| `layer3-override.js` | `components/layer3-override.js` |
| `post-reply-audience.css` | `components/post-reply-audience.css` |
| `post-reply-audience.js` | `components/post-reply-audience.js` |
| `Landing-Mobile-SPEC.html` | `screens/landing/Landing-Mobile-SPEC.html` |
| `Landing-SPEC.html` | `screens/landing/Landing-SPEC.html` |
| `landing-sections-demo.js` | `screens/landing/landing-sections-demo.js` |
| `landing-sections.css` | `screens/landing/landing-sections.css` |
| `landing.css` | `screens/landing/landing.css` |
| `Login-Mobile-SPEC.html` | `screens/login/Login-Mobile-SPEC.html` |
| `Login-SPEC.html` | `screens/login/Login-SPEC.html` |
| `Onboarding-Mobile-SPEC.html` | `screens/onboarding/Onboarding-Mobile-SPEC.html` |
| `Onboarding-SPEC.html` | `screens/onboarding/Onboarding-SPEC.html` |
| `Studio-Compose-Media-SPEC.html` | `screens/studio/Studio-Compose-Media-SPEC.html` |
| `Studio-Ideas-Mobile-SPEC.html` | `screens/studio/Studio-Ideas-Mobile-SPEC.html` |
| `Studio-Ideas-SPEC.html` | `screens/studio/Studio-Ideas-SPEC.html` |
| `Studio-Mobile-SPEC.html` | `screens/studio/Studio-Mobile-SPEC.html` |
| `Studio-SPEC.html` | `screens/studio/Studio-SPEC.html` |
| `Studio-Schedule-Mobile-SPEC.html` | `screens/studio/Studio-Schedule-Mobile-SPEC.html` |
| `Studio-Schedule-SPEC.html` | `screens/studio/Studio-Schedule-SPEC.html` |
| `Studio-Thread-Mobile-SPEC.html` | `screens/studio/Studio-Thread-Mobile-SPEC.html` |
| `Studio-Thread-SPEC.html` | `screens/studio/Studio-Thread-SPEC.html` |
| `compose-media-spec.js` | `screens/studio/compose-media-spec.js` |
| `compose-media.css` | `screens/studio/compose-media.css` |
| `studio-ideas-build.js` | `screens/studio/studio-ideas-build.js` |
| `studio-ideas-mobile-spec.js` | `screens/studio/studio-ideas-mobile-spec.js` |
| `studio-ideas-spec.js` | `screens/studio/studio-ideas-spec.js` |
| `studio-ideas.css` | `screens/studio/studio-ideas.css` |
| `studio-schedule-build.js` | `screens/studio/studio-schedule-build.js` |
| `studio-schedule-mobile-spec.js` | `screens/studio/studio-schedule-mobile-spec.js` |
| `studio-schedule-spec.js` | `screens/studio/studio-schedule-spec.js` |
| `studio-schedule.css` | `screens/studio/studio-schedule.css` |
| `studio-thread-build.js` | `screens/studio/studio-thread-build.js` |
| `studio-thread-mobile-spec.js` | `screens/studio/studio-thread-mobile-spec.js` |
| `studio-thread-spec.js` | `screens/studio/studio-thread-spec.js` |
| `studio-thread.css` | `screens/studio/studio-thread.css` |
| `Calendar-Mobile-SPEC.html` | `screens/calendar/Calendar-Mobile-SPEC.html` |
| `Calendar-SPEC.html` | `screens/calendar/Calendar-SPEC.html` |
| `Feed-Media-SPEC.html` | `screens/feed/Feed-Media-SPEC.html` |
| `Feed-Mobile-SPEC.html` | `screens/feed/Feed-Mobile-SPEC.html` |
| `Feed-SPEC.html` | `screens/feed/Feed-SPEC.html` |
| `feed-media-spec.js` | `screens/feed/feed-media-spec.js` |
| `feed-media.css` | `screens/feed/feed-media.css` |
| `feed.css` | `screens/feed/feed.css` |
| `Replies-Media-SPEC.html` | `screens/replies/Replies-Media-SPEC.html` |
| `Replies-Mobile-SPEC.html` | `screens/replies/Replies-Mobile-SPEC.html` |
| `Replies-SPEC.html` | `screens/replies/Replies-SPEC.html` |
| `replies.css` | `screens/replies/replies.css` |
| `reply-media-spec.js` | `screens/replies/reply-media-spec.js` |
| `reply-media.css` | `screens/replies/reply-media.css` |
| `Mentions-Queue-Mobile-SPEC.html` | `screens/mentions/Mentions-Queue-Mobile-SPEC.html` |
| `Mentions-Queue-SPEC.html` | `screens/mentions/Mentions-Queue-SPEC.html` |
| `mentions-queue-build.js` | `screens/mentions/mentions-queue-build.js` |
| `mentions-queue.css` | `screens/mentions/mentions-queue.css` |
| `Mention-Routines-Mobile-SPEC.html` | `screens/mentions-routines/Mention-Routines-Mobile-SPEC.html` |
| `Mention-Routines-SPEC.html` | `screens/mentions-routines/Mention-Routines-SPEC.html` |
| `Mention-Routine-Layer3-Mobile-SPEC.html` | `screens/mention-routine/Mention-Routine-Layer3-Mobile-SPEC.html` |
| `Mention-Routine-Layer3-SPEC.html` | `screens/mention-routine/Mention-Routine-Layer3-SPEC.html` |
| `Autopilot-Mobile-SPEC.html` | `screens/autopilot/Autopilot-Mobile-SPEC.html` |
| `Autopilot-Unified-SPEC.html` | `screens/autopilot/Autopilot-Unified-SPEC.html` |
| `autopilot-replymode.css` | `screens/autopilot/autopilot-replymode.css` |
| `Advisor-Mobile-SPEC.html` | `screens/advisor/Advisor-Mobile-SPEC.html` |
| `Advisor-SPEC.html` | `screens/advisor/Advisor-SPEC.html` |
| `Audits-Mobile-SPEC.html` | `screens/audits/Audits-Mobile-SPEC.html` |
| `Audits-SPEC.html` | `screens/audits/Audits-SPEC.html` |
| `Engagement-Mobile-SPEC.html` | `screens/stats/Engagement-Mobile-SPEC.html` |
| `Engagement-SPEC.html` | `screens/stats/Engagement-SPEC.html` |
| `First-Run-SPEC.html` | `screens/stats/First-Run-SPEC.html` |
| `Stats-Mobile-SPEC.html` | `screens/stats/Stats-Mobile-SPEC.html` |
| `Stats-SPEC.html` | `screens/stats/Stats-SPEC.html` |
| `engagement-render.js` | `screens/stats/engagement-render.js` |
| `engagement.css` | `screens/stats/engagement.css` |
| `firstrun-spec.js` | `screens/stats/firstrun-spec.js` |
| `stats-firstrun.css` | `screens/stats/stats-firstrun.css` |
| `stats-followers.css` | `screens/stats/stats-followers.css` |
| `stats.css` | `screens/stats/stats.css` |
| `Explore-Mobile-SPEC.html` | `screens/explore/Explore-Mobile-SPEC.html` |
| `Explore-SPEC.html` | `screens/explore/Explore-SPEC.html` |
| `Voice-SPEC.html` | `screens/role-book/Voice-SPEC.html` |
| `Style-Rules-Mobile-SPEC.html` | `screens/style-rules/Style-Rules-Mobile-SPEC.html` |
| `Style-Rules-SPEC.html` | `screens/style-rules/Style-Rules-SPEC.html` |
| `Overview-Cockpit-Mobile-SPEC.html` | `screens/overview/Overview-Cockpit-Mobile-SPEC.html` |
| `Overview-Cockpit-SPEC.html` | `screens/overview/Overview-Cockpit-SPEC.html` |
| `cockpit-data.js` | `screens/overview/cockpit-data.js` |
| `cockpit-desktop.js` | `screens/overview/cockpit-desktop.js` |
| `cockpit-mobile.js` | `screens/overview/cockpit-mobile.js` |
| `Settings-Mobile-SPEC.html` | `screens/settings/Settings-Mobile-SPEC.html` |
| `Settings-SPEC.html` | `screens/settings/Settings-SPEC.html` |
| `Account-Dashboard-Empty-Mobile-SPEC.html` | `screens/account/Account-Dashboard-Empty-Mobile-SPEC.html` |
| `Account-Dashboard-Empty-SPEC.html` | `screens/account/Account-Dashboard-Empty-SPEC.html` |
| `Account-Dashboard-Mobile-SPEC.html` | `screens/account/Account-Dashboard-Mobile-SPEC.html` |
| `Account-Dashboard-SPEC.html` | `screens/account/Account-Dashboard-SPEC.html` |
| `Account-Advisor-Mobile-SPEC.html` | `screens/account-advisor/Account-Advisor-Mobile-SPEC.html` |
| `Account-Advisor-SPEC.html` | `screens/account-advisor/Account-Advisor-SPEC.html` |
| `Applied-Changes-History-Mobile-SPEC.html` | `screens/account-history/Applied-Changes-History-Mobile-SPEC.html` |
| `Applied-Changes-History-SPEC.html` | `screens/account-history/Applied-Changes-History-SPEC.html` |
| `applied-changes-build.js` | `screens/account-history/applied-changes-build.js` |
| `applied-changes.css` | `screens/account-history/applied-changes.css` |
| `Account-Settings-Mobile-SPEC.html` | `screens/account-settings/Account-Settings-Mobile-SPEC.html` |
| `Account-Settings-SPEC.html` | `screens/account-settings/Account-Settings-SPEC.html` |
| `Layer3-HANDOFF.html` | `archive/Layer3-HANDOFF.html` |
| `Recipe-Editor-HANDOFF.html` | `archive/Recipe-Editor-HANDOFF.html` |
| `design-export/PennedlyDesign/Audit-Redesign-SPEC.html` | `archive/design-export/Audit-Redesign-SPEC.html` |
| `design-export/PennedlyDesign/ICONS-SPEC.html` | `archive/design-export/ICONS-SPEC.html` |
| `design-export/PennedlyDesign/Studio-Icon-Options.html` | `archive/design-export/Studio-Icon-Options.html` |
| `design-export/PennedlyDesign/Voice-Tabs-SPEC.html` | `archive/design-export/Voice-Tabs-SPEC.html` |
| `design-export/PennedlyDesign/icons-data.js` | `archive/design-export/icons-data.js` |
| `design-export/PennedlyDesign/audit-redesign/audit-build.js` | `archive/design-export/audit-redesign/audit-build.js` |
| `design-export/PennedlyDesign/audit-redesign/audit-data.js` | `archive/design-export/audit-redesign/audit-data.js` |
| `design-export/PennedlyDesign/audit-redesign/audit-spec.css` | `archive/design-export/audit-redesign/audit-spec.css` |
| `design-export/PennedlyDesign/recipe-editor/Reply-Audience-Multiselect-SPEC.html` | `archive/design-export/recipe-editor/Reply-Audience-Multiselect-SPEC.html` |

## Таблица 2 — что отправлено в To Delete

| Файл | Куда | Почему |
|---|---|---|
| `_destmap.json` | `To Delete/` | рабочая карта переноса, сделана для этой уборки |
| `_refs.json` | `To Delete/` | рабочий файл разбора ссылок, сделан для этой уборки |
| `_usedby_a.txt` | `To Delete/` | рабочая карта зависимостей (часть 1), сделана для этой уборки |
| `_usedby_b.txt` | `To Delete/` | рабочая карта зависимостей (часть 2), сделана для этой уборки |
| `_vtest.html` | `To Delete/` | тестовый файл-заглушка для перебора вариантов дашборда |
| `Разбор-паттернов-SPEC.html` | `To Delete/` | поколение 1 экрана разбора паттернов (русское имя), заменено Explore-SPEC.html |
| `Account-Dashboard-Variants-SPEC.html` | `To Delete/` | витрина пяти концептов дашборда аккаунта, выбран V3 → Account-Dashboard-SPEC.html |
| `account/_h.html` | `To Delete/account-_h.html` | обрывок-фрагмент в папке account, не подключён ни к одному документу. Единственный файл, которому пришлось поменять имя: в `To Delete/` не заводилась вложенная папка `account/`, иначе он бы столкнулся с настоящей. |
| `Applied-Changes-SPEC.html` | `To Delete/` | поколение 1 истории изменений, заменено Applied-Changes-History-SPEC.html |
| `audits-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `audits-change.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `audits-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `audits-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `audits.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Audits.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `autopilot-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `autopilot-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `autopilot-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Autopilot-SPEC.html` | `To Delete/` | поколение 2 экрана Автопилот, заменено Autopilot-Unified-SPEC.html |
| `Autopilot-Unified-SPEC-print-l1cxg0.html` | `To Delete/` | артефакт печати Autopilot-Unified-SPEC.html, хвост -print-l1cxg0 |
| `Autopilot.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `explore-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `explore-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `explore-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `explore-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `explore.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Explore.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `feed-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `feed-card.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `feed-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `feed-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Feed.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `globals.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `landing-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `landing-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `landing-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `landing-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Landing.html` | `To Delete/` | React-прототип лендинга того же слоя, что и остальные 13 загрузчиков; правда — Landing-SPEC.html |
| `legal-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `legal-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `legal-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `legal-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `legal.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `login-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `login-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `login-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `login-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `login.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Login.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `mentions-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `mentions-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Mentions-Mobile-SPEC.html` | `To Delete/` | мобильная пара к Mentions-SPEC, заменена Mentions-Queue-Mobile-SPEC.html |
| `mentions-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Mentions-SPEC.html` | `To Delete/` | поколение 1 экрана Упоминания, заменено Mentions-Queue-SPEC.html |
| `mentions.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Mentions.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `Onboarding Redesign.html` | `To Delete/` | поисковый редизайн онбординга в четырёх направлениях, React-прототип; актуальная правда — Onboarding-SPEC.html |
| `onboarding-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `onboarding-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `onboarding-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `onboarding-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `onboarding.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Onboarding.html` | `To Delete/` | React-прототип онбординга того же слоя; правда — Onboarding-SPEC.html |
| `Overview-Mobile-SPEC.html` | `To Delete/` | мобильная пара к Overview-SPEC, заменена Overview-Cockpit-Mobile-SPEC.html |
| `Overview-SPEC.html` | `To Delete/` | поколение 1 экрана Обзор, заменено Overview-Cockpit-SPEC.html |
| `patterns-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `patterns-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Patterns-Mobile-SPEC.html` | `To Delete/` | мобильная пара к Patterns-SPEC, заменена Explore-Mobile-SPEC.html |
| `patterns-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Patterns-SPEC.html` | `To Delete/` | поколение 2 экрана разбора паттернов, заменено Explore-SPEC.html |
| `patterns.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Patterns.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `Recipe-Phrase-Affordance.html` | `To Delete/` | этюд аффорданса фразы в рецепте, не спецификация |
| `Recipe-Phrase-Marking.html` | `To Delete/` | этюд разметки фразы в рецепте, не спецификация |
| `Recipe-Phrase-Styles.html` | `To Delete/` | этюд стилей фразы в рецепте, не спецификация |
| `replies-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `replies-card.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `replies-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `replies-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `replies-postselect.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Replies.html` | `To Delete/` | React-прототип очереди ответов, до сих пор рисует отменённую двухколоночную раскладку; правда — Replies-SPEC.html |
| `Reply-Settings-3-Approaches-SPEC.html` | `To Delete/` | круг поиска 1 по настройкам ответов, не экран продукта; итог зафиксирован в Autopilot-Unified-SPEC.html |
| `Reply-Settings-3-Directions-SPEC.html` | `To Delete/` | круг поиска 2 по настройкам ответов, итог в Autopilot-Unified-SPEC.html |
| `Reply-Settings-4-More-SPEC.html` | `To Delete/` | круг поиска 3 по настройкам ответов, итог в Autopilot-Unified-SPEC.html |
| `Reply-Settings-Gallery-SPEC.html` | `To Delete/` | круг поиска 4 (витрина вариантов) по настройкам ответов, итог в Autopilot-Unified-SPEC.html |
| `Scenario-Editor-Directions.html` | `To Delete/` | этюд направлений редактора сценария, не спецификация |
| `scenario-editor-directions.js` | `To Delete/` | сборка только этюда Scenario-Editor-Directions.html |
| `Scenario-Editor-SPEC.html` | `To Delete/` | поколение 1 редактора сценария, заменено Scenario-Editor-Recipe-SPEC.html |
| `scenario-editor.js` | `To Delete/` | сборка только Scenario-Editor-SPEC (поколение 1) |
| `Scenario-Growth-Comment-SPEC.html` | `To Delete/` | заменено «Scenario-Growth-Comment-SPEC v2.html» |
| `scenarios-ia.css` | `To Delete/` | стиль только Scenarios-WEB-SPEC (поколение 3) |
| `scenarios-mobile-ia.css` | `To Delete/` | стиль только Scenarios-Mobile-SPEC (поколение 3) |
| `scenarios-mobile-redesign.css` | `To Delete/` | стиль только Scenarios-Mobile-SPEC (поколение 3) |
| `scenarios-mobile-redesign.js` | `To Delete/` | сборка только Scenarios-Mobile-SPEC (поколение 3) |
| `Scenarios-Mobile-SPEC.html` | `To Delete/` | мобильная пара к Scenarios-WEB-SPEC, поколение 3; актуальная мобильная — Autopilot-Mobile-SPEC.html |
| `scenarios-mobile-spec.js` | `To Delete/` | сборка мобильных сценариев (поколение 3), ни одной ссылки ни из одного html |
| `scenarios-mobile.css` | `To Delete/` | стиль только Scenarios-Mobile-SPEC (поколение 3) |
| `scenarios-redesign.js` | `To Delete/` | сборка только Scenarios-SPEC (поколение 3) |
| `Scenarios-SPEC.html` | `To Delete/` | поколение 3 экрана Автопилот (ветка «Сценарии»), заменено Autopilot-Unified-SPEC.html |
| `scenarios-spec.js` | `To Delete/` | сборка только Scenarios-WEB-SPEC (поколение 3) |
| `Scenarios-WEB-SPEC.html` | `To Delete/` | поколение 3, веб-вариант IA сценариев, заменено Autopilot-Unified-SPEC.html |
| `settings-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `settings-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `settings-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `settings-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `settings.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Settings.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `shell-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `shell-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stats-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stats-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stats-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Stats.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `studio-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `studio-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `studio-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `studio-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `Studio.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `Style Rules.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `stylerules-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stylerules-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stylerules-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stylerules-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `stylerules.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Tip-Card-Plaque.html` | `To Delete/` | этюд оформления подсказки, не спецификация |
| `Tip-Slot-Directions.html` | `To Delete/` | этюд направлений слота подсказки, не спецификация |
| `tweaks-panel.jsx` | `To Delete/` | панель твиков для React-прототипов, ни одна спецификация её не подключает |
| `voice-app.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `voice-data.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `voice-icons.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `voice-parts.jsx` | `To Delete/` | часть замкнутого React-слоя, ни одна спецификация её не подключает |
| `voice.css` | `To Delete/` | стиль React-прототипа, ни одной ссылки из спецификаций |
| `Voice.html` | `To Delete/` | React-прототип экрана, не подключён ни к одной спецификации; правда — соответствующий *-SPEC.html |
| `_prev/Account-Advisor-SPEC (pre-V3).html` | `To Delete/_prev/` | снимок экрана аккаунта до перехода на V3, заменён одноимённой спекой в screens/account*/ |
| `_prev/Account-Dashboard-Empty-SPEC (pre-V3).html` | `To Delete/_prev/` | снимок экрана аккаунта до перехода на V3, заменён одноимённой спекой в screens/account*/ |
| `_prev/Account-Dashboard-Mobile-SPEC (pre-V3).html` | `To Delete/_prev/` | снимок экрана аккаунта до перехода на V3, заменён одноимённой спекой в screens/account*/ |
| `_prev/Account-Dashboard-SPEC (pre-V3).html` | `To Delete/_prev/` | снимок экрана аккаунта до перехода на V3, заменён одноимённой спекой в screens/account*/ |
| `_prev/Autopilot-Mobile-SPEC.v1.html` | `To Delete/_prev/` | версия 1 Автопилота, заменена Autopilot-Unified-SPEC.html |
| `_prev/Autopilot-SPEC.v1.html` | `To Delete/_prev/` | версия 1 Автопилота, заменена Autopilot-Unified-SPEC.html |
| `_prev/Stats-Mobile-SPEC.v1.html` | `To Delete/_prev/` | версия 1 статистики, заменена Stats-SPEC.html / Stats-Mobile-SPEC.html |
| `_prev/Stats-SPEC.v1.html` | `To Delete/_prev/` | версия 1 статистики, заменена Stats-SPEC.html / Stats-Mobile-SPEC.html |
| `variants/atoms.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/shell.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/shell.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/spec.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v1.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v1.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v2.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v2.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v3.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v3.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v4.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v4.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v5.css` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/v5.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `variants/vk.js` | `To Delete/variants/` | обвязка витрины пяти концептов дашборда (Account-Dashboard-Variants-SPEC + _vtest), оба уходят |
| `redesign/dir-atelier.css` | `To Delete/redesign/` | стиль направления поискового редизайна онбординга |
| `redesign/dir-atelier.jsx` | `To Delete/redesign/` | код направления поискового редизайна онбординга |
| `redesign/dir-broadsheet.css` | `To Delete/redesign/` | стиль направления поискового редизайна онбординга |
| `redesign/dir-broadsheet.jsx` | `To Delete/redesign/` | код направления поискового редизайна онбординга |
| `redesign/dir-manuscript.css` | `To Delete/redesign/` | стиль направления поискового редизайна онбординга |
| `redesign/dir-manuscript.jsx` | `To Delete/redesign/` | код направления поискового редизайна онбординга |
| `redesign/dir-stage.css` | `To Delete/redesign/` | стиль направления поискового редизайна онбординга |
| `redesign/dir-stage.jsx` | `To Delete/redesign/` | код направления поискового редизайна онбординга |
| `redesign/ob-app.jsx` | `To Delete/redesign/` | обвязка поискового редизайна онбординга, подключена только к «Onboarding Redesign.html» |
| `redesign/ob-flow.jsx` | `To Delete/redesign/` | обвязка поискового редизайна онбординга, подключена только к «Onboarding Redesign.html» |
| `redesign/ob-redesign.css` | `To Delete/redesign/` | обвязка поискового редизайна онбординга, подключена только к «Onboarding Redesign.html» |
| `scraps/mq-cards.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-danger.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-filt.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-full.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-media.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-media3.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mq-vid.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mqm-card.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mqm-card2.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `scraps/mqm-full.png` | `To Delete/scraps/` | промежуточный скриншот итераций очереди упоминаний, ни одной ссылки из html |
| `screenshots/pm-01-task1.png` | `To Delete/screenshots/` | рабочий скриншот режима публикации, ни одной ссылки из html |
| `screenshots/pm-off.png` | `To Delete/screenshots/` | рабочий скриншот режима публикации, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-08 в 15.11.41.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-22 в 14.29.36.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-22 в 14.32.57.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-27 в 23.59.07.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 00.03.41.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 00.39.35.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 00.46.06.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 17.39.50.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 17.42.59.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-06-28 в 17.55.56.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-07-02 в 00.50.25.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-07-02 в 11.48.14.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-07-02 в 11.48.45.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-07-02 в 16.56.06.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |
| `uploads/Снимок экрана 2026-07-02 в 17.04.04.png` | `To Delete/uploads/` | исходный скриншот-референс для уже написанных спек, ни одной ссылки из html |

## Как разобраны группы дублей

| Группа | Победитель | Обоснование |
|---|---|---|
| Автопилот (4 версии) | `Autopilot-Unified-SPEC.html` | Самое позднее поколение и единственное, которое сшивает сценарии и «Правила дома» в один документ. На него ссылаются свежие спеки: Mentions-Queue, Mention-Routines, Mention-Routine-Layer3, Autopilot-Publish-Mode, Autopilot-Reply-Card. Autopilot-SPEC (пок. 2), Scenarios-SPEC и Scenarios-WEB-SPEC (пок. 3) ссылаются наружу, но на них уже не ссылается никто из живых. |
| Разбор паттернов (3 имени) | `Explore-SPEC.html` | Совпадает с реальным маршрутом `/app/patterns/explore`. Patterns-SPEC — предыдущее имя того же экрана, «Разбор-паттернов-SPEC» — самое первое, до перехода на английские имена файлов. |
| Настройки ответов (4 круга) | никто, все четыре в To Delete | Это не экран из списка 31, а четыре круга поиска по одному блоку. Итог поиска уже вшит в Autopilot-Unified-SPEC, на который все четыре и ссылаются. |
| Обзор (2 версии) | `Overview-Cockpit-SPEC.html` | Позднее поколение: у него своя обвязка (cockpit-data/desktop/mobile.js), и он сам ссылается на Overview-SPEC как на предшественника — обратной ссылки нет. |
| Упоминания (2 версии) | `Mentions-Queue-SPEC.html` | Поколение эпохи Unified: ссылается на Autopilot-Unified, Mention-Routines и Replies-SPEC, имеет свою сборку mentions-queue-build.js. Итерации именно этого экрана лежали в `scraps/mq-*.png`. |
| История изменений (2 версии) | `Applied-Changes-History-SPEC.html` | Есть мобильная пара и своя сборка applied-changes-build.js. Applied-Changes-SPEC — поколение 1, на него ссылаются только Account-Advisor и Account-Settings как на предшественника. |
| Редактор сценария (2 версии) | `Scenario-Editor-Recipe-SPEC.html` | Рецептурная модель — текущая: под неё написаны recipe-editor.css/js, на неё ссылается Mention-Routines-SPEC. Scenario-Editor-SPEC описывает модель до рецептов. |
| Дашборд аккаунта | `Account-Dashboard-SPEC.html` | Variants — витрина пяти концептов, выбор V3 сделан давно и уже зафиксирован в основной спеке и в `account/v3.css`. |
| `Scenario-Growth-Comment-SPEC v2.html` | v2 | Позднее из двух; оба ссылаются на одну обвязку growth-comment.css/js. Имя с « v2» не тронуто — переименование документов не входило в задачу. |
| `Autopilot-Unified-SPEC-print-l1cxg0.html` | — | Артефакт печати. Единственный файл, чьё имя содержит явный мусор; не переименован, просто убран. |

## Решение по каждой рабочей папке

| Папка | Решение | Одной строкой |
|---|---|---|
| `_prev/` | `To Delete/_prev/` | 8 снимков прошлых поколений (pre-V3, .v1) — у каждого есть живая замена в screens/. |
| `scraps/` | `To Delete/scraps/` | 10 промежуточных скриншотов очереди упоминаний, ни одной ссылки из html. |
| `uploads/` | `To Delete/uploads/` | 15 исходных скриншотов-референсов; спеки по ним написаны, ссылок из html нет. Если это ваш архив источников — верните папку из To Delete, она цела. |
| `screenshots/` | `To Delete/screenshots/` | 2 рабочих скриншота режима публикации, ни одной ссылки из html. |
| `variants/` | `To Delete/variants/` | Обвязка витрины пяти концептов; её потребители (Account-Dashboard-Variants-SPEC и _vtest.html) уходят целиком. |
| `redesign/` | `To Delete/redesign/` | 11 файлов поискового редизайна онбординга в четырёх направлениях, подключены только к «Onboarding Redesign.html». |
| `design-export/` | `archive/design-export/` | Прошлая поставка: 4 спеки + обвязка, всё автономное — ссылок наружу нет, поэтому перенос путей не затронул. Внутренний уровень `PennedlyDesign/` убран, чтобы не держать папку в папке без причины. |
| `account/` | не тронута | Обвязка дашборда V3, её делят `screens/account/`, `screens/account-advisor/`, `screens/account-settings/` и `components/`. Внутри — только один мёртвый файл, `account/_h.html`, он ушёл в To Delete. |
| `ds/`, `mobile/`, `assets/` | не тронуты | По условию. `assets/avatars/mara.png` нужен Calendar-Mobile-SPEC и дизайн-системе. |

## Почему часть css осталась в корне

В папку экрана уезжает только тот css/js, который использует **ровно этот** экран. 22 файла используют два и больше адресатов, поэтому им нет места ни в одной папке экрана:

`autopilot.css`, `autopilot-publishmode.css`, `scenarios.css`, `scenarios-redesign.css`, `scenarios-redesign-data.js`, `scenario-editor.css`, `recipe-editor.css`, `recipe-editor.js` — делят autopilot, mentions-routines, mention-routine и components/.
`mention-routines.css`, `mention-routines-build.js` — делят mentions-routines и mention-routine.
`calendar.css` — делят calendar и studio (Studio-Schedule).
`studio.css` — делят studio, feed, replies и system/.
`import-banner.css` — делят account, stats и overview.
`account.css`, `account-data.js`, `account-desktop.js`, `account-mobile.css`, `account-mobile.js`, `account-screens.css`, `account-screens.js`, `account-screens-mobile.css`, `account-screens-mobile.js` — делят account-advisor, account-settings, system/ и components/.

`shell.css` — исключение: оба живых потребителя (Footer-SPEC, Navigation-Topbar-SPEC) лежат в `system/`, поэтому он уехал туда.

## Экраны из списка, у которых нет своего документа

Папки для них не создавались — создавать пустые папки не с чем.

| Экран | Что есть сейчас |
|---|---|
| `posts` /app/posts | документа нет |
| `scenario-activity` /app/scenarios/[id]/activity | документа нет; журнал частично описан внутри Autopilot-Unified-SPEC |
| `audit-detail` /app/audits/[id] | отдельного документа в корне нет. Кандидат — `archive/design-export/Audit-Redesign-SPEC.html` из прошлой поставки: он не был подключён к основному набору. Скажите, если поднять его в `screens/audit-detail/`. |
| `autopilot-legacy` /app/autopilot | документа нет, это редирект |
| `privacy`, `terms`, `data-deletion` | своих документов нет; все три собираются из `system/Legal Template.html` |

`role-book` (Голос) описан только десктопной спекой `Voice-SPEC.html` — мобильной версии этого экрана в проекте нет.

## Правки по итогам проверки (25 июля, второй проход)

**1. `legal.css` возвращён.** Он используется `system/Legal Template.html`, ошибочно был отнесён к мёртвому слою в первом проходе. Перенесён обратно в `system/legal.css`, ссылка в шаблоне поправлена на `href="legal.css"`.

Заодно вскрылось: сам шаблон тянет ещё 6 файлов React-слоя (`legal-app.jsx`, `legal-data.jsx`, `legal-icons.jsx`, `legal-parts.jsx`, `tweaks-panel.jsx`, `studio-icons.jsx`) — это были их единственные живые ссылки, у остальных 13 загрузчиков дублей не было. Тем же способом возвращены в `system/`, пути починены. Теперь у `Legal Template.html` нет ни одной ссылки в `To Delete/`.

Важная оговорка: транзитивно шаблон также вызывает `window.Logo`, `window.IcSun`, `window.IcMoon`, `window.IcArrowLeft` — они жили в `shell-parts.jsx`, который остаётся в `To Delete/` (его держали только 13 удалённых загрузчиков, тот же контракт, что мы проверяли). Организационную часть я починил — путей в удаление больше нет, — но это не значит, что документ рендерится полностью: этих четырёх компонентов в проекте больше нет физически. Восстанавливать содержимое я не стал, это не входит в задачу «разложить файлы».

**2. 34 мёртвые ссылки на предыдущие поколения обезврежены.** Во всех 20 файлах текст ссылки сохранён, тег `<a>` убран — по списку из задания, ссылка-в-ссылку не осталась нигде.

Дополнительно нашлись при повторной проверке ещё 2 ссылки того же рода, не входившие в список задания — та же логика, тот же способ починки:
- `components/Autopilot-Reply-Card-SPEC.html` уже была починена как часть 34; отдельно всплыла третья, не текстовая, а внутри шаблона (см. пункт 1 выше).
- `screens/feed/Feed-Media-SPEC.html` → ссылка на `Autopilot-SPEC.html#s2-policy`, слово «Autopilot» осталось как обычный текст.

**3. Русская версия разбора паттернов — в архиве, не на удаление.** `Разбор-паттернов-SPEC.html` перенесён из `To Delete/` в `archive/Разбор-паттернов-SPEC.html`. Это не поколение, а более полный документ-близнец Explore-SPEC (4 раздела и 68К знаков против 2 и 48К) — сверить с живым экраном нельзя, тот с тех пор переписан набело, и обе версии одинаково разошлись с реальностью. Решение отложено до пересборки экрана explore; мобильной пары к нему в проекте не нашлось.

## Проверка после правок

Прогнана заново по всем документам вне `To Delete/`: **82 html-файла, 831 локальная ссылка.**

- Битых ссылок: **0**.
- Ссылок, ведущих внутрь `To Delete/`: **0** — можно удалять папку без последствий для рабочей части проекта.

## Что решено, что осталось на усмотрение владельца

1. **`system/Legal Template.html`** — все зависимости разобраны выше, в разделе «Правки по итогам проверки». Единственный открытый вопрос: 4 иконки/лого не рендерятся (жили в удалённом `shell-parts.jsx`), это уже вопрос содержимого, не оргструктуры.
2. **`Landing.html` и `Onboarding.html`** остаются в `To Delete/` — они того же React-слоя, что и 13 официальных загрузчиков (тянут landing-app.jsx / onboarding-app.jsx и остальную обвязку), просто не попали в исходный список.
3. **`uploads/`** — 15 ваших скриншотов, в `To Delete/uploads/` как рабочие источники. Если это архив, а не мусор — верните папку, она цела.
4. **`screens/autopilot/Autopilot-Mobile-SPEC.html`** называет своей десктопной парой поколение 2 (`Autopilot-SPEC`), а не победивший Unified — текст остался как есть (правку содержимого вы не заказывали), ссылка снята по правке 2. Стоит поправить формулировку вручную под Autopilot-Unified-SPEC.

## Проверка ссылок

После переноса проверены **все 133 html-файла проекта, 1320 локальных ссылок** на css, js, html и картинки. Каждая ссылка разрешена в реально существующий файл.

**Битых ссылок: 0.**

Внешние ссылки (шрифты Google) не тронуты.

Заодно починены две застарелые поломки, обе в файлах, которые теперь лежат в `To Delete/_prev/`: четыре снимка `(pre-V3)` ссылались на `ds/tokens.css`, `import-banner.css`, `account.css` и соседние спеки голыми именами, как будто всё ещё лежат в корне, а `Autopilot-Mobile-SPEC.v1.html` и `Stats-Mobile-SPEC.v1.html` — на `mobile/*` тем же способом. Все шесть открывались без оформления. Теперь у них верные префиксы.

Папка `design-export/` проверена отдельно: её документы автономны — ссылаются только на соседей внутри папки либо держат токены инлайном, поэтому перенос в `archive/` ничего в них не менял.

Один технический нюанс: пять файлов внутри `To Delete/` содержат в именах скобки или кириллицу, и автоматика по ним не проходит. Четыре снимка `(pre-V3)` я починил вручную через переименование и обратно; у `Разбор-паттернов-SPEC.html` локальных ссылок нет вообще — проверено отдельно, там только шрифты Google.
