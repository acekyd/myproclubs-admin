# ProClubs Control Room

Nuxt operator console for MyProClubs. Talks to the Laravel admin API on `be` (`/api/v1/admin/*`). Filament remains available in parallel.

## Requirements

- Node 20+
- pnpm 10+
- Backend on `feat/admin-api` (or later) with `ADMIN_EMAILS` configured
- Operator account: email must be verified **and** listed in `ADMIN_EMAILS`

## Setup

```bash
cp .env.example .env
# point NUXT_PUBLIC_API_BASE at your API, e.g. http://localhost:8000/api/v1/
pnpm install
pnpm dev
```

Default local URL: [http://localhost:3000](http://localhost:3000)

## Backend env

On `be`:

```
ADMIN_EMAILS=you@myproclubs.com
ADMIN_FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

`CORS_ALLOWED_ORIGINS` (comma-separated) is preferred for credentialed SPA calls. Falls back to `ADMIN_FRONTEND_URL`, then `*`.

## Auth flow

1. `POST /api/v1/login` — response includes `user.is_platform_admin`
2. Non-operators are blocked in the SPA before calling admin routes
3. All `/api/v1/admin/*` routes require Sanctum + `EnsurePlatformAdmin`

## Smoke checklist

- [ ] Non-allowlist user: login OK, Control Room shows “not an operator”, `/admin/me` returns 403
- [ ] Allowlist verified user: dashboard loads with counts
- [ ] Support action updates subject and writes an audit row
- [ ] Edit user/club in Nuxt reflects in Filament (and vice versa)
- [ ] Dashboard counts match Filament Support & operations page

## Ad blockers

Routes under `/insights/*` (product events / funnels). Paths named `analytics` are often blocked by browser content blockers and can break Nuxt client hydration (login then looks like a full page refresh with no API call).

## Deploy

Build a Node or static SSR deploy as needed:

```bash
pnpm build
pnpm preview
```

Set `NUXT_PUBLIC_API_BASE` and `ADMIN_FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` to the production admin origin.

## Out of scope (still Filament)

Tournament rounds, standings, prizes, invitations, club requests, admin invitations, and tournament match player-stat deep CRUD.


## Owned event tracking and journeys

The Insights section is wired to the backend's first-party analytics APIs. No
PostHog or other analytics account is required. Events remain in your database.

- **Journeys** lists sessions and opens a chronological timeline by user, session,
  anonymous visitor or tournament creation attempt. Expand events to see click
  labels, route templates, API status, request/page IDs and UTC occurrence/receipt
  timestamps. User account pages include a direct **User journey** link.
- **Events** supports environment, period, source, account, session, exact event,
  name search and failure filters, plus event details and journey links.
- **Funnels** shows the live creation, EA creation and joining reports.

Deploy the backend analytics migrations, start the dedicated Redis analytics
worker, set `ANALYTICS_ENABLED=true`, and enable
`NUXT_PUBLIC_TRACKING_ENABLED=true` on the customer UI. This admin needs only its
existing `NUXT_PUBLIC_API_BASE` and operator login. Collection readiness and disabled
states appear in each screen. Keep customer and admin origins in the backend's
`CORS_ALLOWED_ORIGINS` setting.

Verified account events and anonymous session context are labelled separately.
Mixed-account sessions are not automatically merged. The event feed is best-effort
product telemetry, separate from the existing operator audit log. Historical
journeys before collection was enabled cannot be recovered.
