-- ============================================================
-- MESAJLAŞMA — Çin Kalite Kontrol Platformu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın (schema.sql'den sonra).
-- Bir konuşma = (request_id + customer_id + firm_owner_id) üçlüsü:
-- yani bir talep üzerinden bir müşteri ile bir firma arasındaki yazışma.
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  firm_owner_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('musteri','firma')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists messages_thread_idx
  on public.messages (request_id, customer_id, firm_owner_id, created_at);

alter table public.messages enable row level security;

-- Sadece konuşmanın iki tarafı (müşteri ve firma) okuyabilir.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (
    auth.uid() = customer_id or auth.uid() = firm_owner_id
  );

-- Gönderen sadece kendisi olabilir ve konuşmanın bir tarafı olmalı.
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and auth.uid() in (customer_id, firm_owner_id)
  );
