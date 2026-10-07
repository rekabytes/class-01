# Todo 04

A Vercel-ready todo app with Supabase authentication and per-user cloud sync.

## Features

- Email signup and optional email verification
- Login, persistent sessions, and logout
- Forgot-password email and secure password update flow
- Todos synced across devices
- Row Level Security (RLS), so users can access only their own tasks
- Responsive and accessible task management UI

## 1. Create the Supabase database

1. Open your Supabase project.
2. Go to **SQL Editor → New query**.
3. Paste and run [`supabase/schema.sql`](supabase/schema.sql).

The script creates the `todos` table, enables RLS, and adds user-isolation policies.

## 2. Configure Supabase authentication

In **Authentication → URL Configuration**:

- Set **Site URL** to your production URL, such as `https://your-app.vercel.app`.
- Add `https://your-app.vercel.app/**` under **Redirect URLs**.
- For local testing, also add `http://localhost:8000/**`.
- Add your Vercel preview URL pattern if password-reset links must work on preview deployments.

In **Authentication → Providers → Email**:

- Keep the Email provider enabled.
- Enable **Confirm email** for production accounts (recommended).
- Customize the confirmation and password-recovery email templates if desired.

Supabase sends authentication email with its built-in provider for initial testing. Configure custom SMTP under **Authentication → Email** before production use for reliable delivery and higher rate limits.

## 3. Configure Vercel

Import this repository into Vercel and add these variables in **Project Settings → Environment Variables**:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Both values are available in **Supabase Dashboard → Project Settings → API**. Older Supabase projects can use `SUPABASE_ANON_KEY` instead of `SUPABASE_PUBLISHABLE_KEY`.

Apply the variables to Production and Preview, then redeploy. These credentials are intended for browser use; security is enforced by RLS. **Never add the `service_role` key to Vercel or frontend code.**

Vercel automatically reads [`vercel.json`](vercel.json):

- **Framework Preset:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** repository root

## Run locally

Install dependencies, provide the public Supabase credentials, build, and serve `dist/`:

```sh
npm install
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY \
npm run build
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000/>. Make sure that local URL is included in Supabase Redirect URLs.

A build without credentials still succeeds but displays a configuration warning instead of authentication forms.

## Test

```sh
npx playwright install chromium
npm test
```

## Password-reset flow

1. The user chooses **Forgot your password?** and submits their email.
2. Supabase emails a one-time recovery link.
3. The link returns to this app and opens the **Choose a new password** form.
4. After the update, the authenticated todo list opens automatically.
