create extension if not exists "pgcrypto";

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_assistant_messages_user_created
  on public.assistant_messages (user_id, created_at desc);

alter table public.assistant_messages enable row level security;

create policy "select own assistant messages"
  on public.assistant_messages for select
  using (auth.uid() = user_id);

create policy "insert own assistant messages"
  on public.assistant_messages for insert
  with check (auth.uid() = user_id);

create policy "delete own assistant messages"
  on public.assistant_messages for delete
  using (auth.uid() = user_id);
