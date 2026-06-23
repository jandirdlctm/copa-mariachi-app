-- La Copa Mariachi Internacional 7v7 — schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- Tournaments -------------------------------------------------------------
create table if not exists public.tournaments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  prize_amount  integer not null default 20000,
  location      text,
  start_date    date,
  end_date      date,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Teams -------------------------------------------------------------------
create table if not exists public.teams (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  name           text not null,
  short          text not null check (char_length(short) <= 4),
  color          text not null default '#0B5D34',
  group_label    text not null check (group_label in ('A','B','C','D','E','F','G','H')),
  created_at     timestamptz not null default now()
);
create index if not exists teams_tournament_idx on public.teams(tournament_id);

-- Games -------------------------------------------------------------------
create table if not exists public.games (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  stage          text not null,
  home_team_id   uuid references public.teams(id) on delete set null,
  away_team_id   uuid references public.teams(id) on delete set null,
  home_source    text,
  away_source    text,
  home_score     integer not null default 0,
  away_score     integer not null default 0,
  status         text not null default 'upcoming' check (status in ('upcoming','live','final')),
  field          text not null default 'Cancha 1',
  scheduled_time timestamptz,
  minute         integer not null default 0,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists games_tournament_idx on public.games(tournament_id);
create index if not exists games_sort_idx on public.games(tournament_id, sort_order);

-- Scorers -----------------------------------------------------------------
create table if not exists public.scorers (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  team_id        uuid not null references public.teams(id) on delete cascade,
  player_name    text not null,
  goals          integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists scorers_tournament_idx on public.scorers(tournament_id);

-- Scorekeeper PINs --------------------------------------------------------
create table if not exists public.scorekeeper_pins (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  label          text not null,
  pin            text not null check (char_length(pin) between 4 and 6),
  created_at     timestamptz not null default now()
);
create index if not exists pins_tournament_idx on public.scorekeeper_pins(tournament_id);
