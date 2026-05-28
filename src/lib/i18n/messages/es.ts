// Español — traducción completa. Estilo igual al EN/RU: técnicamente
// preciso, sin paja de marketing, sin emojis. Tuteo en botones.

import type { MessageKey } from "./en";

export const es: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Compañero de escritura para tu voz en Threads.",
  "common.loading": "cargando…",
  "common.saving": "guardando…",
  "common.save": "guardar",
  "common.cancel": "cancelar",
  "common.hide": "ocultar",
  "common.revert": "revertir",
  "common.signed_in_as": "sesión iniciada como",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Solicitar acceso anticipado",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "tu@example.com",
  "login.submit": "enviar enlace de inicio de sesión",
  "login.sending": "enviando…",
  "login.no_password":
    "Te enviaremos un enlace de un solo uso por email. Sin contraseña.",
  "login.signing_in": "Iniciando sesión…",
  "login.sent_title": "Revisa tu bandeja",
  "login.sent_to": "Enviamos un enlace de inicio de sesión a",
  "login.sent_validity":
    "El enlace es válido por 15 minutos y solo puede usarse una vez.",
  "login.use_different_email": "usar otro email",
  "login.link_invalid":
    "Este enlace ya no es válido. Solicita uno nuevo abajo.",
  "login.signin_failed": "Inicio de sesión fallido",
  "login.rate_limited":
    "Demasiados intentos — espera una hora y vuelve a intentar.",
  "login.email_down":
    "El envío de email no está disponible. Inténtalo en un minuto.",
  "login.dev_toggle_show": "modo desarrollador",
  "login.dev_toggle_hide": "ocultar modo desarrollador",
  "login.dev_explainer":
    "Omite la verificación por email. Solo funciona si ALLOW_DEV_LOGIN=true está activo en el backend.",
  "login.dev_submit": "iniciar sesión (dev)",
  "login.dev_signing_in": "iniciando…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "voz",
  "dashboard.nav.audits": "auditorías",
  "dashboard.nav.logout": "cerrar sesión",
  "dashboard.generate.title": "Generar una publicación",
  "dashboard.generate.subtitle":
    "Con tu voz. El tema se elige por turnos entre tus temas.",
  "dashboard.generate.button": "generar publicación",
  "dashboard.generate.generating": "generando…",
  "dashboard.generate.no_topic": "sin tema",
  "dashboard.feed.title": "Borradores recientes",
  "dashboard.feed.empty": "Aún no hay borradores. Pulsa",
  "dashboard.feed.empty_cta": "generar publicación",
  "dashboard.feed.empty_after": "arriba para empezar.",
  "dashboard.feed.draft_singular": "borrador",
  "dashboard.feed.draft_plural": "borradores",
  "dashboard.draft.edited": "editado",
  "dashboard.draft.approve": "aprobar",
  "dashboard.draft.approve_edited": "aprobar edición",
  "dashboard.draft.reject": "rechazar",
  "dashboard.draft.publish": "publicar en Threads",
  "dashboard.draft.refine_placeholder":
    "refinar: «más corto», «menos formal», «añade una pregunta»…",
  "dashboard.draft.refine": "refinar",
  "dashboard.draft.refining": "refinando…",
  "dashboard.draft.refine_preset_shorter": "más corto",
  "dashboard.draft.refine_preset_informal": "menos formal",
  "dashboard.draft.refine_preset_question": "añade una pregunta",
  "dashboard.draft.refine_preset_punchier": "apertura más punzante",
  "dashboard.toast.generated": "generado",
  "dashboard.toast.approved_as_is": "aprobado tal cual",
  "dashboard.toast.approved_edited": "aprobado con tu edición",
  "dashboard.toast.rejected": "rechazado",
  "dashboard.toast.refined": "refinado",
  "dashboard.toast.published": "publicado",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← panel",
  "rolebook.version_label": "voz v",
  "rolebook.parent_label": "anterior v",
  "rolebook.title": "Voz",
  "rolebook.subtitle":
    "Controla qué escribe la IA y cómo. Los cambios se aplican a la próxima generación.",
  "rolebook.intro.label": "Intro",
  "rolebook.intro.helper": "quién escribe",
  "rolebook.intro.placeholder":
    "Un párrafo en tu propio registro: quién eres, sobre qué escribes.",
  "rolebook.themes_exclude.label":
    "Temas sobre los que la IA NUNCA debe escribir",
  "rolebook.themes_exclude.helper":
    "Si un tema solicitado cae aquí, la IA cambia silenciosamente a uno permitido.",
  "rolebook.themes_exclude.placeholder":
    "ej. desarrollo de aplicaciones",
  "rolebook.themes_include.label": "Temas sobre los que la IA escribe",
  "rolebook.themes_include.helper":
    "Sé específico — «fracasos en la cocina» supera a «lifestyle».",
  "rolebook.themes_include.placeholder":
    "ej. fracasos en la cocina y atajos",
  "rolebook.voice_characteristics.label": "Características de voz",
  "rolebook.voice_characteristics.helper":
    "Observaciones concretas: «i minúscula», «frases cortas».",
  "rolebook.voice_characteristics.placeholder":
    "ej. todo en minúsculas",
  "rolebook.do_list.label": "Hacer",
  "rolebook.do_list.helper": "Recursos específicos para reforzar.",
  "rolebook.do_list.placeholder":
    "ej. abrir con preguntas «what's a...»",
  "rolebook.dont_list.label": "No hacer",
  "rolebook.dont_list.helper": "Recursos específicos para evitar.",
  "rolebook.dont_list.placeholder": "ej. sin hashtags ni emojis",
  "rolebook.examples.label": "Ejemplos de voz",
  "rolebook.examples.helper": "Frases representativas en tu voz real.",
  "rolebook.examples.placeholder":
    "ej. i have burned water before. not metaphorically",
  "rolebook.lint.button": "comprobar conflictos",
  "rolebook.lint.checking": "comprobando…",
  "rolebook.lint.section_title": "Comprobación de conflictos",
  "rolebook.lint.no_conflicts": "sin conflictos",
  "rolebook.save.helper":
    "Nueva versión activa al guardar · la antigua pasa a anterior",
  "rolebook.save.toast_saved_clean": "guardado · sin conflictos",
  "rolebook.save.toast_saved_check_unavailable":
    "guardado · comprobación no disponible",
  "rolebook.transparency.title": "Lo que la IA ve realmente",
  "rolebook.transparency.subtitle": "· ensamblado desde las secciones",
  "rolebook.items_count_singular": "elemento",
  "rolebook.items_count_plural": "elementos",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← panel",
  "audits.runs_at": "Lunes 09:00 UTC",
  "audits.title": "Auditorías",
  "audits.subtitle":
    "Cada semana el coach revisa cómo rindieron tus publicaciones y propone ediciones a tu voz. Aprueba o rechaza cada sugerencia individualmente.",
  "audits.empty":
    "Aún no hay auditorías. La primera se ejecutará el lunes tras al menos una semana de publicaciones con métricas.",
  "audits.posts_analyzed": "publicaciones analizadas",
  "audits.decided_of_total": "decididas",
  "audits.pending_review": "esperan tu revisión",
  "audits.detail.back": "← auditorías",
  "audits.detail.proposed_changes": "Cambios propuestos",
  "audits.detail.no_changes":
    "El coach no propuso cambios para este período.",
  "audits.detail.reasoning":
    "Por qué el coach propuso estos cambios",
  "audits.detail.suggested_fix": "Corrección sugerida",
  "audits.detail.your_note": "Tu nota",
  "audits.detail.note_placeholder":
    "Nota opcional sobre esta decisión…",
  "audits.detail.approve": "aprobar",
  "audits.detail.reject": "rechazar",
  "audits.detail.clear": "limpiar",
  "audits.detail.submit": "enviar decisiones",
  "audits.detail.submitting": "enviando…",
  "audits.detail.ready_to_submit": "listas para enviar",
  "audits.detail.applied": "aplicado",
  "audits.detail.rejected_label": "rechazado",
  "audits.detail.rolled_back": "revertido",
  "audits.detail.effect": "efecto",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Publicar en Threads",
  "publish.subtitle":
    "Este es el texto exacto que aparecerá en tu cuenta de Threads. No se puede editar ni retirar desde aquí.",
  "publish.char_count": "car.",
  "publish.over_limit":
    "Threads rechazará publicaciones de solo texto que excedan el límite.",
  "publish.cancel": "cancelar",
  "publish.confirm": "publicar en Threads",
  "publish.publishing": "publicando…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "traducir",
  "translate.cached": "cacheado",
  "translate.fresh": "nuevo",
};
