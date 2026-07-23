# Connecting to byChronos POS

This app is a customer-facing booking PWA. It reads your services, staff, and
availability from **byChronos** and writes new appointments back into it, so the
salon calendar stays the single source of truth.

## TL;DR — it's already connected (live, no login)

The default provider (`bychronos-public`) talks to the **same public API that
powers your official byChronos booking page** (`go.bychronos.com/l/<slug>/a/services`).
Your salon is identified by its public slug via an `X-Location-URL` header, so
**reads need no credentials**: the app shows Fairy Nail Spa's real catalog, real
techs, and real open times, pulled live.

- Configured salon: `BYCHRONOS_LOCATION_URL=chicago-60657-fairy-nail-spa-805539`.
- **Writes (creating an appointment in the live POS) are OFF by default**
  (`BYCHRONOS_ALLOW_WRITE=false`) so testing never books real appointments in
  your salon. With writes off a booking is captured locally and the confirmation
  screen still works — perfect for demos.
- **The admin login is only needed to turn writes on** (or to use the merchant
  API below). Nothing customer-facing requires it. To make real bookings land in
  byChronos we finish the write path (`POST /appointments`) — that step needs one
  live test and possibly the customer phone-verification the official page uses.
  That's the one remaining piece.

The merchant OAuth path (next section) is an alternative write route if you'd
rather push bookings with server-side credentials than via the public flow.

---

## Merchant OAuth API (alternative write path)

## How the connection works (and why it's safe)

```
Customer's phone (PWA)  ─HTTPS→  this app's server  ─HTTPS→  byChronos (Go3 Schedule API)
                                  holds the secrets
```

Customers only ever talk to **our** server (the Next.js API routes under
`src/app/api`). The byChronos credentials live in server-side environment
variables and are **never** shipped to the browser. Nothing is prefixed with
`NEXT_PUBLIC_`, so there is no way for a customer to see or use your login.

byChronos has no public/self-serve API, but its own apps (Manager, Flex, Kiosk)
run on Go3 Technology's documented **Schedule API**. The OpenAPI spec is public
and checked in at [`go3-schedule-openapi.json`](./go3-schedule-openapi.json).
This app talks to that API. Base URL: `https://schedule.go3apis.com` (production)
or `https://schedule-uat.go3apis.com` (sandbox). Auth is OAuth2 (Laravel
Passport) plus two headers on every call: `X-APPLICATION-ID` and `X-LOCATION-ID`.

## What you need to go live

Six values, all set in `.env.local` (copy `.env.example`). Access is
partnership-gated, so you get them from byChronos rather than a signup page:

| Env var | What it is | Where to get it |
| --- | --- | --- |
| `BYCHRONOS_APPLICATION_ID` | Identifies the byChronos app | byChronos / Go3 |
| `BYCHRONOS_LOCATION_ID` | Your salon location | byChronos Manager → location settings, or Go3 |
| `BYCHRONOS_CLIENT_ID` | OAuth client id | Ask Go3 for an API client |
| `BYCHRONOS_CLIENT_SECRET` | OAuth client secret | Ask Go3 for an API client |
| `BYCHRONOS_USERNAME` | Merchant/staff login the bookings are created under | Your account (prefer a dedicated API user) |
| `BYCHRONOS_PASSWORD` | Password for that login | — |

**Recommended:** email `developer@go3technology.com` (you have owner access) and
ask for **API access for your location** — an Application ID, Location ID, and a
dedicated OAuth client. A dedicated client is scoped and revocable, so you avoid
embedding your personal owner password in the server.

## Turning it on

1. `cp .env.example .env.local`
2. Paste your six values into `.env.local` (this file is gitignored — never commit it).
3. Set `BOOKING_PROVIDER=bychronos`.
4. Test against UAT first: `BYCHRONOS_BASE_URL=https://schedule-uat.go3apis.com`.
5. Run the app, walk one booking end-to-end, confirm it appears in byChronos.
6. Flip `BYCHRONOS_BASE_URL` to production.

Leave `BOOKING_PROVIDER=mock` (the default) to run on realistic sample data with
no credentials — useful for demos and design review.

## What still needs a live pass

The connector (`src/lib/booking/bychronos-provider.ts`) is complete, but a few
response field names can only be pinned down against a live account. Those spots
are marked `VERIFY-AGAINST-LIVE` in the code (staff→services/work-days mapping and
the appointment payload shape). Point the app at a UAT location once you have
credentials and tighten those mappers if the real payload differs.
