-- Aetermia schema. Run this once in the Supabase SQL editor.

create type public.task_status as enum ('todo', 'in_progress', 'done', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  notes text,
  status public.task_status not null default 'todo',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create index links_project_id_idx on public.links (project_id);

-- Every logged-in user is a superadmin: one policy per table, no roles.
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.links enable row level security;

create policy "authenticated full access" on public.profiles
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.projects
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.tasks
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.links
  for all to authenticated using (true) with check (true);

-- The Lugares sheet. One row per cell that was ever touched, so the grid has
-- no fixed size: its shape comes from the highest stored index.
create table if not exists public.place_cells (
  row_index int not null check (row_index >= 0),
  col_index int not null check (col_index >= 0),
  value text not null default '',
  font_family text,
  font_size int,
  color text,
  background text,
  updated_at timestamptz not null default now(),
  primary key (row_index, col_index)
);

alter table public.place_cells enable row level security;

create policy "authenticated full access" on public.place_cells
  for all to authenticated using (true) with check (true);

-- Users are created by hand in the dashboard, so the profile row follows them.
-- The fallback is capitalised so a name typed as ezequiel reads Ezequiel.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      initcap(split_part(new.email, '@', 1))
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Supabase usually grants these to the API roles when it creates the table with
-- its own default privileges. This project was created without them, so the API
-- answered "permission denied for table projects" while the policies above were
-- perfectly fine: policies filter rows, these grants allow the table at all.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
