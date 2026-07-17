"use client";

// Mentions — a triaged queue (redesign, Mentions-Queue-SPEC). The backend
// classifies each @mention by intent (question/lead/spam/…), gives a skip reason
// and media fields, so this is a command center for incoming, not a flat list.
// Three zones top-down: «Needs you» (QUEUE-only, the bot doesn't answer itself),
// the feed (auto-safe + handled), and a collapsed «Filtered» (spam family).
// Read + triage now; the write actions (generate/send/skip) land with their
// backend next, so they show only in the ?demo=1 review for now.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/studio/mentions-queue.css";
import { ApiError, clearTokens, fetchMentions, fetchMe, getTokens, translateText } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation, type MessageKey } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import { buttonClasses } from "@/components/ui/button";
import { IcAlert, IcAt, IcClock, IcReload } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  DEMO_DANGER,
  DEMO_FEED,
  DEMO_FILTERED,
  DEMO_QUEUE,
  MQ_TWEAK_DEFAULTS,
  toMQ,
  type MQMention,
} from "@/components/studio/mentions-queue";
import {
  FilteredStrip,
  LimitPanel,
  type MentionAction,
  MentionCard,
  RoutinesEntry,
  ZoneHead,
} from "@/components/studio/mentions-queue-parts";
import type { LanguageCode } from "@/lib/types";

const IS_DEV = process.env.NODE_ENV === "development";
const MQ_STATES = ["Populated", "Filtered open", "Empty", "Loading", "Error", "Reconnect"];

type Split = { queue: MQMention[]; feed: MQMention[]; filtered: MQMention[] };

function split(rows: MQMention[]): Split {
  const queue: MQMention[] = [];
  const feed: MQMention[] = [];
  const filtered: MQMention[] = [];
  for (const r of rows) {
    if (r.group === "skip") filtered.push(r);
    else if (r.group === "queue") queue.push(r);
    else feed.push(r);
  }
  return { queue, feed, filtered };
}

