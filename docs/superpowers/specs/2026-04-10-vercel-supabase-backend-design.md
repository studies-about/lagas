# LAGAS — Vercel + Supabase Backend Design

**Date:** 2026-04-10  
**Status:** Approved

---

## Overview

Migrate LAGAS from a pure frontend app (client secrets exposed in browser bundle) to a production-ready architecture using Supabase Auth + Supabase DB + one Vercel serverless function. Fixes the OAuth security issue and adds a real database for user data persistence.

---

## Architecture

```
Browser (React + Vite)
    │
    ├── Supabase Auth  ←── Google OAuth (native, managed by Supabase)
    │       └── JWT session managed by @supabase/supabase-js
    │
    ├── Supabase DB  ←── profiles, routes, kits, orders
    │       └── RLS: users can only read/write their own rows
    │
    └── Vercel API route
            └── GET /api/strava/callback
                    ├── receives `code` from Strava redirect
                    ├── exchanges for tokens server-side (secret never exposed)
                    ├── reads authenticated user from Supabase JWT
                    ├── upserts Strava tokens into profiles table
                    └── redirects to /salida
```

---

## Database Schema (Supabase)

### `profiles`
Extends `auth.users`. Created automatically on first Google login via a Supabase trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = auth.users.id |
| email | text | |
| name | text | |
| avatar_url | text | |
| cyclist_type | text | 'amateur' \| 'entrenado' \| 'competitivo' |
| age_range | text | '18-25' \| '26-35' \| '36-45' \| '46-55' \| '56+' |
| weekly_km | int | |
| dietary_type | text | 'omnivoro' \| 'vegetariano' \| 'vegano' |
| strava_access_token | text | |
| strava_refresh_token | text | |
| strava_expires_at | bigint | Unix timestamp |
| created_at | timestamptz | default now() |

### `routes`
Imported from Strava. Max 10 per user (enforced in app logic).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | |
| strava_id | bigint | unique per user |
| name | text | |
| distance_km | numeric(6,2) | |
| elevation_m | numeric(6,1) | |
| duration_seconds | int | |
| date | date | |
| created_at | timestamptz | default now() |

### `kits`
Nutrition products. Seeded by admin, read-only for users.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| description | text | |
| price_clp | int | |
| image_url | text | |
| category | text | 'gel' \| 'polvo' \| 'barra' \| 'mix' |
| active | boolean | default true |

### `orders`
Purchases linking users to kits.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | |
| kit_id | uuid FK → kits.id | |
| route_id | uuid FK → routes.id | nullable — kit associated to a route |
| quantity | int | |
| total_clp | int | |
| status | text | 'pending' \| 'paid' \| 'cancelled' |
| subscription_type | text | 'once' \| 'monthly' \| 'flexible' |
| created_at | timestamptz | default now() |

### Row Level Security
- `profiles`: users read/write only their own row
- `routes`: users read/write only their own rows
- `orders`: users read/write only their own rows
- `kits`: read-only for all authenticated users

---

## Vercel API Routes

### `api/strava/callback.ts`

**Flow:**
1. Strava redirects to `https://<domain>/api/strava/callback?code=xxx`
2. Route reads `code` from query params
3. POSTs to `https://www.strava.com/oauth/token` with `STRAVA_CLIENT_SECRET` (server-side env var)
4. Reads the authenticated Supabase user from the `Authorization: Bearer <jwt>` cookie/header
5. Upserts `strava_access_token`, `strava_refresh_token`, `strava_expires_at` into `profiles`
6. Redirects browser to `/salida`

### `api/strava/refresh.ts`

Needed because `STRAVA_CLIENT_SECRET` must not be in the frontend bundle — token refresh also requires it.

**Flow:**
1. Frontend calls `POST /api/strava/refresh` with the Supabase JWT (authenticated)
2. Route reads `strava_refresh_token` from user's `profiles` row
3. POSTs to `https://www.strava.com/oauth/token` with `grant_type: refresh_token`
4. Updates `strava_access_token` and `strava_expires_at` in `profiles`
5. Returns new `access_token` to frontend

**Vercel environment variables (server-side only, no VITE_ prefix):**
```
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## Frontend Changes

### Removed
- `src/lib/googleAuth.ts` — replaced by Supabase Auth
- `src/hooks/useGoogleAuth.ts` — replaced by `useAuth.ts`
- `src/pages/GoogleCallback.tsx` — Supabase handles this callback internally

### Modified
- `src/lib/stravaAuth.ts` — remove `exchangeCode()` and `refreshToken()` (done server-side now); keep redirect and token storage helpers. Add `refreshTokenViaServer()` that calls `/api/strava/refresh`
- `src/pages/StravaCallback.tsx` — instead of calling Strava directly, redirect to `/api/strava/callback?code=xxx`
- `src/App.tsx` — remove GoogleCallback route

### Added
- `src/lib/supabase.ts` — Supabase client using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `src/hooks/useAuth.ts` — wraps `supabase.auth.getSession()` and `signInWithOAuth({ provider: 'google' })`

### Frontend environment variables (public, VITE_ prefix OK)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRAVA_CLIENT_ID      ← client_id is public, safe to expose
```

---

## Deployment

- Frontend + API route deployed together on Vercel
- Supabase project created at supabase.com
- Google OAuth credentials configured in both Google Cloud Console AND Supabase Auth dashboard
- Authorized redirect URI in Google Cloud Console: `https://<supabase-project>.supabase.co/auth/v1/callback`
- Strava app redirect URI: `https://<vercel-domain>/api/strava/callback`

---

## What Does NOT Change

- All React pages, components, and UI logic
- Strava activities fetch (`useStravaActivities.ts`) — still calls Strava API directly from frontend using the stored access token
- Route calculation logic
- shadcn/ui components
