"use client";

// «История изменений» (/app/account/history) — the unified applied-changes
// journal for the selected Threads account: everything Pennedly applied by a
// one-click (Agent actions, Voice-check fixes, Audit decisions). Account-zone,
// reached from account settings. Read-only; the endpoint enforces account
// ownership. ?demo=1 renders the real component on sample data (no backend).

import { useCallback, useEffect, useState } from "react";

import { AppliedChangesHistory, sampleAppliedChanges } from "@/components/account/AppliedChangesHistory";
import { useSelectedAccountId } from "@/lib/account";
import { fetchAppliedChanges, rollbackAppliedChange } from "@/lib/api";
import type { AppliedChangeEntry } from "@/lib/types";
import { useDemoParam } from "@/lib/query";

const IS_DEV = process.env.NODE_ENV === "development";
const PAGE = 50;

export default function AccountHistoryPage() {
  const demoParam = useDemoParam();
  const demoOn = demoParam && IS_DEV;
  const accountId = useSelectedAccountId();

  const [entries, setEntries] = useState<AppliedChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(() => {
    if (accountId === null) {
      // No account selected (e.g. a fresh deep-link before a profile is picked):
      // don't hang on the skeleton — fall through to the component's empty state.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetchAppliedChanges(accountId, { limit: PAGE, offset: 0 })
      .then((res) => {
        setEntries(res.entries);
        setHasMore(res.entries.length === PAGE);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (demoParam) {
      // Review mode: real component, sample data, no backend.
      setEntries(demoOn ? sampleAppliedChanges() : []);
      setLoading(false);
      setError(false);
      setHasMore(false);
      return;
    }
    loadInitial();
  }, [demoParam, demoOn, loadInitial]);

  const onLoadMore = () => {
    if (accountId === null || loadingMore) return;
    setLoadingMore(true);
    fetchAppliedChanges(accountId, { limit: PAGE, offset: entries.length })
      .then((res) => {
        setEntries((prev) => [...prev, ...res.entries]);
        setHasMore(res.entries.length === PAGE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  // Undo one change: POST rollback → patch the entry in place with the server's
  // updated version (now rolled_back_at). On demo there is no backend — the
  // confirm dialog stays inert (onRollback is undefined). Throws propagate to the
  // dialog's inline error.
  const onRollback =
    demoParam || accountId === null
      ? undefined
      : async (entry: AppliedChangeEntry) => {
          const { entry: updated } = await rollbackAppliedChange(accountId, entry.id);
          setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        };

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-8 md:py-9">
        <AppliedChangesHistory
          entries={entries}
          loading={loading && !demoParam}
          error={error}
          onRetry={loadInitial}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
          onRollback={onRollback}
        />
      </div>
    </div>
  );
}
