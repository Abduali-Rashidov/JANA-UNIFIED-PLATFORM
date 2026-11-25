-- Jana Unified Platform: shared prototype state + normalized future-ready schema
create extension if not exists pgcrypto;

create table if not exists public.prototype_state (
  id text primary key check (id = 'main'),
  tickets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prototype_state enable row level security;
drop policy if exists "prototype public demo access" on public.prototype_state;
create policy "prototype public demo access"
  on public.prototype_state for all to anon, authenticated
  using (true) with check (true);
grant select, insert, update, delete on public.prototype_state to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  jpid text unique not null,
  role text not null check (role in ('client','operator','supervisor','admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text unique not null,
  tracking_code text not null,
  client_jpid text not null,
  title text not null default 'Жаңа өтініш',
  status text not null default 'Жаңа',
  is_closed boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tickets_client_jpid_idx on public.tickets(client_jpid);
create index if not exists tickets_tracking_code_idx on public.tickets(tracking_code);
create index if not exists tickets_status_idx on public.tickets(status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_jpid text not null,
  sender_role text not null check (sender_role in ('client','operator','supervisor','admin')),
  body text not null default '',
  attachment_url text,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists messages_ticket_created_idx on public.messages(ticket_id, created_at);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_jpid text not null,
  event_type text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

-- Realtime WebSocket subscriptions for the prototype state and normalized records.
do $$ begin
  alter publication supabase_realtime add table public.prototype_state;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.ticket_events;
exception when duplicate_object then null;
end $$;

-- DEMO ONLY: public JPID-only access is intentionally unauthenticated.
-- Before production, remove the public demo policy and enforce verified auth + RLS.
