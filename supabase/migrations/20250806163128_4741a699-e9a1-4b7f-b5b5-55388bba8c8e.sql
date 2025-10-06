-- Create conversations table for AI chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for individual chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages 
FOR SELECT 
USING (conversation_id IN (
  SELECT id FROM public.conversations WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (conversation_id IN (
  SELECT id FROM public.conversations WHERE user_id = auth.uid()
));

-- Add trigger for updating conversations updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create profiles table if it doesn't exist
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  language text not null default 'it',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Enable RLS and add sane policies
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'profiles_select_own' and tablename = 'profiles'
  ) then
    create policy profiles_select_own
      on public.profiles for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where polname = 'profiles_insert_self' and tablename = 'profiles'
  ) then
    create policy profiles_insert_self
      on public.profiles for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where polname = 'profiles_update_own' and tablename = 'profiles'
  ) then
    create policy profiles_update_own
      on public.profiles for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- Core data model for Daily Sync Keeper
-- Safe to re-run in Supabase: uses IF NOT EXISTS and guarded policy creation.

-- Extensions
create extension if not exists pgcrypto;

-- TABLE: expenses ---------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  amount numeric(12,2) not null check (amount >= 0),
  category text not null default 'Other',
  description text,
  icon text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;

-- Indexes
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date);

-- Policies (idempotent guards)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_select_own') then
    create policy expenses_select_own on public.expenses
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_insert_own') then
    create policy expenses_insert_own on public.expenses
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_update_own') then
    create policy expenses_update_own on public.expenses
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_delete_own') then
    create policy expenses_delete_own on public.expenses
      for delete using (auth.uid() = user_id);
  end if;
end$$;

-- TABLE: settings (one row per user) -------------------------------------
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget numeric not null default 0,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.settings enable row level security;

-- Select own row
drop policy if exists "read_own_settings" on public.settings;
create policy "read_own_settings"
on public.settings
for select
using (auth.uid() = user_id);

-- Insert own row
drop policy if exists "insert_own_settings" on public.settings;
create policy "insert_own_settings"
on public.settings
for insert
with check (auth.uid() = user_id);

-- Update own row
drop policy if exists "update_own_settings" on public.settings;
create policy "update_own_settings"
on public.settings
for update
using (auth.uid = user_id)
with check (auth.uid() = user_id);

create index if not exists settings_user_id_idx on public.settings(user_id);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'settings' and policyname = 'settings_select_own') then
    create policy settings_select_own on public.settings
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'settings' and policyname = 'settings_upsert_own') then
    create policy settings_upsert_own on public.settings
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- TABLE: todos ------------------------------------------------------------
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  text text not null,
  completed boolean not null default false,
  priority text not null default 'medium',
  due_date date,
  due_time text,
  created_at timestamptz not null default now()
);
alter table public.todos enable row level security;

create index if not exists todos_user_id_idx on public.todos(user_id);
create index if not exists todos_user_due_idx on public.todos(user_id, due_date, due_time);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_select_own') then
    create policy todos_select_own on public.todos
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_insert_own') then
    create policy todos_insert_own on public.todos
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_update_own') then
    create policy todos_update_own on public.todos
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_delete_own') then
    create policy todos_delete_own on public.todos
      for delete using (auth.uid() = user_id);
  end if;
end$$;

-- TABLE: calendar_events --------------------------------------------------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  date date not null,
  time text not null,
  duration int not null default 60,
  color text not null default '#000000',
  created_at timestamptz not null default now()
);
alter table public.calendar_events enable row level security;

create index if not exists cal_user_date_time_idx on public.calendar_events(user_id, date, time);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_select_own') then
    create policy cal_select_own on public.calendar_events
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_insert_own') then
    create policy cal_insert_own on public.calendar_events
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_update_own') then
    create policy cal_update_own on public.calendar_events
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calendar_events' and policyname = 'cal_delete_own') then
    create policy cal_delete_own on public.calendar_events
      for delete using (auth.uid() = user_id);
  end if;
end$$;

-- Refresh PostgREST schema cache so the REST endpoint becomes available immediately
select pg_notify('pgrst', 'reload schema');