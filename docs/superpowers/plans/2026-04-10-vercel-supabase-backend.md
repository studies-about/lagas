# Vercel + Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate LAGAS from a pure frontend app with exposed OAuth secrets to a production-ready architecture using Supabase Auth (Google login), Supabase DB (profiles/routes/kits/orders), and two Vercel serverless functions (Strava OAuth exchange + token refresh).

**Architecture:** Supabase Auth handles Google OAuth natively. The frontend uses `@supabase/supabase-js` directly for data access protected by Row Level Security. Two Vercel API routes (`/api/strava/callback` and `/api/strava/refresh`) keep the Strava client secret server-side.

**Tech Stack:** React 18 + Vite, @supabase/supabase-js, Vercel serverless functions (TypeScript), Supabase (Postgres + Auth + RLS)

---

## File Map

### Created
- `src/lib/supabase.ts` — Supabase client (anon key, used by frontend)
- `src/hooks/useAuth.ts` — Supabase session hook (replaces useGoogleAuth)
- `api/strava/callback.ts` — Vercel serverless: exchanges Strava code for tokens
- `api/strava/refresh.ts` — Vercel serverless: refreshes expired Strava access token
- `vercel.json` — SPA routing + framework config
- `.env` — local env vars (not committed)

### Modified
- `src/lib/stravaAuth.ts` — remove `exchangeCode` and `refreshToken`, add `refreshTokenViaServer`
- `src/pages/StravaCallback.tsx` — call POST `/api/strava/callback` instead of Strava directly
- `src/hooks/useStravaAuth.ts` — use `refreshTokenViaServer` instead of `refreshToken`
- `src/pages/ProximaSalida.tsx` — replace `useGoogleAuth` with `useAuth`
- `src/App.tsx` — remove GoogleCallback route

### Deleted
- `src/lib/googleAuth.ts`
- `src/hooks/useGoogleAuth.ts`
- `src/pages/GoogleCallback.tsx`

---

## Prerequisites (manual steps before running tasks)

### A. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `lagas` | Region: South America (São Paulo) | Save the password
3. Wait for project to provision (~2 min)
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server only)

