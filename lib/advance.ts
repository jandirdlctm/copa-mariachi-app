import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBracket } from "./standings";
import type { Game, Team } from "./types";

// After any result changes, recompute the bracket and write resolved team ids
// into downstream knockout games so scorekeepers can start them. Only touches
// knockout games that are still "upcoming" (never rewrites a game in progress).
// A realtime UPDATE then propagates the new matchup to every public browser.
export async function advanceBracket(
  sb: SupabaseClient,
  tournamentId: string,
): Promise<void> {
  const [{ data: teamsData }, { data: gamesData }] = await Promise.all([
    sb.from("teams").select("*").eq("tournament_id", tournamentId),
    sb.from("games").select("*").eq("tournament_id", tournamentId),
  ]);
  const teams = (teamsData as Team[]) ?? [];
  const games = (gamesData as Game[]) ?? [];

  const resolved = resolveBracket(teams, games);
  const gameByStage = new Map(games.map((g) => [g.stage, g]));

  const updates: PromiseLike<unknown>[] = [];
  for (const slot of resolved) {
    const game = gameByStage.get(slot.stage);
    if (!game || game.status !== "upcoming") continue;

    const nextHome = slot.home?.id ?? null;
    const nextAway = slot.away?.id ?? null;
    const patch: Partial<Game> = {};
    if (nextHome && nextHome !== game.home_team_id) patch.home_team_id = nextHome;
    if (nextAway && nextAway !== game.away_team_id) patch.away_team_id = nextAway;

    if (Object.keys(patch).length > 0) {
      updates.push(sb.from("games").update(patch).eq("id", game.id));
    }
  }

  await Promise.all(updates);
}
