# Aetermia

Internal board for a three-person dev group: active projects, their tasks, and who is on what.

## Stack

Next.js 16 (App Router) + Supabase (Postgres + Auth), deployed on Vercel.

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
