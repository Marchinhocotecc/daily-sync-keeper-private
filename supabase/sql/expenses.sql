-- Create extension if needed for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- Create expenses table
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  amount numeric not null,
  category text,
  date date not null default (now()::date),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Read own expenses
create policy "Read own expenses"
on public.expenses
for select
using (auth.uid() = user_id);

-- Insert own expenses
create policy "Insert own expenses"
on public.expenses
for insert
with check (auth.uid() = user_id);

-- Ensure REST schema is up-to-date for "expenses" after local dev changes.
-- Safe no-op if nothing changed.
select pg_notify('pgrst', 'reload schema');
