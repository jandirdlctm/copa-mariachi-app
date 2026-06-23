-- Row Level Security + Realtime publication.
--
-- Security model:
--   * Public site uses the ANON key and may only READ public data.
--   * Tournaments are only readable when published = true.
--   * teams / games / scorers are readable by anon (the public site reads
--     them and filters by the published tournament id in app code).
--   * NO anon writes anywhere. Every admin write goes through Next.js server
--     code using the SERVICE ROLE key, which bypasses RLS entirely.
--   * scorekeeper_pins is NOT readable by anon (PINs stay secret); only the
--     service role can read/validate them server-side.

alter table public.tournaments      enable row level security;
alter table public.teams            enable row level security;
alter table public.games            enable row level security;
alter table public.scorers          enable row level security;
alter table public.scorekeeper_pins enable row level security;

-- Published tournaments are public.
drop policy if exists "public read published tournaments" on public.tournaments;
create policy "public read published tournaments"
  on public.tournaments for select
  to anon
  using (published = true);

-- Teams / games / scorers: public read.
drop policy if exists "public read teams" on public.teams;
create policy "public read teams"
  on public.teams for select to anon using (true);

drop policy if exists "public read games" on public.games;
create policy "public read games"
  on public.games for select to anon using (true);

drop policy if exists "public read scorers" on public.scorers;
create policy "public read scorers"
  on public.scorers for select to anon using (true);

-- scorekeeper_pins: intentionally NO anon policy → anon cannot read them.

-- Realtime: publish the tables the public site subscribes to.
-- (Supabase ships an empty `supabase_realtime` publication by default.)
-- Wrapped so re-running the migration is safe (adding twice would error).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scorers'
  ) then
    alter publication supabase_realtime add table public.scorers;
  end if;
end $$;
