-- ============================================================
-- PLUGG: Auth Tables
-- Paste this entire block into the Supabase SQL Editor and Run.
-- ============================================================

-- 1. PROFILES (extends auth.users 1-to-1)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  handle      text unique,
  bio         text,
  avatar_url  text,
  streak      int not null default 0,
  last_active date,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, handle)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    lower(replace(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), ' ', '_'))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. USER FOLLOWS (who a user follows)
create table if not exists public.user_follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  artist_slug text not null,
  followed_at timestamptz not null default now(),
  primary key (follower_id, artist_slug)
);

alter table public.user_follows enable row level security;

create policy "Users can view their own follows"
  on public.user_follows for select using (auth.uid() = follower_id);

create policy "Users can follow artists"
  on public.user_follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow artists"
  on public.user_follows for delete using (auth.uid() = follower_id);


-- 3. USER FAVOURITES (liked songs)
create table if not exists public.user_favourites (
  user_id    uuid references public.profiles(id) on delete cascade,
  song_id    text not null,
  saved_at   timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.user_favourites enable row level security;

create policy "Users can view their own favourites"
  on public.user_favourites for select using (auth.uid() = user_id);

create policy "Users can save songs"
  on public.user_favourites for insert with check (auth.uid() = user_id);

create policy "Users can unsave songs"
  on public.user_favourites for delete using (auth.uid() = user_id);


-- 4. STORAGE: avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Users can update their avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() is not null);
