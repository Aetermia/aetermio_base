# Aetermia

Internal board for a three-person dev group: active projects, their tasks, and who is on what.

## Stack

Next.js 16 (App Router) + Supabase (Postgres + Auth), deployed on Vercel.

## Quick look without Supabase

The UI runs against an in-memory stand-in, so you can click through it before creating a project.

```bash
printf 'AETERMIA_LOCAL_DB=1\n' > .env.local
npm run dev
```

Log in with any email and any password. The display name is the email prefix, so `ezequiel@test.local` becomes "Ezequiel". The board starts with one project and one task per status. Everything resets when the dev server restarts.

The stand-in lives in `lib/dev-db.ts`. It has no RLS, no GoTrue and no profile trigger, so it proves the UI, not the database. Delete the file and the two `AETERMIA_LOCAL_DB` branches in `lib/supabase/server.ts` and `proxy.ts` once a real project exists. Vercel never sets that variable.

## Setup

### 1. Supabase

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. **Auth > Providers > Email: turn OFF "Allow new users to sign up".** The RLS policy gives every authenticated user full access, so leaving signup open would hand the board to anyone who finds the URL.
4. Auth > Users > Add user, three times. Set `full_name` in the user metadata, otherwise the board falls back to the email prefix.
5. Project Settings > API: copy the project URL and the anon (publishable) key.

### 2. Local

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill both values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

```bash
npm run dev
```

### 3. Vercel

Import the repo, add the same two environment variables, deploy.

## How it works

- No roles table. One RLS policy per table: any authenticated user can read and write everything.
- Tasks have four states: pending, in progress, done, cancelled.
- Notes are a single text column per task. There is no history: saving overwrites the previous note.
- Any user can assign any task to any user, and "Asignarme" assigns it to yourself in one click.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `node --test lib/dev-db.test.mjs`
