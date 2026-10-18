# Control Room — staging prep (do not auto-deploy)

This file is a checklist. Push/deploy from your hosts when ready.

## What is done

| Area | Status |
| --- | --- |
| Admin API (`/api/v1/admin/*`) | Done — gate, CRUD, support, audit, analytics browse |
| Admin Nuxt app | Done — builds (`pnpm build`) |
| Insights UI (events / funnels / journeys) | Done — calls admin analytics APIs |
| Customer UI tracking | Done in `ui` plugin `tracking.client.ts` (not `app.vue`) |
| BE ingest + queue + funnels | Done — see `be/docs/event-tracking.md` |

## Why Insights look “empty / coming soon”

The Insights pages are **implemented**. If local/staging API has not run analytics
migrations, `GET admin/analytics/status` returns `ready: false` and lists stay empty
with a storage warning. That is infra, not a missing frontend feature.

## Staging env (API / `be`)

```dotenv
ADMIN_EMAILS=your@operator.email
ADMIN_FRONTEND_URL=https://admin.staging.example
CORS_ALLOWED_ORIGINS=https://admin.staging.example
ANALYTICS_ENABLED=true
ANALYTICS_QUEUE_CONNECTION=redis
ANALYTICS_RETENTION_DAYS=90
```

Then:

```sh
php artisan migrate
php artisan config:cache
# restart Horizon / ensure analytics queue worker is running
```

Migrations of note:

- `2026_10_18_000001_create_analytics_events_table`
- `2026_10_18_190000_index_analytics_anonymous_journeys`
- `2026_10_18_160000_create_admin_audit_logs_table`

## Staging env (customer UI)

```dotenv
NUXT_PUBLIC_TRACKING_ENABLED=true
NUXT_PUBLIC_TRACKING_ENVIRONMENT=staging
BASE_URL=https://api.staging.example/api/v1/
```

Rebuild the UI after changing public env.

## Staging env (admin app)

```dotenv
NUXT_PUBLIC_API_BASE=https://api.staging.example/api/v1/
```

```sh
pnpm install
pnpm build
# deploy .output / Node host as you do for other Nuxt apps
```

`admin/` is currently **not** its own git remote (folder under `proclubs/`). Create
a repo or attach it to your preferred remote before push.

## Smoke after staging is up

1. Login to Control Room with an `ADMIN_EMAILS` account.
2. Dashboard counts load.
3. Insights → status `ready: true` (or warning clears).
4. Customer UI with tracking on → generate a page view → Events list updates.
5. Support actions: optional; they do **not** send email.

## Emails

Admin support (`verify_email` / `revoke_tokens` / `set_membership`) does not send
mail. Product transactional mail is unchanged by Control Room.
