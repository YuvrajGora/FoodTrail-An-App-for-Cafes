-- FoodTrail: Supabase/Postgres schema
-- Run this in a new Supabase project's SQL Editor before importing seed.sql.

create extension if not exists pgcrypto;

create table if not exists public.places (
  id text primary key,
  name text not null,
  area text,
  category text,
  source text,
  source_url text,
  budget_per_person numeric(10,2),
  maps_url text,
  verification_status text not null default 'Pending verification'
    check (verification_status in ('Verified','Pending verification','Closed / unavailable','Duplicate / merge')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text references public.places(id) on delete set null,
  place_name_override text,
  visited_at date not null default current_date,
  actual_spend numeric(10,2),
  personal_share numeric(10,2),
  rating numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  items_tried text,
  companions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (place_id is not null or nullif(trim(place_name_override), '') is not null)
);

create index if not exists visits_user_date_idx on public.visits(user_id, visited_at desc);
create index if not exists saved_places_user_idx on public.user_saved_places(user_id, created_at desc);

create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at before update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at before update on public.visits
for each row execute function public.set_updated_at();

-- Create a profile row automatically when a new account is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.places enable row level security;
alter table public.profiles enable row level security;
alter table public.user_saved_places enable row level security;
alter table public.visits enable row level security;
alter table public.visit_photos enable row level security;

-- The restaurant catalogue is read-only to app clients. Maintain it through trusted SQL/admin tooling.
drop policy if exists "places are readable by everyone" on public.places;
create policy "places are readable by everyone" on public.places
for select to anon, authenticated using (true);

drop policy if exists "profile owner can read" on public.profiles;
drop policy if exists "profile owner can update" on public.profiles;
drop policy if exists "saved places owner can read" on public.user_saved_places;
drop policy if exists "saved places owner can insert" on public.user_saved_places;
drop policy if exists "saved places owner can delete" on public.user_saved_places;
drop policy if exists "visits owner can read" on public.visits;
drop policy if exists "visits owner can insert" on public.visits;
drop policy if exists "visits owner can update" on public.visits;
drop policy if exists "visits owner can delete" on public.visits;
drop policy if exists "visit photos owner can read" on public.visit_photos;
drop policy if exists "visit photos owner can insert" on public.visit_photos;
drop policy if exists "visit photos owner can delete" on public.visit_photos;

create policy "profile owner can read" on public.profiles
for select to authenticated using (auth.uid() = id);
create policy "profile owner can update" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "saved places owner can read" on public.user_saved_places
for select to authenticated using (auth.uid() = user_id);
create policy "saved places owner can insert" on public.user_saved_places
for insert to authenticated with check (auth.uid() = user_id);
create policy "saved places owner can delete" on public.user_saved_places
for delete to authenticated using (auth.uid() = user_id);

create policy "visits owner can read" on public.visits
for select to authenticated using (auth.uid() = user_id);
create policy "visits owner can insert" on public.visits
for insert to authenticated with check (auth.uid() = user_id);
create policy "visits owner can update" on public.visits
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "visits owner can delete" on public.visits
for delete to authenticated using (auth.uid() = user_id);

create policy "visit photos owner can read" on public.visit_photos
for select to authenticated using (auth.uid() = user_id);
create policy "visit photos owner can insert" on public.visit_photos
for insert to authenticated with check (auth.uid() = user_id);
create policy "visit photos owner can delete" on public.visit_photos
for delete to authenticated using (auth.uid() = user_id);

-- Private bucket; object paths should begin with the authenticated user's UUID.
drop policy if exists "users read their own visit photos" on storage.objects;
drop policy if exists "users upload their own visit photos" on storage.objects;
drop policy if exists "users delete their own visit photos" on storage.objects;

insert into storage.buckets (id, name, public)
values ('foodtrail-visit-photos', 'foodtrail-visit-photos', false)
on conflict (id) do nothing;

create policy "users read their own visit photos" on storage.objects
for select to authenticated using (
  bucket_id = 'foodtrail-visit-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "users upload their own visit photos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'foodtrail-visit-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "users delete their own visit photos" on storage.objects
for delete to authenticated using (
  bucket_id = 'foodtrail-visit-photos' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Explicit API grants; RLS policies above enforce per-user row access.
grant select on public.places to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.user_saved_places to authenticated;
grant select, insert, update, delete on public.visits to authenticated;
grant select, insert, delete on public.visit_photos to authenticated;
