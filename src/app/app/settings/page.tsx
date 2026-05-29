"use client";

// Settings — account-level info: who you're signed in as, your plan, and
// the connected Threads accounts (with a "connect another"). Language +
// log out live in the sidebar profile menu. In the shell (has the sidebar).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  clearTokens,
  fetchMe,
  fetchMyAccounts,
  getTokens,
} from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { ConnectThreadsButton } from "@/components/ConnectThreadsButton";
import type { ConnectedAccount, Me } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [me, setMe] = useState<Me | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!getTokens()) {
      router.push("/app/login");
      return;
    }
    (async () => {
      try {
        const [m, a] = await Promise.all([fetchMe(), fetchMyAccounts()]);
        setMe(m);
        setAccounts(a.accounts.filter((x) => x.disconnected_at === null));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearTokens();
          router.push("/app/login");
          return;
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>

        {!loaded && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}

        {loaded && me && (
          <>
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                {t("settings.account")}
              </h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="truncate">{me.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("settings.plan")}</dt>
                  <dd className="capitalize">{me.tenant.plan_tier}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                {t("settings.accounts")}
              </h2>
              <ul className="space-y-2 mb-4">
                {accounts.length === 0 && (
                  <li className="text-sm text-zinc-500">—</li>
                )}
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      @{a.username ?? `acct ${a.id}`}
                    </span>
                    {a.display_name && (
                      <span className="text-zinc-500 truncate">
                        · {a.display_name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <ConnectThreadsButton variant="primary" />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
