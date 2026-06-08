"use client";

// Studio presentational layer — pure components driven entirely by props, so the
// live screen (real API) and the ?demo=1 Tweaks review (mock data) render the
// exact same pixels. State that mutates the draft list lives in the page; each
// card owns only its own interaction sub-state (edit / tweak / translate / menu).
// Built 1:1 to Studio-SPEC.html (composer, filterbar, feed states, draft card's
// 9 sub-states, ⋯-menu + translate submenu, publish dialog, first-run hero).

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { Button, buttonClasses } from "@/components/ui/button";
import { Mono } from "@/components/ui/mono";
import { AccountFace } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  BrandMark,
  IcArrowLeft,
  IcBubble,
  IcCheck,
  IcChevDown,
  IcExternal,
  IcGlobe,
  IcHeart,
  IcMore,
  IcNib,
  IcPencil,
  IcReload,
  IcReply,
  IcRepost,
  IcSend,
  IcSparkle,
  IcStudio,
  IcTweak,
  IcUndo,
  IcVoice,
  IcX,
} from "@/components/icons";
import {
  UI_LANGS,
  type StudioCard,
  type StudioStatus,
  type UiLang,
} from "@/components/studio/studio-demo";

export const DRAFT_LIMIT = 500;
export type Density = "comfortable" | "compact";

export type CardHandlers = {
  onApprove: (c: StudioCard) => void;
  onReject: (c: StudioCard) => void;
  onPublish: (c: StudioCard) => void;
  onSendBack: (c: StudioCard) => void;
  onRestore: (c: StudioCard) => void;
  /** Persist an edited body into page state (card.body re-flows via props). */
  onSaveEdit: (c: StudioCard, text: string) => void;
  /** Rewrite the body in the user's voice; resolves to the new text. */
  onTweak: (c: StudioCard, instruction: string) => Promise<string>;
  /** Translate the body inline; resolves to the translated text. */
  onTranslate: (c: StudioCard, lang: UiLang) => Promise<string>;
};

