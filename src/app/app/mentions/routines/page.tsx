"use client";

// «Рутины упоминаний» — the hub of mention routines (on_mention scenarios keyed to
// a custom intent). Reached from the queue's «Рутины» entry. Read + toggle today;
// create/edit via the constructor (next slice). Slice 1 of the mention-routines build.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "@/components/studio/mention-routines.css";
import "@/components/studio/publish-mode.css";
import { ApiError, clearTokens, fetchMe, fetchScenarios, getTokens, setScenarioEnabled } from "@/lib/api";
import { useSelectedAccountId } from "@/lib/account";
import { useTranslation } from "@/lib/i18n";
import { useTesterGuard } from "@/lib/tester";
import { AppTopbar, TopbarPill } from "@/components/AppTopbar";
import { buttonClasses } from "@/components/ui/button";
import { IcAlert, IcAt, IcChevRight, IcReload } from "@/components/icons";
import { TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks } from "@/components/tweaks/TweaksPanel";
import {
  DEMO_ROUTINES,
  MR_TWEAK_DEFAULTS,
  ensureAutopilotMaster,
  isMentionRoutine,
  toRoutine,
  type MRoutine,
} from "@/components/studio/mention-routines";
import { MentionRoutinesHub } from "@/components/studio/mention-routines-hub";

const IS_DEV = process.env.NODE_ENV === "development";
const MR_STATES = ["Populated", "Empty", "Loading", "Error"];

export default function MentionRoutinesPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [demoParam] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") === "1" : false,
  );
  const { checking } = useTesterGuard(demoParam);
  const [isTester, setIsTester] = useState(false);
  const demoOn = demoParam && (IS_DEV || isTester);

  const accountId = useSelectedAccountId();
  const [routines, setRoutines] = useState<MRoutine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [tw, setTw] = useTweaks(MR_TWEAK_DEFAULTS);

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
    try {
      const list = await fetchScenarios(accountId);
      setRoutines(list.scenarios.filter(isMentionRoutine).map(toRoutine));
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

  useEffect(() => {
    if (!demoOn) return;
    document.documentElement.classList.toggle("dark", !!tw.dark);
  }, [demoOn, tw.dark]);

  useEffect(() => {
    if (!demoOn) return;
    const st = tw.state;
    setHasError(st === "Error");
    setLoaded(st !== "Loading");
    setRoutines(st === "Populated" ? DEMO_ROUTINES : []);
  }, [demoOn, tw.state]);

  const onToggle = useCallback(
    async (r: MRoutine, on: boolean) => {
      setRoutines((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: on } : x)));
      if (demoOn) return;
      try {
        await setScenarioEnabled(r.id, on);
        // Turning a routine ON is a no-op unless the autopilot master is on too.
        if (on && accountId !== null) await ensureAutopilotMaster(accountId);
      } catch {
        // revert on failure
        setRoutines((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !on } : x)));
      }
    },
    [demoOn, accountId],
  );

  // Create/edit open the constructor — landing in the next slice.
  const onCreate = useCallback(() => {
    if (!demoOn) router.push("/app/mentions/routines/new");
  }, [demoOn, router]);
  const onEdit = useCallback(
    (r: MRoutine) => {
      if (!demoOn) router.push(`/app/mentions/routines/${r.id}`);
    },
    [demoOn, router],
  );

  if (checking) return null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppTopbar
        maxW="820px"
        title={t("mr.title")}
        pill={<TopbarPill icon={<IcAt size={13} className="text-text-subtle" />}>{t("mr.pill")}</TopbarPill>}
      />
      <main className="mx-auto flex max-w-[820px] flex-col gap-5 px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 md:px-6 md:pb-24 md:pt-7">
        <div className="flex flex-col gap-1">
          <a
            href="/app/mentions"
            className="inline-flex w-fit items-center gap-1 text-caption font-medium text-text-subtle transition-colors hover:text-text"
          >
            <IcChevRight size={13} className="rotate-180" /> {t("mr.back")}
          </a>
          <h1 className="text-h1 font-semibold tracking-tight">{t("mr.title")}</h1>
          <p className="max-w-[60ch] text-body text-text-muted">{t("mr.subtitle")}</p>
        </div>

        {hasError ? (
          <div className="flex gap-3.5 rounded-lg border border-danger/30 bg-danger/[0.06] p-4">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
              <IcAlert size={18} />
            </span>
            <div className="flex-1">
              <div className="text-small font-semibold">{t("mr.error_title")}</div>
              <div className="mt-0.5 text-caption leading-normal text-text-muted">{t("mr.error")}</div>
              <button
                type="button"
                onClick={demoOn ? () => setTw("state", "Populated") : load}
                className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-2.5" })}
              >
                <IcReload size={15} /> {t("mq.action.retry")}
              </button>
            </div>
          </div>
        ) : !loaded ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-lg border border-border bg-surface-2/60" />
            ))}
          </div>
        ) : (
          <MentionRoutinesHub
            routines={routines}
            t={t}
            locale={locale}
            demo={demoOn}
            onToggle={onToggle}
            onEdit={onEdit}
            onCreate={onCreate}
          />
        )}
      </main>

      {demoOn && (
        <TweaksPanel title="Mention routines">
          <TweakSection label="Appearance" />
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTw("dark", v)} />
          <TweakSection label="State" />
          <TweakRadio label="State" value={tw.state} options={MR_STATES} onChange={(v) => setTw("state", v)} />
        </TweaksPanel>
      )}
    </div>
  );
}
