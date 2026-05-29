"use client";

// Header-level UI-language picker. Identical mechanics to
// AccountSwitcher: useSyncExternalStore-backed shared state +
// localStorage persistence. Click flag → setLocale → every component
// using useTranslation() re-renders with the new strings instantly,
// no navigation.

import { useState } from "react";

import {
  LOCALES,
  setLocale,
  useLocale,
  type LocaleCode,
} from "@/lib/i18n";
import { getTokens, setMyLocale } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";

export function LanguageSwitcher() {
  const current = useLocale();
  const [open, setOpen] = useState(false);

  const selected = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="change language"
        title="change language"
        className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="text-base leading-none" aria-hidden>
          {selected.flag}
        </span>
        <span aria-hidden className="text-zinc-400">
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-30 w-44 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1">
          {LOCALES.map((l) => {
            const isSel = l.code === current;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLocale(l.code as LocaleCode);
                  setOpen(false);
                  captureEvent("ui.locale_switched", { locale: l.code });
                  if (getTokens()) setMyLocale(l.code).catch(() => {});
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                  isSel
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  {l.flag}
                </span>
                <span className="font-medium">{l.name}</span>
                {isSel && (
                  <span className="ml-auto text-xs text-zinc-500">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
