-- ============================================================
-- FİRMA DOĞRULAMA AKIŞI — Çin Kalite Kontrol Platformu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın (schema.sql'den sonra).
-- Akış: firma belge yükler -> verification_status='pending'
--       admin onaylar -> verified=true, status='approved'
-- ============================================================

-- companies tablosuna doğrulama alanları
alter table public.companies
  add column if not exists verification_status text not null default 'none'
    check (verification_status in ('none','pending','approved','rejected')),
  add column if not exists verification_doc_url text,
  add column if not exists verification_note text;

-- profiles'a admin bayrağı (yöneticiyi elle true yaparsınız)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Admin kontrolü için yardımcı fonksiyon (RLS içinde profiles'a güvenli erişim)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admin tüm firmaları güncelleyebilir (verified / verification_status).
drop policy if exists "companies_admin_update" on public.companies;
create policy "companies_admin_update" on public.companies
  for update using (public.is_admin());

-- ============================================================
-- STORAGE — doğrulama belgeleri için 'verification' bucket'ı
-- Supabase Panel > Storage > New bucket: ad "verification", Public = ON
-- (Belgeler hassas olabilir; isterseniz private yapıp imzalı URL kullanın.)
-- ============================================================
drop policy if exists "verification_upload" on storage.objects;
create policy "verification_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification');

drop policy if exists "verification_read" on storage.objects;
create policy "verification_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'verification');
