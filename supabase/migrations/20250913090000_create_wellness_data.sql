-- Wellness tracking table used by useWellness hook and assistant.

create extension if not exists pgcrypto;

-- Keep updated_at fresh (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wellness_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,

  -- Required by request
  mood int default 0 check (mood between 0 and 10),
  energy int default 0 check (energy between 0 and 10),
  notes text,

  -- Extra fields to support existing UI
  steps int not null default 0,
  step_goal int not null default 10000,
  calories int not null default 0,
  calorie_goal int not null default 600,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date)
);

drop trigger if exists trg_wellness_updated_at on public.wellness_data;
create trigger trg_wellness_updated_at
before update on public.wellness_data
for each row execute procedure public.set_updated_at();

alter table public.wellness_data enable row level security;

create index if not exists wellness_user_date_idx on public.wellness_data(user_id, date);

-- RLS: users can see only their data
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wellness_data'
      and polname = 'wellness_select_own'
  ) then
    create policy wellness_select_own
      on public.wellness_data for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wellness_data'
      and polname = 'wellness_upsert_own'
  ) then
    create policy wellness_upsert_own
      on public.wellness_data for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- Refresh PostgREST cache
select pg_notify('pgrst', 'reload schema');
