"use client";

// On-demand translation widget. Shows a globe button next to any text;
// click opens a language menu; pick one → fetch → display the
// translation below the original with a small toggle to hide it again.
//
// The translation is read-only commentary on the source — never replaces
// it (the source is the canonical thing). Stays per-instance state so
// two TranslateButtons on the same page operate independently.

import { useState } from "react";

import { translateText } from "@/lib/api";
import { captureEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { IcGlobe } from "@/components/icons";
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  type Translation,
} from "@/lib/types";

type Props = {
  text: string;
  // Optional label for analytics (e.g. "draft" vs "role_book_intro")
  source?: string;
  // If you want to size the panel differently per call site
  className?: string;
};

export function TranslateButton({ text, source = "unknown", className = "" }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState<LanguageCode | null>(null);
  const [result, setResult] = useState<Translation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(lang: LanguageCode) {
    setMenuOpen(false);
    setLoading(lang);
    setError(null);
    captureEvent("ui.translate_clicked", { target_lang: lang, source });
    try {
      const t = await translateText(text, lang);
      setResult(t);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  function onClear() {
    setResult(null);
    setError(null);
  }

  return (
    <div className={className}>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label="Translate"
        >
          <IcGlobe size={13} />
          <span>
            {loading
              ? t("translate.translating")
              : result
              ? `${t("translate.translated")} · ${result.target_lang}`
              : t("translate.button")}
          </span>
        </button>
        {menuOpen && (
          <div className="absolute z-10 mt-1 w-44 rounded-md border border-border bg-surface shadow-lg py-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onPick(lang.code)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-2 flex items-center gap-2"
              >
                <span>{lang.name}</span>
                <span className="ml-auto text-xs uppercase text-zinc-400">
                  {lang.code}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="mt-2 rounded border border-border bg-bg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {result.target_lang} ·{" "}
              {result.cached ? t("translate.cached") : t("translate.fresh")}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {t("translate.hide")}
            </button>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {result.translated_text}
          </p>
        </div>
      )}
    </div>
  );
}
