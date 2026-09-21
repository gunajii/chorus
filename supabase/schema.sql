-- Chorus — database schema
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

create extension if not exists "pgcrypto";

-- One honest first-guess vote per player per day (powers the crowd %).
create table if not exists public.votes (
  id            uuid primary key default gen_random_uuid(),
  day           date        not null,
  client_id     text        not null,
  answer_key    text        not null,
  answer_label  text        not null,
  created_at    timestamptz not null default now(),
  unique (day, client_id)
);
create index if not exists votes_day_idx on public.votes (day);

-- Server-authoritative game state: one per player per day. The client never
-- receives the answer key; the server validates each guess against it.
create table if not exists public.games (
  day          date        not null,
  client_id    text        not null,
  started_at   timestamptz not null default now(),
  finished     boolean     not null default false,
  finished_at  timestamptz,
  guesses      jsonb       not null default '[]'::jsonb,
  primary key (day, client_id)
);

-- Finished results — the leaderboard source (now with a daily score).
create table if not exists public.results (
  day         date        not null,
  client_id   text        not null,
  name        text        not null default 'Player',
  found       int         not null,
  guesses     int         not null,
  solved_top  boolean     not null,
  time_ms     int         not null,
  score       int         not null default 0,
  created_at  timestamptz not null default now(),
  primary key (day, client_id)
);
create index if not exists results_day_idx on public.results (day);

-- Player registry: each device gets a stable, shareable friend code + a name.
create table if not exists public.players (
  client_id  text primary key,
  code       text unique not null,
  name       text not null default 'Player',
  created_at timestamptz not null default now()
);

-- Mutual friendships (two rows per friendship, one each direction).
create table if not exists public.friends (
  owner      text not null,
  friend     text not null,
  created_at timestamptz not null default now(),
  primary key (owner, friend)
);
create index if not exists friends_owner_idx on public.friends (owner);

-- Auto-generated / admin-added questions, appended to the schedule.
create table if not exists public.prompt_pool (
  idx         int primary key,
  question    text not null,
  options     jsonb not null,
  created_at  timestamptz not null default now()
);

-- All access goes through the Next.js /api routes using the service_role key.
alter table public.votes       enable row level security;
alter table public.games       enable row level security;
alter table public.results     enable row level security;
alter table public.players     enable row level security;
alter table public.friends     enable row level security;
alter table public.prompt_pool enable row level security;

-- Optional housekeeping (schedule via Supabase cron):
--   delete from public.games   where day < current_date - 7;
--   delete from public.votes   where day < current_date - 60;
--   delete from public.results where day < current_date - 120;
