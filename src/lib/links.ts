// Find the first http(s) URL in a block of text — used to decide whether to
// show a link-preview card under a post/draft. Deliberately simple: it only
// needs to detect a shared link; the backend re-validates (and SSRF-guards)
// the URL before fetching it.

const URL_RE = /https?:\/\/[^\s<>"']+/i;

export function extractFirstUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = URL_RE.exec(text);
  if (!m) return null;
  // Trim trailing punctuation that commonly abuts a URL in prose ("…see x.com).").
  return m[0].replace(/[.,;:!?)\]}>'"]+$/, "");
}
