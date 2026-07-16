"use client";

// Mentions — standalone Threads posts elsewhere that @-mention the account,
// filled hourly by the ingest_mentions worker. Read-only feed rebuilt 1:1 to
// Mentions-SPEC.html: an author row (monogram + handle + time + open icon), the
// text with accented @-handles, and a foot with an on-demand translate control
// and an Open in Threads button. The backend gives the handle / text / permalink
// / time (no display name or language tag), so the card leads with the @handle
// and translate is offered generically. A tester ?demo=1 panel drives states.

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMentions, fetchMe, getTokens, translateText } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Spinner } from "@/components/ui/feedback";
import { buttonClasses } from "@/components/ui/button";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import { DEMO_MENTIONS, MN_TWEAK_DEFAULTS } from "@/components/studio/mentions-demo";
import { cn } from "@/lib/cn";
import { IcAt, IcClock, IcExternal, IcGlobe } from "@/components/icons";
import type { LanguageCode, MentionSummary } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const MN_STATES = ["Populated", "Translated", "Empty", "Loading", "Error"];

// Accent the @-handles inside a mention's text.
function highlightMentions(text: string): ReactNode[] {
  return text.split(/(@[a-zA-Z0-9_.]+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-accent">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

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

export default function MentionsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;
  const accountId = useSelectedAccountId();
  const [mentions, setMentions] = useState<MentionSummary[]>([]);
  const [missingScope, setMissingScope] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [tw, setTw] = useTweaks(MN_TWEAK_DEFAULTS);

  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) router.push("/app/login");
  }, [router, demoParam]);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe().then((m) => setIsTester(m.is_tester === true)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (accountId === null) return;
    setLoaded(false);
    setHasError(false);
    setMissingScope(false);
    try {
      const list = await fetchMentions(accountId, { limit: 50 });
      setMentions(list.mentions);
      setMissingScope(list.missing_mentions_scope === true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearTokens();
        router.push("/app/login");
        return;
      }
      setHasError(true);
    } finally {
      setLoaded(true);
    }
  }, [accountId, router]);

  useEffect(() => {
    if (demoParam) return;
    void load();
  }, [load, demoParam]);

  // Demo: drive every state from the tweak panel on mock content.
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const st = tw.state;
    setHasError(st === "Error");
    setMissingScope(false);
    setLoaded(st !== "Loading");
    setMentions(st === "Empty" ? [] : DEMO_MENTIONS);
  }, [demoOn, tw.state]);

  if (checking) return null;

  const translatedState = demoOn && tw.state === "Translated";

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("mentions.title")}
        pill={
          <TopbarPill icon={<IcClock size={13} className="text-text-subtle" />}>
            {t("mentions.updated_hourly")}
          </TopbarPill>
        }
      />
      <main className="mx-auto max-w-[960px] space-y-4 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:space-y-5 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-tight">{t("mentions.title")}</h1>
          <p className="max-w-[64ch] text-body text-text-muted">{t("mentions.subtitle")}</p>
        </div>

        {hasError ? (
          <ErrorBanner title={t("mentions.error_title")} subtitle={t("mentions.error")} onRetry={demoOn ? () => setTw("state", "Populated") : load} />
        ) : !loaded ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : missingScope ? (
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-7 py-16 text-center shadow-sm">
            <span className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcAt size={24} />
            </span>
            <h2 className="text-h2 font-semibold tracking-tight">{t("mentions.reconnect_title")}</h2>
            <p className="mt-2 max-w-[46ch] text-body leading-relaxed text-text-muted">{t("mentions.reconnect_sub")}</p>
            <div className="mt-5">
              <ConnectThreadsButton variant="primary" returnTo="/app/mentions" />
            </div>
          </div>
        ) : mentions.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-7 py-16 text-center shadow-sm">
            <span className="mb-[18px] grid h-[54px] w-[54px] place-items-center rounded-lg border border-border bg-surface-2 text-text-subtle">
              <IcAt size={24} />
            </span>
            <h2 className="text-h2 font-semibold tracking-tight">{t("mentions.empty_title")}</h2>
            <p className="mt-2 max-w-[46ch] text-body leading-relaxed text-text-muted">{t("mentions.empty")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {mentions.map((m) => (
              <li key={m.id}>
                <MentionCard
                  m={m}
                  demo={demoOn}
                  demoTranslation={(m as { translation?: string }).translation}
                  startTranslated={translatedState}
                  locale={locale}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {allow && (
        <TweaksPanel title="Mentions">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={MN_STATES} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

function MentionCard({
  m,
  demo,
  demoTranslation,
  startTranslated,
  locale,
  t,
}: {
  m: MentionSummary;
  demo: boolean;
  demoTranslation?: string;
  startTranslated?: boolean;
  locale: string;
  t: (k: MessageKey) => string;
}) {
  const text = m.text ?? "";
  const [translated, setTranslated] = useState<string | null>(
    startTranslated && demoTranslation ? demoTranslation : null,
  );
  const [busy, setBusy] = useState(false);
  // No language tag from the backend: in the live app translate is offered on
  // every mention; in the demo only the curated foreign ones carry a translation.
  const canTranslate = !!text && (demo ? demoTranslation !== undefined : true);
  const showText = translated ?? text;
  const initial = (m.author_username?.[0] ?? "@").toUpperCase();

  async function onTranslate() {
    if (demo) {
      setTranslated(demoTranslation ?? text);
      return;
    }
    setBusy(true);
    try {
      const r = await translateText(text, locale as LanguageCode);
      setTranslated(r.translated_text);
    } catch {
      /* leave original on failure */
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="rounded-lg border border-border bg-surface px-[18px] pb-[13px] pt-[15px] shadow-sm transition-colors hover:border-text/14"
      style={{ animation: "card-in 240ms var(--ease-entrance) both" }}
    >
      <div className="flex items-center gap-[11px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-small font-semibold text-text-muted max-md:hidden">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold leading-tight">@{m.author_username ?? "—"}</div>
          <div className="text-caption text-text-subtle">{relativeTime(m.published_at ?? m.created_at, locale)}</div>
        </div>
        {m.permalink && (
          <a
            href={m.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("mentions.view")}
            title={t("mentions.view")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text max-md:hidden"
          >
            <IcExternal size={16} />
          </a>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-text">{highlightMentions(showText)}</p>

      <div className="mt-[13px] flex flex-wrap items-center gap-2.5 border-t border-border pt-3 max-md:flex-col max-md:items-stretch">
        {canTranslate ? (
          translated ? (
            <span className="flex flex-1 flex-wrap items-center gap-2 text-caption max-md:w-full">
              <span className="inline-flex items-center gap-1.5 text-text-subtle">
                <IcGlobe size={13} /> {t("mentions.translated")}
              </span>
              <button
                onClick={() => setTranslated(null)}
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                {t("mentions.show_original")}
              </button>
            </span>
          ) : (
            <button
              onClick={onTranslate}
              disabled={busy}
              className="inline-flex flex-1 items-center gap-1.5 text-caption font-medium text-accent underline-offset-2 hover:underline disabled:opacity-60 max-md:w-full"
            >
              {busy ? <Spinner size={13} /> : <IcGlobe size={13} />} {t("mentions.translate")}
            </button>
          )
        ) : (
          <span className="flex-1 max-md:hidden" />
        )}
        {m.permalink && (
          <a
            href={m.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("max-md:w-full md:shrink-0", buttonClasses({ variant: "secondary", size: "sm", className: "max-md:h-auto max-md:min-h-[44px] max-md:whitespace-normal" }))}
          >
            <IcExternal size={15} /> {t("mentions.open_threads")}
          </a>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface px-[18px] pb-[13px] pt-[15px] shadow-sm" aria-hidden="true">
      <div className="flex items-center gap-[11px]">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2 max-md:hidden" />
        <div className="flex-1">
          <div className="h-3 w-36 animate-pulse rounded bg-surface-2" />
          <div className="mt-2 h-2.5 w-20 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        <div className="h-2.5 w-[95%] animate-pulse rounded bg-surface-2" />
        <div className="h-2.5 w-[64%] animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
