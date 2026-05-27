# pennedly-web

Web frontend for Pennedly — AI co-pilot for Threads creators.

## Current state (May 2026)

Static landing pages only. Files:
- `index.html` — main landing
- `privacy.html` — Privacy Policy (GDPR)
- `terms.html` — Terms of Service (governed by Polish law)
- `data-deletion.html` — Data deletion request flow (referenced by Meta App)

## Deploy

Auto-deployed to **pennedly.com** via Cloudflare Pages on every push to `main`.

## Phase 2 (planned)

Will be replaced with a Next.js 15 (App Router) + Tailwind + shadcn/ui application:
- Public routes: `/`, `/privacy`, `/terms`, `/data-deletion`, `/pricing`, `/blog`
- Authenticated routes: `/login`, `/dashboard`, `/accounts/*`, `/settings`, `/billing`
- Multi-account UI from Day 1 (per architecture decision)
- See `pennedly-backend` for API
