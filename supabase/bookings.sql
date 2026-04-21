create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  hotel text not null,
  city text not null default '',
  check_in date not null,
  check_out date not null,
  rooms integer not null default 1,
  points_earned integer not null default 0,
  game_opponent text not null default '',
  created_at timestamptz default now()
);
