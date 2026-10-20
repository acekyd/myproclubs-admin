# MyProClubs Admin

Private administration console for MyProClubs. This Nuxt application consumes
the protected Laravel API under `/api/v1/admin/*` and provides tools for managing
users, clubs, competitions, content, support operations, audit history, and
first-party product analytics.

## Requirements

- Node.js 22
- pnpm 10
- MyProClubs Laravel API
- A verified account included in the backend `ADMIN_EMAILS` allowlist

## Getting started

```sh
cp .env.example .env
pnpm install
pnpm dev
```

The development server is available at `http://localhost:3000` by default.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | Yes | Laravel API base URL, including `/api/v1/` |

Example:

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1/
```

The Laravel API must also include the admin origin in its configuration:

```dotenv
ADMIN_EMAILS=operator@myproclubs.com
ADMIN_FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Available commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm preview` | Run the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run Nuxt and Vue TypeScript checks |

## Application areas

- Dashboard and operational summaries
- Users and clubs
- Announcements, media, and recruitment
- Tournaments, seasons, fixtures, records, and player statistics
- Support operations and operator audit logs
- Product events, tournament funnels, and user journeys

Some tournament administration workflows remain available through the Laravel
Filament panel.

## Authentication

The application authenticates through the main MyProClubs login endpoint and
verifies access with `/api/v1/admin/me`. All admin API routes require a valid
Sanctum token and backend platform-admin authorization.

The frontend permission check is used for navigation only. The Laravel API is the
authorization boundary and must reject every unauthorized admin request.

## Product analytics

The Insights section reads first-party analytics from the Laravel API:

- **Journeys** displays timestamped activity by user, session, anonymous visitor,
  or tournament flow.
- **Events** provides searchable and filterable product events.
- **Funnels** reports tournament creation and joining conversion.

Analytics collection happens in the customer application and backend. This admin
application does not collect customer events and requires no analytics provider
credentials.

## Production deployment

Set the production API URL, then install, validate, and build from the lockfile:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Run the generated Nuxt server with the hosting platform's Node process manager.
The production environment should use HTTPS and a restricted backend CORS
allowlist containing the exact admin origin.

Before releasing, verify:

- An allowlisted, verified operator can sign in.
- A regular user receives `403` from `/api/v1/admin/me`.
- Dashboard, entity lists, support actions, and audit logs load correctly.
- Events, Journeys, and Funnels can read the analytics API.
- Direct navigation and refresh work for nested routes.

## Project structure

```text
app/
├── components/      Shared admin UI
├── composables/     API and analytics clients
├── layouts/         Authenticated console layout
├── middleware/      Operator route protection
├── pages/           Route-based admin screens
├── stores/          Authentication state
└── utils/           Navigation and shared utilities
```

## Security

- Keep the application private and retain the configured `noindex, nofollow`
  metadata.
- Never expose backend credentials through `NUXT_PUBLIC_*` variables.
- Keep `ADMIN_EMAILS` and all authorization checks on the Laravel backend.
- Review operator actions through the audit log.
- Do not display SQL statements, stack traces, credentials, or private event data
  in the browser.
