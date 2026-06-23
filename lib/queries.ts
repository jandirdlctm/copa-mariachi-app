import "server-only";

import { getPublicServerClient } from "./supabaseServer";
import type { Game, Scorer, Team, Tournament } from "./types";

export interface PublicBundle {
  tournament: Tournament | null;
  teams: Team[];
  games: Game[];
  scorers: Scorer[];
}

const EMPTY: PublicBundle = {
  tournament: null,
  teams: [],
  games: [],
  scorers: [],
};

// Fetch the published tournament and all of its public data. Used to seed the
// public site server-side; Realtime keeps it fresh thereafter.
export async function getPublicBundle(): Promise<PublicBundle> {
  const sb = getPublicServerClient();
  if (!sb) return EMPTY;

  const { data: tournaments } = await sb
    .from("tournaments")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const tournament = (tournaments?.[0] as Tournament | undefined) ?? null;
  if (!tournament) return EMPTY;

  const [teamsRes, gamesRes, scorersRes] = await Promise.all([
    sb.from("teams").select("*").eq("tournament_id", tournament.id),
    sb
      .from("games")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("sort_order", { ascending: true }),
    sb
      .from("scorers")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("goals", { ascending: false }),
  ]);

  return {
    tournament,
    teams: (teamsRes.data as Team[]) ?? [],
    games: (gamesRes.data as Game[]) ?? [],
    scorers: (scorersRes.data as Scorer[]) ?? [],
  };
}
