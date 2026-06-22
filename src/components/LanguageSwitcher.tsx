"use client";

// Header-level UI-language picker. Identical mechanics to
// AccountSwitcher: useSyncExternalStore-backed shared state +
// localStorage persistence. Click → setLocale → every component
// using useTranslation() re-renders with the new strings instantly,
// no navigation. Visually matches the login LangSwitch (globe + locale
// code, monochrome) rather than flags, per request — one globe pattern
// everywhere a language switcher appears.

import { useState } from "react";

import {
  LOCALES,
  setLocale,
  useLocale,
  useTranslation,
  type LocaleCode,
} from "@/lib/i18n";
import { getTokens, setMyLocale } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { IcCheck, IcChevDown, IcGlobe } from "@/components/icons";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const current = useLocale();
  const [open, setOpen] = useState(false);

  const selected = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("a11y.change_language")}
        title={t("a11y.change_language")}
        className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-small text-text-muted transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-surface-2 hover:text-text"
      >
        <IcGlobe size={15} />
        <span className="font-mono text-caption font-medium uppercase">{selected.code}</span>
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
                  <span className="w-[22px] font-mono text-caption uppercase text-text-subtle">
                    {l.code}
                  </span>
                  <span className="flex-1 font-medium">{l.name}</span>
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
