// Português — tradução completa. Variante neutra que serve Brasil
// (o público maior do Threads) e Portugal sem alienar nenhum dos
// dois. Botões no informal, sem emojis.

import type { MessageKey } from "./en";

export const pt: Partial<Record<MessageKey, string>> = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Parceiro de escrita para sua voz no Threads.",
  "common.loading": "carregando…",
  "common.saving": "salvando…",
  "common.save": "salvar",
  "common.cancel": "cancelar",
  "common.hide": "ocultar",
  "common.translate_content": "Traduzir conteúdo",
  "common.translating": "Traduzindo…",
  "common.hide_translation": "Ocultar tradução",
  "common.translation": "Tradução",
  "common.view_original": "Ver original",
  "common.view_translation": "Mostrar tradução",
  "common.revert": "reverter",
  "common.signed_in_as": "conectado como",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Solicitar acesso antecipado",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "voce@example.com",
  "login.submit": "enviar link de acesso",
  "login.sending": "enviando…",
  "login.no_password":
    "Vamos te mandar um link único por email. Sem senha.",
  "login.signing_in": "Entrando…",
  "login.sent_title": "Confira sua caixa de entrada",
  "login.sent_to": "Enviamos um link de acesso para",
  "login.sent_validity":
    "O link é válido por 15 minutos e pode ser usado uma única vez.",
  "login.use_different_email": "usar outro email",
  "login.link_invalid":
    "Este link não é mais válido. Solicite um novo abaixo.",
  "login.signin_failed": "Falha no acesso",
  "login.rate_limited":
    "Muitas tentativas — aguarde uma hora e tente de novo.",
  "login.email_down":
    "Envio de email indisponível agora. Tente em um minuto.",
  "login.dev_toggle_show": "modo desenvolvedor",
  "login.dev_toggle_hide": "ocultar modo desenvolvedor",
  "login.dev_explainer":
    "Pula a verificação de email. Só funciona com ALLOW_DEV_LOGIN=true no backend.",
  "login.dev_submit": "entrar (dev)",
  "login.dev_signing_in": "entrando…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "voz",
  "dashboard.nav.audits": "auditorias",
  "dashboard.nav.logout": "sair",
  "dashboard.generate.title": "Gerar um post",
  "dashboard.generate.subtitle":
    "Na sua voz. O tema é escolhido em rodízio entre seus temas.",
  "dashboard.generate.button": "gerar post",
  "dashboard.generate.generating": "gerando…",
  "dashboard.generate.no_topic": "sem tema",
  "dashboard.feed.title": "Rascunhos recentes",
  "dashboard.feed.empty": "Nenhum rascunho ainda. Clique em",
  "dashboard.feed.empty_cta": "gerar post",
  "dashboard.feed.empty_after": "acima para começar.",
  "dashboard.feed.draft_singular": "rascunho",
  "dashboard.feed.draft_plural": "rascunhos",
  "dashboard.draft.edited": "editado",
  "dashboard.draft.approve": "aprovar",
  "dashboard.draft.approve_edited": "aprovar com edição",
  "dashboard.draft.reject": "rejeitar",
  "dashboard.draft.publish": "publicar no Threads",
  "dashboard.draft.refine_placeholder":
    "refinar: «mais curto», «menos formal», «adicione uma pergunta»…",
  "dashboard.draft.refine": "refinar",
  "dashboard.draft.refining": "refinando…",
  "dashboard.draft.refine_preset_shorter": "mais curto",
  "dashboard.draft.refine_preset_informal": "menos formal",
  "dashboard.draft.refine_preset_question": "adicione uma pergunta",
  "dashboard.draft.refine_preset_punchier": "abertura mais impactante",
  "dashboard.toast.generated": "gerado",
  "dashboard.toast.approved_as_is": "aprovado como está",
  "dashboard.toast.approved_edited": "aprovado com sua edição",
  "dashboard.toast.rejected": "rejeitado",
  "dashboard.toast.refined": "refinado",
  "dashboard.toast.published": "publicado",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← painel",
  "rolebook.version_label": "voz v",
  "rolebook.parent_label": "anterior v",
  "rolebook.title": "Voz",
  "rolebook.subtitle":
    "Controle o que a IA escreve e como. Mudanças se aplicam à próxima geração.",
  "rolebook.intro.label": "Intro",
  "rolebook.intro.helper": "quem escreve",
  "rolebook.intro.placeholder":
    "Um parágrafo no seu registro: quem você é, sobre o que escreve.",
  "rolebook.themes_exclude.label":
    "Temas sobre os quais a IA NUNCA deve escrever",
  "rolebook.themes_exclude.helper":
    "Se um tema pedido cair aqui, a IA troca em silêncio por um permitido.",
  "rolebook.themes_exclude.placeholder":
    "ex. desenvolvimento de apps",
  "rolebook.themes_include.label": "Temas sobre os quais a IA escreve",
  "rolebook.themes_include.helper":
    "Seja específico — «desastres na cozinha» vence «lifestyle».",
  "rolebook.themes_include.placeholder":
    "ex. desastres na cozinha e atalhos",
  "rolebook.voice_characteristics.label": "Características de voz",
  "rolebook.voice_characteristics.helper":
    "Observações concretas: «i minúsculo», «frases curtas».",
  "rolebook.voice_characteristics.placeholder":
    "ex. tudo em minúsculas",
  "rolebook.do_list.label": "Fazer",
  "rolebook.do_list.helper": "Recursos concretos para enfatizar.",
  "rolebook.do_list.placeholder":
    "ex. abrir com perguntas «what's a...»",
  "rolebook.dont_list.label": "Não fazer",
  "rolebook.dont_list.helper": "Recursos concretos a evitar.",
  "rolebook.dont_list.placeholder": "ex. sem hashtags nem emojis",
  "rolebook.examples.label": "Exemplos de voz",
  "rolebook.examples.helper":
    "Frases representativas na sua voz real.",
  "rolebook.examples.placeholder":
    "ex. i have burned water before. not metaphorically",
  "rolebook.extract.button": "re-extrair dos posts",
  "rolebook.extract.extracting": "extraindo…",
  "rolebook.extract.confirm_title": "Re-extrair a voz dos seus posts recentes?",
  "rolebook.extract.confirm_body":
    "Analisa seus posts recentes mais vistos e substitui a voz atual por uma extração nova. A versão atual é salva como anterior — você pode reverter. Edições manuais da versão atual não são mantidas.",
  "rolebook.extract.confirm_cta": "re-extrair",
  "rolebook.extract.toast_done": "voz re-extraída dos seus posts",
  "rolebook.lint.button": "verificar conflitos",
  "rolebook.lint.checking": "verificando…",
  "rolebook.lint.section_title": "Verificação de conflitos",
  "rolebook.lint.no_conflicts": "nenhum conflito",
  "rolebook.save.helper":
    "Nova versão ativa ao salvar · a antiga vira anterior",
  "rolebook.save.toast_saved_clean": "salvo · sem conflitos",
  "rolebook.save.toast_saved_check_unavailable":
    "salvo · verificação indisponível",
  "rolebook.transparency.title": "O que a IA realmente vê",
  "rolebook.transparency.subtitle": "· montado a partir das seções",
  "rolebook.items_count_singular": "item",
  "rolebook.items_count_plural": "itens",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← painel",
  "audits.runs_at": "Segundas 09:00 UTC",
  "audits.title": "Auditorias",
  "audits.subtitle":
    "Toda semana o coach analisa o desempenho dos seus posts e propõe ajustes na sua voz. Aprove ou rejeite cada sugestão individualmente.",
  "audits.empty":
    "Sem auditorias ainda. A primeira roda na segunda depois de pelo menos uma semana de posts publicados com métricas.",
  "audits.posts_analyzed": "posts analisados",
  "audits.decided_of_total": "decididos",
  "audits.pending_review": "aguardando sua revisão",
  "audits.detail.back": "← auditorias",
  "audits.detail.proposed_changes": "Mudanças propostas",
  "audits.detail.no_changes":
    "O coach não propôs mudanças neste período.",
  "audits.detail.reasoning":
    "Por que o coach propôs estas mudanças",
  "audits.detail.suggested_fix": "Correção sugerida",
  "audits.detail.your_note": "Sua nota",
  "audits.detail.note_placeholder":
    "Nota opcional sobre esta decisão…",
  "audits.detail.approve": "aprovar",
  "audits.detail.reject": "rejeitar",
  "audits.detail.clear": "limpar",
  "audits.detail.submit": "enviar decisões",
  "audits.detail.submitting": "enviando…",
  "audits.detail.ready_to_submit": "prontas para envio",
  "audits.detail.applied": "aplicado",
  "audits.detail.rejected_label": "rejeitado",
  "audits.detail.rolled_back": "revertido",
  "audits.detail.effect": "efeito",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Publicar no Threads",
  "publish.subtitle":
    "Este é o texto exato que aparecerá no seu Threads. Não dá para editar nem retirar daqui.",
  "publish.char_count": "carac.",
  "publish.over_limit":
    "O Threads rejeitará posts só de texto acima do limite.",
  "publish.cancel": "cancelar",
  "publish.confirm": "publicar no Threads",
  "publish.publishing": "publicando…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "traduzir",
  "translate.cached": "cache",
  "translate.fresh": "novo",
};
