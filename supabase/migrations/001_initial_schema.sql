-- ==============================================================================
-- FoodTrail Production Database Migration: 001_initial_schema.sql
-- Project: foodtrail-production (Region: South Asia / Mumbai)
-- Framework: Supabase (PostgreSQL 15+)
--
-- Tables:
--   1. public.profiles        - User profiles linked to auth.users
--   2. public.places          - Shared 132+ restaurant catalogue (curator-managed)
--   3. public.saved_places    - User bucket list bookmarks with offline sync support
--   4. public.visits          - Dining visit journal entries (multi-visit support)
--   5. public.visit_photos    - Attached visit photo records linked to storage
--
-- Security:
--   - Row Level Security (RLS) enabled on all public tables
--   - Storage bucket RLS policies for visit photo isolation
--   - Schema grants restricted to least privilege (anon, authenticated)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE (auth.users extension)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'FoodTrail Explorer',
  avatar_url text,
  home_city text not null default 'Delhi NCR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to automatically touch updated_at
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger to create public.profiles row automatically when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(split_part(new.email, '@', 1)), ''),
      'FoodTrail Explorer'
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. PLACES TABLE (Curated Public Restaurant Catalogue)
-- ------------------------------------------------------------------------------
create table if not exists public.places (
  id text primary key, -- Stable slug matching places.json (e.g. 'karim-s')
  name text not null,
  area text not null default '',
  category text not null default '',
  source text,
  source_url text,
  budget_per_person numeric(10, 2),
  maps_url text,
  verification_status text not null default 'Pending verification'
    check (verification_status in (
      'Verified',
      'Pending verification',
      'Closed / unavailable',
      'Duplicate / merge'
    )),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing for rapid mobile discovery, filtering and geo/locality queries
create index if not exists idx_places_area on public.places(area);
create index if not exists idx_places_category on public.places(category);
create index if not exists idx_places_verification on public.places(verification_status);

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. SAVED PLACES TABLE (User Bucket List)
-- ------------------------------------------------------------------------------
create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  deleted_at timestamptz default null, -- Soft-delete tombstone for offline-first sync
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

-- Indexing for fast user bookmark retrieval and sync delta queries
create index if not exists idx_saved_places_user_created on public.saved_places(user_id, created_at desc);
create index if not exists idx_saved_places_place_id on public.saved_places(place_id);
create index if not exists idx_saved_places_sync on public.saved_places(user_id, updated_at desc);

drop trigger if exists saved_places_set_updated_at on public.saved_places;
create trigger saved_places_set_updated_at
  before update on public.saved_places
  for each row execute function public.set_updated_at();

-- Backward compatibility view for legacy references
create or replace view public.user_saved_places as
  select * from public.saved_places;

-- ------------------------------------------------------------------------------
-- 6. VISITS TABLE (Dining Journal Entries)
-- ------------------------------------------------------------------------------
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text, -- Stable client-generated ID for offline creation and idempotent migration
  place_id text references public.places(id) on delete set null,
  place_name text not null,
  visit_date date not null default current_date,
  spend numeric(10, 2) check (spend is null or spend >= 0),
  personal_share numeric(10, 2) check (personal_share is null or personal_share >= 0),
  party_size integer check (party_size is null or party_size >= 1),
  rating numeric(3, 1) check (rating is null or (rating >= 0 and rating <= 10)),
  items text not null default '',
  companions text not null default '',
  notes text not null default '',
  deleted_at timestamptz default null, -- Soft-delete tombstone for multi-device sync
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_visits_user_client_id unique (user_id, client_id),
  constraint chk_visits_place_name check (nullif(trim(place_name), '') is not null)
);

-- Indexing for chronological journal feeds and offline delta synchronization
create index if not exists idx_visits_user_date on public.visits(user_id, visit_date desc);
create index if not exists idx_visits_user_place on public.visits(user_id, place_id);
create index if not exists idx_visits_sync on public.visits(user_id, updated_at desc);

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. VISIT PHOTOS TABLE (Photo Metadata Attached to Visits)
-- ------------------------------------------------------------------------------
create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text, -- Stable local ID for offline uploads
  storage_path text not null, -- Path inside the visit-photos bucket
  caption text not null default '',
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing for photo fetching by visit
create index if not exists idx_visit_photos_visit_id on public.visit_photos(visit_id);
create index if not exists idx_visit_photos_user_id on public.visit_photos(user_id);
create index if not exists idx_visit_photos_sync on public.visit_photos(user_id, updated_at desc);

drop trigger if exists visit_photos_set_updated_at on public.visit_photos;
create trigger visit_photos_set_updated_at
  before update on public.visit_photos
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.saved_places enable row level security;
alter table public.visits enable row level security;
alter table public.visit_photos enable row level security;

-- PROFILES POLICIES
-- Users may only view and update their own profile; profiles are not exposed publicly.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- PLACES POLICIES
-- Catalogue is public read-only for all clients (anonymous + authenticated)
drop policy if exists "places_select_public" on public.places;
create policy "places_select_public" on public.places
  for select to anon, authenticated
  using (true);

-- SAVED PLACES POLICIES
-- Users manage only their own bucket list entries
drop policy if exists "saved_places_select_own" on public.saved_places;
create policy "saved_places_select_own" on public.saved_places
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "saved_places_insert_own" on public.saved_places;
create policy "saved_places_insert_own" on public.saved_places
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saved_places_update_own" on public.saved_places;
create policy "saved_places_update_own" on public.saved_places
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_places_delete_own" on public.saved_places;
create policy "saved_places_delete_own" on public.saved_places
  for delete to authenticated
  using (auth.uid() = user_id);

-- VISITS POLICIES
-- Journal entries are private to the owning user
drop policy if exists "visits_select_own" on public.visits;
create policy "visits_select_own" on public.visits
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "visits_insert_own" on public.visits;
create policy "visits_insert_own" on public.visits
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "visits_update_own" on public.visits;
create policy "visits_update_own" on public.visits
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "visits_delete_own" on public.visits;
create policy "visits_delete_own" on public.visits
  for delete to authenticated
  using (auth.uid() = user_id);

-- VISIT PHOTOS POLICIES
-- Photos are private to the owning user
drop policy if exists "visit_photos_select_own" on public.visit_photos;
create policy "visit_photos_select_own" on public.visit_photos
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "visit_photos_insert_own" on public.visit_photos;
create policy "visit_photos_insert_own" on public.visit_photos
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "visit_photos_update_own" on public.visit_photos;
create policy "visit_photos_update_own" on public.visit_photos
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "visit_photos_delete_own" on public.visit_photos;
create policy "visit_photos_delete_own" on public.visit_photos
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE (visit-photos Bucket & Policies)
-- ------------------------------------------------------------------------------

-- Provision the visit-photos bucket (private, 10MB limit, image types only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visit-photos',
  'visit-photos',
  false,
  10485760, -- 10 MB per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Storage object policies enforcing tenant isolation:
-- Object paths must follow: <user_id>/<visit_id>/<filename>.jpg
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
-- 10. ROLE-BASED API GRANTS
-- ------------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

-- Public read grants on the restaurant catalogue
grant select on public.places to anon, authenticated;

-- User-scoped grants on personalized tables (RLS enforces row-level permissions)
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant select on public.user_saved_places to authenticated;
grant select, insert, update, delete on public.visits to authenticated;
grant select, insert, update, delete on public.visit_photos to authenticated;
