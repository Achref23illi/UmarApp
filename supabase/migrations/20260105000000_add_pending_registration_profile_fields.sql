-- Store optional profile fields during email OTP registration
-- This removes the need to pass these values again during verification.

alter table public.pending_registrations
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists phone_number text;

