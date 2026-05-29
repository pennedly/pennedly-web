// Deutsch — vollständige Übersetzung. Stil wie in EN/RU: technisch
// präzise, ohne Marketing-Floskeln, ohne Emojis. Buttons im du-Modus.

import type { MessageKey } from "./en";

export const de: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Schreibpartner für deine Stimme auf Threads.",
  "common.loading": "lade…",
  "common.saving": "speichere…",
  "common.save": "speichern",
  "common.cancel": "abbrechen",
  "common.hide": "verbergen",
  "common.translate_content": "Inhalt übersetzen",
  "common.translating": "Übersetze…",
  "common.hide_translation": "Übersetzung ausblenden",
  "common.translation": "Übersetzung",
  "common.view_original": "Original ansehen",
  "common.view_translation": "Übersetzung anzeigen",
  "common.revert": "zurücksetzen",
  "common.signed_in_as": "angemeldet als",

  // ── Accounts / connect ─────────────────────────────────────────
  "accounts.connect": "Threads-Konto verbinden",
  "accounts.connect_another": "Weiteres Konto verbinden",
  "accounts.connecting": "Verbinde…",
  "accounts.connect_error": "Verbindung fehlgeschlagen. Versuche es erneut.",
  "accounts.connected": "verbunden",
  "accounts.connect_cta_body":
    "Pennedly schreibt in deiner Stimme — verbinde ein Threads-Konto, um zu starten.",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Frühen Zugang anfragen",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "E-Mail",
  "login.email_placeholder": "du@example.com",
  "login.submit": "Anmelde-Link senden",
  "login.sending": "sende…",
  "login.no_password":
    "Wir schicken dir einen Einmal-Link per E-Mail. Kein Passwort nötig.",
  "login.signing_in": "Melde dich an…",
  "login.sent_title": "Prüfe dein Postfach",
  "login.sent_to": "Wir haben einen Anmelde-Link gesendet an",
  "login.sent_validity":
    "Der Link ist 15 Minuten gültig und kann nur einmal verwendet werden.",
  "login.use_different_email": "andere E-Mail verwenden",
  "login.link_invalid":
    "Dieser Anmelde-Link ist nicht mehr gültig. Fordere unten einen neuen an.",
  "login.signin_failed": "Anmeldung fehlgeschlagen",
  "login.rate_limited":
    "Zu viele Anmeldeversuche — warte eine Stunde und versuche es erneut.",
  "login.email_down":
    "E-Mail-Versand ist gerade nicht verfügbar. Versuche es in einer Minute erneut.",
  "login.dev_toggle_show": "Entwicklermodus",
  "login.dev_toggle_hide": "Entwicklermodus verbergen",
  "login.dev_explainer":
    "Überspringt die E-Mail-Verifizierung. Funktioniert nur, wenn ALLOW_DEV_LOGIN=true im Backend gesetzt ist.",
  "login.dev_submit": "Dev-Anmeldung",
  "login.dev_signing_in": "anmelden…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "stimme",
  "dashboard.nav.audits": "audits",
  "dashboard.nav.logout": "abmelden",
  "dashboard.generate.title": "Beitrag generieren",
  "dashboard.generate.subtitle":
    "In deiner Stimme. Thema wird abwechselnd aus deinen Themen gewählt.",
  "dashboard.generate.button": "Beitrag generieren",
  "dashboard.generate.generating": "generiere…",
  "dashboard.generate.no_topic": "ohne Thema",
  "dashboard.feed.title": "Neueste Entwürfe",
  "dashboard.feed.empty": "Noch keine Entwürfe. Klicke",
  "dashboard.feed.empty_cta": "Beitrag generieren",
  "dashboard.feed.empty_after": "oben, um zu starten.",
  "dashboard.feed.draft_singular": "Entwurf",
  "dashboard.feed.draft_plural": "Entwürfe",
  "dashboard.draft.edited": "bearbeitet",
  "dashboard.draft.approve": "freigeben",
  "dashboard.draft.approve_edited": "Bearbeitung freigeben",
  "dashboard.draft.reject": "ablehnen",
  "dashboard.draft.publish": "auf Threads veröffentlichen",
  "dashboard.draft.refine_placeholder":
    "verfeinern: «kürzer machen», «weniger formell», «Frage einfügen»…",
  "dashboard.draft.refine": "verfeinern",
  "dashboard.draft.refining": "verfeinere…",
  "dashboard.draft.refine_preset_shorter": "kürzer machen",
  "dashboard.draft.refine_preset_informal": "weniger formell",
  "dashboard.draft.refine_preset_question": "Frage einfügen",
  "dashboard.draft.refine_preset_punchier": "knackigerer Einstieg",
  "dashboard.toast.generated": "generiert",
  "dashboard.toast.approved_as_is": "wie geschrieben freigegeben",
  "dashboard.toast.approved_edited": "mit Bearbeitung freigegeben",
  "dashboard.toast.rejected": "abgelehnt",
  "dashboard.toast.refined": "verfeinert",
  "dashboard.toast.published": "veröffentlicht",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← Dashboard",
  "rolebook.version_label": "Stimme v",
  "rolebook.parent_label": "vorherige v",
  "rolebook.title": "Stimme",
  "rolebook.subtitle":
    "Steuere, was die KI schreibt und wie. Änderungen gelten für die nächste Generierung.",
  "rolebook.intro.label": "Einleitung",
  "rolebook.intro.helper": "wer schreibt",
  "rolebook.intro.placeholder":
    "Ein Absatz in deinem Stil: wer du bist, worüber du schreibst.",
  "rolebook.themes_exclude.label":
    "Themen, über die die KI NIE schreiben darf",
  "rolebook.themes_exclude.helper":
    "Wenn ein Thema hier landet, wechselt die KI stillschweigend zu einem erlaubten.",
  "rolebook.themes_exclude.placeholder": "z. B. App-Entwicklung",
  "rolebook.themes_include.label": "Themen, über die die KI schreibt",
  "rolebook.themes_include.helper":
    "Sei konkret — «Küchen-Fails» schlägt «Lifestyle».",
  "rolebook.themes_include.placeholder":
    "z. B. Küchen-Fails und Kochabkürzungen",
  "rolebook.voice_characteristics.label": "Stimm-Merkmale",
  "rolebook.voice_characteristics.helper":
    "Konkrete Beobachtungen: «kleines i», «kurze Sätze».",
  "rolebook.voice_characteristics.placeholder":
    "z. B. durchgehend Kleinbuchstaben",
  "rolebook.do_list.label": "Tun",
  "rolebook.do_list.helper":
    "Konkrete Mittel, die verstärkt werden sollen.",
  "rolebook.do_list.placeholder":
    "z. B. mit «what's a...»-Fragen beginnen",
  "rolebook.dont_list.label": "Nicht tun",
  "rolebook.dont_list.helper": "Konkrete Mittel, die zu vermeiden sind.",
  "rolebook.dont_list.placeholder": "z. B. keine Hashtags und Emojis",
  "rolebook.examples.label": "Stimm-Beispiele",
  "rolebook.examples.helper": "Typische Sätze in deiner echten Stimme.",
  "rolebook.examples.placeholder":
    "z. B. i have burned water before. not metaphorically",
  "rolebook.extract.button": "aus Beiträgen neu ableiten",
  "rolebook.extract.extracting": "leite ab…",
  "rolebook.extract.confirm_title": "Stimme aus aktuellen Beiträgen neu ableiten?",
  "rolebook.extract.confirm_body":
    "Analysiert deine meistgesehenen aktuellen Beiträge und ersetzt die aktuelle Stimme durch eine frische Ableitung. Die aktuelle Version wird als vorherige gespeichert — du kannst zurücksetzen. Manuelle Änderungen der aktuellen Version werden nicht übernommen.",
  "rolebook.extract.confirm_cta": "neu ableiten",
  "rolebook.extract.toast_done": "Stimme aus deinen Beiträgen neu abgeleitet",
  "rolebook.lint.button": "auf Konflikte prüfen",
  "rolebook.lint.checking": "prüfe…",
  "rolebook.lint.section_title": "Konfliktprüfung",
  "rolebook.lint.no_conflicts": "keine Konflikte gefunden",
  "rolebook.save.helper":
    "Neue aktive Version beim Speichern · alte wird zur vorherigen",
  "rolebook.save.toast_saved_clean": "gespeichert · keine Konflikte",
  "rolebook.save.toast_saved_check_unavailable":
    "gespeichert · Konfliktprüfung nicht verfügbar",
  "rolebook.transparency.title": "Was die KI tatsächlich sieht",
  "rolebook.transparency.subtitle": "· zusammengesetzt aus obigen Abschnitten",
  "rolebook.items_count_singular": "Eintrag",
  "rolebook.items_count_plural": "Einträge",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← Dashboard",
  "audits.runs_at": "Montags 09:00 UTC",
  "audits.title": "Audits",
  "audits.subtitle":
    "Jede Woche prüft der Coach, wie deine Beiträge performt haben, und schlägt Anpassungen deiner Stimme vor. Jeden Vorschlag einzeln freigeben oder ablehnen.",
  "audits.empty":
    "Noch keine Audits. Das erste läuft am Montag nach mindestens einer Woche veröffentlichter Beiträge mit Metriken.",
  "audits.posts_analyzed": "Beiträge analysiert",
  "audits.decided_of_total": "entschieden",
  "audits.pending_review": "warten auf deine Prüfung",
  "audits.detail.back": "← Audits",
  "audits.detail.proposed_changes": "Vorgeschlagene Änderungen",
  "audits.detail.no_changes":
    "Der Coach hat in diesem Zeitraum keine Änderungen vorgeschlagen.",
  "audits.detail.reasoning":
    "Warum der Coach diese Änderungen vorgeschlagen hat",
  "audits.detail.suggested_fix": "Vorgeschlagene Korrektur",
  "audits.detail.your_note": "Deine Notiz",
  "audits.detail.note_placeholder":
    "Optionale Notiz zu dieser Entscheidung…",
  "audits.detail.approve": "freigeben",
  "audits.detail.reject": "ablehnen",
  "audits.detail.clear": "zurücksetzen",
  "audits.detail.submit": "Entscheidungen senden",
  "audits.detail.submitting": "sende…",
  "audits.detail.ready_to_submit": "bereit zum Senden",
  "audits.detail.applied": "angewendet",
  "audits.detail.rejected_label": "abgelehnt",
  "audits.detail.rolled_back": "zurückgerollt",
  "audits.detail.effect": "Effekt",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Auf Threads veröffentlichen",
  "publish.subtitle":
    "Das ist der exakte Text, der in deinem Threads-Account erscheint. Er kann von hier aus nicht bearbeitet oder zurückgenommen werden.",
  "publish.char_count": "Zeichen",
  "publish.over_limit":
    "Threads lehnt reine Textbeiträge über dem Limit ab.",
  "publish.cancel": "abbrechen",
  "publish.confirm": "auf Threads veröffentlichen",
  "publish.publishing": "veröffentliche…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "übersetzen",
  "translate.cached": "Cache",
  "translate.fresh": "frisch",
};
