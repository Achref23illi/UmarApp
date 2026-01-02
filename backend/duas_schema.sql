-- Create Duas Table
create table if not exists public.duas (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  title text not null,
  title_fr text not null,
  content text not null, -- Arabic text
  transliteration text,
  translation text not null, -- English
  translation_fr text not null, -- French
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.duas enable row level security;

-- Policies
create policy "Public can view duas"
  on public.duas for select
  using ( true );

create policy "Admins can insert duas"
  on public.duas for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update duas"
  on public.duas for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can delete duas"
  on public.duas for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );
