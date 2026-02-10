-- Public profiles view (safe columns for discovery features)
-- Note: This intentionally excludes sensitive fields like email & phone_number.

create or replace view public.public_profiles as
select
  id,
  full_name,
  avatar_url,
  gender,
  is_verified,
  updated_at,
  cover_url
from public.profiles;

grant select on public.public_profiles to authenticated;