// ─────────────────────────────── CharMeter ──────────────────────────────────
export function CharMeter({ len, showBar = true }: { len: number; showBar?: boolean }) {
  const pct = Math.min(100, (len / DRAFT_LIMIT) * 100);
  const over = len > DRAFT_LIMIT;
  const warn = !over && len > DRAFT_LIMIT - 60;
  return (
    <div className="flex items-center gap-2.5">
      {showBar && (
        <div className="h-1 w-full max-w-[140px] overflow-hidden rounded-full border border-border bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-danger" : warn ? "bg-warning" : "bg-text-subtle",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <span
        className={cn(
          "whitespace-nowrap text-caption tabular-nums",
          over ? "font-semibold text-danger" : warn ? "text-warning" : "text-text-subtle",
        )}
      >
        {len} / {DRAFT_LIMIT}
      </span>
    </div>
  );
}

// ────────────────────────────── StatusBadge ─────────────────────────────────
const BADGE: Record<StudioStatus, { tone: BadgeTone; key: MessageKey }> = {
  draft: { tone: "neutral", key: "studio.badge_draft" },
  ready: { tone: "accent", key: "studio.badge_ready" },
  published: { tone: "good", key: "studio.badge_published" },
  rejected: { tone: "bad", key: "studio.badge_rejected" },
};

export function StatusBadge({ status }: { status: StudioStatus }) {
  const { t } = useTranslation();
  const b = BADGE[status];
  return (
    <Badge tone={b.tone} dot>
      {t(b.key)}
    </Badge>
  );
}

// ─────────────────────────────── CardMenu ───────────────────────────────────
type MenuItem = { label: string; Icon: (p: { size?: number }) => ReactNode; onClick: () => void; danger?: boolean };

function CardMenu({
  items,
  translatedLang,
  onTranslate,
  onShowOriginal,
}: {
  items: MenuItem[];
  translatedLang: UiLang | null;
  onTranslate: (l: UiLang) => void;
  onShowOriginal: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"root" | "translate">("root");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("root");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function shut() {
    setOpen(false);
    setMode("root");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("dashboard.draft.more_actions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-[34px] w-[34px] place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text max-md:h-11 max-md:w-11"
      >
        <IcMore size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] right-0 z-30 max-h-[360px] min-w-[200px] overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg max-md:left-0 max-md:right-auto"
          style={{ animation: "dialog-in var(--duration-base) var(--ease-entrance) both" }}
        >
          {mode === "root" ? (
            <>
              {items.map((it, i) => (
                <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                    shut();
                    it.onClick();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left text-small font-medium transition-colors",
                    it.danger
                      ? "text-danger hover:bg-danger/10"
                      : "text-text hover:bg-surface-2",
                  )}
                >
                  <it.Icon size={15} />
                  {it.label}
                </button>
              ))}
              {translatedLang && (
                <button
                  role="menuitem"
                  onClick={() => {
                    shut();
                    onShowOriginal();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small font-medium text-text transition-colors hover:bg-surface-2"
                >
                  <IcUndo size={15} />
                  {t("studio.show_original")}
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => setMode("translate")}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small font-medium text-text transition-colors hover:bg-surface-2"
              >
                <IcGlobe size={15} />
                <span className="flex-1">{t("studio.translate")}</span>
                <IcChevDown size={13} className="-rotate-90 text-text-subtle" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode("root")}
                className="mb-1 flex w-full items-center gap-2 border-b border-border px-2.5 pb-2 pt-1 text-left text-caption font-semibold uppercase tracking-[0.04em] text-text-subtle"
              >
                <IcArrowLeft size={14} />
                {t("studio.translate_to")}
              </button>
              {UI_LANGS.map((l) => {
                const sel = l.code === "en" ? translatedLang === null : translatedLang?.code === l.code;
                return (
                  <button
                    key={l.code}
                    role="menuitemradio"
                    aria-checked={sel}
                    onClick={() => {
                      shut();
                      if (l.code === "en") onShowOriginal();
                      else onTranslate(l);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-2",
                      sel && "bg-surface-2",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-small text-text">{l.name}</span>
                      <span className="block text-caption text-text-subtle">
                        {l.code === "en" ? t("studio.original") : l.native}
                      </span>
                    </span>
                    {sel && <IcCheck size={14} className="shrink-0 text-success" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── DraftCard ──────────────────────────────────
export function DraftCard({
  card,
  density,
  h,
  replyReadOnly = false,
  demo = false,
}: {
  card: StudioCard;
  density: Density;
  h: CardHandlers;
  /** Q62: reply drafts are managed in /app/replies — no actions here. */
  replyReadOnly?: boolean;
  /** Demo mode surfaces every spec action; real mode hides the ones whose
   *  backend endpoint doesn't exist yet (send-back / restore / edit-on-ready). */
  demo?: boolean;
}) {
  const { t } = useTranslation();
  const compact = density === "compact";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(card.body);
  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakInput, setTweakInput] = useState("");
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState(false);
  const [translated, setTranslated] = useState<{ lang: UiLang; body: string } | null>(null);

  const status = card.status;
  const shownBody = translated ? translated.body : card.body;
  const charLen = (translated ? translated.body : card.body).length;

  async function runTweak(instruction: string) {
    if (!instruction.trim() || revising) return;
    setTweakOpen(false);
    setRevising(true);
    try {
      await h.onTweak(card, instruction.trim());
      setRevised(true);
      setTranslated(null);
    } finally {
      setRevising(false);
      setTweakInput("");
    }
  }

  async function runTranslate(lang: UiLang) {
    const body = await h.onTranslate(card, lang);
    setTranslated({ lang, body });
  }

  // ── ⋯-menu items per status ──
  const menuItems: MenuItem[] = [];
  if (status === "draft") {
    menuItems.push({ label: t("studio.reject"), Icon: IcX, onClick: () => h.onReject(card), danger: true });
    menuItems.push({ label: t("studio.tweak_action"), Icon: IcTweak, onClick: () => setTweakOpen(true) });
    menuItems.push({
      label: t("studio.edit"),
      Icon: IcPencil,
      onClick: () => {
        setEditText(card.body);
        setEditing(true);
      },
    });
  } else if (status === "ready") {
    if (demo) {
      menuItems.push({ label: t("studio.send_back"), Icon: IcUndo, onClick: () => h.onSendBack(card) });
      menuItems.push({
        label: t("studio.edit"),
        Icon: IcPencil,
        onClick: () => {
          setEditText(card.body);
          setEditing(true);
        },
      });
    }
  } else if (status === "rejected") {
    if (demo) menuItems.push({ label: t("studio.restore"), Icon: IcUndo, onClick: () => h.onRestore(card) });
  }

  const cardPad = compact ? "px-4 pb-[11px] pt-[13px]" : "px-[18px] pb-3.5 pt-4";
  const bodyCls = compact ? "mt-[9px] text-small" : "mt-3 text-body";
  const footCls = compact ? "mt-[11px] pt-2.5" : "mt-3.5 pt-3";

  return (
    <article
      className={cn(
        "relative rounded-lg border border-border bg-surface shadow-sm transition-colors focus-within:z-20 hover:border-text/15",
        cardPad,
        status === "published" && "bg-surface-2",
        status === "rejected" && "opacity-[0.72]",
      )}
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      {/* head */}
      <div className="flex items-center gap-2.5">
        <AccountFace url={card.author.avatarUrl} initials={card.author.initials} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-[1.25]">{card.author.name}</div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-caption text-text-subtle">
            {card.author.handle && <span className="truncate">@{card.author.handle}</span>}
            {card.kind === "reply" && card.reply?.who && (
              <>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-accent">
                  <IcReply size={12} />
                  {t("studio.replying_to")} @{card.reply.who}
                </span>
              </>
            )}
            <span className="opacity-60">·</span>
            <span className="whitespace-nowrap">{revised ? t("studio.revised") : card.time}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* reply context */}
      {card.kind === "reply" && card.reply?.text && (
        <div className="mt-3 flex gap-2.5 rounded-md border border-border bg-surface-2 p-3">
          <span className="w-0.5 shrink-0 self-stretch rounded bg-border" />
          <div className="min-w-0">
            {card.reply.who && (
              <div className="mb-0.5 text-caption font-semibold text-text-muted">@{card.reply.who}</div>
            )}
            <div className="text-small leading-[1.5] text-text-muted">{card.reply.text}</div>
          </div>
        </div>
      )}

      {/* body / editing / revising */}
      {revising ? (
        <div className="mt-3.5 flex flex-col gap-2">
          <div className="skel h-3.5 w-[92%] rounded" />
          <div className="skel h-3.5 w-full rounded" />
          <div className="skel h-3.5 w-[48%] rounded" />
          <span className="mt-1 inline-flex items-center gap-1.5 text-caption text-accent">
            <IcTweak size={13} /> {t("studio.revising")}
          </span>
        </div>
      ) : editing ? (
        <div className="mt-2.5">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={Math.min(12, Math.max(3, editText.split("\n").length + 1))}
            className="w-full resize-y rounded-md border border-accent bg-surface px-3 py-2.5 text-body leading-[1.62] text-text ring-[3px] ring-accent/[0.18] focus:outline-none"
          />
          <div className="mt-2.5">
            <CharMeter len={editText.length} />
          </div>
        </div>
      ) : (
        <p className={cn("whitespace-pre-wrap leading-[1.62] text-text", bodyCls, status === "published" && "text-text-muted")}>
          {shownBody}
        </p>
      )}

      {/* translate bar */}
      {translated && !editing && !revising && (
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption text-text-subtle">
          <IcGlobe size={13} />
          {t("studio.translated_to")} {translated.lang.native}
          <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
          <button
            type="button"
            onClick={() => setTranslated(null)}
            className="font-semibold text-accent transition-colors hover:text-accent/80"
          >
            {t("studio.show_original")}
          </button>
        </div>
      )}

      {/* revised note */}
      {revised && !editing && !revising && !translated && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-caption text-accent">
          <IcSparkle size={13} /> {t("studio.revised")}
        </div>
      )}

      {/* tweakbar */}
      {tweakOpen && !editing && !revising && (
        <div className="mt-3">
          <div
            className="flex items-center gap-2 rounded-md border border-accent/40 bg-surface-2 py-2 pl-3 pr-2"
            style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
          >
            <IcTweak size={16} className="shrink-0 text-accent" />
            <input
              autoFocus
              value={tweakInput}
              onChange={(e) => setTweakInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runTweak(tweakInput);
                }
                if (e.key === "Escape") setTweakOpen(false);
              }}
              placeholder={t("studio.tweak_placeholder")}
              className="min-w-0 flex-1 bg-transparent text-small text-text placeholder:text-text-subtle focus:outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              aria-label={t("studio.tweak_action")}
              icon={<IcSend size={15} />}
              disabled={!tweakInput.trim()}
              onClick={() => runTweak(tweakInput)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["studio.tweak_s1", "studio.tweak_s2", "studio.tweak_s3", "studio.tweak_s4"] as MessageKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => runTweak(t(k))}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {t(k)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* footer — hidden while revising */}
      {!revising && (
        <div className={cn("flex flex-wrap items-center gap-2.5 border-t border-border max-md:flex-col max-md:items-stretch", footCls)}>
          {renderFooter()}
        </div>
      )}
    </article>
  );

  function renderFooter() {
    if (editing) {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("studio.editing")}</span>
          <div className="ml-auto flex items-center gap-2 max-md:w-full">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="max-md:min-h-[44px]">
              {t("studio.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal"
              icon={<IcCheck size={15} />}
              disabled={editText.trim().length === 0 || editText.length > DRAFT_LIMIT}
              onClick={() => {
                h.onSaveEdit(card, editText);
                setEditing(false);
                setRevised(false);
              }}
            >
              {t("studio.save")}
            </Button>
          </div>
        </>
      );
    }

    if (status === "published") {
      return (
        <>
          <div className="flex flex-1 items-center gap-4 text-small text-text-muted">
            <Stat Icon={IcHeart} n={card.stats?.likes ?? 0} />
            <Stat Icon={IcBubble} n={card.stats?.replies ?? 0} />
            <Stat Icon={IcRepost} n={card.stats?.reposts ?? 0} />
          </div>
          <div className="ml-auto flex items-center gap-2 max-md:w-full">
            <CardMenu items={[]} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
            <a
              href={card.threadsUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary", size: "sm", className: "max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" })}
            >
              <IcExternal size={15} /> {t("studio.open_threads")}
            </a>
          </div>
        </>
      );
    }

    if (status === "rejected") {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("studio.passed_on")}</span>
          <div className="ml-auto">
            <CardMenu items={menuItems} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
          </div>
        </>
      );
    }

    // reply drafts (Q62) are read-only in Studio — managed in Replies.
    if (card.kind === "reply" && replyReadOnly) {
      return (
        <>
          <span className="text-caption text-text-subtle">{t("dashboard.draft.reply_managed")}</span>
          <a href="/app/replies" className="ml-auto inline-flex items-center gap-1 text-small font-medium text-accent hover:underline">
            {t("dashboard.draft.open_replies")}
          </a>
        </>
      );
    }

    // draft | ready
    const voiceTag =
      status === "ready" ? (
        <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
          <IcCheck size={12} /> {t("studio.ready_tag")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-caption text-text-subtle">
          <IcSparkle size={12} /> {t("studio.in_your_voice")}
        </span>
      );
    return (
      <>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-caption tabular-nums text-text-subtle">
            {charLen} / {DRAFT_LIMIT}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-text-subtle" />
          {voiceTag}
        </div>
        <div className="ml-auto flex items-center gap-2 max-md:w-full">
          <CardMenu items={menuItems} translatedLang={translated?.lang ?? null} onTranslate={runTranslate} onShowOriginal={() => setTranslated(null)} />
          {status === "draft" ? (
            <Button size="sm" variant="primary" className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" icon={<IcCheck size={15} />} onClick={() => h.onApprove(card)}>
              {t("studio.approve")}
            </Button>
          ) : (
            <Button size="sm" variant="primary" className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal" icon={<IcStudio size={15} />} onClick={() => h.onPublish(card)}>
              {t("studio.publish")}
            </Button>
          )}
        </div>
      </>
    );
  }
}

function Stat({ Icon, n }: { Icon: (p: { size?: number }) => ReactNode; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Icon size={15} /> {n.toLocaleString()}
    </span>
  );
}

// ─────────────────────────────── Composer ───────────────────────────────────
const CHIPS: MessageKey[] = ["studio.chip_lesson", "studio.chip_trend", "studio.chip_mentions", "studio.chip_opinion"];

export function StudioComposer({
  avatarText,
  avatarUrl,
  value,
  onChange,
  count,
  onCount,
  onGenerate,
  busy,
  busyCount,
  disabled,
}: {
  avatarText: string;
  avatarUrl?: string | null;
  value: string;
  onChange: (v: string) => void;
  count: number;
  onCount: (n: number) => void;
  onGenerate: () => void;
  busy: boolean;
  busyCount: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section
      className={cn(
        "rounded-xl border bg-surface p-4 pb-3.5 shadow-sm transition-all",
        busy ? "border-accent/45" : "border-border focus-within:border-accent/55 focus-within:shadow-md",
      )}
    >
      {busy ? (
        <div className="flex items-center gap-3 px-0.5 py-1.5">
          <span className="text-text" style={{ animation: "nib-write 1.5s var(--ease-standard) infinite" }}>
            <IcNib size={22} />
          </span>
          <span className="text-h3 text-text">
            {t("studio.drafting_pre")} <b className="font-semibold">{busyCount}</b> {t("studio.drafting_post")}
            <span className="ml-1.5 inline-flex items-end gap-1 align-middle">
              {[0, 0.18, 0.36].map((d) => (
                <i
                  key={d}
                  className="inline-block h-1 w-1 rounded-full bg-text-subtle"
                  style={{ animation: `dot-pulse 1.2s var(--ease-standard) ${d}s infinite` }}
                />
              ))}
            </span>
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <AccountFace url={avatarUrl} initials={avatarText} size={38} className="max-md:hidden" />
            <textarea
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
              }}
              placeholder={t("studio.composer_placeholder")}
              rows={1}
              className="mt-1 min-h-[30px] flex-1 resize-none border-0 bg-transparent text-h3 leading-[1.45] text-text placeholder:text-text-subtle focus:outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
            <div className="flex gap-1.5 [scrollbar-width:none] max-md:w-full max-md:flex-nowrap max-md:overflow-x-auto max-md:[mask-image:linear-gradient(90deg,#000_calc(100%-20px),transparent)] md:min-w-0 md:flex-1 md:flex-wrap">
              {CHIPS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange(t(k))}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1.5 text-small font-medium text-text-muted transition-colors hover:border-text/20 hover:bg-surface-2 hover:text-text"
                >
                  <IcSparkle size={13} className="text-text-subtle" />
                  {t(k)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 max-md:mt-2.5 max-md:w-full md:shrink-0">
              <div className="relative max-md:shrink-0">
                <select
                  value={count}
                  onChange={(e) => onCount(Number(e.target.value))}
                  aria-label={t("dashboard.composer.count_label")}
                  className="h-10 appearance-none rounded-md border border-border bg-surface pl-3 pr-8 text-small text-text transition-colors hover:bg-surface-2 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/[0.22]"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t("dashboard.composer.draft_one") : t("dashboard.composer.draft_few")}
                    </option>
                  ))}
                </select>
                <IcChevDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              </div>
              <Button variant="primary" icon={<IcNib size={16} />} onClick={onGenerate} disabled={disabled || !value.trim()} className="max-md:h-auto max-md:min-h-[44px] max-md:flex-1 max-md:whitespace-normal">
                {t("studio.generate")}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// ────────────────────────────── FilterTabs ──────────────────────────────────
const TABS: { key: StudioStatus; label: MessageKey; dot: string }[] = [
  { key: "ready", label: "studio.tab_ready", dot: "bg-accent" },
  { key: "draft", label: "studio.tab_drafts", dot: "bg-ink-400" },
  { key: "published", label: "studio.tab_published", dot: "bg-success" },
  { key: "rejected", label: "studio.tab_rejected", dot: "bg-danger" },
];

export function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: StudioStatus;
  counts: Record<StudioStatus, number>;
  onChange: (s: StudioStatus) => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="tablist" className="sticky top-13 z-[5] flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1 [scrollbar-width:none] max-md:overflow-x-auto md:top-15">
      {TABS.map((tab) => {
        const on = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-sm border px-2.5 text-small font-medium transition-colors max-md:shrink-0 md:flex-1",
              on ? "border-border bg-surface font-semibold text-text shadow-sm" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", tab.dot)} />
            <span className="truncate">{t(tab.label)}</span>
            <span className={cn("text-caption tabular-nums", on ? "text-text-muted" : "text-text-subtle")}>{counts[tab.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Feed: skeleton/empty/error ─────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] pb-3.5 pt-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="skel h-[34px] w-[34px] rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skel h-3 w-32 rounded" />
          <div className="skel h-2.5 w-20 rounded" />
        </div>
      </div>
      <div className="mt-3.5 space-y-2">
        <div className="skel h-3.5 w-[96%] rounded" />
        <div className="skel h-3.5 w-full rounded" />
        <div className="skel h-3.5 w-[62%] rounded" />
      </div>
    </div>
  );
}

const EMPTY: Record<StudioStatus, { title: MessageKey; sub: MessageKey }> = {
  draft: { title: "studio.empty_draft_title", sub: "studio.empty_draft_sub" },
  ready: { title: "studio.empty_ready_title", sub: "studio.empty_ready_sub" },
  published: { title: "studio.empty_published_title", sub: "studio.empty_published_sub" },
  rejected: { title: "studio.empty_rejected_title", sub: "studio.empty_rejected_sub" },
};

export function EmptyState({ status, onWrite }: { status: StudioStatus; onWrite?: () => void }) {
  const { t } = useTranslation();
  const e = EMPTY[status];
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-md border border-border bg-surface-2 text-text-subtle">
        <IcNib size={24} />
      </span>
      <h3 className="mt-3.5 text-h3 font-semibold">{t(e.title)}</h3>
      <p className="mt-1 max-w-[38ch] text-small text-text-muted">{t(e.sub)}</p>
      {status === "draft" && onWrite && (
        <button onClick={onWrite} className={cn("mt-4", buttonClasses({ variant: "secondary", size: "sm" }))}>
          {t("studio.empty_draft_cta")}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({
  onRetry,
  titleKey = "studio.error_title",
  subKey = "studio.error_sub",
}: {
  onRetry: () => void;
  titleKey?: MessageKey;
  subKey?: MessageKey;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-3.5 rounded-lg border border-danger/30 bg-danger/[0.09] px-4 py-4"
      style={{ animation: "card-in var(--duration-slow) var(--ease-entrance) both" }}
    >
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
        <IcX size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-small font-semibold">{t(titleKey)}</div>
        <div className="text-caption text-text-muted">{t(subKey)}</div>
      </div>
      <button onClick={onRetry} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <IcReload size={15} /> {t("studio.retry")}
      </button>
    </div>
  );
}

// ─────────────────────────────── FirstRun ───────────────────────────────────
export function FirstRun({ onSetup }: { onSetup: () => void }) {
  const { t } = useTranslation();
  const steps: [MessageKey, MessageKey][] = [
    ["studio.fr_step1_t", "studio.fr_step1_d"],
    ["studio.fr_step2_t", "studio.fr_step2_d"],
    ["studio.fr_step3_t", "studio.fr_step3_d"],
  ];
  return (
    <>
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-7 pb-6 shadow-sm">
        <BrandMark size={46} radius={11} className="shadow-sm" />
        <p className="mt-4 text-caption font-semibold uppercase tracking-[0.06em] text-accent">{t("studio.fr_eyebrow")}</p>
        <h2 className="mt-2.5 text-balance text-h2 font-semibold leading-[1.6] tracking-[-0.01em]">{t("studio.fr_title")}</h2>
        <p className="mt-3 max-w-[52ch] text-pretty text-body leading-relaxed text-text-muted">{t("studio.fr_lead")}</p>
        <div className="my-5 flex flex-col gap-0.5">
          {steps.map(([tk, dk], i) => (
            <div key={tk} className={cn("flex items-start gap-3 py-2.5", i > 0 && "border-t border-border")}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-caption font-semibold text-text-muted">
                {i + 1}
              </span>
              <div>
                <div className="text-small font-semibold">{t(tk)}</div>
                <div className="text-small text-text-muted">{t(dk)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSetup} className={buttonClasses({ variant: "primary" })}>
            <IcVoice size={16} /> {t("studio.fr_cta")}
          </button>
          <span className="text-small text-text-subtle">{t("studio.fr_minutes")}</span>
        </div>
      </section>
      <section className="pointer-events-none rounded-xl border border-border bg-surface p-4 opacity-55 saturate-[0.6] shadow-sm">
        <div className="flex items-start gap-3">
          <span className="h-[38px] w-[38px] shrink-0 rounded-full bg-surface-2" />
          <span className="mt-2 text-h3 text-text-subtle">{t("studio.fr_disabled")}</span>
        </div>
      </section>
    </>
  );
}

// ──────────────────────────── Publish dialog ────────────────────────────────
export function StudioPublishDialog({
  open,
  text,
  account,
  publishing,
  onClose,
  onConfirm,
}: {
  open: boolean;
  text: string;
  account: { name: string; handle: string | null; initials: string; avatarUrl?: string | null } | null;
  publishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !publishing) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, publishing, onClose]);
  if (!open) return null;
  const over = text.length > DRAFT_LIMIT;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-6 backdrop-blur-sm max-md:place-items-end max-md:p-0"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-lg max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl max-md:pb-[calc(24px+env(safe-area-inset-bottom))]"
        style={{ animation: "dialog-in var(--duration-slow) var(--ease-entrance) both" }}
      >
        <div className="flex gap-3">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text">
            <IcStudio size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold leading-[1.3]">{t("studio.publish_title")}</h2>
            <p className="mt-1 text-small text-text-muted">{t("studio.publish_sub")}</p>
          </div>
        </div>
        {account && (
          <div className="mt-4 flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5">
            <AccountFace url={account.avatarUrl} initials={account.initials} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-small font-semibold">{account.name}</span>
              {account.handle && <span className="block truncate text-caption text-text-subtle">@{account.handle}</span>}
            </span>
          </div>
        )}
        <div className="mt-3.5 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3.5 text-body leading-[1.6] text-text">
          {text}
        </div>
        <div className="mt-2.5">
          <CharMeter len={text.length} />
        </div>
        <div className="mt-5 flex items-center justify-end gap-2.5 max-md:flex-col-reverse max-md:items-stretch max-md:gap-2">
          <button onClick={onClose} disabled={publishing} className={buttonClasses({ variant: "ghost", className: "max-md:min-h-[44px] max-md:w-full" })}>
            {t("studio.cancel")}
          </button>
          <Button variant="primary" className="max-md:min-h-[44px] max-md:w-full" icon={<IcCheck size={16} />} loading={publishing} disabled={publishing || over || text.length === 0} onClick={onConfirm}>
            {over ? t("studio.too_long") : t("studio.publish_now")}
          </Button>
        </div>
      </div>
    </div>
  );
}
