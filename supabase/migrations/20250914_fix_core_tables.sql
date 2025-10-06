-- This migration is idempotent. Run it in the Supabase SQL editor.

-- Prereqs
create extension if not exists pgcrypto;

-- Ensure REST visibility (role must have some privileges)
grant usage on schema public to anon, authenticated;

-- Utility: add FK only if it does not exist
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and constraint_name = 'fk_profiles_user'
  ) then
    -- placeholder; created later when table exists
    perform 1;
  end if;
end$$;

-- Utility trigger to auto-assign auth.uid() as user_id on insert when missing
create or replace function public.set_user_id_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end$$;

----------------------------------------------------------------
-- profiles
----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

-- Ensure columns exist (future-proof if table existed)
alter table public.profiles
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists language text default 'en',
  add column if not exists created_at timestamptz default now();

-- PK if missing
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_pkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_pkey primary key (id);
  end if;
end$$;

-- Unique on user_id
create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- FK to auth.users
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'fk_profiles_user'
  ) then
    alter table public.profiles
      add constraint fk_profiles_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- RLS + policies
alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and polname='profiles_select_own') then
    create policy profiles_select_own on public.profiles
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and polname='profiles_insert_own') then
    create policy profiles_insert_own on public.profiles
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and polname='profiles_update_own') then
    create policy profiles_update_own on public.profiles
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update on public.profiles to authenticated;

-- Trigger to fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_profiles_bi') then
    create trigger set_user_id_default_profiles_bi
      before insert on public.profiles
      for each row execute function public.set_user_id_default();
  end if;
end$$;

----------------------------------------------------------------
-- expenses
----------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null,
  category text not null,
  date date not null,
  note text,
  title text,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

-- Ensure columns
alter table public.expenses
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists amount numeric(12,2),
  add column if not exists category text,
  add column if not exists date date,
  add column if not exists note text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists icon text,
  add column if not exists created_at timestamptz default now();

-- Types fixups (amount numeric, date date)
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
  where table_schema='public' and table_name='expenses' and column_name='amount';
  if t is distinct from 'numeric' then
    alter table public.expenses alter column amount type numeric(12,2) using amount::numeric;
  end if;

  select data_type into t from information_schema.columns
  where table_schema='public' and table_name='expenses' and column_name='date';
  if t is distinct from 'date' then
    alter table public.expenses alter column date type date using date::date;
  end if;
end$$;

-- PK if missing
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_pkey'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_pkey primary key (id);
  end if;
end$$;

-- FK to auth.users
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public' and table_name='expenses' and constraint_name='fk_expenses_user'
  ) then
    alter table public.expenses
      add constraint fk_expenses_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- Indexes
create index if not exists idx_expenses_user on public.expenses(user_id);
create index if not exists idx_expenses_user_date on public.expenses(user_id, date);

-- RLS + policies
alter table public.expenses enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expenses' and polname='expenses_select_own') then
    create policy expenses_select_own on public.expenses
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expenses' and polname='expenses_insert_own') then
    create policy expenses_insert_own on public.expenses
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expenses' and polname='expenses_update_own') then
    create policy expenses_update_own on public.expenses
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expenses' and polname='expenses_delete_own') then
    create policy expenses_delete_own on public.expenses
      for delete using (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update, delete on public.expenses to authenticated;

-- Trigger to fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_expenses_bi') then
    create trigger set_user_id_default_expenses_bi
      before insert on public.expenses
      for each row execute function public.set_user_id_default();
  end if;
end$$;

----------------------------------------------------------------
-- wellness_data
----------------------------------------------------------------
create table if not exists public.wellness_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  mood numeric,
  energy numeric,
  steps numeric,
  calories numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Ensure columns
alter table public.wellness_data
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists date date,
  add column if not exists mood numeric,
  add column if not exists energy numeric,
  add column if not exists steps numeric,
  add column if not exists calories numeric,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

-- Types fixups
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
  where table_schema='public' and table_name='wellness_data' and column_name='date';
  if t is distinct from 'date' then
    alter table public.wellness_data alter column date type date using date::date;
  end if;
end$$;

-- Unique (user_id, date) for upsert support
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='wellness_data' and indexname='wellness_data_user_date_key'
  ) then
    -- create a unique index backing the uniqueness (if not already via constraint)
    create unique index wellness_data_user_date_key on public.wellness_data(user_id, date);
  end if;
