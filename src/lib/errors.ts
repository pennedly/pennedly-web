// Turning a failed API call into a sentence a person can act on.
//
// Two layers, cheapest-first:
//
//   1. `code` — the backend's stable machine code (`AppError.code`, see the
//      backend's `pennedly/errors.py`). It names WHICH of the user's own
//      actions failed, so it maps to a real localized sentence with the
//      numbers interpolated: "Ты израсходовал все 100 генераций постов…".
//      Keys live under `error.code.<code>` and mirror the backend catalogue 1:1.
//   2. HTTP status family — the fallback. Backend `detail` strings are
//      developer-facing ("account not found", "target.type must be one of
//      [...]"), never localized, and were never real end-user copy even in
//      English. `ApiError.message` embeds that raw detail (see api.ts) for
//      logs/Sentry — this maps by status FAMILY to a small set of honest,
//      localized messages instead of showing it.
//
// A code always beats the status: 429 "you hit the monthly post ceiling" and
// 429 "you clicked translate five times in a second" want different words.
// An untranslated or unknown code degrades to the status message, never to a
// blank toast and never to raw English.

import { ApiError } from "./api";
import type { ApiErrorParams } from "./api";
import { tr, trIfExists } from "./i18n";

const PLACEHOLDER_RE = /\{(\w+)\}/g;

/** Render one `params` value for a sentence.
 *
 *  Byte counts are the only ones that need work: the backend sends the raw
 *  ceiling (10485760) because it can't know how eight locales spell "MB", so
 *  the NUMBER converts here and the UNIT lives in the translated string. One
 *  decimal, and no trailing ".0". */
function renderParam(name: string, value: string | number): string {
  if (name.endsWith("_bytes") && typeof value === "number") {
    return String(Math.round((value / (1024 * 1024)) * 10) / 10);
  }
  return String(value);
}

/** Substitute `{name}` placeholders, or give up.
 *
 *  Returning null on a placeholder with no value is the safety net that makes
 *  the whole scheme safe to extend: if the backend ever stops sending a param
 *  a sentence depends on, the user sees the status fallback rather than a
 *  literal "Try again in {retry_after} s." */
function interpolate(text: string, params: ApiErrorParams): string | null {
  let missing = false;
  const out = text.replace(PLACEHOLDER_RE, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      missing = true;
      return "";
    }
    return renderParam(name, value);
  });
  return missing ? null : out;
}

/** The localized sentence for this error's `code`, or null when there isn't
 *  one (no code, a code we haven't translated, or a param the sentence needs
 *  and didn't get).
 *
 *  Exported for the few screens that own bespoke copy for the generic case and
 *  only want to override it when the server told us something specific. Most
 *  callers want `friendlyErrorText`, which falls back for them. */
export function errorCodeText(e: unknown): string | null {
  if (!(e instanceof ApiError) || !e.code) return null;
  const text = trIfExists(`error.code.${e.code}`);
  if (text === null) return null;
  // `retry_after` also arrives as the `Retry-After` header, already parsed into
  // `retryAfter` — fold it in so a body that omits it still renders the delay,
  // without a second seconds-formatting path.
  const params: ApiErrorParams = { ...(e.params ?? {}) };
  if (params.retry_after === undefined && e.retryAfter !== null) {
    params.retry_after = e.retryAfter;
  }
  return interpolate(text, params);
}

export function friendlyErrorText(e: unknown): string {
  const specific = errorCodeText(e);
  if (specific !== null) return specific;
  if (e instanceof ApiError) {
    const s = e.status;
    if (s === 401 || s === 403) return tr("error.toast_forbidden");
    if (s === 404) return tr("error.toast_not_found");
    if (s === 409) return tr("error.toast_conflict");
    if (s === 429) return tr("error.toast_rate_limited");
    if (s >= 500) return tr("error.toast_server");
    return tr("error.toast_generic");
  }
  // fetch() rejects with a TypeError specifically on a network failure
  // (DNS/offline/CORS) — everything else falls back to the generic message.
  if (e instanceof TypeError) return tr("error.toast_network");
  return tr("error.toast_generic");
}
