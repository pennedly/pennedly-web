"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/lib/i18n";
import { useSelectedAccountId } from "@/lib/account";
import {
  ApiError,
  fetchCalendar,
  getTokens,
  publishDraft,
  retryScheduledDraft,
  scheduleDraft,
  unscheduleDraft,
} from "@/lib/api";
import { friendlyErrorText } from "@/lib/errors";
import { localUtcOffsetLabel } from "@/lib/timezone";
import { AppTopbar } from "@/components/AppTopbar";
import { Toast, ToastHost } from "@/components/ui/toast";
import { TweaksPanel, TweakRadio, TweakSection, TweakToggle, useTweaks } from "@/components/tweaks/TweaksPanel";
import { ErrorBanner } from "@/components/studio/StudioParts";
import {
  CalendarAgenda,
  CalendarEmpty,
  CalendarSkeleton,
  CalendarToolbar,
  EntryDetail,
  draftIdOf,
} from "@/components/studio/CalendarParts";
import { demoCalendar } from "@/components/studio/calendar-demo";
import type { CalendarEntry } from "@/lib/types";
import { useDemoParam } from "@/lib/query";

const IS_DEV = process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";
const CAL_TWEAKS = { dark: false, state: "Normal" }; // Normal | Empty | Loading | Error
const WINDOW_DAYS = 14;

type ToastT = { id: number; title: string; tone: "success" | "error" };

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const accountId = useSelectedAccountId();

  const demoParam = useDemoParam();
  const [tw, setTw] = useTweaks(CAL_TWEAKS);
  const demoOn = demoParam && IS_DEV;

  const [windowStart, setWindowStart] = useState<Date>(() => startOfToday());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastT[]>([]);

  const windowEnd = useMemo(() => {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + WINDOW_DAYS);
    return d;
  }, [windowStart]);

  function toast(title: string, tone: ToastT["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, title, tone }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4200);
  }

  const reload = useCallback(async () => {
    if (demoOn) {
      const st = (tw.state as string) ?? "Normal";
      setPhase(st === "Loading" ? "loading" : st === "Error" ? "error" : "ready");
      setEntries(st === "Empty" ? [] : demoCalendar());
      return;
    }
    if (accountId === null) return;
    setPhase("loading");
    try {
      const res = await fetchCalendar(accountId, windowStart.toISOString(), windowEnd.toISOString());
      setEntries(res.entries);
      setPhase("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push("/app/login");
        return;
      }
      setPhase("error");
    }
  }, [demoOn, tw.state, accountId, windowStart, windowEnd, router]);

  useEffect(() => {
    if (!demoParam && !getTokens()) {
      router.push("/app/login");
      return;
    }
    void reload();
  }, [reload, demoParam, router]);

  useEffect(() => {
    if (demoOn) document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  async function act(fn: () => Promise<void>, okMsg: string) {
    setBusy(true);
    try {
      await fn();
      setSelected(null);
      toast(okMsg);
    } catch (e) {
      toast(friendlyErrorText(e), "error");
    } finally {
      setBusy(false);
    }
  }
  function onReschedule(entry: CalendarEntry, iso: string) {
    if (demoOn) {
      setEntries((p) => p.map((e) => (e.id === entry.id ? { ...e, scheduled_at: iso } : e)));
      setSelected(null);
      toast(t("calendar.toast_moved"));
      return;
    }
    const id = draftIdOf(entry);
    if (id !== null) void act(async () => { await scheduleDraft(id, iso); await reload(); }, t("calendar.toast_moved"));
  }
  function onPublishNow(entry: CalendarEntry) {
    if (demoOn) {
      setEntries((p) => p.filter((e) => e.id !== entry.id));
      setSelected(null);
      toast(t("studio.toast_published"));
      return;
    }
    const id = draftIdOf(entry);
    if (id !== null) void act(async () => { await publishDraft(id); await reload(); }, t("studio.toast_published"));
  }
  function onUnschedule(entry: CalendarEntry) {
    if (demoOn) {
      setEntries((p) => p.filter((e) => e.id !== entry.id));
      setSelected(null);
      toast(t("calendar.toast_unscheduled"));
      return;
    }
    const id = draftIdOf(entry);
    if (id !== null) void act(async () => { await unscheduleDraft(id); await reload(); }, t("calendar.toast_unscheduled"));
  }
  function onRetry(entry: CalendarEntry) {
    if (demoOn) {
      setEntries((p) => p.map((e) => (e.id === entry.id ? { ...e, status: "scheduled", error: null } : e)));
      setSelected(null);
      toast(t("calendar.toast_retry"));
      return;
    }
    const id = draftIdOf(entry);
    if (id !== null) void act(async () => { await retryScheduledDraft(id); await reload(); }, t("calendar.toast_retry"));
  }

  const rangeLabel = `${windowStart.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${new Date(windowEnd.getTime() - 86_400_000).toLocaleDateString(locale, { month: "short", day: "numeric" })}`;
  const shiftWeek = (dir: -1 | 1) =>
    setWindowStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + dir * 7);
      return n;
    });

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar maxW="960px" title={t("calendar.title")} hasHero />
      <main className="mx-auto flex max-w-[920px] flex-col px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <CalendarToolbar
          rangeLabel={rangeLabel}
          tzLabel={localUtcOffsetLabel()}
          onPrev={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
          onToday={() => setWindowStart(startOfToday())}
          onSchedule={() => router.push("/app")}
        />
        {phase === "loading" ? (
          <CalendarSkeleton />
        ) : phase === "error" ? (
          <ErrorBanner onRetry={() => void reload()} titleKey="calendar.error_title" subKey="calendar.error_sub" />
        ) : entries.length === 0 ? (
          <CalendarEmpty onSchedule={() => router.push("/app")} />
        ) : (
          <CalendarAgenda entries={entries} onSelect={setSelected} />
        )}
      </main>

      {selected && (
        <EntryDetail
          entry={selected}
          busy={busy}
          onClose={() => { if (!busy) setSelected(null); }}
          onReschedule={(iso) => onReschedule(selected, iso)}
          onPublishNow={() => onPublishNow(selected)}
          onUnschedule={() => onUnschedule(selected)}
          onRetry={() => onRetry(selected)}
        />
      )}

      <ToastHost>
        {toasts.map((x) => (
          <Toast key={x.id} tone={x.tone} title={x.title} className="[animation:toast-in_var(--duration-slow)_var(--ease-entrance)]" />
        ))}
      </ToastHost>

      {demoOn && (
        <TweaksPanel title="Calendar">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={!!tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="Data" />
          <TweakRadio label="State" value={tw.state as string} options={["Normal", "Empty", "Loading", "Error"]} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
