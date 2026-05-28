"use client";

// Renders the list of conflicts surfaced by /api/.../role-book/lint.
//
// One card per conflict with:
//   • severity dot (red/yellow/green) + title
//   • plain-English description
//   • list of contradicting items grouped by section, in monospace so
//     the user recognizes them as exact text from their own sections
//   • the LLM's suggested fix in a slightly emphasized block
//
// The component is "presentational" — it does not call the API itself.
// The parent owns the lint state (loading / result / error) and passes
// the result in. Empty results render a green "no conflicts" banner.

import type {
  LintConflict,
  LintFix,
  LintResult,
  LintSeverity,
} from "@/lib/types";

const SEVERITY_LABEL: Record<LintSeverity, string> = {
  high: "high",
  medium: "medium",
  low: "low",
};

function severityClasses(s: LintSeverity): {
  border: string;
  bg: string;
  text: string;
  dot: string;
} {
  if (s === "high") {
    return {
      border: "border-red-300 dark:border-red-900/60",
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-800 dark:text-red-200",
      dot: "bg-red-500",
    };
  }
  if (s === "medium") {
    return {
      border: "border-amber-300 dark:border-amber-900/60",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-800 dark:text-amber-200",
      dot: "bg-amber-500",
    };
  }
  return {
    border: "border-zinc-300 dark:border-zinc-700",
    bg: "bg-zinc-50 dark:bg-zinc-900/40",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-400",
  };
}

function fixPreview(fix: LintFix): string {
  // Short, human-readable preview shown above the Apply button. The
  // user needs to know WHAT will happen before they click — no
  // surprise edits.
  switch (fix.kind) {
    case "remove_item":
      return `Remove from ${fix.section}: "${fix.text}"`;
    case "replace_item":
      return `In ${fix.section}: replace "${fix.from}" → "${fix.to}"`;
    case "add_item":
      return `Add to ${fix.section}: "${fix.text}"`;
    case "set_intro":
      return `Replace intro with ${fix.text.length} chars`;
  }
}

function ConflictCard({
  conflict,
  onApplyFix,
  applyingFix,
  applyError,
}: {
  conflict: LintConflict;
  onApplyFix: ((fix: LintFix) => Promise<void>) | undefined;
  applyingFix: boolean;
  applyError: string | null;
}) {
  const c = severityClasses(conflict.severity);
  const fix = conflict.fix ?? null;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${c.dot}`}
          aria-hidden
        />
        <span
          className={`text-[10px] uppercase tracking-wide font-semibold ${c.text}`}
        >
          {SEVERITY_LABEL[conflict.severity]}
        </span>
        <span className={`text-sm font-semibold ${c.text}`}>
          {conflict.title}
        </span>
      </div>
      <p className={`text-sm leading-relaxed ${c.text}`}>
        {conflict.description}
      </p>
      <div className="space-y-1.5">
        {conflict.items.map((item, i) => (
          <div
            key={`${i}-${item.section}-${item.text}`}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2"
          >
            <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-500">
              {item.section}
            </div>
            <div className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">
              {item.text}
            </div>
          </div>
        ))}
      </div>
      {conflict.suggestion && (
        <div className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            Suggested fix
          </div>
          <div className="text-sm text-zinc-800 dark:text-zinc-200">
            {conflict.suggestion}
          </div>
          {fix && onApplyFix && (
            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => onApplyFix(fix)}
                disabled={applyingFix}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                {applyingFix && (
                  <span
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden
                  />
                )}
                {applyingFix ? "applying…" : "apply this fix"}
              </button>
              <span className="text-xs text-zinc-500 font-mono">
                {fixPreview(fix)}
              </span>
            </div>
          )}
          {applyError && (
            <div className="text-xs text-red-600 dark:text-red-400">
              {applyError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LintResults({
  result,
  onApplyFix,
  applyingFixIdx,
  applyError,
}: {
  result: LintResult;
  // Called when the user clicks "apply this fix" on a conflict that
  // carried a structured fix. Receives the fix descriptor; the parent
  // is responsible for the PATCH + re-fetch + re-lint cycle. Pass
  // undefined to disable the apply button (e.g. while saving).
  onApplyFix?: (fix: LintFix, conflictIdx: number) => Promise<void>;
  applyingFixIdx?: number | null;
  applyError?: string | null;
}) {
  if (result.conflicts.length === 0) {
    return (
      <div className="rounded-lg border border-green-300 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 p-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full bg-green-500"
            aria-hidden
          />
          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
            No conflicts found
          </span>
        </div>
        <p className="text-xs text-green-700 dark:text-green-300 mt-1.5">
          The sections look consistent. The generator should honor every
          explicit rule.
        </p>
      </div>
    );
  }

  const high = result.conflicts.filter((c) => c.severity === "high").length;
  const medium = result.conflicts.filter((c) => c.severity === "medium").length;
  const low = result.conflicts.filter((c) => c.severity === "low").length;

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-500 flex items-center gap-3 flex-wrap">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {result.conflicts.length}{" "}
          {result.conflicts.length === 1 ? "conflict" : "conflicts"}
        </span>
        {high > 0 && <span>· {high} high</span>}
        {medium > 0 && <span>· {medium} medium</span>}
        {low > 0 && <span>· {low} low</span>}
        <span className="ml-auto text-zinc-400">
          {result.latency_ms}ms ·{" "}
          {result.prompt_tokens + result.completion_tokens} tok ·{" "}
          {result.llm_model}
        </span>
      </div>
      {result.conflicts.map((c, i) => (
        <ConflictCard
          key={i}
          conflict={c}
          onApplyFix={
            onApplyFix
              ? (fix) => onApplyFix(fix, i)
              : undefined
          }
          applyingFix={applyingFixIdx === i}
          applyError={applyingFixIdx === i ? applyError ?? null : null}
        />
      ))}
    </div>
  );
}
