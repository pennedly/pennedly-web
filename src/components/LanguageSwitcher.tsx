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
import { IcCheck, IcChevDown } from "@/components/icons";

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
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-small text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <span className="text-base leading-none" aria-hidden>
          {selected.flag}
        </span>
        <span className="font-medium uppercase">{selected.code}</span>
        <IcChevDown size={14} className="text-text-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-1.5 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
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
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-small transition-colors ${
                    isSel ? "bg-surface-2 text-text" : "text-text hover:bg-surface-2"
                  }`}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {l.flag}
                  </span>
                  <span className="font-medium">{l.name}</span>
                  {isSel && <IcCheck size={15} className="ml-auto text-text-subtle" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
