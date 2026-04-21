create table if not exists gmail_connections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  email text not null,
  access_token text not null,
  refresh_token text,
  expiry timestamptz,
  created_at timestamptz default now(),
  unique(team_id)
);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  gmail_message_id text not null,
  type text not null,
  urgency text not null default 'medium',
  summary text not null,
  suggested_action text,
  extracted_data jsonb default '{}'::jsonb,
  email_subject text,
  email_from text,
  email_snippet text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  unique(team_id, gmail_message_id)
);
