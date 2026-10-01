-- Query 1/3: jalankan sekali di Supabase SQL Editor.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table if not exists public.face_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 70),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists face_profiles_owner_name
  on public.face_profiles(owner_id, lower(display_name));

create table if not exists public.face_samples (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.face_profiles(id) on delete cascade,
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now()
);
create index if not exists face_samples_profile_id on public.face_samples(profile_id);

create table if not exists public.face_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.face_profiles(id) on delete cascade,
  similarity real,
  detected_at timestamptz not null default now()
);
create index if not exists face_events_owner_time on public.face_events(owner_id, detected_at desc);
