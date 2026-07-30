"use client";

// Overview (/app/overview) — the multi-account portfolio rollup, built 1:1 to
// Overview-SPEC.html / Overview-Mobile-SPEC.html. The app is multi-account but
// every other screen is about ONE account; this rollup shows ALL connected
// accounts at once (a combined top strip of portfolio totals over a grid of
// per-account cards) so someone running 3–4 accounts sees the whole picture
// without flipping the switcher. Read-only: cards open into each account's
// screens; the only mutation is Retry on a failed sync.
//
// Reached from the account switcher's "All accounts" pin. The context here is
// "all of them", so no sidebar nav item is active. A real fetchOverview wires
// the data; a tester ?demo=1 panel drives every state (single / many /
// importing / loading / empty / error, light + dark).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, clearTokens, fetchMe, fetchOverview, getTokens } from "@/lib/api";
import { setSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { AppTopbar, HeaderPill, HeroMeta } from "@/components/AppTopbar";
import { IcOverview } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  AccountCard,
  OverviewEmpty,
  OverviewError,
  OverviewNudge,
  OverviewSkeleton,
  PortfolioTotals,
  TriageQueue,
} from "@/components/studio/OverviewParts";
import { OVERVIEW_DEMO, OVERVIEW_TWEAK_DEFAULTS, type OverviewDemoState } from "@/components/studio/overview-demo";
import type { OverviewAccount, OverviewResponse } from "@/lib/types";
import { useDemoParam } from "@/lib/query";
import { HERO_FADE_STYLE } from "@/lib/useHeaderReveal";

const IS_DEV = process.env.NODE_ENV === "development";

export default function OverviewPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const demoParam = useDemoParam();
  const [isTester, setIsTester] = useState(false);
  const allow = demoParam && (IS_DEV || isTester);
  const demoOn = allow;

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [tw, setTw] = useTweaks(OVERVIEW_TWEAK_DEFAULTS);

  useEffect(() => {
    if (!getTokens()) return;
    fetchMe()
      .then((m) => setIsTester(m.is_tester === true))
      .catch(() => {});
  }, []);

  // Real load. Re-run on Retry (reloadKey). Skipped in demo (prop-driven).
  useEffect(() => {
    if (demoParam) return;
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const out = await fetchOverview();
        if (!cancelled) setData(out);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoParam, router, reloadKey]);

  // Demo: dark toggle + a brief loading flash on state change.
  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  const demoState = tw.state as OverviewDemoState;
  useEffect(() => {
    if (!demoOn) return;
    if (demoState === "loading") {
      setLoading(true);
      return;
    }
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(id);
  }, [demoOn, demoState]);

  // The model the screen renders — real data, or the demo fixture for the
  // selected tweak state.
  const model = useMemo<OverviewResponse | null>(() => {
    if (!demoOn) return data;
    if (demoState === "empty" || demoState === "error" || demoState === "loading") return null;
    return OVERVIEW_DEMO[demoState];
  }, [demoOn, demoState, data]);

  // Phase: loading skeleton, the empty/error edges, or ready.
  const phase: "loading" | "empty" | "error" | "ready" = demoOn
    ? demoState === "loading" || loading
      ? "loading"
      : demoState === "empty"
        ? "empty"
        : demoState === "error"
          ? "error"
          : "ready"
    : loading
      ? "loading"
      : error
        ? "error"
        : !model || model.accounts.length === 0
          ? "empty"
          : "ready";

  // Single connected account → degrade gracefully to one card + a "connect
  // another" nudge (no empty portfolio-of-one).
  const single = phase === "ready" && !!model && model.accounts.length === 1;
  // Show per-card network badges only once the portfolio spans >1 network —
  // invisible on Threads-only today, surfaces the moment LinkedIn connects.
  const multiNetwork = !!model && new Set(model.accounts.map((a) => a.network)).size > 1;

  function openAccount(a: OverviewAccount, path = "/app/stats") {
    setSelectedAccountId(a.id);
    router.push(path);
  }

  const accountsCount = model?.totals.accounts_count ?? 0;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="960px"
        title={t("overview.title")}
        hasHero
        pill={
          // App-Header-Pill-Budget-SPEC §8 — the ·-joined string was two facts
          // in one pill (a count and a freshness note) and needed 241px in ru.
          // The count stays as glyph + number; the freshness moves to the hero
          // meta line below, where it runs full-length in every locale.
          phase === "ready" && accountsCount > 0 ? (
            <HeaderPill
              glyph={<IcOverview />}
              tone="accent"
              count={accountsCount}
              zero="idle"
              label={t("overview.pill.accounts").replace("{n}", String(accountsCount))}
            />
          ) : undefined
        }
      />
      <main className="mx-auto flex max-w-[960px] flex-col gap-[18px] px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <h1 style={HERO_FADE_STYLE} className="text-h1 font-semibold tracking-[-0.015em]">{t("overview.title")}</h1>
          <p className="text-body text-text-muted">{t("overview.subtitle")}</p>
          <HeroMeta items={[t("overview.pill.updated")]} />
        </div>

        {phase === "loading" ? (
          <OverviewSkeleton />
        ) : phase === "error" ? (
          <OverviewError onRetry={() => setReloadKey((k) => k + 1)} />
        ) : phase === "empty" ? (
          <OverviewEmpty demo={demoOn} />
        ) : model ? (
          <>
            <TriageQueue
              accounts={model.accounts}
              onOpen={demoOn ? undefined : (acc, path) => openAccount(acc, path)}
              onRetry={() => setReloadKey((k) => k + 1)}
            />
            <PortfolioTotals totals={model.totals} />
            <div className={single ? "grid grid-cols-1 gap-[14px]" : "grid grid-cols-1 gap-[14px] md:grid-cols-2"}>
              {model.accounts.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  showNetwork={multiNetwork}
                  onOpen={demoOn ? undefined : (acc) => openAccount(acc)}
                  onOpenStats={demoOn ? undefined : (acc) => openAccount(acc, "/app/stats")}
                  onOpenReplies={demoOn ? undefined : (acc) => openAccount(acc, "/app/replies?filter=needs-reply")}
                  onRetry={() => setReloadKey((k) => k + 1)}
                />
              ))}
            </div>
            {single && <OverviewNudge demo={demoOn} />}
          </>
        ) : null}
      </main>

      {allow && (
        <TweaksPanel title="Overview">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio
            label="State"
            value={tw.state}
            options={["many", "zeroTriage", "single", "importing", "loading", "empty", "error"]}
            onChange={(v) => setTw("state", v)}
          />
        </TweaksPanel>
      )}
    </div>
  );
}