export default function MentionsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const demoOn = demoParam && (IS_DEV || isTester);

  const accountId = useSelectedAccountId();
  const [rows, setRows] = useState<MQMention[]>([]);
  const [missingScope, setMissingScope] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [filteredOpen, setFilteredOpen] = useState(false);
  const [caps, setCaps] = useState({ comments: 12, mentions: 6 });
  const [tw, setTw] = useTweaks(MQ_TWEAK_DEFAULTS);

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
      setRows(list.mentions.map(toMQ));
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

  // Demo: drive every state from the tweak panel on the seed content.
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const st = tw.state;
    setHasError(st === "Error");
    setMissingScope(st === "Reconnect");
    setLoaded(st !== "Loading");
    setFilteredOpen(st === "Filtered open");
    if (st === "Empty" || st === "Loading" || st === "Error" || st === "Reconnect") {
      setRows([]);
    } else {
      setRows([...DEMO_QUEUE, ...DEMO_FEED, ...DEMO_FILTERED]);
    }
  }, [demoOn, tw.state]);

  if (checking) return null;

  const { queue, feed, filtered } = split(rows);
  const isEmpty = loaded && !hasError && !missingScope && queue.length + feed.length + filtered.length === 0;
  // Demo-only: the scam «example card» (§7) — a veiled-media card with the warn
  // tone. It normally lives in Filtered, so it's rendered explicitly here.
  const showDanger = demoOn && !!tw.danger && !hasError && !missingScope && loaded && rows.length > 0;
  const onTranslate = (text: string) => translateText(text, locale as LanguageCode).then((r) => r.translated_text);
  const onAction = (_id: MQMention["id"], _a: MentionAction) => {
    // Write actions land with their backend next; no-op in the demo review.
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("mentions.title")}
        pill={
          <TopbarPill icon={<IcClock size={13} className="text-text-subtle" />}>{t("mentions.updated_hourly")}</TopbarPill>
        }
      />
      <main className="mx-auto flex max-w-[960px] flex-col gap-5 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-tight">{t("mentions.title")}</h1>
          <p className="max-w-[64ch] text-body text-text-muted">{t("mentions.subtitle")}</p>
        </div>

        {hasError ? (
          <ErrorBannerMQ t={t} onRetry={demoOn ? () => setTw("state", "Populated") : load} />
        ) : missingScope ? (
          <ReconnectMQ t={t} />
        ) : !loaded ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyMQ t={t} />
        ) : (
          <>
            <RoutinesEntry t={t} />

            {queue.length > 0 && (
              <section className="mq-zone">
                <ZoneHead title={t("mq.zone.queue.title")} count={queue.length} sub={t("mq.zone.queue.sub")} />
                {queue.map((m) => (
                  <MentionCard key={m.id} m={m} t={t} locale={locale} demo={demoOn} writeEnabled={demoOn} onAction={onAction} onTranslate={onTranslate} />
                ))}
              </section>
            )}

            {(feed.length > 0 || showDanger) && (
              <section className="mq-zone">
                <ZoneHead title={t("mq.zone.feed.title")} sub={t("mq.zone.feed.sub")} />
                {showDanger && (
                  <MentionCard m={DEMO_DANGER} t={t} locale={locale} demo={demoOn} writeEnabled={demoOn} onAction={onAction} onTranslate={onTranslate} />
                )}
                {feed.map((m) => (
                  <MentionCard key={m.id} m={m} t={t} locale={locale} demo={demoOn} writeEnabled={demoOn} onAction={onAction} onTranslate={onTranslate} />
                ))}
              </section>
            )}

            {filtered.length > 0 && (
              <FilteredStrip rows={filtered} open={filteredOpen} onToggle={() => setFilteredOpen((v) => !v)} t={t} />
            )}

            {demoOn && (
              <LimitPanel
                commentsCap={caps.comments}
                mentionsCap={caps.mentions}
                onStep={(which, d) => setCaps((c) => ({ ...c, [which]: Math.max(0, c[which] + d) }))}
                t={t}
              />
            )}
          </>
        )}
      </main>

      {demoOn && (
        <TweaksPanel title="Mentions queue">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={MQ_STATES} onChange={(v) => setTw("state", v)} />
          <TweakSection label="Variants" />
          <TweakToggle label="Scam (veiled media) example" value={!!tw.danger} onChange={(v) => setTw("danger", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}

function EmptyMQ({ t }: { t: (k: MessageKey) => string }) {
  return (
    <div className="mq-empty">
      <div className="em-mark">
        <IcAt size={24} />
      </div>
      <div className="em-t">{t("mq.empty.title")}</div>
      <div className="em-s">{t("mq.empty.sub")}</div>
    </div>
  );
}

function ErrorBannerMQ({ t, onRetry }: { t: (k: MessageKey) => string; onRetry: () => void }) {
  return (
    <div className="mq-error-banner">
      <span className="eb-mark">
        <IcAlert size={18} />
      </span>
      <div style={{ flex: "1 1 auto" }}>
        <div className="eb-title">{t("mentions.error_title")}</div>
        <div className="eb-sub">{t("mentions.error")}</div>
        <button type="button" onClick={onRetry} className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-2.5" })}>
          <IcReload size={15} /> {t("mq.action.retry")}
        </button>
      </div>
    </div>
  );
}

function ReconnectMQ({ t }: { t: (k: MessageKey) => string }) {
  return (
    <div className="mq-error-banner">
      <span className="eb-mark">
        <IcAlert size={18} />
      </span>
      <div style={{ flex: "1 1 auto" }}>
        <div className="eb-title">{t("mentions.reconnect_title")}</div>
        <div className="eb-sub">{t("mentions.reconnect_sub")}</div>
        <div className="mt-2.5">
          <ConnectThreadsButton variant="primary" returnTo="/app/mentions" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="mq-card" aria-hidden="true">
      <div className="mq-head">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-2" />
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
