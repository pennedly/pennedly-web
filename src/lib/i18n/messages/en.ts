// English — the canonical message catalog. Every key shipped in the
// UI lives here first; other locales translate against this set and
// fall back to en if a key is missing.
//
// Keep keys flat (one level deep) for fast lookup and easy diff. Use
// dot-separated namespaces ('dashboard.generate.button') rather than
// nested objects so missing-key fallback is a single string lookup.

export const en = {
  // ── Shared ─────────────────────────────────────────────────────
  "app.brand": "Pennedly",
  "app.tagline": "Drafting partner for your Threads voice.",
  "common.loading": "loading…",
  "common.saving": "saving…",
  "common.save": "save",
  "common.cancel": "cancel",
  "common.hide": "hide",
  "common.translate_content": "Translate content",
  "common.translating": "Translating…",
  "common.hide_translation": "Hide translation",
  "common.translation": "Translation",
  "common.view_original": "View original",
  "common.view_translation": "Show translation",
  "common.revert": "revert",
  "common.signed_in_as": "signed in as",

  // ── Accounts / connect ─────────────────────────────────────────
  "accounts.connect": "Connect Threads account",
  "accounts.connect_another": "Connect another account",
  "accounts.connecting": "Connecting…",
  "accounts.connect_error": "Couldn't connect. Try again.",
  "accounts.connected": "connected",
  "accounts.connect_cta_body":
    "Pennedly drafts in your voice — connect a Threads account to start.",

  // ── Landing ────────────────────────────────────────────────────
  "landing.cta": "Get early access",

  // ── Login ──────────────────────────────────────────────────────
  "login.email_label": "email",
  "login.email_placeholder": "you@example.com",
  "login.submit": "send sign-in link",
  "login.sending": "sending…",
  "login.no_password": "We'll email you a one-time link. No password needed.",
  "login.signing_in": "Signing you in…",
  "login.sent_title": "Check your inbox",
  "login.sent_to": "We sent a sign-in link to",
  "login.sent_validity":
    "The link is valid for 15 minutes and can only be used once.",
  "login.use_different_email": "use a different email",
  "login.link_invalid":
    "This sign-in link is no longer valid. Request a new one below.",
  "login.signin_failed": "Sign-in failed",
  "login.rate_limited": "Too many sign-in attempts — wait an hour and try again.",
  "login.email_down": "Email delivery is down right now. Try again in a minute.",
  "login.dev_toggle_show": "developer mode",
  "login.dev_toggle_hide": "hide developer mode",
  "login.dev_explainer":
    "Skips email verification. Only works when ALLOW_DEV_LOGIN=true is set on the backend.",
  "login.dev_submit": "dev sign in",
  "login.dev_signing_in": "signing in…",

  // ── Dashboard ──────────────────────────────────────────────────
  "dashboard.nav.voice": "voice",
  "dashboard.nav.audits": "audits",
  "dashboard.nav.logout": "logout",
  "dashboard.generate.title": "Generate a post",
  "dashboard.generate.subtitle":
    "In your voice. Topic auto-picked round-robin from your topics.",
  "dashboard.generate.button": "generate post",
  "dashboard.generate.generating": "generating…",
  "dashboard.generate.no_topic": "no topic",
  "dashboard.feed.title": "Recent drafts",
  "dashboard.feed.empty": "No drafts yet. Hit",
  "dashboard.feed.empty_cta": "generate post",
  "dashboard.feed.empty_after": "above to get started.",
  "dashboard.feed.draft_singular": "draft",
  "dashboard.feed.draft_plural": "drafts",
  "dashboard.draft.edited": "edited",
  "dashboard.draft.approve": "approve",
  "dashboard.draft.approve_edited": "approve edit",
  "dashboard.draft.reject": "reject",
  "dashboard.draft.publish": "publish to Threads",
  "dashboard.draft.refine_placeholder":
    "refine: 'make shorter', 'less formal', 'add a question'…",
  "dashboard.draft.refine": "refine",
  "dashboard.draft.refining": "refining…",
  "dashboard.draft.refine_preset_shorter": "make shorter",
  "dashboard.draft.refine_preset_informal": "less formal",
  "dashboard.draft.refine_preset_question": "add a question",
  "dashboard.draft.refine_preset_punchier": "punchier opening",
  "dashboard.draft.tweak": "tweak",
  "dashboard.draft.published": "published",
  "dashboard.draft.open_threads": "open in Threads ↗",
  "dashboard.tab.pending": "drafts",
  "dashboard.tab.approved": "ready to publish",
  "dashboard.tab.published": "published",
  "dashboard.tab.rejected": "rejected",
  "dashboard.tab.empty": "Nothing here.",
  "dashboard.toast.generated": "generated",
  "dashboard.toast.approved_as_is": "approved as-is",
  "dashboard.toast.approved_edited": "approved with your edit",
  "dashboard.toast.rejected": "rejected",
  "dashboard.toast.refined": "refined",
  "dashboard.toast.published": "published",

  // ── Role book ──────────────────────────────────────────────────
  "rolebook.back_to_dashboard": "← dashboard",
  "rolebook.version_label": "voice v",
  "rolebook.parent_label": "parent v",
  "rolebook.title": "Voice",
  "rolebook.subtitle":
    "Edit what the AI writes and how. Changes apply to the next generation.",
  "rolebook.intro.label": "Intro",
  "rolebook.intro.helper": "who's writing",
  "rolebook.intro.placeholder":
    "One paragraph in your own register: who you are, what you write about.",
  "rolebook.themes_exclude.label": "Topics the AI must NEVER write about",
  "rolebook.themes_exclude.helper":
    "If a requested topic falls here, the AI silently pivots to an allowed topic.",
  "rolebook.themes_exclude.placeholder": "e.g. app development",
  "rolebook.themes_include.label": "Topics the AI writes about",
  "rolebook.themes_include.helper":
    "Be specific — 'kitchen failures' beats 'lifestyle'.",
  "rolebook.themes_include.placeholder": "e.g. kitchen failures and shortcuts",
  "rolebook.voice_characteristics.label": "Voice characteristics",
  "rolebook.voice_characteristics.helper":
    "Concrete observations: 'lowercase i', 'short sentences'.",
  "rolebook.voice_characteristics.placeholder":
    "e.g. uses lowercase throughout",
  "rolebook.do_list.label": "Do",
  "rolebook.do_list.helper": "Specific moves to lean into.",
  "rolebook.do_list.placeholder": "e.g. open with 'what's a...' questions",
  "rolebook.dont_list.label": "Don't",
  "rolebook.dont_list.helper": "Specific moves to avoid.",
  "rolebook.dont_list.placeholder": "e.g. no hashtags or emojis",
  "rolebook.examples.label": "Voice examples",
  "rolebook.examples.helper":
    "Representative phrases in your actual voice.",
  "rolebook.examples.placeholder":
    "e.g. i have burned water before. not metaphorically",
  "rolebook.extract.button": "re-extract from posts",
  "rolebook.extract.extracting": "extracting…",
  "rolebook.extract.confirm_title": "Re-extract voice from recent posts?",
  "rolebook.extract.confirm_body":
    "This analyzes your most-viewed recent posts and replaces the current voice with a fresh extraction. Your current version is saved as the parent — you can revert. Manual edits to the current version will not carry over.",
  "rolebook.extract.confirm_cta": "re-extract",
  "rolebook.extract.toast_done": "voice re-extracted from your posts",
  "rolebook.lint.button": "check for conflicts",
  "rolebook.lint.checking": "checking…",
  "rolebook.lint.section_title": "Conflict check",
  "rolebook.lint.no_conflicts": "no conflicts found",
  "rolebook.save.helper": "New active version on save · old becomes parent",
  "rolebook.save.toast_saved_clean": "saved · no conflicts",
  "rolebook.save.toast_saved_check_unavailable":
    "saved · conflict check unavailable",
  "rolebook.transparency.title": "What the AI actually sees",
  "rolebook.transparency.subtitle": "· assembled from sections above",
  "rolebook.items_count_singular": "item",
  "rolebook.items_count_plural": "items",

  // ── Audits ─────────────────────────────────────────────────────
  "audits.back": "← dashboard",
  "audits.runs_at": "Mondays 09:00 UTC",
  "audits.title": "Audits",
  "audits.subtitle":
    "Each week the coach reviews how your posts performed and proposes edits to your voice. Approve or reject each suggestion individually.",
  "audits.empty":
    "No audits yet. The first one runs the Monday after you have at least a week of published posts with metrics.",
  "audits.posts_analyzed": "posts analyzed",
  "audits.decided_of_total": "decided",
  "audits.pending_review": "pending your review",
  "audits.detail.back": "← audits",
  "audits.detail.proposed_changes": "Proposed changes",
  "audits.detail.no_changes":
    "The coach didn't propose any changes for this period.",
  "audits.detail.reasoning": "Why the coach proposed these changes",
  "audits.detail.suggested_fix": "Suggested fix",
  "audits.detail.your_note": "Your note",
  "audits.detail.note_placeholder": "Optional note about this decision…",
  "audits.detail.approve": "approve",
  "audits.detail.reject": "reject",
  "audits.detail.clear": "clear",
  "audits.detail.submit": "submit decisions",
  "audits.detail.submitting": "submitting…",
  "audits.detail.ready_to_submit": "ready to submit",
  "audits.detail.applied": "applied",
  "audits.detail.rejected_label": "rejected",
  "audits.detail.rolled_back": "rolled back",
  "audits.detail.effect": "effect",
  "audits.detail.title": "Weekly audit",
  "audits.detail.changes_count": "proposed change(s)",
  "audits.detail.status_label": "status",
  "audits.detail.view_diff": "View raw diff",
  "audits.detail.approved": "approved",
  "audits.detail.toast_nothing":
    "nothing to submit — approve or reject at least one",
  "audits.detail.toast_submitted": "decisions submitted",

  // ── Publish modal ──────────────────────────────────────────────
  "publish.title": "Publish to Threads",
  "publish.subtitle":
    "This is the exact text that will appear on your Threads account. It cannot be edited or unpublished from here.",
  "publish.char_count": "chars",
  "publish.over_limit":
    "Threads will reject text-only posts over the limit.",
  "publish.cancel": "cancel",
  "publish.confirm": "publish to Threads",
  "publish.publishing": "publishing…",

  // ── Translation widget ─────────────────────────────────────────
  "translate.button": "translate",
  "translate.cached": "cached",
  "translate.fresh": "fresh",

  // ── Pattern Study ───────────────────────────────────────────────
  "dashboard.nav.patterns": "patterns",
  "patterns.back": "← dashboard",
  "patterns.title": "Pattern study",
  "patterns.subtitle":
    "Paste the TEXT of posts you admire — Pennedly extracts the reusable techniques (how the hook is built, the rhythm, the structure) so you can apply the moves to your own voice.",
  "patterns.disclaimer_title": "Paste text, not links",
  "patterns.disclaimer_body":
    "Copy the actual words of a post you're studying. Links and @profiles won't work — Pennedly never opens links or reads other people's accounts. And it extracts technique, never copies the content.",
  "patterns.input_placeholder":
    "Paste a post's text here. Add more posts separated by a blank line.\n\ne.g. i have burned water before. not metaphorically. actual water in a pot",
  "patterns.analyze": "analyze patterns",
  "patterns.analyzing": "analyzing…",
  "patterns.empty_warning": "paste at least one post's text first",
  "patterns.link_warning":
    "That looks like a link or profile. Paste the post's TEXT instead — the words you see.",
  "patterns.summary_label": "What these have in common",
  "patterns.why_label": "why it works",
  "patterns.example_label": "fresh example",
  "patterns.add_to_voice": "add to my voice",
  "patterns.added": "added to your do-list",

  // ── Style rules ────────────────────────────────────────────────
  "dashboard.nav.style_rules": "style",
  "style_rules.back": "← dashboard",
  "style_rules.title": "Style rules",
  "style_rules.subtitle":
    "Built-in rules that keep the AI from writing like AI. All on by default — turn off any you don't want for this account.",
  "style_rules.count_on": "on",
  "style_rules.kind.post": "posts only",
  "style_rules.kind.reply": "replies only",
  "style_rules.on": "on",
  "style_rules.off": "off",
  "style_rules.defaults_title": "Built-in rules",
  "user_rules.title": "Your rules",
  "user_rules.subtitle":
    "Your own instructions, layered on top of the built-in rules below. Applied every time the AI writes.",
  "user_rules.empty": "No custom rules yet.",
  "user_rules.kind_post": "for posts",
  "user_rules.kind_reply": "for replies",
  "user_rules.add": "+ add rule",
  "user_rules.placeholder":
    "e.g. always name a concrete tool or number; never start with a question",
  "user_rules.delete": "delete",
  "user_rules.confirm_delete": "Delete?",
  "style_rules.punctuation_note":
    "While on, em dashes and «guillemets» are rewritten to a plain hyphen and straight quotes — both in the prompt and the automatic cleanup. Turn it off to keep native typography.",
  "style_rules.toast.enabled": "rule on",
  "style_rules.toast.disabled": "rule off",

  // ── Replies ────────────────────────────────────────────────────
  "dashboard.nav.replies": "replies",
  "replies.back": "← dashboard",
  "replies.title": "Replies",
  "replies.subtitle":
    "Comments under your posts. Generate a reply in your voice, review it, then publish.",
  "replies.empty":
    "No comments yet. The reply queue fills hourly from your recent posts.",
  "replies.on_post": "on your post",
  "replies.under_post": "Under your post:",
  "replies.open_thread": "open in Threads ↗",
  "replies.replied_on": "replied",
  "replies.view_comment": "view on Threads",
  "replies.dismiss": "remove from queue",
  "replies.confirm_dismiss": "Remove?",
  "replies.toast_dismissed": "Removed from queue",
  "replies.generate": "generate reply",
  "replies.skipped":
    "skipped — the AI judged this comment not worth replying to",
  "replies.replied": "replied",
  "replies.filter_all": "All",
  "replies.filter_new": "Needs reply",
  "replies.filter_drafted": "Draft",
  "replies.filter_replied": "Replied",
  "replies.filter_skipped": "Skipped",

  // ── Mentions ───────────────────────────────────────────────────
  "dashboard.nav.mentions": "mentions",
  "mentions.back": "← dashboard",
  "mentions.title": "Mentions",
  "mentions.subtitle":
    "Posts elsewhere on Threads that @-mention you. Updated hourly.",
  "mentions.empty": "No mentions yet.",
  "mentions.view": "view on Threads",

  // ── Posts (published) ──────────────────────────────────────────
  "dashboard.nav.posts": "posts",
  "posts.back": "← dashboard",
  "posts.title": "Published posts",
  "posts.subtitle":
    "Your posts on Threads. Deleting removes a post from Threads — it can't be undone.",
  "posts.empty": "No published posts yet.",
  "posts.delete": "delete",
  "posts.deleting": "deleting…",
  "posts.confirm_title": "Delete this post from Threads?",
  "posts.confirm_body":
    "This permanently removes the post from your Threads account. It can't be undone.",
  "posts.confirm_cta": "delete from Threads",
  "posts.toast_deleted": "post deleted",

  // ── Autopilot ──────────────────────────────────────────────────
  "dashboard.nav.autopilot": "autopilot",
  "autopilot.back": "← dashboard",
  "autopilot.title": "Autopilot",
  "autopilot.subtitle":
    "Off by default. Turn on only what you want — Pennedly posts and replies in your voice, on your terms. Pause anytime.",
  "autopilot.master": "Autopilot enabled",
  "autopilot.posts_title": "Auto-post",
  "autopilot.post_enabled": "Generate and publish posts automatically",
  "autopilot.posts_per_day": "Posts per day",
  "autopilot.quiet_hours": "Quiet hours (don't post)",
  "autopilot.quiet_off": "off",
  "autopilot.replies_title": "Auto-reply to comments",
  "autopilot.reply_enabled": "Reply to comments automatically",
  "autopilot.reply_audience": "Reply to",
  "autopilot.audience_fans": "fans / positive only",
  "autopilot.audience_all_except_trolls": "everyone except trolls",
  "autopilot.audience_questions": "questions only",
  "autopilot.replies_per_day": "Replies per day",
  "autopilot.uses_voice": "Autopilot follows your Voice and Style rules.",
  "autopilot.safety":
    "Only drafts that pass quality checks are published; daily limits apply; everything is logged and can be undone.",
  "autopilot.saved": "autopilot saved",
  "autopilot.objects_title": "Autopost objects",
  "autopilot.objects_subtitle":
    "Each posts once a day at its time. More posts a day = more objects.",
  "autopilot.add_object": "+ add object",
  "autopilot.no_objects": "No objects yet. Add one to start.",
  "autopilot.activity_title": "Activity",
  "autopilot.activity_empty": "Autopilot hasn't posted anything yet.",
  "autopilot.activity_today": "today",
  "autopilot.activity_posts": "posts",
  "autopilot.activity_replies": "replies",
  "autopilot.activity_last_post": "last post",
  "autopilot.activity_recent": "Recent auto-posts",
  "autopilot.object_name_ph": "name (optional)",
  "autopilot.object_topic": "Topic",
  "autopilot.any_topic": "any (round-robin)",
  "autopilot.object_time": "Post at",
  "autopilot.object_autoreply": "Auto-reply to its comments",
  "autopilot.delete_object": "delete",
  "autopilot.confirm_delete_object": "Delete this object?",

  // ── My Feed (posts + analytics) ───────────────────────────────
  "dashboard.nav.feed": "feed",
  "nav.studio": "Studio",
  "nav.group.content": "Content",
  "nav.group.growth": "Growth",
  "nav.group.voice": "Voice",
  "feed.back": "← dashboard",
  "feed.title": "My Feed",
  "feed.subtitle": "Your posts — each with how it did versus your usual.",
  "feed.empty":
    "No posts yet. Once you publish on Threads, they'll show up here with analytics.",
  "feed.ref_week": "Your weekly average",
  "feed.ref_30d": "Your 30-day average",
  "feed.ref_none":
    "Not enough posts yet to compare against your average — keep posting.",
  "feed.posts_word": "posts",
  "feed.views": "views",
  "feed.likes": "likes",
  "feed.comments": "comments",
  "feed.reposts": "reposts",
  "feed.vs_avg": "× your average",
  "feed.fresh": "still settling",
  "feed.open": "open in Threads ↗",
  "feed.growth": "growth",
  "feed.growth_none": "not enough snapshots yet for a curve",
  "feed.autoreply_on": "auto-replies on",
  "feed.autoreply_off": "auto-replies off",
  "feed.autoreply_hint":
    "When on, Pennedly auto-replies to new comments under this post (your audience + daily cap).",
  "feed.autoreply_toast_on": "Auto-replies on for this post",
  "feed.autoreply_toast_off": "Auto-replies off for this post",

  // ── Onboarding ────────────────────────────────────────────────
  "onboarding.title": "Set up your voice",
  "onboarding.subtitle":
    "Pennedly writes in your voice. Let's define it — pick how to start.",
  "onboarding.connect_title": "First, connect your Threads account",
  "onboarding.connect_body":
    "Pennedly drafts for a connected account. Connect one to begin.",
  "onboarding.analyze_title": "Analyze my posts",
  "onboarding.analyze_body":
    "Pennedly reads your recent Threads posts and builds your voice automatically.",
  "onboarding.analyze_cta": "Analyze my posts",
  "onboarding.analyze_count": "posts ready to analyze",
  "onboarding.analyze_none": "No posts yet — build from scratch instead.",
  "onboarding.analyzing": "Analyzing your posts…",
  "onboarding.scratch_title": "Build from scratch",
  "onboarding.scratch_body":
    "New account? Describe your voice and topics, and start posting right away.",
  "onboarding.scratch_cta": "Build from scratch",
  "onboarding.form_intro_label": "Describe your voice",
  "onboarding.form_intro_ph":
    "Who you are, what your account is about, your tone. Write in the language you post in.",
  "onboarding.form_themes_label": "Topics you want to post about",
  "onboarding.form_themes_ph": "add a topic and press enter",
  "onboarding.form_exclude_label": "Topics to avoid (optional)",
  "onboarding.form_exclude_ph": "add a topic to avoid",
  "onboarding.create_cta": "Create my voice",
  "onboarding.creating": "Creating…",
  "onboarding.back": "← back",
  "onboarding.error_empty": "Add at least a voice description or one topic.",

  // ── Stats (analytics) ─────────────────────────────────────────
  "dashboard.nav.stats": "stats",
  "stats.title": "Statistics",
  "stats.subtitle": "How your account is doing over recent weeks.",
  "stats.empty": "No posts yet. Stats appear here as you publish.",
  "stats.card_posts": "Posts",
  "stats.card_views": "Total views",
  "stats.card_avg_views": "Avg views / post",
  "stats.card_avg_likes": "Avg likes / post",
  "stats.card_avg_comments": "Avg comments / post",
  "stats.vs_last_week": "vs last week",
  "stats.tiers_title": "How viral your posts were",
  "stats.tier_viral": "viral",
  "stats.tier_good": "good",
  "stats.tier_mid": "average",
  "stats.tier_flop": "weak",
  "stats.weekly_views_title": "Average views per week",
  "stats.weekly_posts_title": "Posts per week",
  "stats.period.today": "Today",
  "stats.period.yesterday": "Yesterday",
  "stats.period.7d": "7 days",
  "stats.period.30d": "Month",
  "stats.period.90d": "3 months",
  "stats.period.all": "All time",
  "stats.vs_prev": "vs previous",
  "stats.chart_avg_views": "Avg. views per post",
  "stats.chart_posts": "Posts",
  "stats.chart_avg_line": "average",
  "stats.chart_above_avg": "above average",
  "stats.chart_below_avg": "below average",
  "stats.gran_day": "by day",
  "stats.gran_week": "by week",
  "stats.gran_month": "by month",

  // ── Translate widget (button/cached/fresh already defined above) ──
  "translate.translating": "translating…",
  "translate.translated": "translated",
  "translate.hide": "hide",

  // ── Draft status badge ────────────────────────────────────────
  "dashboard.status.pending": "draft",
  "dashboard.status.approved": "approved",
  "dashboard.status.rejected": "rejected",
  "dashboard.status.published": "published",
  "dashboard.draft.refine_empty": "type a tweak instruction first",
  "dashboard.draft.delete": "delete",
  "dashboard.draft.confirm_delete": "Delete this draft?",
  "dashboard.draft.toast_deleted": "draft deleted",

  // ── Sidebar bottom + Settings ─────────────────────────────────
  "nav.settings": "Settings",
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.plan": "Plan",
  "settings.language": "Interface language",
  "settings.accounts": "Connected Threads accounts",
  "settings.disconnect": "disconnect",
  "settings.disconnect_confirm": "Disconnect?",
  "settings.disconnect_yes": "Yes, disconnect",
  "settings.disconnecting": "disconnecting…",
  "settings.disconnect_hint":
    "Disconnecting removes the stored access token; your posts and stats are kept. You can reconnect anytime via OAuth.",
  "settings.logout": "Log out",
  "settings.voice_setup": "Voice setup",
  "settings.voice_setup_cta": "Open setup",
  "settings.voice_preview_cta": "Preview (nothing saved)",
  "onboarding.already_setup":
    "Your voice is already set up — going through this again replaces it (the previous version is kept).",
  "onboarding.preview_banner":
    "Preview mode — nothing is saved to your account. Run it for real, see the result, then it's discarded.",
  "onboarding.preview_result_title": "Voice preview",
  "onboarding.preview_not_saved":
    "This is only a preview — nothing was saved to your account.",
  "onboarding.preview_posts_analyzed": "Posts analyzed:",
  "onboarding.preview_would_topics": "Topics that would be created:",
  "onboarding.preview_full_rolebook":
    "Full role-book (what generation would use)",
  "onboarding.preview_back": "← Back / run again",
  "onboarding.exit": "Back",
  "onboarding.sec_intro": "Intro",
  "onboarding.sec_themes": "Topics",
  "onboarding.sec_exclude": "Avoid",
  "onboarding.sec_voice": "Voice",
  "onboarding.sec_do": "Do",
  "onboarding.sec_dont": "Don't",
  "onboarding.sec_examples": "Examples",
} as const;

export type MessageKey = keyof typeof en;