### B. Configure Google OAuth in Supabase
1. In Supabase Dashboard → **Authentication → Providers → Google** → Enable
2. You need a Google OAuth app. Go to [console.cloud.google.com](https://console.cloud.google.com):
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**
3. Paste them in Supabase → Authentication → Providers → Google
4. Save also `VITE_GOOGLE_CLIENT_ID` if needed for display, but **no client secret in frontend**

### C. Get Strava API credentials
1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an app if you don't have one
3. Set **Authorization Callback Domain**: your Vercel domain (e.g. `lagas.vercel.app`)
4. Copy **Client ID** → `VITE_STRAVA_CLIENT_ID` and `STRAVA_CLIENT_ID`
5. Copy **Client Secret** → `STRAVA_CLIENT_SECRET` (server only, never VITE_)

---

## Task 1: Install Supabase and create .env

**Files:**
- Create: `.env`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Install @supabase/supabase-js**

```bash
bun add @supabase/supabase-js
```

Expected output: package added to `package.json` and `bun.lock` updated.

- [ ] **Step 2: Create .env with all required variables**

Create file `.env` at project root (never commit this file — it's already in .gitignore):

```
# Supabase (frontend — safe to expose)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Strava (frontend — client_id is public)
VITE_STRAVA_CLIENT_ID=12345

# Strava (server only — used by Vercel API routes)
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Supabase (server only — used by Vercel API routes)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

- [ ] **Step 3: Create src/lib/supabase.ts**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Verify dev server still starts**

```bash
bun dev
```

Expected: app loads at `http://localhost:8080` with no console errors about Supabase.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts package.json bun.lock
git commit -m "feat: add supabase client"
```

---

## Task 2: Create Supabase database schema

**Files:**
- No code files — SQL run directly in Supabase Dashboard → SQL Editor

- [ ] **Step 1: Open Supabase SQL Editor**

In Supabase Dashboard → **SQL Editor** → New query.

- [ ] **Step 2: Create profiles table**

Paste and run:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  cyclist_type text check (cyclist_type in ('amateur', 'entrenado', 'competitivo')),
  age_range text check (age_range in ('18-25', '26-35', '36-45', '46-55', '56+')),
  weekly_km int,
  dietary_type text check (dietary_type in ('omnivoro', 'vegetariano', 'vegano')),
  strava_access_token text,
  strava_refresh_token text,
  strava_expires_at bigint,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
```

Expected: "Success. No rows returned."

- [ ] **Step 3: Create trigger to auto-create profile on signup**

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Expected: "Success. No rows returned."

- [ ] **Step 4: Create routes table**

```sql
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strava_id bigint,
  name text not null,
  distance_km numeric(6,2) not null,
  elevation_m numeric(6,1),
  duration_seconds int,
  date date,
  created_at timestamptz default now(),
  unique (user_id, strava_id)
);

alter table public.routes enable row level security;

create policy "users can manage own routes"
  on public.routes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 5: Create kits table**

```sql
create table public.kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_clp int not null,
  image_url text,
  category text check (category in ('gel', 'polvo', 'barra', 'mix')),
  active boolean default true
);

alter table public.kits enable row level security;

create policy "kits are readable by authenticated users"
  on public.kits for select
  to authenticated
  using (active = true);
```

- [ ] **Step 6: Create orders table**

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kit_id uuid not null references public.kits(id),
  route_id uuid references public.routes(id),
  quantity int not null default 1,
  total_clp int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  subscription_type text not null check (subscription_type in ('once', 'monthly', 'flexible')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "users can manage own orders"
  on public.orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 7: Seed one kit for testing**

```sql
insert into public.kits (name, description, price_clp, category)
values ('Kit Fondo 100km', 'Gel energético + barra + polvo electrolitos', 12900, 'mix');
```

- [ ] **Step 8: Verify tables exist**

In Supabase Dashboard → **Table Editor** — you should see: `profiles`, `routes`, `kits`, `orders`.

---

## Task 3: Create useAuth hook (Supabase session)

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create src/hooks/useAuth.ts**

```typescript
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function signInWithGoogle() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  function signOut() {
    supabase.auth.signOut();
    setUser(null);
  }

  return {
    user,
    loading,
    isConnected: !!user,
    connect: signInWithGoogle,
    disconnect: signOut,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run build 2>&1 | head -20
```

Expected: build succeeds or only shows pre-existing warnings (not errors from useAuth.ts).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook with Supabase Google OAuth"
```

---

## Task 4: Replace Google Auth in the frontend

**Files:**
- Modify: `src/pages/ProximaSalida.tsx` (lines 6, 365-366, 376-381)
- Modify: `src/App.tsx` (remove GoogleCallback route)
- Delete: `src/lib/googleAuth.ts`
- Delete: `src/hooks/useGoogleAuth.ts`
- Delete: `src/pages/GoogleCallback.tsx`

- [ ] **Step 1: Update ProximaSalida.tsx — replace useGoogleAuth import**

In `src/pages/ProximaSalida.tsx`, replace line 6:

```typescript
// Remove this:
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

// Add this:
import { useAuth } from "@/hooks/useAuth";
```

- [ ] **Step 2: Update ProximaSalida.tsx — replace hook usage**

In `src/pages/ProximaSalida.tsx`, replace line 365:

```typescript
// Remove this:
const { isConnected: googleConnected, connect: connectGoogle } = useGoogleAuth();

// Add this:
const { isConnected: googleConnected, connect: connectGoogle } = useAuth();
```

- [ ] **Step 3: Remove GoogleCallback route from App.tsx**

In `src/App.tsx`, remove the import and route:

```typescript
// Remove this import:
import GoogleCallback from "@/pages/GoogleCallback";

// Remove this route:
<Route path="/google/callback" element={<GoogleCallback />} />
```

- [ ] **Step 4: Delete old Google auth files**

```bash
rm src/lib/googleAuth.ts src/hooks/useGoogleAuth.ts src/pages/GoogleCallback.tsx
```

- [ ] **Step 5: Verify build**

```bash
bun run build 2>&1 | head -30
```

Expected: no TypeScript errors. If there are import errors, they're from files that imported from deleted modules — fix them by removing the import.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: replace Google OAuth with Supabase Auth"
```

---

## Task 5: Create Vercel API route — Strava OAuth callback

**Files:**
- Create: `api/strava/callback.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create api/strava/callback.ts**

Create directory and file:

```typescript
// api/strava/callback.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const jwt = authHeader.slice(7);
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { code } = req.body as { code: string };
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return res.status(502).json({ error: "Strava token exchange failed" });
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_expires_at: tokens.expires_at,
    })
    .eq("id", user.id);

  if (dbError) {
    return res.status(500).json({ error: "Failed to save tokens" });
  }

  return res.status(200).json({
    access_token: tokens.access_token,
    expires_at: tokens.expires_at,
  });
}
```

- [ ] **Step 2: Create vercel.json**

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3: Install @vercel/node types**

```bash
bun add -d @vercel/node
```

- [ ] **Step 4: Verify TypeScript in API file**

```bash
bun tsc --noEmit 2>&1 | head -20
```

Expected: no errors from `api/strava/callback.ts`.

- [ ] **Step 5: Commit**

```bash
git add api/strava/callback.ts vercel.json package.json bun.lock
git commit -m "feat: add Vercel API route for Strava OAuth callback"
```

---

## Task 6: Create Vercel API route — Strava token refresh

**Files:**
- Create: `api/strava/refresh.ts`

- [ ] **Step 1: Create api/strava/refresh.ts**

```typescript
// api/strava/refresh.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const jwt = authHeader.slice(7);
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("strava_refresh_token")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.strava_refresh_token) {
    return res.status(404).json({ error: "No Strava refresh token found" });
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: profile.strava_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    return res.status(502).json({ error: "Strava refresh failed" });
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  await supabase
    .from("profiles")
    .update({
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_expires_at: tokens.expires_at,
    })
    .eq("id", user.id);

  return res.status(200).json({
    access_token: tokens.access_token,
    expires_at: tokens.expires_at,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/strava/refresh.ts
git commit -m "feat: add Vercel API route for Strava token refresh"
```

---

## Task 7: Update Strava frontend to use server routes

**Files:**
- Modify: `src/lib/stravaAuth.ts`
- Modify: `src/pages/StravaCallback.tsx`
- Modify: `src/hooks/useStravaAuth.ts`

- [ ] **Step 1: Update src/lib/stravaAuth.ts — remove client-side secrets, add server call**

Replace the entire file content:

```typescript
import { supabase } from "@/lib/supabase";

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string;
const REDIRECT_URI = `${window.location.origin}/strava/callback`;

export function redirectToStrava() {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read,activity:read");
  window.location.href = url.toString();
}

export async function exchangeCodeViaServer(code: string): Promise<{ access_token: string; expires_at: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch("/api/strava/callback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error("Error al conectar Strava");
  return res.json();
}

export async function refreshTokenViaServer(): Promise<{ access_token: string; expires_at: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch("/api/strava/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Error al renovar token de Strava");
  return res.json();
}

export function storeTokens(accessToken: string, expiresAt: number) {
  localStorage.setItem("strava_access_token", accessToken);
  localStorage.setItem("strava_expires_at", String(expiresAt));
}

export function clearTokens() {
  localStorage.removeItem("strava_access_token");
  localStorage.removeItem("strava_expires_at");
  localStorage.removeItem("strava_refresh_token");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("strava_access_token");
}

export function isTokenValid(): boolean {
  const token = localStorage.getItem("strava_access_token");
  const expiresAt = Number(localStorage.getItem("strava_expires_at"));
  if (!token || !expiresAt) return false;
  return Date.now() / 1000 < expiresAt - 60;
}
```

- [ ] **Step 2: Update src/pages/StravaCallback.tsx — use server exchange**

Replace the entire file content:

```typescript
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeViaServer, storeTokens } from "@/lib/stravaAuth";
import { motion } from "framer-motion";

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam || !code) {
      setError("Acceso denegado. Intenta conectar Strava de nuevo.");
      return;
    }

    exchangeCodeViaServer(code)
      .then((data) => {
        storeTokens(data.access_token, data.expires_at);
        navigate("/salida", { replace: true });
      })
      .catch(() => {
        setError("No se pudo conectar con Strava. Verifica tus credenciales.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => navigate("/salida", { replace: true })}
            className="text-primary text-sm underline"
          >
            Volver
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Conectando con Strava...</p>
        </motion.div>
      )}
    </div>
  );
};

export default StravaCallback;
```

- [ ] **Step 3: Update src/hooks/useStravaAuth.ts — use server refresh**

Replace the entire file content:

```typescript
import { useState, useEffect } from "react";
import {
  isTokenValid,
  getAccessToken,
  clearTokens,
  redirectToStrava,
  refreshTokenViaServer,
  storeTokens,
} from "@/lib/stravaAuth";

export function useStravaAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (isTokenValid()) {
        setIsConnected(true);
        setToken(getAccessToken());
        setLoading(false);
        return;
      }

      // Token expired — try refreshing via server (server reads refresh token from Supabase DB)
      try {
        const data = await refreshTokenViaServer();
        storeTokens(data.access_token, data.expires_at);
        setIsConnected(true);
        setToken(data.access_token);
        } catch {
          clearTokens();
        }
      }

      setLoading(false);
    }

    init();
  }, []);

  function disconnect() {
    clearTokens();
    setIsConnected(false);
    setToken(null);
  }

  return { isConnected, token, loading, connect: redirectToStrava, disconnect };
}
```

- [ ] **Step 4: Verify build**

```bash
bun run build 2>&1 | head -30
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stravaAuth.ts src/pages/StravaCallback.tsx src/hooks/useStravaAuth.ts
git commit -m "feat: move Strava token exchange to server API routes"
```

---

## Task 8: Deploy to Vercel

**Files:**
- No code changes — configuration in Vercel dashboard

- [ ] **Step 1: Push code to GitHub**

If the project isn't in GitHub yet:
```bash
git init   # skip if already a git repo
git remote add origin https://github.com/<your-username>/lagas.git
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the `lagas` repository
3. Framework Preset: **Vite** (auto-detected)
4. Root Directory: `.` (default)
5. Build Command: `bun run build` (or leave as `vite build`)
6. Output Directory: `dist`
7. **Do NOT deploy yet** — add env vars first

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel project settings → **Environment Variables**, add all of these:

| Name | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `VITE_STRAVA_CLIENT_ID` | `12345` | All |
| `STRAVA_CLIENT_ID` | `12345` | All |
| `STRAVA_CLIENT_SECRET` | `your_secret` | All |
| `SUPABASE_URL` | `https://xxx.supabase.co` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | All |

- [ ] **Step 4: Deploy**

Click **Deploy** in Vercel. Wait for the build to complete (~2 min).

Expected: deployment succeeds, you get a URL like `https://lagas-xyz.vercel.app`

- [ ] **Step 5: Update redirect URIs**

After getting your Vercel URL:

1. **Google Cloud Console** → OAuth 2.0 Client → Authorized redirect URIs:
   - Keep: `https://<project>.supabase.co/auth/v1/callback`
   - This is the only one Supabase needs (it handles the relay to your app)

2. **Strava API settings** → Authorization Callback Domain:
   - Change to: `lagas-xyz.vercel.app` (your Vercel domain, no https://)

3. **Supabase** → Authentication → URL Configuration:
   - Site URL: `https://lagas-xyz.vercel.app`
   - Redirect URLs: add `https://lagas-xyz.vercel.app/**`

- [ ] **Step 6: Test the full login flow**

1. Open `https://lagas-xyz.vercel.app`
2. Go to Próxima Salida → click "Conectar Google"
3. Google OAuth flow → should redirect back to app and show user as logged in
4. Click "Conectar Strava" → Strava OAuth → should redirect back and load activities

Expected: both OAuth flows complete without errors.

---

## Local Development Note

The Vercel API routes (`/api/*`) don't run locally with `bun dev` (Vite dev server). To test the API routes locally you need the Vercel CLI:

```bash
bun add -g vercel
vercel dev   # runs Vite + API routes together on port 3000
```

Or test OAuth on Vercel directly after deploying. For local dev, the Strava connect button will fail until deployed (or using `vercel dev`).
