// Italiano — traduzione completa. Stesso registro di EN/RU: tecnico,
// senza fronzoli di marketing, senza emoji. Tu su pulsanti.

import type { MessageKey } from "./en";

export const it: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Compagno di scrittura per la tua voce su Threads.",
  "common.loading": "caricamento…",
  "common.saving": "salvataggio…",
  "common.save": "salva",
  "common.cancel": "annulla",
  "common.hide": "nascondi",
  "common.revert": "ripristina",
  "common.signed_in_as": "accesso effettuato come",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Richiedi accesso anticipato",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "tu@example.com",
  "login.submit": "invia link di accesso",
  "login.sending": "invio…",
  "login.no_password":
    "Ti invieremo un link monouso via email. Nessuna password.",
  "login.signing_in": "Accesso in corso…",
  "login.sent_title": "Controlla la posta",
  "login.sent_to": "Abbiamo inviato un link di accesso a",
  "login.sent_validity":
    "Il link è valido 15 minuti e si usa una volta sola.",
  "login.use_different_email": "usa un'altra email",
  "login.link_invalid":
    "Questo link non è più valido. Richiedine uno nuovo qui sotto.",
  "login.signin_failed": "Accesso fallito",
  "login.rate_limited":
    "Troppi tentativi — aspetta un'ora e riprova.",
  "login.email_down":
    "L'invio email non è disponibile. Riprova tra un minuto.",
  "login.dev_toggle_show": "modalità sviluppatore",
  "login.dev_toggle_hide": "nascondi modalità sviluppatore",
  "login.dev_explainer":
    "Salta la verifica email. Funziona solo se ALLOW_DEV_LOGIN=true sul backend.",
  "login.dev_submit": "accedi (dev)",
  "login.dev_signing_in": "accesso…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "voce",
  "dashboard.nav.audits": "audit",
  "dashboard.nav.logout": "esci",
  "dashboard.generate.title": "Genera un post",
  "dashboard.generate.subtitle":
    "Nella tua voce. Argomento scelto a turno dai tuoi argomenti.",
  "dashboard.generate.button": "genera post",
  "dashboard.generate.generating": "generazione…",
  "dashboard.generate.no_topic": "senza argomento",
  "dashboard.feed.title": "Bozze recenti",
  "dashboard.feed.empty": "Nessuna bozza. Premi",
  "dashboard.feed.empty_cta": "genera post",
  "dashboard.feed.empty_after": "sopra per iniziare.",
  "dashboard.feed.draft_singular": "bozza",
  "dashboard.feed.draft_plural": "bozze",
  "dashboard.draft.edited": "modificato",
  "dashboard.draft.approve": "approva",
  "dashboard.draft.approve_edited": "approva modifica",
  "dashboard.draft.reject": "rifiuta",
  "dashboard.draft.publish": "pubblica su Threads",
  "dashboard.draft.refine_placeholder":
    "affina: «più corto», «meno formale», «aggiungi una domanda»…",
  "dashboard.draft.refine": "affina",
  "dashboard.draft.refining": "affino…",
  "dashboard.draft.refine_preset_shorter": "più corto",
  "dashboard.draft.refine_preset_informal": "meno formale",
  "dashboard.draft.refine_preset_question": "aggiungi una domanda",
  "dashboard.draft.refine_preset_punchier": "apertura più incisiva",
  "dashboard.toast.generated": "generato",
  "dashboard.toast.approved_as_is": "approvato così com'è",
  "dashboard.toast.approved_edited": "approvato con modifica",
  "dashboard.toast.rejected": "rifiutato",
  "dashboard.toast.refined": "affinato",
  "dashboard.toast.published": "pubblicato",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← dashboard",
  "rolebook.version_label": "voce v",
  "rolebook.parent_label": "precedente v",
  "rolebook.title": "Voce",
  "rolebook.subtitle":
    "Controlla cosa scrive l'AI e come. Le modifiche si applicano alla prossima generazione.",
  "rolebook.intro.label": "Intro",
  "rolebook.intro.helper": "chi scrive",
  "rolebook.intro.placeholder":
    "Un paragrafo nel tuo registro: chi sei, di cosa scrivi.",
  "rolebook.themes_exclude.label":
    "Argomenti su cui l'AI NON deve MAI scrivere",
  "rolebook.themes_exclude.helper":
    "Se un argomento richiesto cade qui, l'AI passa silenziosamente a uno permesso.",
  "rolebook.themes_exclude.placeholder":
    "es. sviluppo di app",
  "rolebook.themes_include.label": "Argomenti su cui l'AI scrive",
  "rolebook.themes_include.helper":
    "Sii specifico — «disastri in cucina» batte «lifestyle».",
  "rolebook.themes_include.placeholder":
    "es. disastri in cucina e scorciatoie",
  "rolebook.voice_characteristics.label": "Caratteristiche di voce",
  "rolebook.voice_characteristics.helper":
    "Osservazioni concrete: «i minuscola», «frasi brevi».",
  "rolebook.voice_characteristics.placeholder":
    "es. tutto minuscolo",
  "rolebook.do_list.label": "Fare",
  "rolebook.do_list.helper": "Mosse concrete da enfatizzare.",
  "rolebook.do_list.placeholder":
    "es. aprire con domande «what's a...»",
  "rolebook.dont_list.label": "Non fare",
  "rolebook.dont_list.helper": "Mosse concrete da evitare.",
  "rolebook.dont_list.placeholder": "es. niente hashtag né emoji",
  "rolebook.examples.label": "Esempi di voce",
  "rolebook.examples.helper":
    "Frasi rappresentative nella tua voce reale.",
  "rolebook.examples.placeholder":
    "es. i have burned water before. not metaphorically",
  "rolebook.lint.button": "controlla conflitti",
  "rolebook.lint.checking": "controllo…",
  "rolebook.lint.section_title": "Controllo conflitti",
  "rolebook.lint.no_conflicts": "nessun conflitto",
  "rolebook.save.helper":
    "Nuova versione attiva al salvataggio · la vecchia diventa precedente",
  "rolebook.save.toast_saved_clean": "salvato · nessun conflitto",
  "rolebook.save.toast_saved_check_unavailable":
    "salvato · controllo non disponibile",
  "rolebook.transparency.title": "Cosa vede davvero l'AI",
  "rolebook.transparency.subtitle": "· assemblato dalle sezioni",
  "rolebook.items_count_singular": "elemento",
  "rolebook.items_count_plural": "elementi",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← dashboard",
  "audits.runs_at": "Lunedì 09:00 UTC",
  "audits.title": "Audit",
  "audits.subtitle":
    "Ogni settimana il coach analizza come hanno performato i tuoi post e propone modifiche alla tua voce. Approva o rifiuta ogni suggerimento singolarmente.",
  "audits.empty":
    "Ancora nessun audit. Il primo parte il lunedì dopo almeno una settimana di post pubblicati con metriche.",
  "audits.posts_analyzed": "post analizzati",
  "audits.decided_of_total": "decisi",
  "audits.pending_review": "in attesa di revisione",
  "audits.detail.back": "← audit",
  "audits.detail.proposed_changes": "Modifiche proposte",
  "audits.detail.no_changes":
    "Il coach non ha proposto modifiche per questo periodo.",
  "audits.detail.reasoning":
    "Perché il coach ha proposto queste modifiche",
  "audits.detail.suggested_fix": "Correzione suggerita",
  "audits.detail.your_note": "La tua nota",
  "audits.detail.note_placeholder":
    "Nota opzionale su questa decisione…",
  "audits.detail.approve": "approva",
  "audits.detail.reject": "rifiuta",
  "audits.detail.clear": "azzera",
  "audits.detail.submit": "invia decisioni",
  "audits.detail.submitting": "invio…",
  "audits.detail.ready_to_submit": "pronte all'invio",
  "audits.detail.applied": "applicato",
  "audits.detail.rejected_label": "rifiutato",
  "audits.detail.rolled_back": "annullato",
  "audits.detail.effect": "effetto",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Pubblica su Threads",
  "publish.subtitle":
    "Questo è il testo esatto che apparirà sul tuo account Threads. Non si può modificare o ritirare da qui.",
  "publish.char_count": "car.",
  "publish.over_limit":
    "Threads rifiuterà i post solo testo oltre il limite.",
  "publish.cancel": "annulla",
  "publish.confirm": "pubblica su Threads",
  "publish.publishing": "pubblico…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "traduci",
  "translate.cached": "cache",
  "translate.fresh": "nuovo",
};
