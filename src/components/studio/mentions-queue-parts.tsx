"use client";

// Presentational parts for the triaged Mentions Queue, ported 1:1 from
// design-export/Pennedly-2026-07-17 (mentions-queue-build.js + mentions-queue.css).
// Pure view: the page owns data + actions and passes them down. Chrome uses the
// mq-* classes (mentions-queue.css); action buttons use the app's buttonClasses so
// they match the rest of the app, with a `btn`/`mq-grow` hook for the mobile layer.

import { useState, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import {
  IcChevDown,
  IcExternal,
  IcEye,
  IcEyeOff,
  IcGlobe,
  IcImage,
  IcMinus,
  IcNib,
  IcPlus,
  IcRefresh,
  IcRepeat,
  IcShield,
  IcSkip,
  IcUndo,
  IcVideo,
  IcWand,
} from "@/components/icons";
import { mediaUrl } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n";
import {
  INTENT_ICON,
  INTENTS,
  type FilteredReason,
  type IntentKey,
  type MQMention,
  type MQStatus,
} from "@/components/studio/mentions-queue";

type T = (k: MessageKey) => string;
export type MentionAction = "skip" | "generate" | "reject" | "edit" | "send" | "unskip" | "gen_image";

// The design's exact intent glyph (calm line set). Paths are static constants, so
// dangerouslySetInnerHTML is safe here.
export function IntentIcon({ intent, size = 13 }: { intent: IntentKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: INTENT_ICON[intent] }}
    />
  );
}

export function IntentChip({ intent, t }: { intent: IntentKey; t: T }) {
  const meta = INTENTS[intent];
  return (
    <span className={"mq-intent" + (meta.warn ? " mq-intent--warn" : "")}>
      <IntentIcon intent={intent} />
      {t(meta.labelKey)}
    </span>
  );
}

const STATUS_CLASS: Record<MQStatus, { cls: string; dot: boolean; key: MessageKey }> = {
  new: { cls: "mq-badge--accent", dot: true, key: "mq.status.new" },
  draft: { cls: "mq-badge--neutral", dot: true, key: "mq.status.draft" },
  replied: { cls: "mq-badge--good", dot: true, key: "mq.status.replied" },
  skipped: { cls: "mq-badge--neutral", dot: false, key: "mq.status.skipped" },
};

export function StatusBadge({ status, t }: { status: MQStatus; t: T }) {
  const s = STATUS_CLASS[status];
  return (
    <span className={"mq-badge " + s.cls}>
      {s.dot && <span className="pill-dot" />}
      {t(s.key)}
    </span>
  );
}

