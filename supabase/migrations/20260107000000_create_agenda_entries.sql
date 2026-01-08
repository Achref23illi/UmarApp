-- Agenda entries per user to bookmark/pin posts
create table if not exists agenda_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  pinned boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists agenda_entries_user_post_idx on agenda_entries(user_id, post_id);
create index if not exists agenda_entries_user_pinned_created_idx on agenda_entries(user_id, pinned desc, created_at desc);
