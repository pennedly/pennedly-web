// Français — traduction complète. Même registre que EN/RU : précis,
// sans formules marketing, sans emojis. Tutoiement sur les boutons.

import type { MessageKey } from "./en";

export const fr: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Partenaire d'écriture pour ta voix sur Threads.",
  "common.loading": "chargement…",
  "common.saving": "enregistrement…",
  "common.save": "enregistrer",
  "common.cancel": "annuler",
  "common.hide": "masquer",
  "common.translate_content": "Traduire le contenu",
  "common.translating": "Traduction…",
  "common.hide_translation": "Masquer la traduction",
  "common.translation": "Traduction",
  "common.view_original": "Voir l'original",
  "common.view_translation": "Afficher la traduction",
  "common.revert": "revenir",
  "common.signed_in_as": "connecté en tant que",

  // ── Accounts / connect ─────────────────────────────────────────
  "accounts.connect": "Connecter un compte Threads",
  "accounts.connect_another": "Connecter un autre compte",
  "accounts.connecting": "Connexion…",
  "accounts.connect_error": "Échec de la connexion. Réessaie.",
  "accounts.connected": "connecté",
  "accounts.connect_cta_body":
    "Pennedly écrit dans ta voix — connecte un compte Threads pour commencer.",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Demander un accès anticipé",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "toi@example.com",
  "login.submit": "envoyer le lien de connexion",
  "login.sending": "envoi…",
  "login.no_password":
    "On t'envoie un lien à usage unique par email. Pas de mot de passe.",
  "login.signing_in": "Connexion en cours…",
  "login.sent_title": "Vérifie ta boîte mail",
  "login.sent_to": "Lien de connexion envoyé à",
  "login.sent_validity":
    "Le lien est valable 15 minutes et ne peut être utilisé qu'une fois.",
  "login.use_different_email": "utiliser un autre email",
  "login.link_invalid":
    "Ce lien n'est plus valide. Demandes-en un nouveau ci-dessous.",
  "login.signin_failed": "Échec de la connexion",
  "login.rate_limited":
    "Trop de tentatives — attends une heure et réessaie.",
  "login.email_down":
    "L'envoi d'email est indisponible. Réessaie dans une minute.",
  "login.dev_toggle_show": "mode développeur",
  "login.dev_toggle_hide": "masquer le mode développeur",
  "login.dev_explainer":
    "Saute la vérification email. Ne fonctionne que si ALLOW_DEV_LOGIN=true côté backend.",
  "login.dev_submit": "se connecter (dev)",
  "login.dev_signing_in": "connexion…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "voix",
  "dashboard.nav.audits": "audits",
  "dashboard.nav.logout": "déconnexion",
  "dashboard.generate.title": "Générer un post",
  "dashboard.generate.subtitle":
    "Dans ta voix. Le sujet est choisi à tour de rôle parmi tes sujets.",
  "dashboard.generate.button": "générer un post",
  "dashboard.generate.generating": "génération…",
  "dashboard.generate.no_topic": "sans sujet",
  "dashboard.feed.title": "Brouillons récents",
  "dashboard.feed.empty": "Aucun brouillon pour l'instant. Clique",
  "dashboard.feed.empty_cta": "générer un post",
  "dashboard.feed.empty_after": "ci-dessus pour commencer.",
  "dashboard.feed.draft_singular": "brouillon",
  "dashboard.feed.draft_plural": "brouillons",
  "dashboard.draft.edited": "modifié",
  "dashboard.draft.approve": "approuver",
  "dashboard.draft.approve_edited": "approuver la modification",
  "dashboard.draft.reject": "rejeter",
  "dashboard.draft.publish": "publier sur Threads",
  "dashboard.draft.refine_placeholder":
    "affiner : « plus court », « moins formel », « ajoute une question »…",
  "dashboard.draft.refine": "affiner",
  "dashboard.draft.refining": "affinage…",
  "dashboard.draft.refine_preset_shorter": "plus court",
  "dashboard.draft.refine_preset_informal": "moins formel",
  "dashboard.draft.refine_preset_question": "ajoute une question",
  "dashboard.draft.refine_preset_punchier": "ouverture plus percutante",
  "dashboard.toast.generated": "généré",
  "dashboard.toast.approved_as_is": "approuvé tel quel",
  "dashboard.toast.approved_edited": "approuvé avec modification",
  "dashboard.toast.rejected": "rejeté",
  "dashboard.toast.refined": "affiné",
  "dashboard.toast.published": "publié",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← tableau de bord",
  "rolebook.version_label": "voix v",
  "rolebook.parent_label": "précédente v",
  "rolebook.title": "Voix",
  "rolebook.subtitle":
    "Contrôle ce que l'IA écrit et comment. Les changements s'appliquent à la prochaine génération.",
  "rolebook.intro.label": "Intro",
  "rolebook.intro.helper": "qui écrit",
  "rolebook.intro.placeholder":
    "Un paragraphe dans ton registre : qui tu es, sur quoi tu écris.",
  "rolebook.themes_exclude.label":
    "Sujets sur lesquels l'IA ne doit JAMAIS écrire",
  "rolebook.themes_exclude.helper":
    "Si un sujet demandé tombe ici, l'IA bascule en silence vers un sujet autorisé.",
  "rolebook.themes_exclude.placeholder":
    "ex. développement d'applications",
  "rolebook.themes_include.label": "Sujets sur lesquels l'IA écrit",
  "rolebook.themes_include.helper":
    "Sois précis — « ratés en cuisine » bat « lifestyle ».",
  "rolebook.themes_include.placeholder":
    "ex. ratés en cuisine et raccourcis",
  "rolebook.voice_characteristics.label": "Caractéristiques de voix",
  "rolebook.voice_characteristics.helper":
    "Observations concrètes : « i minuscule », « phrases courtes ».",
  "rolebook.voice_characteristics.placeholder":
    "ex. tout en minuscules",
  "rolebook.do_list.label": "Faire",
  "rolebook.do_list.helper": "Procédés concrets à appuyer.",
  "rolebook.do_list.placeholder":
    "ex. ouvrir avec des questions « what's a... »",
  "rolebook.dont_list.label": "Ne pas faire",
  "rolebook.dont_list.helper": "Procédés concrets à éviter.",
  "rolebook.dont_list.placeholder": "ex. pas de hashtags ni d'emojis",
  "rolebook.examples.label": "Exemples de voix",
  "rolebook.examples.helper":
    "Phrases caractéristiques dans ta voix réelle.",
  "rolebook.examples.placeholder":
    "ex. i have burned water before. not metaphorically",
  "rolebook.extract.button": "ré-extraire des posts",
  "rolebook.extract.extracting": "extraction…",
  "rolebook.extract.confirm_title": "Ré-extraire la voix de tes posts récents ?",
  "rolebook.extract.confirm_body":
    "Analyse tes posts récents les plus vus et remplace la voix actuelle par une extraction fraîche. La version actuelle est sauvegardée comme précédente — tu peux revenir en arrière. Les modifications manuelles de la version actuelle ne sont pas conservées.",
  "rolebook.extract.confirm_cta": "ré-extraire",
  "rolebook.extract.toast_done": "voix ré-extraite de tes posts",
  "rolebook.lint.button": "vérifier les conflits",
  "rolebook.lint.checking": "vérification…",
  "rolebook.lint.section_title": "Vérification de conflits",
  "rolebook.lint.no_conflicts": "aucun conflit",
  "rolebook.save.helper":
    "Nouvelle version active à l'enregistrement · l'ancienne devient précédente",
  "rolebook.save.toast_saved_clean": "enregistré · aucun conflit",
  "rolebook.save.toast_saved_check_unavailable":
    "enregistré · vérification indisponible",
  "rolebook.transparency.title": "Ce que l'IA voit réellement",
  "rolebook.transparency.subtitle": "· assemblé depuis les sections",
  "rolebook.items_count_singular": "élément",
  "rolebook.items_count_plural": "éléments",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← tableau de bord",
  "audits.runs_at": "Lundis 09h00 UTC",
  "audits.title": "Audits",
  "audits.subtitle":
    "Chaque semaine, le coach examine la performance de tes posts et propose des ajustements de ta voix. Approuve ou rejette chaque suggestion individuellement.",
  "audits.empty":
    "Aucun audit pour l'instant. Le premier se lance le lundi après au moins une semaine de posts publiés avec métriques.",
  "audits.posts_analyzed": "posts analysés",
  "audits.decided_of_total": "décidés",
  "audits.pending_review": "en attente de ta revue",
  "audits.detail.back": "← audits",
  "audits.detail.proposed_changes": "Changements proposés",
  "audits.detail.no_changes":
    "Le coach n'a proposé aucun changement pour cette période.",
  "audits.detail.reasoning":
    "Pourquoi le coach a proposé ces changements",
  "audits.detail.suggested_fix": "Correction suggérée",
  "audits.detail.your_note": "Ta note",
  "audits.detail.note_placeholder":
    "Note optionnelle sur cette décision…",
  "audits.detail.approve": "approuver",
  "audits.detail.reject": "rejeter",
  "audits.detail.clear": "effacer",
  "audits.detail.submit": "envoyer les décisions",
  "audits.detail.submitting": "envoi…",
  "audits.detail.ready_to_submit": "prêtes à envoyer",
  "audits.detail.applied": "appliqué",
  "audits.detail.rejected_label": "rejeté",
  "audits.detail.rolled_back": "annulé",
  "audits.detail.effect": "effet",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Publier sur Threads",
  "publish.subtitle":
    "Voici le texte exact qui apparaîtra sur ton compte Threads. Impossible de l'éditer ou de le retirer depuis ici.",
  "publish.char_count": "car.",
  "publish.over_limit":
    "Threads rejettera les posts texte au-dessus de la limite.",
  "publish.cancel": "annuler",
  "publish.confirm": "publier sur Threads",
  "publish.publishing": "publication…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "traduire",
  "translate.cached": "cache",
  "translate.fresh": "nouveau",
};
