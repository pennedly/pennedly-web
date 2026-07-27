// Backend HTTPException `detail` strings are developer-facing ("account not
// found", "target.type must be one of [...]"), never localized, and were
// never real end-user copy even in English. `ApiError.message` embeds that
// raw detail (see api.ts) for logs/Sentry — this maps by HTTP status FAMILY
// to a small set of honest, localized messages instead of showing it, rather
// than inventing a specific reason we don't actually have.

import { ApiError } from "./api";
import { tr } from "./i18n";

export function friendlyErrorText(e: unknown): string {
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