// Accent the @-handles inside a mention's text (Cyrillic + Latin handles).
function highlight(text: string): ReactNode[] {
  return text.split(/(@[\wа-яё.]+)/gi).map((part, i) =>
    /^@[\wа-яё.]+$/i.test(part) ? (
      <span key={i} className="at-mention">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function MediaPreview({ media, t }: { media: MQMention["media"]; t: T }) {
  const [revealed, setRevealed] = useState(false);
  if (media === "text") return null;
  if (media === "photo") {
    return (
      <div className="mq-media">
        <div className="mq-media-ph">
          <span className="ph-in">
            <IcImage size={20} />
            {t("mq.media.photo")}
          </span>
        </div>
      </div>
    );
  }
  if (media === "video") {
    return (
      <div className="mq-media mq-media--video">
        <div className="mq-media-ph">
          <span className="ph-in">
            <IcVideo size={20} />
            {t("mq.media.video_poster")}
          </span>
        </div>
        <div className="mq-media-play">
          <span>
            <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
        </div>
        <span className="mq-media-badge">
          <IcVideo size={12} /> {t("mq.media.video")}
        </span>
      </div>
    );
  }
  // hidden (S2): a suspicious source, veiled until the owner reveals it.
  return (
    <div className="mq-media mq-media--hidden">
      <div className="mq-media-ph" />
      {!revealed && (
        <div className="mq-media-veil">
          <IcEyeOff size={20} />
          <span className="mq-media-veil-note">
            {t("mq.media.hidden")}
            <br />
            {t("mq.media.hidden_sub")}
          </span>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <IcEye size={14} /> {t("mq.media.show")}
          </button>
        </div>
      )}
    </div>
  );
}

function DraftThread({ m, t }: { m: MQMention; t: T }) {
  if (!m.draft) return null;
  return (
    <div className="mq-thread">
      <div className="mq-draft">
        <div className="mq-draft-author">
          <span className="av">{t("mq.draft.you").slice(0, 1)}</span>
          <span className="nm">{t("mq.draft.you")}</span>
          <span className="tag">
            <IcNib size={12} /> {t("mq.draft.tag")}
          </span>
        </div>
        {m.draft && <div className="mq-draft-text">{m.draft}</div>}
        {/* Phase 4: the generated photo, once produced (a reply carries one image). */}
        {m.draftMediaUrl && (
          <img
            src={mediaUrl(m.draftMediaUrl)}
            alt={t("mq.draft.generated_alt")}
            className="mt-2.5 block w-full max-w-[340px] rounded-md border border-border"
          />
        )}
        {m.media === "video" && (
          <div className="mq-media-note">
            <IcEyeOff size={13} /> {t("mq.media.video_note")}
          </div>
        )}
      </div>
    </div>
  );
}

// The design's why blurb, one per QUEUE intent (+ the danger example).
function whyKeyFor(m: MQMention): MessageKey | null {
  if (m.intent && INTENTS[m.intent].whyKey) return INTENTS[m.intent].whyKey ?? null;
  if (m.media === "hidden" || (m.intent && INTENTS[m.intent].warn)) return "mq.why.danger";
  return null;
}

function CardFoot({
  m,
  t,
  onAct,
  writeEnabled = true,
  busy = false,
  editing = false,
}: {
  m: MQMention;
  t: T;
  onAct?: (action: MentionAction) => void;
  // Actions are live for real cards; the read-only fallback (only Open in Threads)
  // is kept for any future surface that passes writeEnabled=false.
  writeEnabled?: boolean;
  busy?: boolean;
  /** True while this text draft is being edited inline (swaps «Изменить»→«Отмена»). */
  editing?: boolean;
}) {
  const group = m.group;
  const openLink = m.permalink ? (
    <a
      href={m.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={"btn " + buttonClasses({ variant: "secondary", size: "sm" })}
    >
      <IcExternal size={15} /> {group === "skip" ? t("mq.action.open_short") : t("mq.action.open")}
    </a>
  ) : null;
  const act = (a: MentionAction) => () => onAct?.(a);

  let meta: ReactNode = null;
  let actions: ReactNode = null;

  if (m.status === "new") {
    if (group === "skip") {
      meta = (
        <span className="mi">
          <IcShield size={13} /> {t("mq.meta.filtered_auto")}
        </span>
      );
      actions = openLink;
    } else if (group === "queue") {
      meta = (
        <span className="mi">
          <IcShield size={13} /> {t("mq.meta.queue_wait")}
        </span>
      );
      actions = (
        <>
          {openLink}
          <button type="button" disabled={busy} onClick={act("generate")} className={"btn mq-grow " + buttonClasses({ variant: "primary", size: "sm" })}>
            {busy ? <Spinner size={14} /> : <IcNib size={15} />} {t("mq.action.generate_draft")}
          </button>
        </>
      );
    } else {
      actions = (
        <>
          <button type="button" disabled={busy} onClick={act("skip")} className={"btn " + buttonClasses({ variant: "ghost", size: "sm" })}>
            <IcSkip size={14} /> {t("mq.action.skip")}
          </button>
          {openLink}
          <button type="button" disabled={busy} onClick={act("generate")} className={"btn mq-grow " + buttonClasses({ variant: "primary", size: "sm" })}>
            {busy ? <Spinner size={14} /> : <IcNib size={15} />} {t("mq.action.generate")}
          </button>
        </>
      );
    }
  } else if (m.status === "draft" && m.generateImage) {
    // Phase 4 — the LIVE generated-photo flow: generate → review the image → send.
    actions = !m.draftMediaUrl ? (
      <>
        {openLink}
        <button type="button" disabled={busy} onClick={act("gen_image")} className={"btn mq-grow " + buttonClasses({ variant: "primary", size: "sm" })}>
          {busy ? <Spinner size={14} /> : <IcWand size={15} />} {t("mq.action.gen_image")}
        </button>
      </>
    ) : (
      <>
        <button type="button" disabled={busy} onClick={act("gen_image")} className={"btn " + buttonClasses({ variant: "secondary", size: "sm" })}>
          <IcRefresh size={14} /> {t("mq.action.regen")}
        </button>
        {openLink}
        <button type="button" disabled={busy} onClick={act("send")} className={"btn mq-grow " + buttonClasses({ variant: "primary", size: "sm" })}>
          <IcExternal size={15} /> {t("mq.action.send")}
        </button>
      </>
    );
  } else if (m.status === "draft") {
    actions = (
      <>
        <button type="button" disabled={busy} onClick={act("reject")} className={"btn " + buttonClasses({ variant: "ghost", size: "sm" })}>
          <IcSkip size={14} /> {t("mq.action.reject")}
        </button>
        <button type="button" disabled={busy} onClick={act("edit")} className={"btn " + buttonClasses({ variant: "secondary", size: "sm" })}>
          {editing ? <IcUndo size={14} /> : <IcNib size={15} />} {editing ? t("mq.action.edit_cancel") : t("mq.action.edit")}
        </button>
        <button type="button" disabled={busy} onClick={act("send")} className={"btn mq-grow " + buttonClasses({ variant: "primary", size: "sm" })}>
          {busy ? <Spinner size={14} /> : <IcExternal size={15} />} {t("mq.action.send")}
        </button>
      </>
    );
  } else if (m.status === "replied") {
    meta = (
      <span className="mi">
        <IcNib size={13} /> {t("mq.meta.sent").replace("{when}", m.repliedLabel ?? "")}
      </span>
    );
    actions = openLink;
  } else if (m.status === "skipped") {
    meta = (
      <span className="mi">
        {t("mq.meta.skipped")}
        {m.skipReason ? ": " + m.skipReason : ""}
      </span>
    );
    actions = (
      <>
        {openLink}
        <button type="button" disabled={busy} onClick={act("unskip")} className={"btn " + buttonClasses({ variant: "ghost", size: "sm" })}>
          <IcUndo size={14} /> {t("mq.action.unskip")}
        </button>
      </>
    );
  }

  // Read-only view (backend for the other writes not shipped): keep the meta,
  // collapse actions to just Open in Threads. The generated-photo draft flow IS
  // live (Phase 4), so it stays interactive even when writeEnabled is off.
  const liveImageDraft = m.status === "draft" && !!m.generateImage;
  if (!writeEnabled && !liveImageDraft) actions = openLink;

  return (
    <div className="mq-foot">
      <div className="mq-meta">{meta}</div>
      <div className="mq-actions">{actions}</div>
    </div>
  );
}

export function MentionCard({
  m,
  t,
  locale,
  demo,
  onAction,
  onTranslate,
  writeEnabled = true,
  actionBusy = false,
}: {
  m: MQMention;
  t: T;
  locale: string;
  demo: boolean;
  onAction?: (id: MQMention["id"], action: MentionAction, text?: string) => void | Promise<boolean>;
  onTranslate?: (text: string) => Promise<string>;
  writeEnabled?: boolean;
  /** True while this card's generate/send/skip request is in flight. */
  actionBusy?: boolean;
}) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Inline edit of a text draft: «Изменить» reveals a textarea; «Отправить» ships
  // the edited text (or the untouched draft). Ephemeral until send, mirroring the
  // comment /app/replies local-edit → approve flow (a reply draft's edit is applied
  // at approve time, never persisted to content_drafts.edited_text).
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const isTextDraft = m.status === "draft" && !m.generateImage;

  async function handleAct(a: MentionAction) {
    if (a === "edit") {
      setEditing((v) => {
        if (!v) setEditText(m.draft ?? "");
        return !v;
      });
      return;
    }
    if (a === "send") {
      const trimmed = editText.trim();
      // While the editor is open, always pass its text (even if it currently equals
      // the original) — otherwise a retry after a failed publish that the user
      // reverted to the original would skip the re-approve and ship the earlier,
      // already-approved edit. Empty falls back to the generated text.
      const edited = editing && trimmed ? trimmed : undefined;
      const ok = await onAction?.(m.id, "send", edited);
      // Keep the editor open (and editText) on failure so a retry doesn't lose the
      // user's edit; collapse it only once the send actually succeeded.
      if (ok) setEditing(false);
      return;
    }
    onAction?.(m.id, a);
  }

  const canTranslate = !!m.text && (demo ? m.translation != null : !!onTranslate);
  const shown = translated ?? m.text;
  const whyKey = whyKeyFor(m);
  const warn = !!m.intent && INTENTS[m.intent].warn;

  async function translate() {
    if (demo) {
      setTranslated(m.translation ?? m.text);
      return;
    }
    if (!onTranslate) return;
    setBusy(true);
    try {
      setTranslated(await onTranslate(m.text));
    } catch {
      /* keep original on failure */
    } finally {
      setBusy(false);
    }
  }

  const when = m.whenLabel ?? (m.whenIso ? relativeTime(m.whenIso, locale) : "");

  return (
    <article className={"mq-card" + (m.status === "skipped" ? " mq-card--skipped" : "")}>
      <div className="mq-head">
        <span className="mq-ava">{m.initials}</span>
        <div className="mq-id">
          <div className="mq-handle">@{m.handle}</div>
          <div className="mq-when">{when}</div>
        </div>
        <div className="mq-chips">
          {m.intent && <IntentChip intent={m.intent} t={t} />}
          <StatusBadge status={m.status} t={t} />
        </div>
      </div>

      <p className="mq-text">{highlight(shown)}</p>

      {canTranslate && (
        <div className="translate-row">
          {translated ? (
            <>
              <span className="translate-note">
                <IcGlobe size={13} /> {t("mentions.translated")}
              </span>
              <button type="button" className="translate-btn" onClick={() => setTranslated(null)}>
                {t("mentions.show_original")}
              </button>
            </>
          ) : (
            <button type="button" className="translate-btn" onClick={translate} disabled={busy}>
              {busy ? <Spinner size={13} /> : <IcGlobe size={13} />} {t("mentions.translate")}
            </button>
          )}
        </div>
      )}

      {whyKey && (
        <div className={"mq-why" + (warn ? " mq-why--warn" : "")}>
          <IcShield size={14} />
          <span>{t(whyKey)}</span>
        </div>
      )}

      <MediaPreview media={m.media} t={t} />
      {editing && isTextDraft ? (
        <div className="mq-thread">
          <div className="mq-draft">
            <div className="mq-draft-author">
              <span className="av">{t("mq.draft.you").slice(0, 1)}</span>
              <span className="nm">{t("mq.draft.you")}</span>
              <span className="tag">
                <IcNib size={12} /> {t("mq.draft.tag")}
              </span>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              aria-label={t("mq.action.edit")}
              placeholder={t("mq.edit.placeholder")}
              className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-text outline-none focus:border-accent"
            />
          </div>
        </div>
      ) : (
        <DraftThread m={m} t={t} />
      )}
      <CardFoot m={m} t={t} onAct={handleAct} writeEnabled={writeEnabled} busy={actionBusy} editing={editing} />
    </article>
  );
}

export function ZoneHead({ title, count, sub }: { title: string; count?: number | null; sub?: string }) {
  return (
    <div className="mq-zone-head">
      <span className="mq-zone-title">{title}</span>
      {count != null && <span className="mq-zone-count">{count}</span>}
      {sub && <span className="mq-zone-sub">{sub}</span>}
    </div>
  );
}

const REASON_KEY: Record<FilteredReason, MessageKey> = {
  link: "mq.reason.link",
  masstag: "mq.reason.masstag",
  obfusc: "mq.reason.obfusc",
  klass: "mq.reason.klass",
  notyou: "mq.reason.notyou",
};

export function FilteredStrip({
  rows,
  open,
  onToggle,
  t,
}: {
  rows: MQMention[];
  open: boolean;
  onToggle: () => void;
  t: T;
}) {
  return (
    <div className={"mq-filtered" + (open ? " mq-filtered--open" : "")}>
      <button type="button" className="mq-filt-sum" aria-expanded={open} onClick={onToggle}>
        <span className="fs-ico">
          <IcShield size={17} />
        </span>
        <span className="fs-body">
          <span className="fs-t">
            {t("mq.filtered.title")}: {rows.length}
          </span>
          <span className="fs-s">{t("mq.filtered.sub")}</span>
        </span>
        <span className="fs-chev">
          <IcChevDown size={18} />
        </span>
      </button>
      {open && (
        <div className="mq-filt-list">
          {rows.map((m) => (
            <div className="mq-filt-row" key={m.id}>
              {m.intent && <IntentChip intent={m.intent} t={t} />}
              <div className="mq-filt-main">
                <div className="mq-filt-handle">@{m.handle}</div>
                <div className="mq-filt-snip">{m.text}</div>
                {m.intent && INTENTS[m.intent].warn && (
                  <div className="mq-filt-warn">
                    <IcShield size={13} /> {t("mq.filtered.scam_note")}
                  </div>
                )}
              </div>
              {m.reason && <span className="mq-filt-reason">{t(REASON_KEY[m.reason])}</span>}
              {m.permalink && (
                <a
                  className="mq-filt-open"
                  href={m.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("mq.action.open")}
                >
                  <IcExternal size={15} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RoutinesEntry({ t, href = "/app/mentions/routines" }: { t: T; href?: string }) {
  return (
    <a className="mq-routines" href={href}>
      <span className="rt-ico">
        <IcRepeat size={18} />
      </span>
      <span className="rt-body">
        <span className="rt-t">{t("mq.routines.title")}</span>
        <span className="rt-s">{t("mq.routines.sub")}</span>
      </span>
      <span className="rt-chev">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );
}

export function LimitPanel({
  commentsCap,
  mentionsCap,
  onStep,
  t,
}: {
  commentsCap: number;
  mentionsCap: number;
  onStep?: (which: "comments" | "mentions", delta: number) => void;
  t: T;
}) {
  const stepper = (which: "comments" | "mentions", value: number) => (
    <div className="mq-step">
      <button type="button" aria-label={t("mq.limit.less")} onClick={() => onStep?.(which, -1)} disabled={value <= 0}>
        <IcMinus size={14} />
      </button>
      <span className="v">{value}</span>
      <button type="button" aria-label={t("mq.limit.more")} onClick={() => onStep?.(which, 1)}>
        <IcPlus size={14} />
      </button>
    </div>
  );
  return (
    <div className="mq-hr">
      <div className="mq-hr-cap">{t("mq.limit.cap")}</div>
      <div className="mq-policy">
        <div className="pl-l">
          <div className="pl-t">{t("mq.limit.comments_title")}</div>
          <div className="pl-s">{t("mq.limit.comments_sub")}</div>
        </div>
        {stepper("comments", commentsCap)}
      </div>
      <div className="mq-policy">
        <div className="pl-l">
          <div className="pl-t">
            {t("mq.limit.mentions_title")}
            <span className="mq-new-tag">{t("mq.limit.new_tag")}</span>
          </div>
          <div className="pl-s">{t("mq.limit.mentions_sub")}</div>
        </div>
        {stepper("mentions", mentionsCap)}
      </div>
    </div>
  );
}

// Local relative-time (mirrors the current mentions page).
function relativeTime(iso: string, locale: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
}
