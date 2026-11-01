-- ==============================================================================
-- FoodTrail Production Database Migration: 002_security_hardening.sql
-- Project: foodtrail-production (Region: South Asia / Mumbai)
-- Framework: Supabase (PostgreSQL 15+)
--
-- Security Hardening Updates:
--   1. Compatibility View Security:
--      - Drop unneeded public.user_saved_places compatibility view and revoke grants
--        to eliminate potential RLS bypass attack surface.
--   2. Strict Relational Visit-Photo Ownership:
--      - Enforce composite foreign key constraint: (visit_id, user_id) in visit_photos
--        MUST reference (id, user_id) in visits.
--      - Prevents any user from associating a photo metadata record with another
--        user's visit at the database constraint level.
--   3. Enhanced RLS Policies for Visits & Photos:
--      - Enforce parent-visit ownership verification in visit_photos RLS policies.
--      - Enable authenticated owners to fetch soft-deleted tombstones for multi-device sync.
--   4. Storage Bucket Hardening:
--      - Explicitly enforce visit-photos bucket privacy (public = false).
--      - Restrict object read/write/delete strictly to the authenticated folder owner.
--   5. Function Search Path Hardening:
--      - Enforce immutable search_path on security definer functions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP UNNEEDED COMPATIBILITY VIEW (RLS Bypass Prevention)
-- ------------------------------------------------------------------------------
-- Revoke all grants and remove the view so clients exclusively query public.saved_places
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_saved_places'
  ) then
    execute 'revoke all on public.user_saved_places from anon, authenticated';
    execute 'drop view if exists public.user_saved_places cascade';
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 2. COMPOSITE FOREIGN KEY CONSTRAINT (Cross-User Visit Photo Linking Prevention)
-- ------------------------------------------------------------------------------

-- Ensure visits table has a unique constraint on (id, user_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_visits_id_user_id'
      and conrelid = 'public.visits'::regclass
  ) then
    alter table public.visits
      add constraint uq_visits_id_user_id unique (id, user_id);
  end if;
end $$;

-- Drop legacy single-column visit_id foreign key if present
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'visit_photos_visit_id_fkey'
      and conrelid = 'public.visit_photos'::regclass
  ) then
    alter table public.visit_photos
      drop constraint visit_photos_visit_id_fkey;
  end if;
end $$;

-- Add composite foreign key linking (visit_id, user_id) directly to visits(id, user_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_visit_photos_visit_user'
      and conrelid = 'public.visit_photos'::regclass
  ) then
    alter table public.visit_photos
      add constraint fk_visit_photos_visit_user
      foreign key (visit_id, user_id)
      references public.visits(id, user_id)
      on delete cascade;
  end if;
end $$;

-- Composite index to support the foreign key and ownership checks
create index if not exists idx_visit_photos_visit_user
  on public.visit_photos(visit_id, user_id);

-- ------------------------------------------------------------------------------
-- 3. HARDENED RLS POLICIES FOR VISIT_PHOTOS
-- ------------------------------------------------------------------------------

-- Re-apply visit_photos RLS policies with explicit parent visit validation
drop policy if exists "visit_photos_select_own" on public.visit_photos;
create policy "visit_photos_select_own" on public.visit_photos
  for select to authenticated
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.visits v
      where v.id = visit_photos.visit_id
        and v.user_id = auth.uid()
    )
  );

drop policy if exists "visit_photos_insert_own" on public.visit_photos;
create policy "visit_photos_insert_own" on public.visit_photos
  for insert to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.visits v
      where v.id = visit_photos.visit_id
        and v.user_id = auth.uid()
    )
  );

drop policy if exists "visit_photos_update_own" on public.visit_photos;
create policy "visit_photos_update_own" on public.visit_photos
  for update to authenticated
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.visits v
      where v.id = visit_photos.visit_id
        and v.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.visits v
      where v.id = visit_photos.visit_id
        and v.user_id = auth.uid()
    )
  );

drop policy if exists "visit_photos_delete_own" on public.visit_photos;
create policy "visit_photos_delete_own" on public.visit_photos
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. SYNC-FRIENDLY RLS POLICIES FOR VISITS & SAVED PLACES
-- ------------------------------------------------------------------------------
-- Ensure authenticated owners can read their own records (including tombstones)
-- so the offline sync engine can pull deletes across devices. Cross-user access is strictly blocked.

drop policy if exists "visits_select_own" on public.visits;
create policy "visits_select_own" on public.visits
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saved_places_select_own" on public.saved_places;
create policy "saved_places_select_own" on public.saved_places
  for select to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKET VERIFICATION & SECURITY HARDENING
-- ------------------------------------------------------------------------------

-- Ensure bucket is strictly private and enforces content restrictions
update storage.buckets
set
  public = false,
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'visit-photos';

-- Re-verify storage policies
drop policy if exists "storage_visit_photos_select" on storage.objects;
create policy "storage_visit_photos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'visit-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_visit_photos_insert" on storage.objects;
create policy "storage_visit_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'visit-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_visit_photos_update" on storage.objects;
create policy "storage_visit_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'visit-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'visit-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_visit_photos_delete" on storage.objects;
create policy "storage_visit_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'visit-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER FUNCTION SEARCH_PATH IMMUTABILITY
-- ------------------------------------------------------------------------------
alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
