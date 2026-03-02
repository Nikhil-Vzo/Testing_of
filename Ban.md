# Supabase Ban in India — JioBase Proxy Setup & Revert Guide

## What Happened

On **Feb 24, 2026**, the Indian government ordered ISPs (Jio, Airtel, ACT Fibernet, BSNL) to DNS-block `*.supabase.co` under Section 69A of the IT Act. This broke all Supabase operations (database, auth, storage, realtime) for Indian users.

---

## What We Did

### 1. Created a JioBase Proxy App

- Signed up at [jiobase.com](https://jiobase.com)
- Created an app called **"Othrhalff"**
- **Proxy URL:** `https://othrhalff.jiobase.com`
- JioBase is a Cloudflare-based reverse proxy that forwards requests to `htepqqigtzmllailykas.supabase.co` — ISPs can't block it because `jiobase.com` is not on the block list.

### 2. Changed the Supabase URL in `.env`

**File:** `client/.env`

```diff
- VITE_SUPABASE_URL=https://htepqqigtzmllailykas.supabase.co
+ VITE_SUPABASE_URL=https://othrhalff.jiobase.com
```

The anon key (`VITE_SUPABASE_ANON_KEY`) stays **unchanged** — it's tied to the Supabase project, not the domain.

### 3. Fixed Auth Session Persistence in `supabase.ts`

**File:** `client/src/lib/supabase.ts`

By default, the Supabase JS client generates a localStorage key from the URL (e.g., `sb-htepqqigtzmllailykas-auth-token`). When the URL changed to `othrhalff.jiobase.com`, it would generate a different key (`sb-othrhalff-auth-token`), causing users to appear logged out.

We fixed this by setting a fixed `storageKey`:

```diff
- export const supabase = createClient(supabaseUrl, supabaseKey);
+ export const supabase = createClient(supabaseUrl, supabaseKey, {
+   auth: {
+     storageKey: 'sb-htepqqigtzmllailykas-auth-token',
+   },
+ });
```

This ensures existing user sessions persist across URL changes — no logout/re-login needed.

### 4. Updated Vercel Environment Variable

In Vercel dashboard → OthrHalf project → Settings → Environment Variables:
- Changed `VITE_SUPABASE_URL` to `https://othrhalff.jiobase.com`
- Triggered a redeploy

---

## How to Revert (When the Ban is Lifted)

### Step 1: Revert `.env`

```diff
- VITE_SUPABASE_URL=https://othrhalff.jiobase.com
+ VITE_SUPABASE_URL=https://htepqqigtzmllailykas.supabase.co
```

### Step 2: `supabase.ts` — Keep the `storageKey`!

**Do NOT remove the `storageKey`** — leave it as is. This ensures sessions persist when switching back. The file can stay exactly as it is.

### Step 3: Update Vercel

- Change `VITE_SUPABASE_URL` back to `https://htepqqigtzmllailykas.supabase.co` in Vercel env vars
- Redeploy

### Step 4: (Optional) Deactivate JioBase

- Go to [jiobase.com](https://jiobase.com) dashboard
- Click **Deactivate** on the Othrhalff app

---

## Important Notes

- **JioBase free tier:** 50,000 requests/month — monitor usage on the JioBase dashboard
- **JioBase is open source:** [github.com/sunithvs/jiobase](https://github.com/sunithvs/jiobase)
- **Latency overhead:** ~1-5ms (negligible)
- **All Supabase features work:** REST API, Auth, Storage, Realtime (WebSockets), Edge Functions
- **RLS policies, database schema, auth config** are completely unaffected — JioBase is a transparent proxy
