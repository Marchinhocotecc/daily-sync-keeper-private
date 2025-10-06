-- Creates the 'tasks' table expected by the frontend (tasksService, useTasks).
-- Idempotent: safe to run multiple times.

create extension if not exists pgcrypto;

-- Reuse helper to auto set user_id if it exists elsewhere; create if missing
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'set_user_id_default'
      and pg_function_is_visible(oid)
  ) then
    create or replace function public.set_user_id_default()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      if new.user_id is null then
        new.user_id := auth.uid();
      end if;
      return new;
    end
    $fn$;
  end if;
end$$;

-- Table -------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  created_at timestamptz not null default now()
);

-- Ensure columns exist (future-proof if table was partially created)
alter table public.tasks
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists priority text default 'medium',
  add column if not exists created_at timestamptz default now();

-- Constraint to enforce allowed priorities if missing
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and contype = 'c'
      and conname = 'tasks_priority_chk'
  ) then
    alter table public.tasks
      add constraint tasks_priority_chk check (priority in ('low','medium','high'));
  end if;
end$$;

-- FK to auth.users
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public'
      and table_name='tasks'
      and constraint_name='fk_tasks_user'
  ) then
    alter table public.tasks
      add constraint fk_tasks_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- Indexes
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_user_priority on public.tasks(user_id, priority);

-- RLS ---------------------------------------------------------------------
alter table public.tasks enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and polname='tasks_select_own') then
    create policy tasks_select_own on public.tasks
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and polname='tasks_insert_own') then
    create policy tasks_insert_own on public.tasks
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and polname='tasks_update_own') then
    create policy tasks_update_own on public.tasks
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and polname='tasks_delete_own') then
    create policy tasks_delete_own on public.tasks
      for delete using (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update, delete on public.tasks to authenticated;

-- Trigger to auto-fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_tasks_bi') then
    create trigger set_user_id_default_tasks_bi
      before insert on public.tasks
      for each row execute function public.set_user_id_default();
  end if;
end$$;

-- Notify PostgREST to reload schema so /rest/v1/tasks becomes available immediately
select pg_notify('pgrst', 'reload schema');
