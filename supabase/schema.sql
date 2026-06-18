-- ============================================================
-- Çin Kalite Kontrol Platformu — Supabase Şeması
-- Supabase Panel > SQL Editor > New query alanına yapıştırıp çalıştırın.
-- ============================================================

-- ---------- PROFILES ----------
-- auth.users ile 1-1. Kayıt sırasında rol burada tutulur.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('musteri','firma')),
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- Yeni kullanıcı oluşunca profiles satırını otomatik oluştur.
-- Rol ve ad, signUp sırasında user_metadata içine yazılır.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'musteri'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- COMPANIES ----------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text,
  license_no text,
  certificate_info text,
  experience_years int default 0,
  services text,
  description text,
  rating numeric default 0,
  verified boolean default false,
  latitude numeric,
  longitude numeric,
  created_at timestamptz default now(),
  unique (owner_id)
);

-- ---------- REQUESTS (Talepler) ----------
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  factory_name text,
  factory_city text,
  control_type text,
  quantity int,
  notes text,
  status text default 'open' check (status in ('open','matched','in_progress','completed','cancelled')),
  created_at timestamptz default now()
);

-- ---------- OFFERS (Teklifler) ----------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  firm_owner_id uuid not null references auth.users(id) on delete cascade,
  price numeric,
  currency text default 'USD',
  proposed_date date,
  message text,
  status text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now()
);

-- ---------- REPORTS (Raporlar) ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  firm_owner_id uuid not null references auth.users(id) on delete cascade,
  summary text,
  checklist text,
  file_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.companies enable row level security;
alter table public.requests  enable row level security;
alter table public.offers    enable row level security;
alter table public.reports   enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------- companies ----------
-- Firmalar herkese açık görünür (ana sayfadaki harita + firma listesi).
-- Hassas alanları gizlemek isterseniz bir view kullanın.
drop policy if exists "companies_select_all" on public.companies;
create policy "companies_select_all" on public.companies
  for select using (true);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own" on public.companies
  for insert with check (auth.uid() = owner_id);

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own" on public.companies
  for update using (auth.uid() = owner_id);

drop policy if exists "companies_delete_own" on public.companies;
create policy "companies_delete_own" on public.companies
  for delete using (auth.uid() = owner_id);

-- ---------- requests ----------
-- Müşteri kendi taleplerini yönetir; firmalar açık talepleri görebilir.
drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests
  for select using (
    auth.uid() = customer_id
    or status = 'open'
    or exists (
      select 1 from public.offers o
      where o.request_id = requests.id and o.firm_owner_id = auth.uid()
    )
  );

drop policy if exists "requests_insert_own" on public.requests;
create policy "requests_insert_own" on public.requests
  for insert with check (auth.uid() = customer_id);

drop policy if exists "requests_update_own" on public.requests;
create policy "requests_update_own" on public.requests
  for update using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.offers o
      where o.request_id = requests.id
        and o.firm_owner_id = auth.uid()
        and o.status = 'accepted'
    )
  );

-- ---------- offers ----------
-- Firma kendi tekliflerini; müşteri kendi taleplerine gelen teklifleri görür.
drop policy if exists "offers_select" on public.offers;
create policy "offers_select" on public.offers
  for select using (
    auth.uid() = firm_owner_id
    or exists (
      select 1 from public.requests r
      where r.id = offers.request_id and r.customer_id = auth.uid()
    )
  );

drop policy if exists "offers_insert_firm" on public.offers;
create policy "offers_insert_firm" on public.offers
  for insert with check (auth.uid() = firm_owner_id);

-- Firma kendi teklifini günceller; müşteri ise gelen teklifin durumunu (kabul/red) günceller.
drop policy if exists "offers_update" on public.offers;
create policy "offers_update" on public.offers
  for update using (
    auth.uid() = firm_owner_id
    or exists (
      select 1 from public.requests r
      where r.id = offers.request_id and r.customer_id = auth.uid()
    )
  );

-- ---------- reports ----------
-- Firma rapor ekler; ilgili talebin müşterisi ve firma okur.
drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
  for select using (
    auth.uid() = firm_owner_id
    or exists (
      select 1 from public.requests r
      where r.id = reports.request_id and r.customer_id = auth.uid()
    )
  );

drop policy if exists "reports_insert_firm" on public.reports;
create policy "reports_insert_firm" on public.reports
  for insert with check (auth.uid() = firm_owner_id);

drop policy if exists "reports_update_firm" on public.reports;
create policy "reports_update_firm" on public.reports
  for update using (auth.uid() = firm_owner_id);

-- ---------- MESSAGES (mesajlaşma) ----------
-- Bir konuşma = (request_id + customer_id + firm_owner_id).
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

drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (auth.uid() = customer_id or auth.uid() = firm_owner_id);

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id and auth.uid() in (customer_id, firm_owner_id)
  );

-- ---------- FİRMA DOĞRULAMA ----------
alter table public.companies
  add column if not exists verification_status text not null default 'none'
    check (verification_status in ('none','pending','approved','rejected')),
  add column if not exists verification_doc_url text,
  add column if not exists verification_note text;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "companies_admin_update" on public.companies;
create policy "companies_admin_update" on public.companies
  for update using (public.is_admin());

-- ============================================================
-- STORAGE
-- ------------------------------------------------------------
-- Supabase Panel > Storage > New bucket:
--   "reports"      (Public = ON) — rapor dosyaları
--   "verification" (Public = ON) — firma doğrulama belgeleri
-- (Aşağıdaki politikalar bucket'lar oluşturulduktan sonra çalışır.)
-- ============================================================
drop policy if exists "reports_upload" on storage.objects;
create policy "reports_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'reports');

drop policy if exists "reports_read" on storage.objects;
create policy "reports_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'reports');

drop policy if exists "verification_upload" on storage.objects;
create policy "verification_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification');

drop policy if exists "verification_read" on storage.objects;
create policy "verification_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'verification');
