"use client";

// Login placeholder. Plain form, no styling polish — UI lives here as
// skeleton until the daytime session with eyes-on-screen.

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, devLogin, fetchMe, setTokens } from "@/lib/api";
import { captureEvent, identify } from "@/lib/analytics";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const pair = await devLogin(email, displayName || undefined);
      setTokens(pair);
      // Hydrate PostHog identity right after sign-in so subsequent
      // pageviews are attributed to the right user.
      try {
        const me = await fetchMe();
        identify(me.user_id, me.email, me.tenant.id);
        captureEvent("ui.login_succeeded", { dev_mode: true });
      } catch {
        // identity hydration is best-effort; don't block the redirect
      }
      router.push("/app");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 404) {
          setError(
            "dev-login is disabled on the backend (set ALLOW_DEV_LOGIN=true)"
          );
        } else if (e.status === 429) {
          setError("too many sign-in attempts — wait an hour");
        } else {
          setError(`sign-in failed (${e.status}): ${JSON.stringify(e.detail)}`);
        }
      } else {
        setError(String(e));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8 font-sans text-zinc-900 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold mb-1">Pennedly</h1>
      <p className="text-sm text-zinc-500 mb-6">sign in (dev mode)</p>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            display name (optional)
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending || !email}
          className="w-full px-4 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black disabled:opacity-50"
        >
          {pending ? "signing in…" : "sign in"}
        </button>
      </form>
    </main>
  );
}
