# ProClubs Control Room

Private operator console for MyProClubs. The app is a Nuxt frontend for the
protected Laravel API under `/api/v1/admin/*`. It manages product data, support
operations, audit history, and first-party product analytics. Filament remains
available for workflows that have not moved into Control Room.

## What is included

- Dashboard and operational counts
- Users and clubs
- Announcements, media, and recruitment posts
- Tournaments, seasons, fixtures, records, and player statistics
- Support operations and operator audit logs
- Product events, tournament funnels, and timestamped user journeys

The analytics screens can follow a journey by account, browser session,
anonymous visitor, or tournament creation attempt. Verified account activity and
anonymous session context are labelled separately; sessions shared by multiple
accounts are not attributed automatically.

## Stack

- Nuxt 4 and Vue 3
- Nuxt UI 4
- Pinia
- TypeScript
- pnpm 10

Use Node 22 locally and in deployment.

## Local setup

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Set the API base in `.env`:

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1/
```

The development server opens at `http://localhost:3000` by default. The API base
may include or omit the trailing slash; the client normalizes it.

## Backend configuration

The Laravel backend controls access and must know the admin origin:

```dotenv
ADMIN_EMAILS=operator@myproclubs.com
ADMIN_FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

`ADMIN_EMAILS` is a comma-separated allowlist. An operator must have a verified
MyProClubs account whose email is on that list. `CORS_ALLOWED_ORIGINS` should list
the customer and admin origins in production.

## Authentication and authorization

1. The login page calls `POST /api/v1/login`.
2. The returned user must have `is_platform_admin=true`.
3. The app verifies the session through `GET /api/v1/admin/me`.
4. Every admin API route independently requires Sanctum authentication and the
   backend platform-admin guard.

The browser stores the Sanctum token in the `mpc_admin_token` cookie for up to
three days. A 401 or 403 clears the local session and returns the operator to the
login screen. The UI check is for navigation; backend authorization remains the
security boundary.

## Product analytics

Control Room reads first-party events owned by MyProClubs. It does not require
PostHog or another analytics account.

- **Journeys** shows chronological page visits, clicks, form actions, API results,
  tournament steps, timestamps, and correlation identifiers.
- **Events** provides environment, period, source, account, session, tournament,
  event-name, search, and failure filters.
- **Funnels** reports tournament creation, EA creation, and join conversion.

The selectors support up to 365 days, matching the default backend retention.
The admin app only reads analytics; event collection happens in the customer UI
and Laravel backend. Product telemetry is separate from operator audit history.

If an Insights page reports that analytics is unavailable, verify that the
backend migrations ran against the analytics database, the analytics queue worker
is running, and collection is enabled. Events that occurred before collection was
enabled cannot be reconstructed.

## Commands

```sh
pnpm dev        # local development
pnpm lint       # ESLint
pnpm typecheck  # Nuxt/Vue TypeScript checks
pnpm build      # production build
pnpm preview    # run the built app locally
```

## Deployment

Set the production API URL before building:

```dotenv
NUXT_PUBLIC_API_BASE=https://api.example.com/api/v1/
```

Then install and build with the lockfile:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Run the generated Nuxt server using the hosting platform's normal Node process.
Keep the application private, set `robots` to no-index as configured, and restrict
the backend CORS allowlist to known customer and admin origins.

## Production smoke test

- [ ] A non-allowlisted account can sign in to MyProClubs but receives 403 from
      `/api/v1/admin/me` and cannot enter Control Room.
- [ ] A verified allowlisted operator can sign in and load dashboard counts.
- [ ] User, club, tournament, and match-data lists load from the production API.
- [ ] A support action updates its subject and creates an audit entry.
- [ ] Edits made in Control Room are visible in Filament, and vice versa.
- [ ] Journeys, Events, and Funnels show the backend environment and retention.
- [ ] A recent customer action appears in Events and its correlated journey.
- [ ] Direct navigation and page refresh work for nested routes.

## Troubleshooting

If login succeeds and the app immediately returns to `/login`, check the operator
allowlist, email verification, API base URL, CORS origins, and `/admin/me`
response. Browser content blockers may block URLs containing `analytics`; the app
uses `/insights/*` routes to avoid that class of false positive.

For server errors, inspect the Laravel logs and confirm the relevant migrations
have run. Control Room intentionally shows a short operational error instead of
SQL statements or stack traces.

## Work still handled in Filament

Tournament rounds, standings, prizes, invitations, club requests, admin
invitations, and deep tournament match player-stat editing remain in Filament.
