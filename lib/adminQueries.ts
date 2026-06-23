import "server-only";

import { getServiceClient } from "./supabaseServer";
import type { Game, Scorer, ScorekeeperPin, Team, Tournament } from "./types";

export interface AdminBundle {
  tournament: Tournament | null;
  teams: Team[];
  games: Game[];
  scorers: Scorer[];
  pins: ScorekeeperPin[];
}

// Admin reads use the service role, so unpublished tournaments are visible.
export async function getAdminBundle(): Promise<AdminBundle> {
  const sb = getServiceClient();
  const { data: tournaments } = await sb
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  const tournament = (tournaments?.[0] as Tournament | undefined) ?? null;
  if (!tournament) {
    return { tournament: null, teams: [], games: [], scorers: [], pins: [] };
  }

  const [teams, games, scorers, pins] = await Promise.all([
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
    sb
      .from("scorekeeper_pins")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("label", { ascending: true }),
  ]);

  return {
    tournament,
    teams: (teams.data as Team[]) ?? [],
    games: (games.data as Game[]) ?? [],
    scorers: (scorers.data as Scorer[]) ?? [],
    pins: (pins.data as ScorekeeperPin[]) ?? [],
  };
}
