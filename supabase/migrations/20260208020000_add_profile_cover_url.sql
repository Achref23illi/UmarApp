-- Add profile cover image URL (public)

alter table public.profiles
  add column if not exists cover_url text;