end$$;

-- FK to auth.users
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public' and table_name='wellness_data' and constraint_name='fk_wellness_user'
  ) then
    alter table public.wellness_data
      add constraint fk_wellness_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- Index
create index if not exists idx_wellness_user_date on public.wellness_data(user_id, date);

-- RLS + policies
alter table public.wellness_data enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wellness_data' and polname='wellness_select_own') then
    create policy wellness_select_own on public.wellness_data
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wellness_data' and polname='wellness_insert_own') then
    create policy wellness_insert_own on public.wellness_data
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wellness_data' and polname='wellness_update_own') then
    create policy wellness_update_own on public.wellness_data
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wellness_data' and polname='wellness_delete_own') then
    create policy wellness_delete_own on public.wellness_data
      for delete using (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update, delete on public.wellness_data to authenticated;

-- Trigger to fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_wellness_bi') then
    create trigger set_user_id_default_wellness_bi
      before insert on public.wellness_data
      for each row execute function public.set_user_id_default();
  end if;
end$$;

----------------------------------------------------------------
-- calendar_events
----------------------------------------------------------------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  date date not null,
  time time without time zone not null default '00:00:00',
  duration integer not null default 60,
  color text,
  description text,
  created_at timestamptz not null default now()
);

-- Ensure columns
alter table public.calendar_events
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists date date,
  add column if not exists time time without time zone default '00:00:00',
  add column if not exists duration integer default 60,
  add column if not exists color text,
  add column if not exists description text,
  add column if not exists created_at timestamptz default now();

-- Types fixups
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
  where table_schema='public' and table_name='calendar_events' and column_name='date';
  if t is distinct from 'date' then
    alter table public.calendar_events alter column date type date using date::date;
  end if;

  select data_type into t from information_schema.columns
  where table_schema='public' and table_name='calendar_events' and column_name='time';
  if t not in ('time without time zone','time with time zone') then
    alter table public.calendar_events alter column time type time using time::time;
  end if;
end$$;

-- FK, indexes, RLS
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public' and table_name='calendar_events' and constraint_name='fk_calendar_events_user'
  ) then
    alter table public.calendar_events
      add constraint fk_calendar_events_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

create index if not exists idx_calendar_user on public.calendar_events(user_id);
create index if not exists idx_calendar_user_date_time on public.calendar_events(user_id, date, time);

alter table public.calendar_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and polname='calendar_select_own') then
    create policy calendar_select_own on public.calendar_events
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and polname='calendar_insert_own') then
    create policy calendar_insert_own on public.calendar_events
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and polname='calendar_update_own') then
    create policy calendar_update_own on public.calendar_events
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and polname='calendar_delete_own') then
    create policy calendar_delete_own on public.calendar_events
      for delete using (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update, delete on public.calendar_events to authenticated;

-- Trigger to fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_calendar_bi') then
    create trigger set_user_id_default_calendar_bi
      before insert on public.calendar_events
      for each row execute function public.set_user_id_default();
  end if;
end$$;

----------------------------------------------------------------
-- todos (used by AI assistant commands)
----------------------------------------------------------------
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  priority text not null default 'medium',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint todos_priority_chk check (priority in ('low','medium','high'))
);

-- Ensure columns
alter table public.todos
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists text text,
  add column if not exists priority text default 'medium',
  add column if not exists completed boolean default false,
  add column if not exists created_at timestamptz default now();

-- FK, indexes, RLS
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public' and table_name='todos' and constraint_name='fk_todos_user'
  ) then
    alter table public.todos
      add constraint fk_todos_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

create index if not exists idx_todos_user on public.todos(user_id);

alter table public.todos enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='todos' and polname='todos_select_own') then
    create policy todos_select_own on public.todos
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='todos' and polname='todos_insert_own') then
    create policy todos_insert_own on public.todos
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='todos' and polname='todos_update_own') then
    create policy todos_update_own on public.todos
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='todos' and polname='todos_delete_own') then
    create policy todos_delete_own on public.todos
      for delete using (auth.uid() = user_id);
  end if;
end$$;

grant select, insert, update, delete on public.todos to authenticated;

-- Trigger to fill user_id if omitted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_user_id_default_todos_bi') then
    create trigger set_user_id_default_todos_bi
      before insert on public.todos
      for each row execute function public.set_user_id_default();
  end if;
end$$;
